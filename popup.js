/**
 * Popup script for ContextZero Chrome Extension
 */

class PopupController {
  constructor() {
    this.storage = new LocalStorage();
    this.isLoading = false;
    this.init();
  }

  /**
   * Initialize the popup
   */
  async init() {
    try {
      await this.initializeTheme();
      await this.loadData();
      this.setupEventListeners();
      this.hideLoading();
    } catch (error) {
      this.showError('Failed to initialize popup: ' + error.message);
      this.hideLoading();
    }
  }

  /**
   * Initialize theme system
   */
  async initializeTheme() {
    try {
      // Load saved theme preference from chrome storage
      const result = await chrome.storage.local.get(['contextzero_theme']);
      const savedTheme = result.contextzero_theme;
      const theme = savedTheme || 'dark'; // Default to dark theme
      
      this.setTheme(theme);
      
      // Listen for system theme changes
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        if (!savedTheme) {
          this.setTheme(e.matches ? 'light' : 'dark');
        }
      });
    } catch (error) {
      console.error('Failed to initialize theme:', error);
      this.setTheme('dark'); // fallback to dark theme
    }
  }

  /**
   * Set theme
   */
  setTheme(theme) {
    console.log('Setting theme to:', theme);
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    
    // Update theme icon
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'light' ? '🌙' : '☀️';
    }
    
    // Save theme preference
    try {
      chrome.storage.local.set({ contextzero_theme: theme });
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Toggle theme
   */
  toggleTheme() {
    console.log('Toggle theme clicked');
    const currentTheme = document.body.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    console.log('Switching from', currentTheme, 'to', newTheme);
    this.setTheme(newTheme);
  }

  /**
   * Load data from storage and update UI
   */
  async loadData() {
    try {
      // Get statistics and recent memories
      const [statistics, memories, settings] = await Promise.all([
        this.sendMessage({ action: 'getStatistics' }),
        this.sendMessage({ action: 'getAllMemories' }),
        this.sendMessage({ action: 'getSettings' })
      ]);

      if (statistics.success) {
        this.updateStatistics(statistics.statistics);
      }

      if (memories.success) {
        this.updateRecentMemories(memories.memories.slice(0, 5));
      }

      if (settings.success) {
        this.updateSettings(settings.settings);
      }

    } catch (error) {
      throw new Error('Failed to load data from storage');
    }
  }

  /**
   * Update statistics display
   * @param {Object} stats - Statistics object
   */
  updateStatistics(stats) {
    document.getElementById('total-memories').textContent = stats.totalMemories || 0;
    document.getElementById('memories-created').textContent = stats.memoriesCreated || 0;
    document.getElementById('prompts-enhanced').textContent = stats.promptsEnhanced || 0;
  }

  /**
   * Update recent memories display
   * @param {Array} memories - Array of recent memories
   */
  updateRecentMemories(memories) {
    const container = document.getElementById('recent-memories');
    
    if (!memories || memories.length === 0) {
      container.innerHTML = '<div class="no-memories">No memories yet. Start a conversation on a supported platform!</div>';
      return;
    }

    container.innerHTML = memories.map(memory => `
      <div class="memory-item">
        <div>${this.escapeHtml(this.truncateText(memory.content, 80))}</div>
        <div class="memory-meta">
          ${memory.metadata.type} • ${memory.metadata.platform} • ${this.formatDate(memory.timestamp)}
        </div>
      </div>
    `).join('');
  }

  /**
   * Update settings toggles
   * @param {Object} settings - Settings object
   */
  updateSettings(settings) {
    const memoryToggle = document.getElementById('memory-enabled-toggle');
    const autoToggle = document.getElementById('auto-capture-toggle');

    if (settings.memoryEnabled) {
      memoryToggle.classList.add('active');
    }

    if (settings.autoCapture) {
      autoToggle.classList.add('active');
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Action buttons
    document.getElementById('view-all-btn').addEventListener('click', () => {
      this.openMemoryPanel();
    });

    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('clear-btn').addEventListener('click', () => {
      this.clearAllMemories();
    });

    // Settings toggles
    document.getElementById('memory-enabled-toggle').addEventListener('click', () => {
      this.toggleSetting('memoryEnabled');
    });

    document.getElementById('auto-capture-toggle').addEventListener('click', () => {
      this.toggleSetting('autoCapture');
    });

    // Import file input
    document.getElementById('import-file').addEventListener('change', (e) => {
      this.handleFileImport(e.target.files[0]);
    });
  }

  /**
   * Open memory panel in active tab
   */
  async openMemoryPanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { 
        action: 'toggleMemoryPanel' 
      }).then(() => {
        window.close();
      }).catch(() => {
        this.showError('Please open a supported platform (ChatGPT, Claude, Perplexity, or Grok) to view memories.');
      });
      
    } catch (error) {
      this.showError('Failed to open memory panel: ' + error.message);
    }
  }

  /**
   * Export data to JSON file
   */
  async exportData() {
    try {
      this.setLoading(true);
      
      const result = await this.sendMessage({ action: 'exportData' });
      
      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contextzero-memories-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showSuccess('Memories exported successfully!');
      } else {
        this.showError('Failed to export memories');
      }
      
    } catch (error) {
      this.showError('Export failed: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Import data from JSON file
   */
  importData() {
    document.getElementById('import-file').click();
  }

  /**
   * Handle file import
   * @param {File} file - JSON file to import
   */
  async handleFileImport(file) {
    if (!file) return;

    try {
      this.setLoading(true);
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Validate data structure
      if (!data.memories || !Array.isArray(data.memories)) {
        throw new Error('Invalid file format');
      }
      
      const result = await this.sendMessage({ 
        action: 'importData', 
        data: data 
      });
      
      if (result.success) {
        this.showSuccess(`Imported ${data.memories.length} memories successfully!`);
        await this.loadData(); // Refresh display
      } else {
        this.showError('Failed to import memories');
      }
      
    } catch (error) {
      this.showError('Import failed: ' + error.message);
    } finally {
      this.setLoading(false);
      document.getElementById('import-file').value = ''; // Reset file input
    }
  }

  /**
   * Clear all memories
   */
  async clearAllMemories() {
    if (!confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
      return;
    }

    try {
      this.setLoading(true);
      
      const result = await this.sendMessage({ action: 'clearAllMemories' });
      
      if (result.success) {
        this.showSuccess('All memories cleared successfully!');
        await this.loadData(); // Refresh display
      } else {
        this.showError('Failed to clear memories');
      }
      
    } catch (error) {
      this.showError('Clear failed: ' + error.message);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Toggle a setting
   * @param {string} settingName - Name of setting to toggle
   */
  async toggleSetting(settingName) {
    try {
      const result = await this.sendMessage({ action: 'getSettings' });
      
      if (result.success) {
        const settings = result.settings;
        settings[settingName] = !settings[settingName];
        
        const updateResult = await this.sendMessage({ 
          action: 'updateSettings', 
          settings: settings 
        });
        
        if (updateResult.success) {
          // Update UI
          const toggle = document.getElementById(`${settingName.replace(/([A-Z])/g, '-$1').toLowerCase()}-toggle`);
          toggle.classList.toggle('active', settings[settingName]);
          
          this.showSuccess(`${settingName} ${settings[settingName] ? 'enabled' : 'disabled'}`);
        } else {
          this.showError('Failed to update setting');
        }
      }
      
    } catch (error) {
      this.showError('Failed to toggle setting: ' + error.message);
    }
  }

  /**
   * Send message to background script
   * @param {Object} message - Message to send
   * @returns {Promise<Object>} Response from background script
   */
  sendMessage(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Show loading state
   */
  setLoading(loading) {
    this.isLoading = loading;
    const loadingEl = document.getElementById('loading');
    const mainContent = document.getElementById('main-content');
    
    if (loading) {
      loadingEl.style.display = 'block';
      mainContent.style.display = 'none';
    } else {
      loadingEl.style.display = 'none';
      mainContent.style.display = 'block';
    }
  }

  /**
   * Hide loading state
   */
  hideLoading() {
    this.setLoading(false);
  }

  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    const errorEl = document.getElementById('error');
    const errorMessage = document.getElementById('error-message');
    
    errorMessage.textContent = message;
    errorEl.style.display = 'block';
    
    // Hide after 5 seconds
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }

  /**
   * Show success message
   * @param {string} message - Success message
   */
  showSuccess(message) {
    const successEl = document.getElementById('success');
    const successMessage = document.getElementById('success-message');
    
    successMessage.textContent = message;
    successEl.style.display = 'block';
    
    // Hide after 3 seconds
    setTimeout(() => {
      successEl.style.display = 'none';
    }, 3000);
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Text to truncate
   * @param {number} length - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length - 3) + '...';
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Timestamp
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 72) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Dummy LocalStorage class for popup context
class LocalStorage {
  // This is a placeholder - real storage operations go through background script
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Refresh data when popup becomes visible
    if (window.popupController) {
      window.popupController.loadData();
    }
  }
});

console.log('ContextZero: Popup script loaded');