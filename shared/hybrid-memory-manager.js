/**
 * Hybrid Memory Manager for ContextZero
 * Combines local pattern-based extraction with cloud AI processing
 */

class HybridMemoryManager {
  constructor() {
    this.localMemoryManager = null;
    this.cloudAPI = null;
    this.storage = null;
    this.settings = null;
    this.init();
  }

  async init() {
    // Import and initialize local components
    if (typeof MemoryManager !== 'undefined') {
      this.localMemoryManager = new MemoryManager();
    }
    
    if (typeof CloudAPI !== 'undefined') {
      this.cloudAPI = new CloudAPI();
    }
    
    if (typeof LocalStorage !== 'undefined') {
      this.storage = new LocalStorage();
    }

    // Load settings
    await this.loadSettings();
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get(['contextzero_settings']);
    this.settings = result.contextzero_settings || {
      processingMode: 'hybrid', // 'local', 'cloud', 'hybrid'
      cloudEnabled: true,
      localEnabled: true,
      autoSync: true,
      aiEnhancement: true
    };
  }

  async saveSettings() {
    await chrome.storage.sync.set({ contextzero_settings: this.settings });
  }

  /**
   * Store memory using hybrid approach
   * @param {string} content - Message content
   * @param {Object} metadata - Memory metadata
   * @returns {Promise<Array>} Stored memories
   */
  async storeMemory(content, metadata = {}) {
    const results = [];
    
    try {
      // Always try local processing first (faster)
      if (this.settings.localEnabled && this.localMemoryManager) {
        const localMemories = await this.localMemoryManager.storeMemory(content, metadata);
        results.push(...localMemories);
      }

      // If cloud is enabled and authenticated, enhance with AI processing
      if (this.settings.cloudEnabled && this.cloudAPI && this.cloudAPI.isCloudEnabled()) {
        try {
          const aiMemories = await this.cloudAPI.processMemoriesWithAI(content, {
            ...metadata,
            localMemories: results.length > 0 ? results : undefined
          });
          
          // Merge AI-enhanced memories with local ones
          if (aiMemories && aiMemories.length > 0) {
            const enhancedMemories = await this.mergeMemories(results, aiMemories);
            
            // Store enhanced memories locally
            if (this.storage) {
              for (const memory of enhancedMemories) {
                await this.storage.saveMemory(memory);
              }
            }
            
            return enhancedMemories;
          }
        } catch (error) {
          console.warn('Cloud processing failed, falling back to local:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Memory storage error:', error);
      return [];
    }
  }

  /**
   * Search memories using hybrid approach
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Search results
   */
  async searchMemories(query, options = {}) {
    const results = [];
    
    try {
      // Local search (always available)
      if (this.settings.localEnabled && this.localMemoryManager) {
        const localResults = await this.localMemoryManager.searchMemories(query, options);
        results.push(...localResults);
      }

      // Cloud AI search (if enabled and authenticated)
      if (this.settings.cloudEnabled && this.cloudAPI && this.cloudAPI.isCloudEnabled()) {
        try {
          const aiResults = await this.cloudAPI.searchMemoriesWithAI(query, {
            ...options,
            excludeLocalResults: results.map(r => r.id)
          });
          
          if (aiResults && aiResults.length > 0) {
            // Merge and rank results
            const mergedResults = await this.mergeSearchResults(results, aiResults);
            return mergedResults;
          }
        } catch (error) {
          console.warn('Cloud search failed, using local results:', error);
        }
      }

      return results;
    } catch (error) {
      console.error('Memory search error:', error);
      return [];
    }
  }

  /**
   * Sync memories between local and cloud
   * @returns {Promise<Object>} Sync result
   */
  async syncMemories() {
    if (!this.settings.autoSync || !this.cloudAPI || !this.cloudAPI.isCloudEnabled()) {
      return { success: false, error: 'Sync not enabled or not authenticated' };
    }

    try {
      // Get local memories
      const localMemories = await this.storage.getMemories();
      
      // Get cloud memories
      const cloudMemories = await this.cloudAPI.getMemoriesFromCloud();
      
      // Determine what needs to be synced
      const syncPlan = this.calculateSyncPlan(localMemories, cloudMemories);
      
      // Upload new local memories to cloud
      if (syncPlan.toCloud.length > 0) {
        await this.cloudAPI.syncMemoriesToCloud(syncPlan.toCloud);
      }
      
      // Download new cloud memories to local
      if (syncPlan.toLocal.length > 0) {
        for (const memory of syncPlan.toLocal) {
          await this.storage.saveMemory(memory);
        }
      }
      
      return {
        success: true,
        uploaded: syncPlan.toCloud.length,
        downloaded: syncPlan.toLocal.length,
        conflicts: syncPlan.conflicts.length
      };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate what needs to be synced
   * @param {Array} localMemories - Local memories
   * @param {Array} cloudMemories - Cloud memories
   * @returns {Object} Sync plan
   */
  calculateSyncPlan(localMemories, cloudMemories) {
    const localIds = new Set(localMemories.map(m => m.id));
    const cloudIds = new Set(cloudMemories.map(m => m.id));
    const cloudMap = new Map(cloudMemories.map(m => [m.id, m]));
    const localMap = new Map(localMemories.map(m => [m.id, m]));
    
    const toCloud = localMemories.filter(m => !cloudIds.has(m.id));
    const toLocal = cloudMemories.filter(m => !localIds.has(m.id));
    const conflicts = [];
    
    // Check for conflicts (same ID but different content)
    for (const id of localIds) {
      if (cloudIds.has(id)) {
        const localMemory = localMap.get(id);
        const cloudMemory = cloudMap.get(id);
        
        if (localMemory.timestamp !== cloudMemory.timestamp) {
          conflicts.push({
            id,
            local: localMemory,
            cloud: cloudMemory
          });
        }
      }
    }
    
    return { toCloud, toLocal, conflicts };
  }

  /**
   * Merge local and AI-enhanced memories
   * @param {Array} localMemories - Local memories
   * @param {Array} aiMemories - AI-enhanced memories
   * @returns {Promise<Array>} Merged memories
   */
  async mergeMemories(localMemories, aiMemories) {
    const merged = [...localMemories];
    const localIds = new Set(localMemories.map(m => m.id));
    
    // Add AI memories that don't exist locally
    for (const aiMemory of aiMemories) {
      if (!localIds.has(aiMemory.id)) {
        merged.push({
          ...aiMemory,
          metadata: {
            ...aiMemory.metadata,
            source: 'ai_enhanced',
            localProcessed: false
          }
        });
      } else {
        // Enhance existing local memory with AI insights
        const localIndex = merged.findIndex(m => m.id === aiMemory.id);
        if (localIndex !== -1) {
          merged[localIndex] = {
            ...merged[localIndex],
            metadata: {
              ...merged[localIndex].metadata,
              aiInsights: aiMemory.metadata.aiInsights,
              confidence: Math.max(merged[localIndex].metadata.confidence, aiMemory.metadata.confidence),
              enhancedBy: 'ai'
            }
          };
        }
      }
    }
    
    return merged;
  }

  /**
   * Merge local and cloud search results
   * @param {Array} localResults - Local search results
   * @param {Array} cloudResults - Cloud search results
   * @returns {Promise<Array>} Merged and ranked results
   */
  async mergeSearchResults(localResults, cloudResults) {
    const merged = [...localResults];
    const localIds = new Set(localResults.map(r => r.id));
    
    // Add cloud results that don't exist locally
    for (const cloudResult of cloudResults) {
      if (!localIds.has(cloudResult.id)) {
        merged.push({
          ...cloudResult,
          source: 'cloud'
        });
      } else {
        // Enhance local result with cloud relevance score
        const localIndex = merged.findIndex(r => r.id === cloudResult.id);
        if (localIndex !== -1) {
          merged[localIndex] = {
            ...merged[localIndex],
            enhancedScore: (merged[localIndex].score + cloudResult.score) / 2,
            cloudRelevance: cloudResult.score
          };
        }
      }
    }
    
    // Sort by enhanced score
    return merged.sort((a, b) => (b.enhancedScore || b.score) - (a.enhancedScore || a.score));
  }

  /**
   * Get comprehensive statistics including cloud data
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const stats = {
      local: null,
      cloud: null,
      sync: null
    };
    
    // Local statistics
    if (this.localMemoryManager) {
      stats.local = await this.localMemoryManager.getStatistics();
    }
    
    // Cloud statistics
    if (this.cloudAPI && this.cloudAPI.isCloudEnabled()) {
      try {
        stats.cloud = await this.cloudAPI.getUserAnalytics();
      } catch (error) {
        console.warn('Failed to get cloud statistics:', error);
      }
    }
    
    // Sync statistics
    stats.sync = {
      lastSync: await this.getLastSyncTime(),
      autoSync: this.settings.autoSync,
      cloudEnabled: this.settings.cloudEnabled
    };
    
    return stats;
  }

  /**
   * Get last sync time
   * @returns {Promise<number|null>} Last sync timestamp
   */
  async getLastSyncTime() {
    const result = await chrome.storage.local.get(['contextzero_last_sync']);
    return result.contextzero_last_sync || null;
  }

  /**
   * Set last sync time
   * @param {number} timestamp - Sync timestamp
   */
  async setLastSyncTime(timestamp) {
    await chrome.storage.local.set({ contextzero_last_sync: timestamp });
  }

  /**
   * Update processing mode
   * @param {string} mode - Processing mode ('local', 'cloud', 'hybrid')
   */
  async setProcessingMode(mode) {
    if (['local', 'cloud', 'hybrid'].includes(mode)) {
      this.settings.processingMode = mode;
      this.settings.localEnabled = mode === 'local' || mode === 'hybrid';
      this.settings.cloudEnabled = mode === 'cloud' || mode === 'hybrid';
      await this.saveSettings();
    }
  }

  /**
   * Get current processing mode
   * @returns {string} Current processing mode
   */
  getProcessingMode() {
    return this.settings.processingMode;
  }

  /**
   * Enable/disable auto-sync
   * @param {boolean} enabled - Enable auto-sync
   */
  async setAutoSync(enabled) {
    this.settings.autoSync = enabled;
    await this.saveSettings();
  }

  /**
   * Get authentication status
   * @returns {Object} Auth status
   */
  getAuthStatus() {
    if (this.cloudAPI) {
      return this.cloudAPI.getAuthStatus();
    }
    return { isAuthenticated: false, cloudEnabled: false };
  }

  /**
   * Authenticate with cloud
   * @param {string} clerkToken - Clerk token
   * @returns {Promise<Object>} Auth result
   */
  async authenticate(clerkToken) {
    if (this.cloudAPI) {
      return await this.cloudAPI.authenticateWithClerk(clerkToken);
    }
    return { success: false, error: 'Cloud API not available' };
  }

  /**
   * Logout from cloud
   */
  async logout() {
    if (this.cloudAPI) {
      await this.cloudAPI.logout();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HybridMemoryManager;
}