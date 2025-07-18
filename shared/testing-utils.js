/**
 * Testing utilities for ContextZero
 * Provides easy methods to enable/disable testing mode
 */

class TestingUtils {
  /**
   * Enable testing mode for ContextZero
   * This disables real authentication and uses mock data
   * @param {string} testUserId - Optional test user ID
   */
  static async enableTestingMode(testUserId = null) {
    try {
      await chrome.storage.sync.set({
        contextzero_testing_mode: true,
        contextzero_test_user_id: testUserId || `test-user-${Date.now()}`,
        contextzero_cloud_enabled: true
      });
      
      console.log('🧪 ContextZero: Testing mode enabled');
      console.log('🔄 Please reload the extension or refresh the page to apply changes');
      
      return {
        success: true,
        message: 'Testing mode enabled. Please reload the extension.',
        testUserId: testUserId || `test-user-${Date.now()}`
      };
    } catch (error) {
      console.error('Failed to enable testing mode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Disable testing mode and return to normal operation
   */
  static async disableTestingMode() {
    try {
      await chrome.storage.sync.remove([
        'contextzero_testing_mode',
        'contextzero_test_user_id'
      ]);
      
      console.log('🧪 ContextZero: Testing mode disabled');
      console.log('🔄 Please reload the extension or refresh the page to apply changes');
      
      return {
        success: true,
        message: 'Testing mode disabled. Please reload the extension.'
      };
    } catch (error) {
      console.error('Failed to disable testing mode:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Check if testing mode is currently enabled
   * @returns {Promise<boolean>} Testing mode status
   */
  static async isTestingModeEnabled() {
    const result = await chrome.storage.sync.get(['contextzero_testing_mode']);
    return result.contextzero_testing_mode === true;
  }

  /**
   * Get current testing configuration
   * @returns {Promise<Object>} Testing configuration
   */
  static async getTestingConfig() {
    const result = await chrome.storage.sync.get([
      'contextzero_testing_mode',
      'contextzero_test_user_id',
      'contextzero_cloud_enabled'
    ]);
    
    return {
      testingMode: result.contextzero_testing_mode === true,
      testUserId: result.contextzero_test_user_id,
      cloudEnabled: result.contextzero_cloud_enabled
    };
  }

  /**
   * Create mock test data for development
   * @param {number} count - Number of mock memories to create
   * @returns {Array} Mock memories
   */
  static createMockMemories(count = 10) {
    const mockMemories = [];
    const types = ['identity', 'work', 'location', 'preferences', 'education', 'family', 'hobbies', 'goals', 'health', 'tech'];
    const platforms = ['chatgpt', 'claude', 'perplexity', 'grok', 'gemini', 'deepseek'];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      mockMemories.push({
        id: `mock_memory_${Date.now()}_${i}`,
        content: `Mock ${type} information ${i + 1}`,
        originalText: `This is a mock ${type} memory for testing purposes: ${i + 1}`,
        metadata: {
          type,
          category: type,
          confidence: 0.7 + Math.random() * 0.3,
          source: 'test_data',
          platform,
          keywords: ['mock', 'test', type, platform],
          timestamp: Date.now() - Math.random() * 86400000 * 7, // Random time in last 7 days
        },
        timestamp: Date.now() - Math.random() * 86400000 * 7,
        lastAccessed: Date.now(),
        accessCount: Math.floor(Math.random() * 5),
      });
    }
    
    return mockMemories;
  }

  /**
   * Populate local storage with mock test data
   * @param {number} memoryCount - Number of mock memories to create
   */
  static async populateTestData(memoryCount = 10) {
    try {
      const mockMemories = this.createMockMemories(memoryCount);
      
      // Store in local storage
      await chrome.storage.local.set({
        contextzero_memories: mockMemories
      });
      
      console.log(`🧪 ContextZero: Added ${memoryCount} mock memories for testing`);
      
      return {
        success: true,
        message: `Added ${memoryCount} mock memories`,
        memories: mockMemories
      };
    } catch (error) {
      console.error('Failed to populate test data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear all test data
   */
  static async clearTestData() {
    try {
      await chrome.storage.local.remove(['contextzero_memories']);
      await chrome.storage.sync.remove([
        'contextzero_testing_mode',
        'contextzero_test_user_id'
      ]);
      
      console.log('🧪 ContextZero: Test data cleared');
      
      return {
        success: true,
        message: 'Test data cleared'
      };
    } catch (error) {
      console.error('Failed to clear test data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Log current extension state for debugging
   */
  static async logExtensionState() {
    try {
      const syncData = await chrome.storage.sync.get();
      const localData = await chrome.storage.local.get();
      
      console.group('🧪 ContextZero Extension State');
      console.log('Sync Storage:', syncData);
      console.log('Local Storage:', localData);
      console.groupEnd();
      
      return {
        syncData,
        localData
      };
    } catch (error) {
      console.error('Failed to log extension state:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  window.ContextZeroTesting = TestingUtils;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestingUtils;
}