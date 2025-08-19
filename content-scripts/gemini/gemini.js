/**
 * Gemini content script for ContextZero
 * Handles memory injection and extraction for Gemini interface
 */

class GeminiAdapter {
  constructor() {
    // Selectors for Gemini interface elements
    this.selectors = {
      input: 'rich-textarea .ql-editor[contenteditable="true"], rich-textarea .ql-editor.textarea, .ql-editor[aria-label="Enter a prompt here"], .ql-editor.textarea.new-input-ui, .text-input-field_textarea .ql-editor, div[contenteditable="true"][role="textbox"][aria-label="Enter a prompt here"]',
      sendButton: 'button[aria-label="Send message"], button[data-testid="send-button"], button[type="submit"]:not([aria-label*="attachment"]), .send-button, button[aria-label*="Send"], button[title*="Send"]',
      messageContainer: '[data-testid="message"], .message-content, .model-response-text',
      conversationContainer: 'main, [data-testid="conversation-container"]',
      inputContainer: 'form, [data-testid="input-container"]',
      toolboxDrawer: 'toolbox-drawer .toolbox-drawer-container'
    };
    
    this.memoryManager = new MemoryManager();
    this.memoryExtractor = new MemoryExtractor();
    this.isInitialized = false;
    this.lastProcessedMessage = '';
    this.allMemories = [];
    this.allMemoriesById = new Set();
    this.sendListenerAdded = false;
    
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
      console.error('ContextZero: Failed to initialize Gemini adapter:', error);
    }
  }
  
  /**
   * Wait for DOM elements to be available
   */
  async waitForDOM() {
    return new Promise((resolve) => {
      const checkDOM = () => {
        if (this.getInputElement() || this.getToolboxDrawer()) {
          resolve();
        } else {
          setTimeout(checkDOM, 100);
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
   * Get the toolbox drawer container
   * @returns {Element|null} Toolbox drawer element
   */
  getToolboxDrawer() {
    return document.querySelector(this.selectors.toolboxDrawer);
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
   * Set input text using ctx0's approach
   * @param {string} text - Text to set
   */
  setInputText(text) {
    const input = this.getInputElement();
    if (input) {
      if (input.contentEditable === 'true') {
        // Clear existing content
        input.innerHTML = '';
        
        // Split the text by newlines and create paragraph elements
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          const p = document.createElement('p');
          if (line.trim() === '') {
            p.innerHTML = '<br>';
          } else {
            p.textContent = line;
          }
          input.appendChild(p);
        });
        
        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Focus and set cursor to end
        input.focus();
        
        // Set cursor to end of content
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // For regular input/textarea
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }
  
  /**
   * Get container for injecting memory button
   * @returns {Element|null} Button container
   */
  getButtonContainer() {
    const input = this.getInputElement();
    if (!input) return null;
    
    const inputContainer = input.closest(this.selectors.inputContainer);
    if (inputContainer && !inputContainer.querySelector('.contextzero-memory-btn')) {
      return inputContainer;
    }
    
    const container = input.parentElement;
    if (container && !container.querySelector('.contextzero-memory-btn')) {
      return container;
    }
    
    return null;
  }
  
  /**
   * Inject memory button using multiple strategies
   */
  injectMemoryButton() {
    
    // Remove existing button if any
    const existingButton = document.querySelector('#contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
    }
    
    // Strategy 1: Try toolbox-drawer
    const toolboxDrawer = this.getToolboxDrawer();
    if (toolboxDrawer && !document.querySelector('#contextzero-icon-button')) {
      this.createToolboxDrawerButton(toolboxDrawer);
      return;
    }
    
    // Strategy 2: Try near send button
    const sendButton = this.getSendButton();
    if (sendButton && !document.querySelector('#contextzero-icon-button')) {
      this.createSendButtonStrategy(sendButton);
      return;
    }
    
    // Strategy 3: Try input container
    const inputContainer = this.getInputContainer();
    if (inputContainer && !document.querySelector('#contextzero-icon-button')) {
      this.createInputContainerStrategy(inputContainer);
      return;
    }
    
    // Strategy 4: Fallback floating button
    const inputElement = this.getInputElement();
    if (inputElement && !document.querySelector('#contextzero-icon-button')) {
      this.createFallbackButton(inputElement);
      return;
    }
    
  }
  
  /**
   * Get send button
   */
  getSendButton() {
    const sendSelectors = this.selectors.sendButton.split(', ');
    for (const selector of sendSelectors) {
      try {
        const button = document.querySelector(selector);
        if (button) return button;
      } catch (e) {
        // Skip invalid selector
      }
    }
    return null;
  }
  
  /**
   * Get input container
   */
  getInputContainer() {
    const input = this.getInputElement();
    if (!input) return null;
    
    // Try various container strategies
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
   * Create button in toolbox drawer
   */
  createToolboxDrawerButton(toolboxDrawer) {
    const contextZeroButton = new GeminiContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      }
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    toolboxDrawer.appendChild(buttonContainer);
    this.updateNotificationDot();
  }
  
  /**
   * Create button near send button
   */
  createSendButtonStrategy(sendButton) {
    const contextZeroButton = new GeminiContextZeroButton({
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
  
  /**
   * Create button in input container
   */
  createInputContainerStrategy(inputContainer) {
    const contextZeroButton = new GeminiContextZeroButton({
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
  
  /**
   * Create fallback floating button
   */
  createFallbackButton(inputElement) {
    const contextZeroButton = new GeminiContextZeroButton({
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
  
  /**
   * Fallback button injection for when toolbox drawer is not available
   */
  injectFallbackButton() {
    const container = this.getButtonContainer();
    if (!container) {
      return;
    }
    
    // Create the button using the Gemini-specific component
    const contextZeroButton = new GeminiContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin-left: 8px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Insert button next to the input
    const input = this.getInputElement();
    if (input && input.nextSibling) {
      container.insertBefore(buttonContainer, input.nextSibling);
    } else {
      container.appendChild(buttonContainer);
    }
    
    // Update notification dot based on input content
    this.updateNotificationDot();
  }
  
  /**
   * Update notification dot based on input content
   */
  updateNotificationDot() {
    const inputElement = this.getInputElement();
    
    if (!inputElement || !this.contextZeroButton) {
      // If elements aren't found, try again after a short delay
      setTimeout(() => this.updateNotificationDot(), 1000);
      return;
    }
    
    // Function to check if input has text
    const checkForText = () => {
      const inputText = inputElement.textContent || inputElement.innerText || inputElement.value || '';
      const hasText = inputText.trim() !== '';
      
      // Use the common button component's method
      this.contextZeroButton.updateNotificationDot(hasText);
    };
    
    // Setup mutation observer for the input element to detect changes
    const observer = new MutationObserver(checkForText);
    observer.observe(inputElement, { 
      childList: true, 
      characterData: true, 
      subtree: true,
      attributes: true
    });
    
    // Also listen for direct input events
    inputElement.addEventListener('input', checkForText);
    inputElement.addEventListener('keyup', checkForText);
    inputElement.addEventListener('focus', checkForText);
    
    // Initial check
    checkForText();
    
    // Force another check after a small delay
    setTimeout(checkForText, 500);
  }

  /**
   * Handle memory button click
   */
  async handleMemoryButtonClick() {
    try {
      const inputText = this.getInputText();
      if (!inputText || typeof inputText !== 'string' || !inputText.trim()) {
        alert('Please enter a message first, then click the memory button to add relevant context.');
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
    
  }
  
  /**
   * Setup message capture for memory extraction using ctx0's approach
   */
  setupMessageCapture() {
    // Prevent duplicate listener registration
    if (this.sendListenerAdded) {
      return;
    }
    
    // Handle capturing and storing the current message
    const captureAndStoreMemory = async () => {
      const inputElement = this.getInputElement();
      if (!inputElement) {
        return;
      }
      
      const message = (inputElement.textContent || inputElement.innerText || inputElement.value || '').trim();
      if (!message) {
        return;
      }
      
      // Extract and store memories asynchronously
      await this.memoryManager.storeMemory(message, {
        platform: 'gemini',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      // Clear all memories after sending
      setTimeout(() => {
        this.allMemories = [];
        this.allMemoriesById.clear();
      }, 100);
    };
    
    // Get send button and add listener
    const sendSelectors = this.selectors.sendButton.split(', ');
    let sendButton = null;
    
    for (const selector of sendSelectors) {
      try {
        sendButton = document.querySelector(selector);
        if (sendButton) break;
      } catch (e) {
        // Skip invalid selector
      }
    }
    
    if (sendButton && !sendButton.dataset.contextzeroListener) {
      sendButton.dataset.contextzeroListener = 'true';
      sendButton.addEventListener('click', captureAndStoreMemory);
    }
    
    // Handle textarea for Enter key press
    const inputElement = this.getInputElement();
    
    if (inputElement && !inputElement.dataset.contextzeroKeyListener) {
      inputElement.dataset.contextzeroKeyListener = 'true';
      inputElement.addEventListener('keydown', (event) => {
        // Check if Enter was pressed without Shift (standard send behavior)
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          // The send button click will handle the capture
          return;
        }
      });
    }
    
    // Mark as added if we set up both elements
    if (inputElement && sendButton) {
      this.sendListenerAdded = true;
    }
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
        platform: 'gemini',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing Gemini message:', error);
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
            platform: 'gemini',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing Gemini conversation messages:', error);
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
          sendResponse({ success: true, platform: 'gemini' });
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
        platform: 'gemini',
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
        if (!document.querySelector('#contextzero-icon-button')) {
          this.injectMemoryButton();
        }
        // Update notification dot
        this.updateNotificationDot();
        // Re-setup message capture
        this.setupMessageCapture();
      }, 1000);
    }
  }
}

// Initialize when DOM is ready
function initializeGeminiAdapter() {
  if (window.location.hostname.includes('gemini.google.com') || 
      window.location.hostname.includes('bard.google.com') ||
      window.location.hostname.includes('ai.google.dev')) {
    const adapter = new GeminiAdapter();
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        adapter.reinitialize();
      }
    }, 1000);
    
    // Check more frequently initially, then less frequently
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      if (!document.querySelector('#contextzero-icon-button')) {
        adapter.injectMemoryButton();
      }
      checkCount++;
      // After 20 checks (10 seconds), reduce frequency to every 5 seconds
      if (checkCount >= 20) {
        clearInterval(checkInterval);
        setInterval(() => {
          if (!document.querySelector('#contextzero-icon-button')) {
            adapter.injectMemoryButton();
          }
        }, 5000);
      }
    }, 500);
    
    // Make adapter globally available for debugging
    window.contextZeroGemini = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGeminiAdapter);
} else {
  initializeGeminiAdapter();
}

// Handle dynamic page loads - check more frequently initially
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializeGeminiAdapter, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

