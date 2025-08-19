/**
 * Cloud API Integration for ContextZero
 * Handles communication with Python FastAPI backend using Clerk authentication
 */

class CloudAPI {
  constructor() {
    this.baseURL = 'https://api.context0.ai'; // Your FastAPI backend URL
    this.clerkToken = null;
    this.userId = null;
    this.userEmail = null;
    this.isAuthenticated = false;
    this.testingMode = false; // Flag to disable auth for testing
    this.init();
  }

  async init() {
    try {
      // First try to get auth from ClerkAuth
      if (typeof ClerkAuth !== 'undefined') {
        const clerkAuth = new ClerkAuth();
        const authData = await clerkAuth.getToken();
        
        if (authData && authData.token) {
          this.clerkToken = authData.token;
          this.userId = authData.userId;
          this.userEmail = authData.email;
          this.isAuthenticated = true;
          this.cloudEnabled = true;
          console.log('CloudAPI: Initialized with Clerk authentication');
          return;
        }
      }
      
      // Fallback to stored credentials
      const result = await chrome.storage.sync.get([
        'contextzero_clerk_token', 
        'contextzero_user_id', 
        'contextzero_user_email',
        'contextzero_cloud_enabled',
        'contextzero_testing_mode',
        'contextzero_test_user_id'
      ]);
      
      this.testingMode = result.contextzero_testing_mode === true;
      
      if (this.testingMode) {
        // In testing mode, create a mock authenticated state
        this.clerkToken = 'testing-token-' + Date.now();
        this.userId = result.contextzero_test_user_id || 'test-user-' + Date.now();
        this.userEmail = 'test@contextzero.dev';
        this.isAuthenticated = true;
        this.cloudEnabled = true;
        
        console.log('🧪 CloudAPI: Running in testing mode with mock auth');
      } else {
        // Normal mode - use stored credentials
        this.clerkToken = result.contextzero_clerk_token;
        this.userId = result.contextzero_user_id;
        this.userEmail = result.contextzero_user_email;
        this.isAuthenticated = !!(this.clerkToken && this.userId);
        this.cloudEnabled = result.contextzero_cloud_enabled !== false; // Default to true
      }
    } catch (error) {
      console.error('CloudAPI: Error during initialization:', error);
      this.isAuthenticated = false;
      this.cloudEnabled = false;
    }
  }

  /**
   * Authenticate with Clerk token
   * @param {string} clerkToken - Clerk session token
   * @returns {Promise<Object>} Authentication result
   */
  async authenticateWithClerk(clerkToken) {
    try {
      const response = await fetch(`${this.baseURL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clerkToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Store Clerk credentials
      await chrome.storage.sync.set({
        contextzero_clerk_token: clerkToken,
        contextzero_user_id: data.user.id,
        contextzero_user_email: data.user.email,
        contextzero_cloud_enabled: true
      });

      this.clerkToken = clerkToken;
      this.userId = data.user.id;
      this.userEmail = data.user.email;
      this.isAuthenticated = true;
      this.cloudEnabled = true;

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Clerk authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Redirect to Clerk authentication
   * @returns {Promise<void>}
   */
  async redirectToClerkAuth() {
    try {
      // Open frontend authentication page in a new tab
      const authUrl = `https://www.context0.ai/auth`; // Your frontend auth page
      chrome.tabs.create({ url: authUrl });
    } catch (error) {
      console.error('Clerk redirect error:', error);
    }
  }

  /**
   * Handle Clerk authentication callback
   * @param {string} token - Clerk session token from callback
   * @returns {Promise<Object>} Authentication result
   */
  async handleClerkCallback(token) {
    return await this.authenticateWithClerk(token);
  }

  /**
   * Process memories using advanced AI
   * @param {string} content - Message content
   * @param {Object} metadata - Memory metadata
   * @returns {Promise<Array>} Processed memories
   */
  async processMemoriesWithAI(content, metadata = {}) {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      throw new Error('Cloud processing requires authentication');
    }

    // Testing mode - return mock enhanced memories
    if (this.testingMode) {
      console.log('🧪 CloudAPI: Mock processing memories with AI');
      return this.createMockAIMemories(content, metadata);
    }

    try {
      // Create memory using the backend's expected format
      const response = await fetch(`${this.baseURL}/api/v1/memories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clerkToken}`,
        },
        body: JSON.stringify({
          user_id: this.userId,
          session_id: metadata.sessionId || 'chrome-extension-default',
          text: content,
          memory_type: metadata.memory_type,
          tags: metadata.tags || [],
          category: metadata.category,
          emotion: metadata.emotion,
          metadata: {
            ...metadata,
            platform: metadata.platform || 'chrome-extension',
            url: metadata.url,
            source: metadata.source || 'user-input',
            timestamp: Date.now()
          },
          scope: metadata.scope || 'general'
        }),
      });

