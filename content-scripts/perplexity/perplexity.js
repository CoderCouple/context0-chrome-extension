/**
 * Perplexity content script for ContextZero
 * Handles memory injection and extraction for Perplexity interface
 */

class PerplexityAdapter {
  constructor() {
    // Selectors for Perplexity interface elements
    this.selectors = {
      input: '#ask-input, div[contenteditable="true"], textarea[placeholder*="Ask"], input[type="text"]',
      sendButton: 'button[aria-label*="Submit"], button[data-testid*="submit"], button[type="submit"], button svg',
      messageContainer: '.prose, [data-testid="message"], .message',
      conversationContainer: 'main, [data-testid="conversation"], [role="main"]',
      inputContainer: 'form, [data-testid="input-container"], div[class*="input"]',
      modelSelectionButton: 'button[aria-label="Choose a model"]'
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
    } catch (error) {
      console.error('ContextZero: Failed to initialize Perplexity adapter:', error);
    }
  }
  
  /**
   * Wait for DOM elements to be available
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      const checkDOM = () => {
        const inputElement = this.getInputElement();
        if (inputElement) {
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
    // Log all available elements for debugging
    
    for (const selector of this.selectors.input.split(', ')) {
      try {
        const element = document.querySelector(selector);
        if (element) {
          return element;
        }
      } catch (e) {
      }
    }
    
    // Try fallback - look for any textarea or input
    const fallbackTextarea = document.querySelector('textarea');
    if (fallbackTextarea) {
      return fallbackTextarea;
    }
    
    const fallbackInput = document.querySelector('input[type="text"]');
    if (fallbackInput) {
      return fallbackInput;
    }
    
    return null;
  }
  
  /**
   * Get current input text
   * @returns {string} Current input text
   */
  getInputText() {
    try {
      const input = this.getInputElement();
      if (!input) return '';
      
      let text = '';
      if (input.contentEditable === 'true') {
        text = input.textContent || '';
      } else {
        text = input.value || '';
      }
      
      // Ensure we always return a string
      return typeof text === 'string' ? text : '';
    } catch (error) {
      console.warn('ContextZero: Error getting input text:', error);
      return '';
    }
  }
  
