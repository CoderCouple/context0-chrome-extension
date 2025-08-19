/**
 * Local storage manager for ContextZero memories
 */
class LocalStorage {
  constructor() {
    this.storageKey = 'contextzero_memories';
    this.settingsKey = 'contextzero_settings';
    this.userDataKey = 'contextzero_user_data';
    this.maxMemories = 1000; // Limit to prevent storage bloat
  }
  
  /**
   * Get all memories from storage
   * @returns {Promise<Array>} Array of memory objects
   */
  async getMemories() {
    try {
      const result = await chrome.storage.local.get([this.storageKey]);
      return result[this.storageKey] || [];
    } catch (error) {
      console.error('Error getting memories:', error);
      return [];
    }
  }
  
  /**
   * Save a new memory to storage
   * @param {Object} memory - Memory object to save
   * @returns {Promise<Object>} Saved memory object
   */
  async saveMemory(memory) {
    try {
      const memories = await this.getMemories();
      
      // Check for duplicates
      const duplicate = memories.find(m => 
        m.content === memory.content && 
        m.metadata.type === memory.metadata.type
      );
      
      if (duplicate) {
        return duplicate;
      }
      
      // Add new memory
      memories.push(memory);
      
      // Limit storage size
      if (memories.length > this.maxMemories) {
        memories.sort((a, b) => b.timestamp - a.timestamp);
        memories.splice(this.maxMemories);
      }
      
      await chrome.storage.local.set({
        [this.storageKey]: memories
      });
      
      return memory;
    } catch (error) {
      console.error('Error saving memory:', error);
      throw error;
    }
  }
  
  /**
   * Search memories by content
   * @param {string} query - Search query
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Array>} Array of matching memories
   */
  async searchMemories(query, limit = 10) {
    try {
      const memories = await this.getMemories();
      
      if (!query || query.trim() === '') {
        return memories.slice(0, limit);
      }
      
      const queryLower = query.toLowerCase();
      
      // Simple relevance scoring
      const scored = memories.map(memory => {
        const contentLower = memory.content.toLowerCase();
        let score = 0;
        
        // Exact phrase match
        if (contentLower.includes(queryLower)) {
          score += 10;
        }
        
        // Word matches
        const queryWords = queryLower.split(/\s+/);
        const contentWords = contentLower.split(/\s+/);
        
        queryWords.forEach(word => {
          if (contentWords.includes(word)) {
            score += 5;
          }
        });
        
        // Recency bonus
        const daysSinceCreated = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 5 - daysSinceCreated);
        
        return { ...memory, score };
      });
      
      // Sort by score and return top results
      return scored
        .filter(m => m.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
        
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }
  
  /**
   * Delete a memory by ID
   * @param {string} id - Memory ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteMemory(id) {
    try {
      const memories = await this.getMemories();
      const filtered = memories.filter(m => m.id !== id);
      
      await chrome.storage.local.set({
        [this.storageKey]: filtered
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
  
  /**
   * Clear all memories
   * @returns {Promise<boolean>} Success status
   */
  async clearMemories() {
    try {
      await chrome.storage.local.remove([this.storageKey]);
      return true;
    } catch (error) {
      console.error('Error clearing memories:', error);
      return false;
    }
  }
  
  /**
   * Get user settings
   * @returns {Promise<Object>} Settings object
   */
  async getSettings() {
    try {
      const result = await chrome.storage.local.get([this.settingsKey]);
      return result[this.settingsKey] || {
        memoryEnabled: true,
        autoCapture: true,
        maxMemories: 1000,
        similarity_threshold: 0.7
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }
  
  /**
   * Save user settings
   * @param {Object} settings - Settings object
   * @returns {Promise<boolean>} Success status
   */
  async saveSettings(settings) {
    try {
      await chrome.storage.local.set({
        [this.settingsKey]: settings
      });
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }
  
  /**
   * Get user data and stats
   * @returns {Promise<Object>} User data object
   */
  async getUserData() {
    try {
      const result = await chrome.storage.local.get([this.userDataKey]);
      return result[this.userDataKey] || {
        memoriesCreated: 0,
        promptsEnhanced: 0,
        platformsUsed: new Set(),
        lastUsed: Date.now()
      };
    } catch (error) {
      console.error('Error getting user data:', error);
      return {};
    }
  }
  
  /**
   * Update user data and stats
   * @param {Object} userData - User data object
   * @returns {Promise<boolean>} Success status
   */
  async updateUserData(userData) {
    try {
      await chrome.storage.local.set({
        [this.userDataKey]: userData
      });
      return true;
    } catch (error) {
      console.error('Error updating user data:', error);
      return false;
    }
  }
  
  /**
   * Export all data
   * @returns {Promise<Object>} All stored data
   */
  async exportData() {
    try {
      const [memories, settings, userData, syncData] = await Promise.all([
        this.getMemories(),
        this.getSettings(),
        this.getUserData(),
        this.getSyncData()
      ]);
      
      return {
        memories,
        settings,
        userData,
        syncData,
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
    } catch (error) {
      console.error('Error exporting data:', error);
      return null;
    }
  }
  
  /**
   * Import data from export
   * @param {Object} data - Exported data object
   * @returns {Promise<boolean>} Success status
   */
  async importData(data) {
    try {
      if (data.memories) {
        await chrome.storage.local.set({
          [this.storageKey]: data.memories
        });
      }
      
      if (data.settings) {
        await chrome.storage.local.set({
          [this.settingsKey]: data.settings
        });
      }
      
      if (data.userData) {
        await chrome.storage.local.set({
          [this.userDataKey]: data.userData
        });
      }
      
      if (data.syncData) {
        await this.saveSyncData(data.syncData);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  /**
   * Get sync data (cloud sync metadata)
   * @returns {Promise<Object>} Sync data
   */
  async getSyncData() {
    try {
      const result = await chrome.storage.local.get(['contextzero_sync_data']);
      return result.contextzero_sync_data || {
        lastSync: null,
        cloudEnabled: false,
        syncInProgress: false,
        lastSyncError: null,
        syncCount: 0
      };
    } catch (error) {
      console.error('Error getting sync data:', error);
      return {};
    }
  }

  /**
   * Save sync data
   * @param {Object} syncData - Sync data object
   * @returns {Promise<boolean>} Success status
   */
  async saveSyncData(syncData) {
    try {
      await chrome.storage.local.set({
        contextzero_sync_data: syncData
      });
      return true;
    } catch (error) {
      console.error('Error saving sync data:', error);
      return false;
    }
  }

  /**
   * Update last sync time
   * @param {number} timestamp - Sync timestamp
   */
  async updateLastSync(timestamp = Date.now()) {
    try {
      const syncData = await this.getSyncData();
      syncData.lastSync = timestamp;
      syncData.syncCount = (syncData.syncCount || 0) + 1;
      await this.saveSyncData(syncData);
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  }

  /**
   * Set sync status
   * @param {boolean} inProgress - Whether sync is in progress
   * @param {string|null} error - Error message if any
   */
  async setSyncStatus(inProgress, error = null) {
    try {
      const syncData = await this.getSyncData();
      syncData.syncInProgress = inProgress;
      syncData.lastSyncError = error;
      await this.saveSyncData(syncData);
    } catch (error) {
      console.error('Error setting sync status:', error);
    }
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.LocalStorage = LocalStorage;
}