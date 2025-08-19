/**
 * Claude content script for ContextZero
 * Handles memory injection and extraction for Claude interface
 */

class ClaudeAdapter {
  constructor() {
    // Selectors for Claude interface elements
    this.selectors = {
      input: 'div[contenteditable="true"].ProseMirror, div[contenteditable="true"], textarea, p[data-placeholder="How can I help you today?"], p[data-placeholder="Reply to Claude..."]',
      sendButton: 'button[aria-label="Send Message"], button[aria-label="Send message"]',
      messageContainer: '.font-claude-message, .font-user-message',
      conversationContainer: 'main',
      inputContainer: 'div[data-testid="chat-input-container"]',
      inputToolsMenuButton: '#input-tools-menu-trigger',
      screenshotButton: 'button[aria-label="Capture screenshot"]'
    };
    
    // Initialize memory components - prefer HybridMemoryManager
    try {
      if (typeof HybridMemoryManager !== 'undefined') {
        this.memoryManager = new HybridMemoryManager();
        console.log('ContextZero: Using HybridMemoryManager for Claude');
      } else if (typeof MemoryManager !== 'undefined') {
        this.memoryManager = new MemoryManager();
        console.log('ContextZero: Fallback to MemoryManager for Claude');
      }
      if (typeof MemoryExtractor !== 'undefined') {
        this.memoryExtractor = new MemoryExtractor();
      }
    } catch (error) {
      console.warn('ContextZero: Could not initialize memory components:', error.message);
    }
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
      console.log('ContextZero: Claude adapter initialized');
    } catch (error) {
      console.error('ContextZero: Failed to initialize Claude adapter:', error);
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
    // Try multiple selectors in order of preference
    const selectors = this.selectors.input.split(', ');
    for (const selector of selectors) {
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
      
      // Handle different input types
      let text = '';
      if (input.tagName.toLowerCase() === 'textarea') {
        text = input.value || '';
      } else if (input.tagName.toLowerCase() === 'p') {
        text = input.textContent || '';
      } else {
        text = input.textContent || input.value || '';
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
      input.textContent = text;
      
      // Trigger input events for Claude
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Focus and set cursor to end
      input.focus();
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
  
  /**
   * Get container for injecting memory button
   * @returns {Element|null} Button container
   */
  getButtonContainer() {
    const inputContainer = document.querySelector(this.selectors.inputContainer);
    if (inputContainer && !inputContainer.querySelector('.contextzero-memory-btn')) {
      return inputContainer;
    }
    return null;
  }
  
  /**
   * Inject memory button into the interface using mem0's approach
   */
  injectMemoryButton() {
    console.log('ContextZero: Starting button injection...');
    
    // Remove existing button if any
    const existingButton = document.querySelector('#contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
      console.log('ContextZero: Removed existing button');
    }
    
    // Try different locations based on Claude's interface
    const inputToolsMenuButton = document.querySelector(this.selectors.inputToolsMenuButton);
    const screenshotButton = document.querySelector(this.selectors.screenshotButton);
    const sendButton = document.querySelector(this.selectors.sendButton.split(', ')[0]) || 
                      document.querySelector(this.selectors.sendButton.split(', ')[1]);
    
    if (inputToolsMenuButton && !document.querySelector('#contextzero-icon-button')) {
      this.createInputToolsButton(inputToolsMenuButton);
    } else if (window.location.href.includes('claude.ai/new') && screenshotButton && !document.querySelector('#contextzero-icon-button')) {
      this.createScreenshotButton(screenshotButton);
    } else if (sendButton && !document.querySelector('#contextzero-icon-button')) {
      this.createSendButton(sendButton);
    } else {
      console.log('ContextZero: No suitable container found for button injection');
    }
    
    // Update notification dot based on input
    this.updateNotificationDot();
  }
  
  /**
   * Create button for input tools menu location
   */
  createInputToolsButton(inputToolsMenuButton) {
    console.log('ContextZero: Creating button near input tools menu');
    
    // Create the button using the Claude-specific component
    const contextZeroButton = new ClaudeContextZeroButton({
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
    
    // Find the parent container to place the button at the same level as input-tools-menu
    const parentContainer = inputToolsMenuButton.closest('.relative.flex-1.flex.items-center.gap-2') || 
                            inputToolsMenuButton.closest('.relative.flex-1') ||
                            inputToolsMenuButton.parentNode.parentNode.parentNode.parentNode.parentNode;
                            
    if (parentContainer) {
      // Find the flex-row div to insert before it
      const flexRowDiv = parentContainer.querySelector('.flex.flex-row.items-center.gap-2.min-w-0');
      
      // Find the tools div that we want to position after
      const toolsDiv = inputToolsMenuButton.closest('div > div > div > div').parentNode.parentNode;
      
      // Make sure our button is the third div in the container
      if (flexRowDiv && toolsDiv) {
        // Insert right after the tools div and before the flex-row div
        parentContainer.insertBefore(buttonContainer, flexRowDiv);
      } else {
        // Fallback to just append to the parent
        parentContainer.appendChild(buttonContainer);
      }
    } else {
      // Fallback to original behavior if parent not found
      inputToolsMenuButton.parentNode.insertBefore(
        buttonContainer,
        inputToolsMenuButton.nextSibling
      );
    }
  }
  
  /**
   * Create button for screenshot button location
   */
  createScreenshotButton(screenshotButton) {
    console.log('ContextZero: Creating button near screenshot button');
    
    // Create the button using the Claude-specific component
    const contextZeroButton = new ClaudeContextZeroButton({
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
    
    screenshotButton.parentNode.insertBefore(
      buttonContainer,
      screenshotButton.nextSibling
    );
  }
  
  /**
   * Create button for send button location
   */
  createSendButton(sendButton) {
    console.log('ContextZero: Creating button near send button');
    
    // Find the parent container of the send button
    const buttonParent = sendButton.parentNode;
    if (!buttonParent) return;
    
    // Create the button using the Claude-specific component
    const contextZeroButton = new ClaudeContextZeroButton({
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
      let hasText = false;
      
      // Check for text based on the input type
      if (inputElement.classList.contains('ProseMirror')) {
        // For ProseMirror, check if it has any content other than just a placeholder <p>
        const paragraphs = inputElement.querySelectorAll('p');
        
        // Check if there's text content or if there are multiple paragraphs
        const textContent = inputElement.textContent.trim();
        hasText = textContent !== '' || paragraphs.length > 1 || 
                 (paragraphs.length === 1 && !paragraphs[0].classList.contains('is-empty'));
      } else if (inputElement.tagName.toLowerCase() === 'p') {
        // For p elements with placeholder
        hasText = (inputElement.textContent || '').trim() !== '';
      } else if (inputElement.tagName.toLowerCase() === 'div') {
        // For normal contenteditable divs
        hasText = (inputElement.textContent || '').trim() !== '';
      } else {
        // For textareas
        hasText = (inputElement.value || '').trim() !== '';
      }
      
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
      attributeFilter: ['class'] 
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
        alert('No relevant memories found for your prompt.');
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
    
    console.log(`ContextZero: Injected ${memories.length} memories into Claude prompt`);
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
          // Don't process for textarea which may want newlines
          if (inputElement.tagName.toLowerCase() !== 'textarea') {
            // Capture and save memory asynchronously
            await this.captureUserMessage();
            
            // Clear all memories after sending
            setTimeout(() => {
              this.allMemories = [];
              this.allMemoriesById.clear();
            }, 100);
          }
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
        platform: 'claude',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
        console.log(`ContextZero: Extracted ${memories.length} memories from Claude message`);
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing Claude message:', error);
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
            platform: 'claude',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing Claude conversation messages:', error);
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
          sendResponse({ success: true, platform: 'claude' });
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
        platform: 'claude',
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
function initializeClaudeAdapter() {
  if (window.location.hostname.includes('claude.ai')) {
    const adapter = new ClaudeAdapter();
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        adapter.reinitialize();
      }
    }, 1000);
    
    // Also check periodically for button existence (like mem0 does)
    setInterval(() => {
      if (!document.querySelector('#contextzero-icon-button')) {
        adapter.injectMemoryButton();
      }
    }, 5000);
    
    // Make adapter globally available for debugging
    window.contextZeroClaude = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeClaudeAdapter);
} else {
  initializeClaudeAdapter();
}

// Handle dynamic page loads
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializeClaudeAdapter, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('ContextZero: Claude content script loaded');