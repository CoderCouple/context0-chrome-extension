/**
 * Background service worker for ContextZero Chrome Extension
 */

/**
 * Handle extension installation and updates
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('ContextZero: Extension installed/updated', details.reason);
  
  // Initialize default settings
  try {
    const result = await chrome.storage.sync.get(['contextzero_settings']);
    const settings = result.contextzero_settings || {};
    
    // Set default settings if not already configured
    const defaultSettings = {
      memoryEnabled: true,
      autoCapture: true,
      maxMemories: 1000,
      similarity_threshold: 0.7,
      enhancementMode: 'auto', // auto, manual, disabled
      debugMode: false,
      platforms: {
        chatgpt: true,
        claude: true,
        perplexity: true,
        grok: true,
        gemini: true,
        deepseek: true
      },
      categories: {
        identity: true,
        location: true,
        preference: true,
        work: true,
        education: true,
        family: true,
        hobby: true,
        goal: true,
        health: true,
        tech: true
      }
    };
    
    // Merge with existing settings
    const mergedSettings = { ...defaultSettings, ...settings };
    await chrome.storage.sync.set({ contextzero_settings: mergedSettings });
    
    // Initialize user data if not exists
    const userDataResult = await chrome.storage.local.get(['contextzero_user_data']);
    const userData = userDataResult.contextzero_user_data || {};
    if (!userData.memoriesCreated) {
      await chrome.storage.local.set({
        contextzero_user_data: {
          memoriesCreated: 0,
          promptsEnhanced: 0,
          platformsUsed: [],
          lastUsed: Date.now(),
          installDate: Date.now()
        }
      });
    }
    
    console.log('ContextZero: Settings initialized');
    
  } catch (error) {
    console.error('ContextZero: Error initializing settings:', error);
  }
});

/**
 * Handle messages from content scripts and popup
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('ContextZero: Background received message:', request.action);
  
  // Handle async operations
  (async () => {
    try {
      const storage = new LocalStorage();
      const memoryManager = new MemoryManager();
      
      switch (request.action) {
        case 'addMemory':
          const memories = await memoryManager.storeMemory(request.content, request.metadata);
          sendResponse({ success: true, memories });
          break;
          
        case 'searchMemories':
          const results = await memoryManager.searchMemories(request.query, request.options);
          sendResponse({ success: true, memories: results });
          break;
          
        case 'enhancePrompt':
          const enhanced = await handlePromptEnhancement(request.prompt, request.options);
          sendResponse({ success: true, ...enhanced });
          break;
          
        case 'getAllMemories':
          const allMemories = await storage.getMemories();
          sendResponse({ success: true, memories: allMemories });
          break;
          
        case 'deleteMemory':
          const deleted = await storage.deleteMemory(request.memoryId);
          sendResponse({ success: deleted });
          break;
          
        case 'clearAllMemories':
          const cleared = await storage.clearMemories();
          sendResponse({ success: cleared });
          break;
          
        case 'getSettings':
          const settings = await storage.getSettings();
          sendResponse({ success: true, settings });
          break;
          
        case 'updateSettings':
          const updated = await storage.saveSettings(request.settings);
          sendResponse({ success: updated });
          break;
          
        case 'getStatistics':
          const stats = await memoryManager.getStatistics();
          sendResponse({ success: true, statistics: stats });
          break;
          
        case 'exportData':
          const exportData = await storage.exportData();
          sendResponse({ success: true, data: exportData });
          break;
          
        case 'importData':
          const imported = await storage.importData(request.data);
          sendResponse({ success: imported });
          break;
          
        case 'openOptionsPage':
          chrome.runtime.openOptionsPage();
          sendResponse({ success: true });
          break;
          
        default:
          console.warn('ContextZero: Unknown action:', request.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
      
    } catch (error) {
      console.error('ContextZero: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  // Return true to indicate async response
  return true;
});

/**
 * Handle prompt enhancement requests
 * @param {string} prompt - Original prompt
 * @param {Object} options - Enhancement options
 * @returns {Promise<Object>} Enhancement result
 */