  /**
   * Set input text
   * @param {string} text - Text to set
   */
  setInputText(text) {
    const input = this.getInputElement();
    if (input) {
      if (input.contentEditable === 'true') {
        // Handle contenteditable div (like Perplexity's #ask-input)
        input.textContent = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus and set cursor to end
        input.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // Handle regular input/textarea
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Focus and set cursor to end
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }
  
  /**
   * Get container for injecting memory button
   * @returns {Element|null} Button container
   */
  getModelSelectionButton() {
    const button = document.querySelector(this.selectors.modelSelectionButton);
    if (button) {
      return button;
    }
    return null;
  }

  getSendButton() {
    const selectors = this.selectors.sendButton.split(', ');
    for (const selector of selectors) {
      try {
        const button = document.querySelector(selector);
        if (button) return button;
      } catch (e) {
        // Skip invalid selector
      }
    }
    return null;
  }

  getInputContainer() {
    const input = this.getInputElement();
    if (!input) return null;
    
    const containers = [
      input.closest('form'),
      input.closest('[data-testid="input-container"]'),
      input.closest('div[class*="input"]'),
      input.parentElement
    ];
    
    for (const container of containers) {
      if (container && !container.querySelector('#contextzero-icon-button')) {
        return container;
      }
    }
    return null;
  }
  
  /**
   * Inject memory button into the interface
   */
  createModelSelectionButton(modelButton) {
    const contextZeroButton = new PerplexityContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      }
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    // Use exact mem0 approach - find the specific button container
    const buttonContainer_parent = modelButton.closest('.bg-background-50.dark\\:bg-offsetDark.flex.items-center.justify-self-end.rounded-full');
    
    if (buttonContainer_parent) {
      // Insert at the beginning like mem0 does
      buttonContainer_parent.insertBefore(buttonContainer, buttonContainer_parent.firstChild);
    } else {
      // Fallback approach
      const fallbackContainer = modelButton.closest('.flex.items-center') || modelButton.parentNode;
      if (fallbackContainer) {
        fallbackContainer.insertBefore(buttonContainer, modelButton);
      }
    }
    
    this.updateNotificationDot();
  }

  createSendButtonStrategy(sendButton) {
    const contextZeroButton = new PerplexityContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin-right: 8px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    sendButton.parentNode.insertBefore(buttonContainer, sendButton);
    this.updateNotificationDot();
  }

  createInputContainerStrategy(inputContainer) {
    const contextZeroButton = new PerplexityContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin-left: 8px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    inputContainer.appendChild(buttonContainer);
    this.updateNotificationDot();
  }

  createFallbackButton(inputElement) {
    const contextZeroButton = new PerplexityContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        position: fixed;
        bottom: 100px;
        right: 24px;
        z-index: 1000;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    document.body.appendChild(buttonContainer);
    this.updateNotificationDot();
  }

  injectMemoryButton() {
    
    const existingButton = document.querySelector('#contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
    }
    
    const modelButton = this.getModelSelectionButton();
    if (modelButton && !document.querySelector('#contextzero-icon-button')) {
      this.createModelSelectionButton(modelButton);
      return;
    }
    
    const sendButton = this.getSendButton();
    if (sendButton && !document.querySelector('#contextzero-icon-button')) {
      this.createSendButtonStrategy(sendButton);
      return;
    }
    
    const inputContainer = this.getInputContainer();
    if (inputContainer && !document.querySelector('#contextzero-icon-button')) {
      this.createInputContainerStrategy(inputContainer);
      return;
    }
    
    const inputElement = this.getInputElement();
    if (inputElement && !document.querySelector('#contextzero-icon-button')) {
      this.createFallbackButton(inputElement);
      return;
    }
    
  }

  /**
   * Update notification dot based on input content
   */
  updateNotificationDot() {
    const inputElement = this.getInputElement();
    
    if (!inputElement || !this.contextZeroButton) {
      setTimeout(() => this.updateNotificationDot(), 1000);
      return;
    }
    
    const checkForText = () => {
      const inputText = inputElement.value || inputElement.textContent || '';
      const hasText = inputText.trim() !== '';
      
      this.contextZeroButton.updateNotificationDot(hasText);
    };
    
    const observer = new MutationObserver(checkForText);
    observer.observe(inputElement, { 
      childList: true, 
      characterData: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['value'] 
    });
    
    inputElement.addEventListener('input', checkForText);
    inputElement.addEventListener('keyup', checkForText);
    inputElement.addEventListener('focus', checkForText);
    
    checkForText();
    setTimeout(checkForText, 500);
  }
  
  /**
   * Handle memory button click
   */
  async handleMemoryButtonClick() {
    try {
      const inputText = this.getInputText();
      if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
        alert('Please enter a question first, then click the memory button to add relevant context.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('.contextzero-memory-btn');
      const originalContent = button ? button.innerHTML : '';
      if (button) {
        button.innerHTML = '⏳';
        button.disabled = true;
      }
      
      // Search for relevant memories
      const memories = await this.memoryManager.searchMemories(inputText, {
        limit: 10,
        threshold: 0.3,
        includeGeneral: true
      });
      
      // Restore button
      if (button) {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
      
      if (memories.length === 0) {
        alert('No relevant memories found for your question.');
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
        platform: 'perplexity',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing Perplexity message:', error);
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
            platform: 'perplexity',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing Perplexity conversation messages:', error);
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
          sendResponse({ success: true, platform: 'perplexity' });
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
        platform: 'perplexity',
        source: 'manual_selection',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
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
function initializePerplexityAdapter() {
  if (window.location.hostname.includes('perplexity.ai')) {
    const adapter = new PerplexityAdapter();
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        adapter.reinitialize();
      }
    }, 1000);
    
    // Make adapter globally available for debugging
    window.contextZeroPerplexity = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePerplexityAdapter);
} else {
  initializePerplexityAdapter();
}

// Handle dynamic page loads
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializePerplexityAdapter, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});