      if (!response.ok) {
        throw new Error(`AI processing failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle BaseResponse structure
      if (data.success && data.result) {
        // Return array with the created memory in extension format
        return [{
          id: data.result.memory_id,
          content: content,
          metadata: {
            type: data.result.memory_type,
            category: metadata.category || 'general',
            confidence: data.result.confidence,
            platform: 'cloud',
            operation: data.result.operation
          },
          timestamp: Date.now()
        }];
      }
      
      return [];
    } catch (error) {
      console.error('AI processing error:', error);
      throw error;
    }
  }

  /**
   * Sync memories to cloud
   * @param {Array} memories - Local memories to sync
   * @returns {Promise<Object>} Sync result
   */
  async syncMemoriesToCloud(memories) {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      return { success: false, error: 'Cloud sync requires authentication' };
    }

    try {
      const response = await fetch(`${this.baseURL}/memories/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clerkToken}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          memories,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, syncedCount: data.syncedCount };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get memories from cloud
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Cloud memories
   */
  async getMemoriesFromCloud(options = {}) {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      return [];
    }

    try {
      const queryParams = new URLSearchParams({
        ...options,
      });

      const response = await fetch(`${this.baseURL}/api/v1/memories?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.clerkToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch memories: ${response.status}`);
      }

