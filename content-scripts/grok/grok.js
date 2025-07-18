/**
 * Grok content script for ContextZero
 * Handles memory injection and extraction for Grok interface
 */

class GrokAdapter {
  constructor() {
    // Selectors for Grok interface elements
    this.selectors = {
      input: 'textarea[placeholder*="Message"], textarea[data-testid="composer-textarea"]',
      sendButton: 'button[data-testid="send-button"], button[aria-label="Send"]',
      messageContainer: '[data-testid="message"], .message-content',
      conversationContainer: 'main, [data-testid="conversation"]',
      inputContainer: 'form, [data-testid="composer-form"]'
    };
    
    this.memoryManager = new MemoryManager();
    this.memoryExtractor = new MemoryExtractor();
    this.isInitialized = false;
    this.lastProcessedMessage = '';
    
    this.init();
  }
  
  /**
   * Initialize the adapter
   */
  async init() {
    try {
      await this.waitForDOM();
      this.injectMemoryButton();
      this.setupMessageCapture();
      this.setupAutoMemoryExtraction();
      this.setupMessageListener();
      this.isInitialized = true;
      console.log('ContextZero: Grok adapter initialized');
    } catch (error) {
      console.error('ContextZero: Failed to initialize Grok adapter:', error);
    }
  }
  
  /**
   * Wait for DOM elements to be available
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      const checkDOM = () => {
        if (this.getInputElement()) {
          resolve();
        } else {
          setTimeout(checkDOM, 500);
        }
      };
      checkDOM();
    });
  }
  
  /**
   * Get the input element
   * @returns {Element|null} Input element
   */
  getInputElement() {
    for (const selector of this.selectors.input.split(', ')) {
      const element = document.querySelector(selector);
      if (element) return element;
    }
    return null;
  }
  
  /**
   * Get current input text
   * @returns {string} Current input text
   */
  getInputText() {
    const input = this.getInputElement();
    return input ? input.value : '';
  }
  
