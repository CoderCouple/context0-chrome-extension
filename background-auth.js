/**
 * Background script authentication handler for ContextZero
 * Listens for authentication events and updates extension state
 */

// Listen for authentication messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'CONTEXTZERO_AUTH_SUCCESS':
      handleAuthSuccess(message.data);
      break;
      
    case 'CONTEXTZERO_AUTH_CLEARED':
      handleAuthCleared();
      break;
      
    case 'CONTEXTZERO_AUTH_TIMEOUT':
      handleAuthTimeout(message.error);
      break;
  }
});

/**
 * Handle successful authentication
 */
function handleAuthSuccess(authData) {
  console.log('ContextZero: Authentication successful', authData.email);
  
  // Update extension badge to show authenticated state
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#00AA00' });
  
  // Update extension icon if needed
  chrome.action.setTitle({ 
    title: `ContextZero - Signed in as ${authData.email}` 
  });
  
  // Notify all tabs about authentication
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXTZERO_AUTH_UPDATE',
          isAuthenticated: true,
          authData
        }).catch(() => {
          // Tab might not have content script
        });
      }
    });
  });
}

/**
 * Handle authentication cleared/sign out
 */
function handleAuthCleared() {
  console.log('ContextZero: Authentication cleared');
  
  // Update extension badge
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  
  // Update extension icon title
  chrome.action.setTitle({ 
    title: 'ContextZero - Click to sign in' 
  });
  
  // Notify all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'CONTEXTZERO_AUTH_UPDATE',
          isAuthenticated: false
        }).catch(() => {
          // Tab might not have content script
        });
      }
    });
  });
}

/**
 * Handle authentication timeout
 */
function handleAuthTimeout(error) {
  console.error('ContextZero: Authentication timeout', error);
  
  // Show notification if available
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'ContextZero Authentication',
      message: error || 'Authentication timed out. Please try again.'
    });
  }
}

/**
 * Check auth status on startup
 */
async function checkAuthOnStartup() {
  try {
    const result = await chrome.storage.local.get(['clerk_auth_data']);
    const authData = result.clerk_auth_data;
    
    if (authData && authData.token) {
      // Check if expired
      if (authData.expiresAt) {
        const expiresAt = new Date(authData.expiresAt);
        if (expiresAt > new Date()) {
          handleAuthSuccess(authData);
          return;
        }
      }
    }
    
    // Not authenticated
    handleAuthCleared();
  } catch (error) {
    console.error('ContextZero: Error checking auth on startup:', error);
    handleAuthCleared();
  }
}

// Check auth status when extension starts
checkAuthOnStartup();

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleAuthSuccess,
    handleAuthCleared,
    handleAuthTimeout
  };
}