      const data = await response.json();
      return data.memories || [];
    } catch (error) {
      console.error('Fetch memories error:', error);
      return [];
    }
  }

  /**
   * Search memories using AI
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchMemoriesWithAI(query, options = {}) {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      throw new Error('AI search requires authentication');
    }

    // Testing mode - return mock search results
    if (this.testingMode) {
      console.log('🧪 CloudAPI: Mock AI search for:', query);
      await this.mockDelay(300);
      return this.createMockSearchResults(query, options);
    }

    try {
      const response = await fetch(`${this.baseURL}/api/v1/memories/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clerkToken}`,
        },
        body: JSON.stringify({
          user_id: this.userId,
          query: query,
          memory_types: options.memory_types,
          tags: options.tags,
          category: options.category,
          emotion: options.emotion,
          limit: options.limit || 10,
          threshold: options.threshold || 0.7,
          include_content: options.include_content || false,
          scope: options.scope,
          start_date: options.start_date,
          end_date: options.end_date
        }),
      });

      if (!response.ok) {
        throw new Error(`AI search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.memories || [];
    } catch (error) {
      console.error('AI search error:', error);
      throw error;
    }
  }

  /**
   * Get all memories for the authenticated user
   * @returns {Promise<Array>} All user memories
   */
  async getAllMemories() {
    console.log('CloudAPI: getAllMemories called');
    console.log('CloudAPI: isAuthenticated:', this.isAuthenticated);
    console.log('CloudAPI: cloudEnabled:', this.cloudEnabled);
    console.log('CloudAPI: userId:', this.userId);
    
    if (!this.isAuthenticated || !this.cloudEnabled) {
      console.log('CloudAPI: Not authenticated or cloud not enabled');
      return [];
    }

    try {
      // Ensure we have fresh auth token
      if (typeof ClerkAuth !== 'undefined') {
        const clerkAuth = new ClerkAuth();
        const authData = await clerkAuth.getToken();
        console.log('CloudAPI: Got auth data:', authData ? 'Yes' : 'No');
        if (authData && authData.token) {
          this.clerkToken = authData.token;
          this.userId = authData.userId;
          console.log('CloudAPI: Updated token and userId');
        }
      }

      const url = `${this.baseURL}/api/v1/memories?limit=100`;
      console.log('CloudAPI: Fetching memories from:', url);
      console.log('CloudAPI: Using token:', this.clerkToken ? 'Yes' : 'No');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.clerkToken}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('CloudAPI: Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('CloudAPI: Error response:', errorText);
        throw new Error(`Failed to fetch all memories: ${response.status}`);
      }

      const data = await response.json();
      console.log('CloudAPI: Response data:', data);
      
      // Handle BaseResponse structure
      if (data.success && data.result) {
        // Transform backend memory format to extension format
        const memories = data.result.map(memory => ({
          id: memory.id,
          content: memory.input || memory.summary,
          metadata: {
            type: memory.memory_type,
            category: memory.category || 'general',
            confidence: memory.confidence || 0.8,
            platform: 'cloud',
            tags: memory.tags || [],
            emotion: memory.emotion,
            scope: memory.scope,
            createdAt: memory.created_at,
            updatedAt: memory.updated_at
          },
          timestamp: new Date(memory.created_at).getTime()
        }));
        return memories;
      }
      
      // Fallback for direct array response
      return data.memories || data || [];
    } catch (error) {
      console.error('Get all memories error:', error);
      return [];
    }
  }

  /**
   * Get user analytics and insights
   * @returns {Promise<Object>} User analytics
   */
  async getUserAnalytics() {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}/analytics/${this.userId}`, {
        headers: {
          'Authorization': `Bearer ${this.clerkToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Analytics failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Analytics error:', error);
      return null;
    }
  }

  /**
   * Delete memory from cloud
   * @param {string} memoryId - Memory ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteMemoryFromCloud(memoryId) {
    if (!this.isAuthenticated || !this.cloudEnabled) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/memories/${memoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.clerkToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Delete memory error:', error);
      return false;
    }
  }

  /**
   * Logout and clear credentials
   */
  async logout() {
    await chrome.storage.sync.remove([
      'contextzero_clerk_token', 
      'contextzero_user_id', 
      'contextzero_user_email'
    ]);
    this.clerkToken = null;
    this.userId = null;
    this.userEmail = null;
    this.isAuthenticated = false;
    this.cloudEnabled = false;
  }

  /**
   * Check if cloud features are enabled
   * @returns {boolean} Cloud status
   */
  isCloudEnabled() {
    return this.cloudEnabled && this.isAuthenticated;
  }

  /**
   * Enable/disable cloud features
   * @param {boolean} enabled - Enable cloud features
   */
  async setCloudEnabled(enabled) {
    this.cloudEnabled = enabled;
    await chrome.storage.sync.set({ contextzero_cloud_enabled: enabled });
  }

  /**
   * Get authentication status
   * @returns {Object} Auth status
   */
  getAuthStatus() {
    return {
      isAuthenticated: this.isAuthenticated,
      userId: this.userId,
      cloudEnabled: this.cloudEnabled,
      testingMode: this.testingMode,
    };
  }

  /**
   * Enable testing mode (disables real authentication)
   * @param {boolean} enabled - Enable testing mode
   * @param {string} testUserId - Optional test user ID
   */
  async enableTestingMode(enabled = true, testUserId = null) {
    await chrome.storage.sync.set({
      contextzero_testing_mode: enabled,
      contextzero_test_user_id: testUserId || 'test-user-' + Date.now()
    });
    
    this.testingMode = enabled;
    
    if (enabled) {
      this.clerkToken = 'testing-token-' + Date.now();
      this.userId = testUserId || 'test-user-' + Date.now();
      this.userEmail = 'test@contextzero.dev';
      this.isAuthenticated = true;
      this.cloudEnabled = true;
      console.log('🧪 Testing mode enabled');
    } else {
      console.log('🧪 Testing mode disabled');
      await this.init(); // Reinitialize with real auth
    }
  }

  /**
   * Check if currently in testing mode
   * @returns {boolean} Testing mode status
   */
  isTestingMode() {
    return this.testingMode;
  }

  /**
   * Create mock AI-enhanced memories for testing
   * @param {string} content - Original content
   * @param {Object} metadata - Original metadata
   * @returns {Array} Mock AI memories
   */
  createMockAIMemories(content, metadata = {}) {
    const mockMemories = [];
    
    // Simulate AI extracting different types of information
    const aiPatterns = [
      { type: 'identity', pattern: /my name is (\w+)/i, confidence: 0.95 },
      { type: 'work', pattern: /work at (\w+)/i, confidence: 0.90 },
      { type: 'location', pattern: /live in (\w+)/i, confidence: 0.85 },
      { type: 'preferences', pattern: /like (\w+)/i, confidence: 0.80 },
      { type: 'goals', pattern: /want to (\w+)/i, confidence: 0.75 },
    ];

    for (const pattern of aiPatterns) {
      const match = content.match(pattern.pattern);
      if (match) {
        mockMemories.push({
          id: `ai_memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: match[1],
          originalText: content,
          metadata: {
            ...metadata,
            type: pattern.type,
            category: pattern.type,
            confidence: pattern.confidence,
            source: 'ai_enhanced',
            platform: metadata.platform || 'unknown',
            aiInsights: {
              extractionMethod: 'advanced_nlp',
              contextScore: Math.random() * 0.5 + 0.5,
              sentimentScore: Math.random() * 2 - 1,
              relevanceScore: Math.random() * 0.5 + 0.5,
            },
            keywords: this.extractMockKeywords(match[1]),
            timestamp: Date.now(),
          },
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0,
        });
      }
    }

    // Add a general AI-enhanced memory
    if (mockMemories.length === 0) {
      mockMemories.push({
        id: `ai_memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: content.substring(0, 100),
        originalText: content,
        metadata: {
          ...metadata,
          type: 'general',
          category: 'general',
          confidence: 0.7,
          source: 'ai_enhanced',
          platform: metadata.platform || 'unknown',
          aiInsights: {
            extractionMethod: 'advanced_nlp',
            contextScore: Math.random() * 0.5 + 0.5,
            sentimentScore: Math.random() * 2 - 1,
            relevanceScore: Math.random() * 0.5 + 0.5,
          },
          keywords: this.extractMockKeywords(content),
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        lastAccessed: Date.now(),
        accessCount: 0,
      });
    }

    return mockMemories;
  }

  /**
   * Extract mock keywords for testing
   * @param {string} text - Text to extract keywords from
   * @returns {Array} Mock keywords
   */
  extractMockKeywords(text) {
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'];
    return words.filter(word => word.length > 3 && !stopWords.includes(word)).slice(0, 5);
  }

  /**
   * Create mock search results for testing
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Array} Mock search results
   */
  createMockSearchResults(query, options = {}) {
    const mockResults = [];
    const queryLower = query.toLowerCase();
    
    // Create relevant mock memories based on query
    if (queryLower.includes('work') || queryLower.includes('job')) {
      mockResults.push({
        id: `mock_work_${Date.now()}`,
        content: 'Software Engineer at Google',
        originalText: 'I work as a Software Engineer at Google in Mountain View',
        metadata: {
          type: 'work',
          category: 'work',
          confidence: 0.95,
          source: 'ai_enhanced',
          platform: 'chatgpt',
          aiInsights: {
            extractionMethod: 'advanced_nlp',
            contextScore: 0.9,
            sentimentScore: 0.1,
            relevanceScore: 0.95,
          },
          keywords: ['software', 'engineer', 'google', 'work'],
          timestamp: Date.now() - 86400000, // 1 day ago
        },
        timestamp: Date.now() - 86400000,
        lastAccessed: Date.now(),
        accessCount: 3,
        score: 0.95,
      });
    }

    if (queryLower.includes('name') || queryLower.includes('identity')) {
      mockResults.push({
        id: `mock_identity_${Date.now()}`,
        content: 'John Doe',
        originalText: 'Hi, my name is John Doe',
        metadata: {
          type: 'identity',
          category: 'identity',
          confidence: 0.98,
          source: 'ai_enhanced',
          platform: 'claude',
          aiInsights: {
            extractionMethod: 'advanced_nlp',
            contextScore: 0.95,
            sentimentScore: 0.0,
            relevanceScore: 0.98,
          },
          keywords: ['name', 'john', 'doe', 'identity'],
          timestamp: Date.now() - 172800000, // 2 days ago
        },
        timestamp: Date.now() - 172800000,
        lastAccessed: Date.now(),
        accessCount: 1,
        score: 0.98,
      });
    }

    if (queryLower.includes('location') || queryLower.includes('live')) {
      mockResults.push({
        id: `mock_location_${Date.now()}`,
        content: 'San Francisco, CA',
        originalText: 'I live in San Francisco, CA',
        metadata: {
          type: 'location',
          category: 'location',
          confidence: 0.90,
          source: 'ai_enhanced',
          platform: 'perplexity',
          aiInsights: {
            extractionMethod: 'advanced_nlp',
            contextScore: 0.85,
            sentimentScore: 0.2,
            relevanceScore: 0.90,
          },
          keywords: ['san', 'francisco', 'location', 'live'],
          timestamp: Date.now() - 259200000, // 3 days ago
        },
        timestamp: Date.now() - 259200000,
        lastAccessed: Date.now(),
        accessCount: 2,
        score: 0.90,
      });
    }

    // Add a general mock result if no specific matches
    if (mockResults.length === 0) {
      mockResults.push({
        id: `mock_general_${Date.now()}`,
        content: `General information about ${query}`,
        originalText: `This is some general information related to ${query}`,
        metadata: {
          type: 'general',
          category: 'general',
          confidence: 0.70,
          source: 'ai_enhanced',
          platform: 'chatgpt',
          aiInsights: {
            extractionMethod: 'advanced_nlp',
            contextScore: 0.60,
            sentimentScore: 0.0,
            relevanceScore: 0.70,
          },
          keywords: this.extractMockKeywords(query),
          timestamp: Date.now() - 86400000,
        },
        timestamp: Date.now() - 86400000,
        lastAccessed: Date.now(),
        accessCount: 1,
        score: 0.70,
      });
    }

    return mockResults;
  }

  /**
   * Add mock delay to simulate network latency in testing
   * @param {number} ms - Delay in milliseconds
   */
  async mockDelay(ms = 500) {
    if (this.testingMode) {
      await new Promise(resolve => setTimeout(resolve, ms));
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CloudAPI;
}