  /**
   * Set input text
   * @param {string} text - Text to set
   */
  setInputText(text) {
    const input = this.getInputElement();
    if (input) {
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Focus and set cursor to end
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
  
  /**
   * Get container for injecting memory button
   * @returns {Element|null} Button container
   */
  getButtonContainer() {
    const input = this.getInputElement();
    if (!input) return null;
    
    const form = input.closest('form');
    if (form && !form.querySelector('.contextzero-memory-btn')) {
      return form;
    }
    
    const container = input.parentElement;
    if (container && !container.querySelector('.contextzero-memory-btn')) {
      return container;
    }
    
    return null;
  }
  
  /**
   * Inject memory button into the interface
   */
  injectMemoryButton() {
    const container = this.getButtonContainer();
    if (!container) {
      return;
    }
    
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'contextzero-memory-btn';
    button.innerHTML = '🧠';
    button.title = 'Add relevant memories to your prompt';
    button.style.cssText = `
      background: #1d9bf0;
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-size: 16px;
      margin-left: 8px;
      padding: 8px 12px;
      transition: all 0.2s;
      position: relative;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = '#1a8cd8';
      button.style.transform = 'scale(1.05)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '#1d9bf0';
      button.style.transform = 'scale(1)';
    });
    
    // Click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleMemoryButtonClick();
    });
    
    // Insert button next to the input
    const input = this.getInputElement();
    if (input.nextSibling) {
      container.insertBefore(button, input.nextSibling);
    } else {
      container.appendChild(button);
    }
    
    console.log('ContextZero: Grok memory button injected');
  }
  
  /**
   * Handle memory button click
   */
  async handleMemoryButtonClick() {
    try {
      const inputText = this.getInputText();
      if (!inputText.trim()) {
        alert('Please enter a message first, then click the memory button to add relevant context.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('.contextzero-memory-btn');
      const originalContent = button.innerHTML;
      button.innerHTML = '⏳';
      button.disabled = true;
      
      // Search for relevant memories
      const memories = await this.memoryManager.searchMemories(inputText, {
        limit: 10,
        threshold: 0.3,
        includeGeneral: true
      });
      
      // Restore button
      button.innerHTML = originalContent;
      button.disabled = false;
      
      if (memories.length === 0) {
        alert('No relevant memories found for your message.');
        return;
      }
      
      // Show memory selection modal
      this.showMemoryModal(memories);
      
    } catch (error) {
      console.error('ContextZero: Error handling memory button click:', error);
      
      // Restore button on error
      const button = document.querySelector('.contextzero-memory-btn');
      if (button) {
        button.innerHTML = '🧠';
        button.disabled = false;
      }
    }
  }
  
  /**
   * Show memory selection modal
   * @param {Array} memories - Array of relevant memories
   */
  showMemoryModal(memories) {
    // Remove existing modal
    const existingModal = document.querySelector('.contextzero-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal
    const modal = new MemoryModal(memories, {
      onSelect: (selectedMemories) => this.injectMemories(selectedMemories),
      onClose: () => modal.remove()
    });
    
    document.body.appendChild(modal.render());
  }
  
  /**
   * Inject selected memories into the prompt
   * @param {Array} memories - Selected memories
   */
  injectMemories(memories) {
    if (memories.length === 0) return;
    
    const currentText = this.getInputText();
    const formattedMemories = this.memoryManager.formatMemoriesForInjection(memories, {
      groupByCategory: true,
      maxLength: 800
    });
    
    const newText = currentText + formattedMemories;
    this.setInputText(newText);
    
    console.log(`ContextZero: Injected ${memories.length} memories into Grok prompt`);
  }
  
  /**
   * Setup message capture for memory extraction
   */
  setupMessageCapture() {
    // Listen for send button clicks
    document.addEventListener('click', async (event) => {
      const sendButton = event.target.closest(this.selectors.sendButton);
      if (sendButton) {
        await this.captureUserMessage();
      }
    });
    
    // Listen for Enter key in input
    document.addEventListener('keydown', async (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const input = event.target;
        if (input.matches && input.matches(this.selectors.input)) {
          // Small delay to ensure message is processed
          setTimeout(() => this.captureUserMessage(), 100);
        }
      }
    });
  }
  
  /**
   * Capture and extract memories from user messages
   */
  async captureUserMessage() {
    try {
      const inputText = this.getInputText();
      if (!inputText.trim() || inputText === this.lastProcessedMessage) {
        return;
      }
      
      this.lastProcessedMessage = inputText;
      
      // Extract and store memories
      const memories = await this.memoryManager.storeMemory(inputText, {
        platform: 'grok',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
        console.log(`ContextZero: Extracted ${memories.length} memories from Grok message`);
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing Grok message:', error);
    }
  }
  
  /**
   * Setup automatic memory extraction from conversation
   */
  setupAutoMemoryExtraction() {
    // Observe conversation for new messages
    const conversationContainer = document.querySelector(this.selectors.conversationContainer);
    if (!conversationContainer) return;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if this is a new message
            const messageElements = node.querySelectorAll ? 
              node.querySelectorAll(this.selectors.messageContainer) : [];
            
            if (messageElements.length > 0 || node.matches?.(this.selectors.messageContainer)) {
              // Process new messages after a delay
              setTimeout(() => this.processConversationMessages(), 1000);
            }
          }
        });
      });
    });
    
    observer.observe(conversationContainer, {
      childList: true,
      subtree: true
    });
  }
  
  /**
   * Process conversation messages for memory extraction
   */
  async processConversationMessages() {
    try {
      const messageElements = document.querySelectorAll(this.selectors.messageContainer);
      
      for (const element of messageElements) {
        const text = element.textContent?.trim();
        if (text && text.length > 20 && !element.dataset.contextzeroProcessed) {
          // Mark as processed
          element.dataset.contextzeroProcessed = 'true';
          
          // Extract memories from longer messages
          await this.memoryManager.storeMemory(text, {
            platform: 'grok',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing Grok conversation messages:', error);
    }
  }
  
  /**
   * Setup message listener for memory panel commands
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'toggleMemoryPanel':
          this.toggleMemoryPanel();
          sendResponse({ success: true });
          break;
          
        case 'addSelectedTextAsMemory':
          this.addSelectedTextAsMemory(request.text);
          sendResponse({ success: true });
          break;
          
        case 'searchMemoriesWithText':
          this.searchMemoriesWithText(request.text);
          sendResponse({ success: true });
          break;
          
        case 'ping':
          sendResponse({ success: true, platform: 'grok' });
          break;
      }
    });
  }
  
  /**
   * Toggle memory panel
   */
  async toggleMemoryPanel() {
    const existingPanel = document.querySelector('.contextzero-panel');
    if (existingPanel) {
      existingPanel.remove();
      return;
    }
    
    try {
      // Get memories and statistics
      const [memories, stats] = await Promise.all([
        this.memoryManager.storage.getMemories(),
        this.memoryManager.getStatistics()
      ]);
      
      // Create and show panel
      const panel = new MemoryPanel({
        onClose: () => panel.remove(),
        onDeleteMemory: (id) => this.deleteMemory(id),
        onClearAll: () => this.clearAllMemories(),
        onExport: () => this.exportMemories(),
        onImport: () => this.importMemories()
      });
      
      await panel.loadMemories(memories, stats);
      
    } catch (error) {
      console.error('ContextZero: Error toggling memory panel:', error);
    }
  }
  
  /**
   * Add selected text as memory
   * @param {string} text - Selected text
   */
  async addSelectedTextAsMemory(text) {
    try {
      const memories = await this.memoryManager.storeMemory(text, {
        platform: 'grok',
        source: 'manual_selection',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
        console.log(`ContextZero: Added ${memories.length} memories from selected text`);
      }
    } catch (error) {
      console.error('ContextZero: Error adding selected text as memory:', error);
    }
  }
  
  /**
   * Search memories with selected text
   * @param {string} text - Search text
   */
  async searchMemoriesWithText(text) {
    try {
      const memories = await this.memoryManager.searchMemories(text, {
        limit: 10,
        threshold: 0.3
      });
      
      if (memories.length > 0) {
        this.showMemoryModal(memories);
      } else {
        alert('No relevant memories found for the selected text.');
      }
    } catch (error) {
      console.error('ContextZero: Error searching memories with text:', error);
    }
  }
  
  /**
   * Delete a memory
   * @param {string} id - Memory ID
   */
  async deleteMemory(id) {
    try {
      await this.memoryManager.deleteMemory(id);
      console.log('ContextZero: Memory deleted');
    } catch (error) {
      console.error('ContextZero: Error deleting memory:', error);
    }
  }
  
  /**
   * Clear all memories
   */
  async clearAllMemories() {
    try {
      await this.memoryManager.clearAllMemories();
      console.log('ContextZero: All memories cleared');
    } catch (error) {
      console.error('ContextZero: Error clearing memories:', error);
    }
  }
  
  /**
   * Export memories
   */
  async exportMemories() {
    try {
      const data = await this.memoryManager.storage.exportData();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contextzero-memories-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      console.log('ContextZero: Memories exported');
    } catch (error) {
      console.error('ContextZero: Error exporting memories:', error);
    }
  }
  
  /**
   * Reinitialize adapter when page changes
   */
  reinitialize() {
    if (this.isInitialized) {
      // Re-inject button if needed
      setTimeout(() => {
        if (!document.querySelector('.contextzero-memory-btn')) {
          this.injectMemoryButton();
        }
      }, 1000);
    }
  }
}

// Initialize when DOM is ready
function initializeGrokAdapter() {
  if (window.location.hostname.includes('x.ai')) {
    const adapter = new GrokAdapter();
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        adapter.reinitialize();
      }
    }, 1000);
    
    // Make adapter globally available for debugging
    window.contextZeroGrok = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGrokAdapter);
} else {
  initializeGrokAdapter();
}

// Handle dynamic page loads
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializeGrokAdapter, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('ContextZero: Grok content script loaded');