async function handlePromptEnhancement(prompt, options = {}) {
  try {
    const memoryManager = new MemoryManager();
    const storage = new LocalStorage();
    
    // Check if enhancement is enabled
    const settings = await storage.getSettings();
    if (!settings.memoryEnabled || settings.enhancementMode === 'disabled') {
      return { 
        enhanced: false, 
        prompt: prompt, 
        memories: [],
        reason: 'Enhancement disabled'
      };
    }
    
    // Search for relevant memories
    const searchOptions = {
      limit: options.limit || 5,
      threshold: settings.similarity_threshold || 0.3,
      includeGeneral: options.includeGeneral !== false,
      platforms: options.platforms || [],
      categories: options.categories || []
    };
    
    const relevantMemories = await memoryManager.searchMemories(prompt, searchOptions);
    
    if (relevantMemories.length === 0) {
      return {
        enhanced: false,
        prompt: prompt,
        memories: [],
        reason: 'No relevant memories found'
      };
    }
    
    // Format memories for injection
    const formattedMemories = memoryManager.formatMemoriesForInjection(relevantMemories, {
      groupByCategory: options.groupByCategory !== false,
      includeMetadata: options.includeMetadata === true,
      maxLength: options.maxLength || 800
    });
    
    const enhancedPrompt = prompt + formattedMemories;
    
    return {
      enhanced: true,
      prompt: enhancedPrompt,
      originalPrompt: prompt,
      memories: relevantMemories,
      memoriesText: formattedMemories,
      reason: `Added ${relevantMemories.length} relevant memories`
    };
    
  } catch (error) {
    console.error('ContextZero: Error enhancing prompt:', error);
    return {
      enhanced: false,
      prompt: prompt,
      memories: [],
      error: error.message
    };
  }
}

/**
 * Handle browser action click (extension icon)
 */
chrome.action.onClicked.addListener(async (tab) => {
  console.log('ContextZero: Extension icon clicked');
  
  try {
    // Check if we're on a supported platform
    const supportedDomains = [
      'chatgpt.com',
      'chat.openai.com', 
      'claude.ai',
      'perplexity.ai',
      'x.ai',
      'gemini.google.com',
      'bard.google.com',
      'ai.google.dev',
      'deepseek.com',
      'chat.deepseek.com'
    ];
    
    const isSupported = supportedDomains.some(domain => 
      tab.url && tab.url.includes(domain)
    );
    
    if (isSupported) {
      // Send message to content script to open memory panel
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleMemoryPanel' 
      }).catch(error => {
        console.log('ContextZero: Content script not ready, opening popup instead');
        chrome.action.openPopup();
      });
    } else {
      // Open popup for unsupported pages
      chrome.action.openPopup();
    }
    
  } catch (error) {
    console.error('ContextZero: Error handling icon click:', error);
    chrome.action.openPopup();
  }
});

/**
 * Handle tab updates to re-inject content scripts if needed
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when page has finished loading
  if (changeInfo.status !== 'complete') return;
  
  try {
    const supportedDomains = [
      'chatgpt.com',
      'chat.openai.com',
      'claude.ai', 
      'perplexity.ai',
      'x.ai',
      'gemini.google.com',
      'bard.google.com',
      'ai.google.dev',
      'deepseek.com',
      'chat.deepseek.com'
    ];
    
    const isSupported = supportedDomains.some(domain => 
      tab.url && tab.url.includes(domain)
    );
    
    if (isSupported) {
      // Ping content script to see if it's active
      chrome.tabs.sendMessage(tabId, { action: 'ping' }).catch(() => {
        console.log('ContextZero: Content script not active, may need manual refresh');
      });
    }
    
  } catch (error) {
    console.error('ContextZero: Error handling tab update:', error);
  }
});

/**
 * Handle context menu creation (optional feature)
 */
chrome.runtime.onInstalled.addListener(() => {
  try {
    // Create context menu for selected text
    chrome.contextMenus.create({
      id: 'contextzero-add-memory',
      title: 'Add to ContextZero memories',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: 'contextzero-search-memories', 
      title: 'Search ContextZero memories',
      contexts: ['selection']
    });
    
  } catch (error) {
    console.error('ContextZero: Error creating context menus:', error);
  }
});

