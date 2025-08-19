/**
 * Clerk Authentication Handler for Chrome Extension
 * Handles authentication sync between Next.js frontend and Chrome Extension
 */

class ClerkAuth {
  constructor() {
    this.frontendHost = 'https://www.context0.ai';
    this.backendHost = 'https://api.context0.ai';
    this.storageKey = 'clerk_auth_data';
    this.sessionStorageKey = 'clerk_auth_session';
    this.pollInterval = null;
    this.pollAttempts = 0;
    this.maxPollAttempts = 120; // 2 minutes with 1 second intervals
  }

  /**
   * Generate unique session ID for authentication flow
   */
  generateSessionId() {
    return `ext_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start authentication flow by opening frontend with session ID
   */
  async startAuthFlow() {
    try {
      const sessionId = this.generateSessionId();
      
      // Store session ID temporarily
      await chrome.storage.local.set({ 
        [this.sessionStorageKey]: {
          sessionId,
          timestamp: Date.now()
        }
      });
      
      // Open frontend with session ID
      const authUrl = `${this.frontendHost}/sign-in?ext_session=${sessionId}`;
      
      // Use chrome.tabs.create if available (in background script)
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
        chrome.tabs.create({ url: authUrl });
      } else {
        // Fallback for content scripts
        window.open(authUrl, '_blank');
      }
      
      // Start polling for auth completion
      return await this.pollForAuth(sessionId);
    } catch (error) {
      console.error('ClerkAuth: Error starting auth flow:', error);
      throw error;
    }
  }

  /**
   * Poll backend for authentication completion
   */
  async pollForAuth(sessionId) {
    return new Promise((resolve, reject) => {
      this.pollAttempts = 0;
      
      const checkAuth = async () => {
        try {
          this.pollAttempts++;
          
          // Check if max attempts reached
          if (this.pollAttempts > this.maxPollAttempts) {
            clearInterval(this.pollInterval);
            reject(new Error('Authentication timeout - please try again'));
            return;
          }
          
          // Check auth status
          const response = await fetch(
            `${this.backendHost}/api/v1/ext-auth-status?session_id=${sessionId}`,
            {
              method: 'GET',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.result && data.result.status === 'complete') {
              // Auth successful - stop polling immediately
              clearInterval(this.pollInterval);
              this.pollInterval = null;
              
              // Extract auth data from the correct response structure
              const authData = {
                token: data.result.data.token,
                userId: data.result.data.userId,
                email: data.result.data.email,
                firstName: data.result.data.firstName,
                lastName: data.result.data.lastName,
                imageUrl: data.result.data.imageUrl
              };
              
              await this.saveAuthData(authData);
              
              // Clean up session
              await chrome.storage.local.remove([this.sessionStorageKey]);
              
              // Broadcast auth success
              if (chrome.runtime && chrome.runtime.sendMessage) {
                chrome.runtime.sendMessage({
                  type: 'CONTEXTZERO_AUTH_SUCCESS',
                  data: authData
                }).catch(() => {
                  // Ignore errors if no listeners
                });
              }
              
              resolve(authData);
              return; // Exit immediately to prevent further polling
            }
            // If status is 'pending', continue polling
          }
        } catch (error) {
          console.error('ClerkAuth: Error polling for auth:', error);
          // Continue polling on error
        }
      };
      
      // Start polling every 1 second
      this.pollInterval = setInterval(checkAuth, 1000);
      
      // Check immediately
      checkAuth();
    });
  }

  /**
   * Get authentication token - returns cached token if valid
   */
  async getToken() {
    try {
      // Check if we have a cached token
      const cachedData = await this.getCachedAuthData();
      
      if (cachedData && cachedData.token) {
        // Token exists and is not expired (checked in getCachedAuthData)
        return cachedData;
      }
      
      // No valid token found
      return null;
    } catch (error) {
      console.error('ClerkAuth: Error getting token:', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const authData = await this.getToken();
      return !!(authData && authData.token);
    } catch (error) {
      console.error('ClerkAuth: Error checking authentication:', error);
      return false;
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser() {
    try {
      const authData = await this.getToken();
      if (!authData || !authData.token) {
        return null;
      }

      return {
        id: authData.userId,
        email: authData.email,
        firstName: authData.firstName,
        lastName: authData.lastName,
        imageUrl: authData.imageUrl
      };
    } catch (error) {
      console.error('ClerkAuth: Error getting current user:', error);
      return null;
    }
  }

  /**
   * Save auth data to Chrome storage
   */
  async saveAuthData(data) {
    try {
      // Add expiration if not provided (24 hours default)
      const expiresAt = data.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      
      await chrome.storage.local.set({
        [this.storageKey]: {
          ...data,
          expiresAt,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      console.error('ClerkAuth: Error saving auth data:', error);
    }
  }

  /**
   * Get cached auth data from Chrome storage
   */
  async getCachedAuthData() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      const authData = result[this.storageKey];
      
      if (!authData) {
        return null;
      }

      // Check if token is expired
      if (authData.expiresAt) {
        const expiresAt = new Date(authData.expiresAt);
        if (expiresAt < new Date()) {
          // Token expired
          await this.signOut();
          return null;
        }
      }

      // Check if cache is still valid (1 hour for cache freshness)
      const cacheAge = Date.now() - authData.timestamp;
      if (cacheAge > 3600000) {
        // Cache is old but token might still be valid
        // You could optionally refresh the token here
      }

      return authData;
    } catch (error) {
      console.error('ClerkAuth: Error getting cached auth data:', error);
      return null;
    }
  }

  /**
   * Clear authentication data
   */
  async signOut() {
    try {
      await chrome.storage.local.remove([this.storageKey, this.sessionStorageKey]);
      
      // Broadcast sign out event
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'CONTEXTZERO_AUTH_CLEARED'
        }).catch(() => {
          // Ignore errors if no listeners
        });
      }
    } catch (error) {
      console.error('ClerkAuth: Error clearing auth data:', error);
    }
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.ClerkAuth = ClerkAuth;
}