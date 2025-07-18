/**
 * Core memory management system for ContextZero
 */
class MemoryManager {
  constructor() {
    this.storage = new LocalStorage();
    this.extractor = new MemoryExtractor();
    this.cache = new Map();
    this.lastCacheUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Store a new memory with automatic fact extraction
   * @param {string} content - Raw content to store
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<Array>} Array of stored memory objects
   */
  async storeMemory(content, metadata = {}) {
    try {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return [];
      }
      
      const cleanContent = this.cleanContent(content);
      const facts = this.extractor.extractFacts(cleanContent);
      const storedMemories = [];
      
      // Store each extracted fact as a separate memory
      for (const fact of facts) {
        const memory = {
          id: this.generateId(),
          content: fact.content,
          originalText: content,
          metadata: {
            type: fact.type,
            category: fact.type,
            confidence: fact.confidence,
            platform: metadata.platform || 'unknown',
            source: 'auto_extract',
            keywords: this.extractor.extractKeywords(fact.content),
            ...metadata
          },
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0
        };
        
        const savedMemory = await this.storage.saveMemory(memory);
        if (savedMemory) {
          storedMemories.push(savedMemory);
        }
      }
      
      // Store general content if no specific facts were extracted
      if (facts.length === 0 && cleanContent.length > 10) {
        const generalMemory = {
          id: this.generateId(),
          content: cleanContent,
          originalText: content,
          metadata: {
            type: 'general',
            category: this.extractor.categorizeContent(cleanContent),
            confidence: 0.5,
            platform: metadata.platform || 'unknown',
            source: 'general_content',
            keywords: this.extractor.extractKeywords(cleanContent),
            ...metadata
          },
          timestamp: Date.now(),
          lastAccessed: Date.now(),
          accessCount: 0
        };
        
        const savedMemory = await this.storage.saveMemory(generalMemory);
        if (savedMemory) {
          storedMemories.push(savedMemory);
        }
      }
      
      // Clear cache to force refresh
      this.clearCache();
      
      // Update user statistics
      await this.updateUserStats('memoriesCreated', storedMemories.length);
      
      return storedMemories;
      
    } catch (error) {
      console.error('Error storing memory:', error);
      return [];
    }
  }
  
  /**
   * Search for relevant memories based on query
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<Array>} Array of relevant memories
   */
  async searchMemories(query, options = {}) {
    try {
      const {
        limit = 10,
        threshold = 0.3,
        includeGeneral = true,
        platforms = [],
        categories = [],
        timeRange = null
      } = options;
      
      // Use cache if available and recent
      const cacheKey = `search:${query}:${JSON.stringify(options)}`;
      if (this.isCacheValid() && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      let memories = await this.storage.searchMemories(query, limit * 2); // Get more for filtering
      
      // Apply filters
      if (platforms.length > 0) {
        memories = memories.filter(m => platforms.includes(m.metadata.platform));
      }
      
      if (categories.length > 0) {
        memories = memories.filter(m => categories.includes(m.metadata.category));
      }
      
      if (!includeGeneral) {
        memories = memories.filter(m => m.metadata.type !== 'general');
      }
      
      // Apply time range filter
      if (timeRange) {
        const cutoff = Date.now() - timeRange;
        memories = memories.filter(m => m.timestamp >= cutoff);
      }
      
      // Apply threshold filter
      memories = memories.filter(m => (m.score || 0) >= threshold);
      
      // Enhance scoring with additional factors
      memories = memories.map(memory => {
        let enhancedScore = memory.score || 0;
        
        // Boost recent memories
        const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
        enhancedScore += Math.max(0, 2 - daysSince * 0.1);
        
        // Boost frequently accessed memories
        enhancedScore += Math.min(memory.accessCount * 0.1, 1);
        
        // Boost high-confidence memories
        enhancedScore += (memory.metadata.confidence || 0) * 2;
        
        // Update access tracking
        this.updateMemoryAccess(memory.id);
        
        return { ...memory, enhancedScore };
      });
      
      // Sort by enhanced score and limit results
      const results = memories
        .sort((a, b) => b.enhancedScore - a.enhancedScore)
        .slice(0, limit);
      
      // Cache results
      this.cache.set(cacheKey, results);
      
      // Update user statistics
      if (results.length > 0) {
        await this.updateUserStats('promptsEnhanced', 1);
      }
      
      return results;
      
    } catch (error) {
      console.error('Error searching memories:', error);
      return [];
    }
  }
  
  /**
   * Get memories by category
   * @param {string} category - Memory category
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Array of memories
   */
  async getMemoriesByCategory(category, limit = 20) {
    try {
      const allMemories = await this.storage.getMemories();
      return allMemories
        .filter(m => m.metadata.category === category)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting memories by category:', error);
      return [];
    }
  }
  
  /**
   * Get recent memories
   * @param {number} limit - Maximum results
   * @param {number} days - Number of days to look back
   * @returns {Promise<Array>} Array of recent memories
   */
  async getRecentMemories(limit = 10, days = 7) {
    try {
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
      const allMemories = await this.storage.getMemories();
      
      return allMemories
        .filter(m => m.timestamp >= cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting recent memories:', error);
      return [];
    }
  }
  
  /**
   * Delete a memory by ID
   * @param {string} id - Memory ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteMemory(id) {
    try {
      const success = await this.storage.deleteMemory(id);
      if (success) {
        this.clearCache();
      }
      return success;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
  
  /**
   * Clear all memories
   * @returns {Promise<boolean>} Success status
   */
  async clearAllMemories() {
    try {
      const success = await this.storage.clearMemories();
      if (success) {
        this.clearCache();
      }
      return success;
    } catch (error) {
      console.error('Error clearing memories:', error);
      return false;
    }
  }
  
  /**
   * Get memory statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const memories = await this.storage.getMemories();
      const userData = await this.storage.getUserData();
      
      // Calculate category distribution
      const categories = {};
      const platforms = {};
      let totalSize = 0;
      
      memories.forEach(memory => {
        const category = memory.metadata.category || 'unknown';
        const platform = memory.metadata.platform || 'unknown';
        
        categories[category] = (categories[category] || 0) + 1;
        platforms[platform] = (platforms[platform] || 0) + 1;
        totalSize += JSON.stringify(memory).length;
      });
      
      return {
        totalMemories: memories.length,
        categories,
        platforms,
        totalSize,
        averageConfidence: memories.reduce((sum, m) => sum + (m.metadata.confidence || 0), 0) / memories.length,
        oldestMemory: memories.length > 0 ? Math.min(...memories.map(m => m.timestamp)) : null,
        newestMemory: memories.length > 0 ? Math.max(...memories.map(m => m.timestamp)) : null,
        ...userData
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      return {};
    }
  }
  
  /**
   * Clean and normalize content
   * @param {string} content - Raw content
   * @returns {string} Cleaned content
   */
  cleanContent(content) {
    return content
      .replace(/\n+/g, ' ')           // Replace newlines with spaces
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[""'']/g, '"')        // Normalize quotes
      .trim();
  }
  
  /**
   * Generate unique ID for memories
   * @returns {string} Unique ID
   */
  generateId() {
    return `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Update memory access tracking
   * @param {string} id - Memory ID
   */
  async updateMemoryAccess(id) {
    try {
      // This would ideally update the specific memory's access count
      // For now, we'll skip this to avoid complex storage updates
      // In a full implementation, we'd update the memory object
    } catch (error) {
      console.error('Error updating memory access:', error);
    }
  }
  
  /**
   * Update user statistics
   * @param {string} stat - Statistic name
   * @param {number} increment - Amount to increment
   */
  async updateUserStats(stat, increment = 1) {
    try {
      const userData = await this.storage.getUserData();
      userData[stat] = (userData[stat] || 0) + increment;
      userData.lastUsed = Date.now();
      await this.storage.updateUserData(userData);
    } catch (error) {
      console.error('Error updating user stats:', error);
    }
  }
  
  /**
   * Check if cache is valid
   * @returns {boolean} Cache validity
   */
  isCacheValid() {
    return Date.now() - this.lastCacheUpdate < this.cacheTimeout;
  }
  
  /**
   * Clear the memory cache
   */
  clearCache() {
    this.cache.clear();
    this.lastCacheUpdate = Date.now();
  }
  
  /**
   * Format memories for injection into prompts
   * @param {Array} memories - Array of memory objects
   * @param {Object} options - Formatting options
   * @returns {string} Formatted memory string
   */
  formatMemoriesForInjection(memories, options = {}) {
    const {
      includeMetadata = false,
      groupByCategory = false,
      maxLength = 1000
    } = options;
    
    if (!memories || memories.length === 0) {
      return '';
    }
    
    let formatted = '\n\nContext from your previous conversations:\n';
    
    if (groupByCategory) {
      const grouped = {};
      memories.forEach(memory => {
        const category = memory.metadata.category || 'general';
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(memory);
      });
      
      for (const [category, categoryMemories] of Object.entries(grouped)) {
        formatted += `\n${category.toUpperCase()}:\n`;
        categoryMemories.forEach(memory => {
          formatted += `- ${memory.content}\n`;
        });
      }
    } else {
      memories.forEach(memory => {
        formatted += `- ${memory.content}\n`;
        if (includeMetadata && memory.metadata.type !== 'general') {
          formatted += `  (${memory.metadata.type})\n`;
        }
      });
    }
    
    formatted += '\nPlease use this context to provide more personalized and relevant responses.\n';
    
    // Truncate if too long
    if (formatted.length > maxLength) {
      formatted = formatted.substring(0, maxLength - 50) + '...\n\nPlease use this context to provide more personalized responses.\n';
    }
    
    return formatted;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MemoryManager = MemoryManager;
}