/**
 * Handle context menu clicks
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    if (info.menuItemId === 'contextzero-add-memory' && info.selectionText) {
      // Add selected text as memory
      chrome.tabs.sendMessage(tab.id, {
        action: 'addSelectedTextAsMemory',
        text: info.selectionText
      });
    } else if (info.menuItemId === 'contextzero-search-memories' && info.selectionText) {
      // Search memories with selected text
      chrome.tabs.sendMessage(tab.id, {
        action: 'searchMemoriesWithText',
        text: info.selectionText
      });
    }
  } catch (error) {
    console.error('ContextZero: Error handling context menu:', error);
  }
});

/**
 * Alarm handler for periodic cleanup tasks
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'contextzero-cleanup') {
    try {
      console.log('ContextZero: Running periodic cleanup');
      
      const storage = new LocalStorage();
      const memories = await storage.getMemories();
      
      // Remove very old memories if we're at the limit
      if (memories.length >= 1000) {
        const cutoff = Date.now() - (365 * 24 * 60 * 60 * 1000); // 1 year
        const filtered = memories.filter(m => m.timestamp > cutoff);
        
        if (filtered.length < memories.length) {
          await chrome.storage.local.set({
            contextzero_memories: filtered
          });
          console.log(`ContextZero: Cleaned up ${memories.length - filtered.length} old memories`);
        }
      }
      
    } catch (error) {
      console.error('ContextZero: Error during cleanup:', error);
    }
  }
});

/**
 * Set up periodic cleanup alarm
 */
chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create('contextzero-cleanup', {
    delayInMinutes: 60, // First cleanup after 1 hour
    periodInMinutes: 24 * 60 // Then every 24 hours
  });
});

// Dummy classes for background script context
// (Real classes are injected in content scripts)
class LocalStorage {
  constructor() {
    this.storageKey = 'contextzero_memories';
    this.settingsKey = 'contextzero_settings';
    this.userDataKey = 'contextzero_user_data';
  }
  
  async getMemories() {
    const result = await chrome.storage.local.get([this.storageKey]);
    return result[this.storageKey] || [];
  }
  
  async getSettings() {
    const result = await chrome.storage.local.get([this.settingsKey]);
    return result[this.settingsKey] || {};
  }
  
  async saveSettings(settings) {
    await chrome.storage.local.set({ [this.settingsKey]: settings });
    return true;
  }
  
  async getUserData() {
    const result = await chrome.storage.local.get([this.userDataKey]);
    return result[this.userDataKey] || {};
  }
  
  async updateUserData(userData) {
    await chrome.storage.local.set({ [this.userDataKey]: userData });
    return true;
  }
  
  async deleteMemory(id) {
    const memories = await this.getMemories();
    const filtered = memories.filter(m => m.id !== id);
    await chrome.storage.local.set({ [this.storageKey]: filtered });
    return true;
  }
  
  async clearMemories() {
    await chrome.storage.local.remove([this.storageKey]);
    return true;
  }
  
  async exportData() {
    const [memories, settings, userData] = await Promise.all([
      this.getMemories(),
      this.getSettings(), 
      this.getUserData()
    ]);
    
    return {
      memories,
      settings,
      userData,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
  }
  
  async importData(data) {
    if (data.memories) {
      await chrome.storage.local.set({ [this.storageKey]: data.memories });
    }
    if (data.settings) {
      await chrome.storage.local.set({ [this.settingsKey]: data.settings });
    }
    if (data.userData) {
      await chrome.storage.local.set({ [this.userDataKey]: data.userData });
    }
    return true;
  }
}

class MemoryManager {
  constructor() {
    this.storage = new LocalStorage();
  }
  
  async storeMemory(content, metadata) {
    // Simplified version for background script
    return [];
  }
  
  async searchMemories(query, options) {
    const storage = new LocalStorage();
    const memories = await storage.getMemories();
    
    if (!query) return memories.slice(0, options.limit || 10);
    
    const queryLower = query.toLowerCase();
    return memories
      .filter(m => m.content.toLowerCase().includes(queryLower))
      .slice(0, options.limit || 10);
  }
  
  async getStatistics() {
    const storage = new LocalStorage();
    const [memories, userData] = await Promise.all([
      storage.getMemories(),
      storage.getUserData()
    ]);
    
    const categories = {};
    const platforms = {};
    
    memories.forEach(memory => {
      const category = memory.metadata?.category || 'unknown';
      const platform = memory.metadata?.platform || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
      platforms[platform] = (platforms[platform] || 0) + 1;
    });
    
    return {
      totalMemories: memories.length,
      categories,
      platforms,
      ...userData
    };
  }
  
  formatMemoriesForInjection(memories, options = {}) {
    if (!memories || memories.length === 0) return '';
    
    let formatted = '\n\nContext from your previous conversations:\n';
    memories.forEach(memory => {
      formatted += `- ${memory.content}\n`;
    });
    formatted += '\nPlease use this context to provide more personalized responses.\n';
    
    return formatted;
  }
}

console.log('ContextZero: Background script loaded');