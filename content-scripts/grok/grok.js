/**
 * Grok content script for ContextZero
 * Handles memory injection and extraction for Grok interface
 */

class GrokAdapter {
  constructor() {
    // Selectors for Grok interface elements
    this.selectors = {
      input: 'textarea[placeholder*="Message"], textarea[data-testid="composer-textarea"], textarea[placeholder*="Ask"], textarea[placeholder*="grok"], div[contenteditable="true"]',
      sendButton: 'button[data-testid="send-button"], button[aria-label="Send"], button[type="submit"], button[aria-label*="Send"]',
      messageContainer: '[data-testid="message"], .message-content, [data-testid="conversation-turn"]',
      conversationContainer: 'main, [data-testid="conversation"], [data-testid="chat-container"]',
      inputContainer: 'form, [data-testid="composer-form"], [data-testid="composer-container"]'
    };
    
    this.memoryManager = new MemoryManager();
    this.memoryExtractor = new MemoryExtractor();
    this.isInitialized = false;
    this.lastProcessedMessage = '';
    this.allMemories = [];
    this.allMemoriesById = new Set();
    
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
      input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Focus and set cursor to end
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
  
  /**
   * Create button for Think button location
   */
  createThinkButton(thinkButton) {
    
    // Create the button using the Grok-specific component
    const contextZeroButton = new GrokContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin: 0 8px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Insert button after the Think button
    thinkButton.parentNode.insertBefore(buttonContainer, thinkButton.nextSibling);
  }
  
  /**
   * Create button for toolbar location
   */
  createToolbarButton(toolbar) {
    
    // Create the button using the Grok-specific component
    const contextZeroButton = new GrokContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin: 0 4px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Insert at the beginning of the toolbar
    toolbar.insertBefore(buttonContainer, toolbar.firstChild);
  }
  
  /**
   * Create button for input container location
   */
  createInputContainerButton(inputContainer) {
    
    // Create the button using the Grok-specific component
    const contextZeroButton = new GrokContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin-right: 12px;
      `,
      buttonStyle: `
        padding: 4px 8px;
        height: 32px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Find the send button or similar control to position relative to
    const sendButton = inputContainer.querySelector('button[type="submit"], button[aria-label*="Send"], button[data-testid*="send"]');
    
    if (sendButton) {
      sendButton.parentNode.insertBefore(buttonContainer, sendButton);
    } else {
      inputContainer.appendChild(buttonContainer);
    }
  }
  
  /**
   * Create button for send button location
   */
  createSendButton(sendButton) {
    
    // Find the parent container of the send button
    const buttonParent = sendButton.parentNode;
    if (!buttonParent) return;
    
    // Create the button using the Grok-specific component
    const contextZeroButton = new GrokContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin-right: 12px;
      `,
      buttonStyle: `
        padding: 4px 8px;
        height: 32px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Insert the button before the send button
    buttonParent.insertBefore(buttonContainer, sendButton);
  }
  
  /**
   * Create fallback button attached to input element
   */
  createFallbackButton(inputElement) {
    
    // Create the button using the Grok-specific component
    const contextZeroButton = new GrokContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 1000;
      `,
      buttonStyle: `
        padding: 6px 10px;
        font-size: 12px;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    // Make the input container relatively positioned if needed
    const container = inputElement.closest('div') || inputElement.parentElement;
    if (container) {
      const computedStyle = getComputedStyle(container);
      if (computedStyle.position === 'static') {
        container.style.position = 'relative';
      }
      container.appendChild(buttonContainer);
    }
  }
  
  /**
   * Inject memory button into the interface using mem0's approach
   */
  injectMemoryButton() {
    
    // Remove existing button if any
    const existingButton = document.querySelector('#contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
    }
    
    // Look for the Think button or similar controls using mem0's approach
    let thinkButton = document.querySelector('button[aria-label*="Think"], button[data-testid*="think"], button[title*="Think"]');
    
    // If not found, search for buttons containing "Think" text
    if (!thinkButton) {
      const allButtons = document.querySelectorAll('button');
      thinkButton = Array.from(allButtons).find(button => 
        button.textContent.toLowerCase().includes('think') ||
        button.querySelector('span')?.textContent.toLowerCase().includes('think')
      );
    }
    const toolbar = document.querySelector('[data-testid="composer-toolbar"], .composer-toolbar, [role="toolbar"]');
    const inputContainer = document.querySelector('[data-testid="composer-container"], .composer-container');
    let sendButton = null;
    const sendSelectors = this.selectors.sendButton.split(', ');
    for (const selector of sendSelectors) {
      try {
        sendButton = document.querySelector(selector);
        if (sendButton) break;
      } catch (e) {
        // Skip invalid selector
      }
    }
    
    // If not found with selectors, look for buttons with send-like content
    if (!sendButton) {
      const allButtons = document.querySelectorAll('button');
      sendButton = Array.from(allButtons).find(button => 
        button.textContent.toLowerCase().includes('send') ||
        button.querySelector('svg') // Often send buttons just have an icon
      );
    }
    const inputElement = this.getInputElement();
    
    
    if (thinkButton && !document.querySelector('#contextzero-icon-button')) {
      this.createThinkButton(thinkButton);
    } else if (toolbar && !document.querySelector('#contextzero-icon-button')) {
      this.createToolbarButton(toolbar);
    } else if (inputContainer && !document.querySelector('#contextzero-icon-button')) {
      this.createInputContainerButton(inputContainer);
    } else if (sendButton && !document.querySelector('#contextzero-icon-button')) {
      this.createSendButton(sendButton);
    } else if (inputElement && !document.querySelector('#contextzero-icon-button')) {
      this.createFallbackButton(inputElement);
    }
    
    // Update notification dot based on input
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
      const inputText = inputElement.value || inputElement.textContent || '';
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
      attributes: true,
      attributeFilter: ['value'] 
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
    
    console.log(`ContextZero: Injected ${memories.length} memories into Grok prompt`);
  }
  
  /**
   * Setup message capture for memory extraction
   */
  setupMessageCapture() {
    // Add send button listener to capture memory and clear memories after sending
    const allSendButtons = this.selectors.sendButton.split(', ').map(selector => 
      document.querySelector(selector)
    ).filter(Boolean);
    
    allSendButtons.forEach(sendBtn => {
      if (sendBtn && !sendBtn.dataset.contextzeroListener) {
        sendBtn.dataset.contextzeroListener = 'true';
        sendBtn.addEventListener('click', async () => {
          // Capture and save memory asynchronously
          await this.captureUserMessage();
          
          // Clear all memories after sending
          setTimeout(() => {
            this.allMemories = [];
            this.allMemoriesById.clear();
          }, 100);
        });
      }
    });
      
    // Also handle Enter key press for sending messages
    const inputElement = this.getInputElement();
    
    if (inputElement && !inputElement.dataset.contextzeroKeyListener) {
      inputElement.dataset.contextzeroKeyListener = 'true';
      inputElement.addEventListener('keydown', async (event) => {
        // Check if Enter was pressed without Shift (standard send behavior)
        if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          // Capture and save memory asynchronously
          await this.captureUserMessage();
          
          // Clear all memories after sending
          setTimeout(() => {
            this.allMemories = [];
            this.allMemoriesById.clear();
          }, 100);
        }
      });
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
function initializeGrokAdapter() {
  if (window.location.hostname.includes('x.ai') || window.location.hostname.includes('grok.com')) {
    const adapter = new GrokAdapter();
    
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
    window.contextZeroGrok = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGrokAdapter);
} else {
  initializeGrokAdapter();
}

// Handle dynamic page loads - check more frequently initially
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializeGrokAdapter, 100);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('ContextZero: Grok content script loaded');