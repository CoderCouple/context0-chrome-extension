/**
 * DeepSeek content script for ContextZero
 * Handles memory injection and extraction for DeepSeek interface
 */

class DeepSeekAdapter {
  constructor() {
    // Selectors for DeepSeek interface elements (based on mem0 reference)
    this.selectors = {
      input: "#chat-input, textarea, [contenteditable='true']",
      sendButton: 'div[role="button"] svg',
      messageContainer: '.prose, [data-testid="message"], .message',
      conversationContainer: 'main, [data-testid="conversation"], [role="main"]',
      inputContainer: 'form, [data-testid="input-container"], div[class*="input"]'
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
      console.log('ContextZero: DeepSeek adapter initialized');
    } catch (error) {
      console.error('ContextZero: Failed to initialize DeepSeek adapter:', error);
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
   * Get the input element using mem0's approach
   * @returns {Element|null} Input element
   */
  getInputElement() {
    // Try finding with the more specific selector first
    const inputElement = document.querySelector(this.selectors.input);
    
    if (inputElement) {
      return inputElement;
    }
    
    // If not found, try a more general approach like mem0
    
    // Try finding by common input attributes
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      // Return the textarea that's visible and has the largest area (likely the main input)
      let bestMatch = null;
      let largestArea = 0;
      
      for (const textarea of textareas) {
        const rect = textarea.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const area = rect.width * rect.height;
        
        if (isVisible && area > largestArea) {
          largestArea = area;
          bestMatch = textarea;
        }
      }
      
      if (bestMatch) {
        return bestMatch;
      }
    }
    
    // Try contenteditable divs
    const editableDivs = document.querySelectorAll('[contenteditable="true"]');
    if (editableDivs.length > 0) {
      return editableDivs[0];
    }
    
    // Try any element with role="textbox"
    const textboxes = document.querySelectorAll('[role="textbox"]');
    if (textboxes.length > 0) {
      return textboxes[0];
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
   * Get send button element using mem0's approach
   * @returns {Element|null} Send button
   */
  getSendButtonElement() {
    try {
      // Strategy 1: Look for buttons with send-like characteristics
      const buttons = document.querySelectorAll('div[role="button"]');
      
      if (buttons.length === 0) {
        return null;
      }
      
      // Get the input element to help with positioning-based detection
      const inputElement = this.getInputElement();
      const inputRect = inputElement ? inputElement.getBoundingClientRect() : null;
      
      // Find candidate buttons that might be send buttons
      let bestSendButton = null;
      let bestScore = 0;
      
      for (const button of buttons) {
        // Skip if button is not visible or has no size
        const buttonRect = button.getBoundingClientRect();
        if (buttonRect.width === 0 || buttonRect.height === 0) {
          continue;
        }
        
        let score = 0;
        
        // 1. Check if it has an SVG (likely an icon button)
        const svg = button.querySelector('svg');
        if (svg) score += 2;
        
        // 2. Check if it has no text content (icon-only buttons)
        const buttonText = button.textContent.trim();
        if (buttonText === '') score += 2;
        
        // 3. Check if it contains a paper airplane shape (common in send buttons)
        const paths = svg ? svg.querySelectorAll('path') : [];
        if (paths.length > 0) score += 1;
        
        // 4. Check positioning relative to input (send buttons are usually close to input)
        if (inputRect) {
          // Check if button is positioned to the right of input
          if (buttonRect.left > inputRect.left) score += 1;
          
          // Check if button is at similar height to input
          if (Math.abs(buttonRect.top - inputRect.top) < 100) score += 2;
          
          // Check if button is very close to input (right next to it)
          if (Math.abs(buttonRect.left - (inputRect.right + 20)) < 40) score += 3;
        }
        
        // 5. Check for DeepSeek specific classes
        if (button.classList.contains('ds-button--primary')) score += 2;
        
        // Update best match if this button has a higher score
        if (score > bestScore) {
          bestScore = score;
          bestSendButton = button;
        }
      }
      
      // Return best match if score is reasonable
      if (bestScore >= 4) {
        return bestSendButton;
      }
      
      // Strategy 2: Look for buttons positioned at the right of the input
      if (inputElement) {
        // Find buttons positioned to the right of the input
        const rightButtons = Array.from(buttons).filter(button => {
          const buttonRect = button.getBoundingClientRect();
          return buttonRect.left > inputRect.right - 50 && // To the right
                 Math.abs(buttonRect.top - inputRect.top) < 50; // Similar height
        });
        
        // Sort by horizontal proximity to input
        rightButtons.sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          return (aRect.left - inputRect.right) - (bRect.left - inputRect.right);
        });
        
        // Return the closest button
        if (rightButtons.length > 0) {
          return rightButtons[0];
        }
      }
      
      // Strategy 3: Last resort - take the last button with an SVG
      const svgButtons = Array.from(buttons).filter(button => button.querySelector('svg'));
      if (svgButtons.length > 0) {
        return svgButtons[svgButtons.length - 1];
      }
      
      return null;
    } catch (e) {
      return null; // Return null on error instead of failing
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
        // For contenteditable div
        input.textContent = text;
        
        // Trigger input events for DeepSeek
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
      } else {
        // For regular input/textarea
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }
  
  /**
   * Inject memory button into the interface using mem0's approach
   */
  async injectMemoryButton() {
    // Remove existing button if any
    const existingButton = document.querySelector('#contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
    }
    
    // Wait for input element to be available
    const inputElement = this.getInputElement();
    if (!inputElement) {
      // Retry in 1 second
      setTimeout(() => this.injectMemoryButton(), 1000);
      return;
    }
    
    // Try multiple approaches to find placement locations
    let buttonContainer = null;
    let status = "searching";
    
    // Approach 1: Look for search button and its container
    const searchButtons = document.querySelectorAll('div[role="button"]');
    let searchButton = null;
    for (const button of searchButtons) {
      const buttonText = button.textContent.trim();
      const hasSearchSpan = button.querySelector('span') && button.querySelector('span').textContent.trim().toLowerCase() === 'search';
      if (buttonText.toLowerCase() === 'search' || hasSearchSpan) {
        // Found search button, get its parent container
        searchButton = button;
        buttonContainer = button.parentElement;
        status = "found_search_button_container";
        break;
      }
    }
    
    // Approach 2: Look for any toolbar or button container
    if (!buttonContainer) {
      const toolbars = document.querySelectorAll('.toolbar, .button-container, .controls, div[role="toolbar"]');
      if (toolbars.length > 0) {
        buttonContainer = toolbars[0];
        status = "found_toolbar";
      }
    }
    
    // Approach 3: Try to find the input field and place it near there
    if (!buttonContainer) {
      if (inputElement && inputElement.parentElement) {
        // Try going up a few levels to find a good container
        let parent = inputElement.parentElement;
        let level = 0;
        while (parent && level < 3) {
          const buttons = parent.querySelectorAll('div[role="button"]');
          if (buttons.length > 0) {
            buttonContainer = parent;
            status = "found_input_parent_with_buttons";
            break;
          }
          parent = parent.parentElement;
          level++;
        }
        
        // If still not found, use direct parent
        if (!buttonContainer) {
          buttonContainer = inputElement.parentElement;
          status = "found_input_parent";
        }
      }
    }
    
    // If we couldn't find a suitable container, create one near the input
    if (!buttonContainer && inputElement) {
      const inputRect = inputElement.getBoundingClientRect();
      buttonContainer = document.createElement('div');
      buttonContainer.id = 'contextzero-custom-container';
      buttonContainer.style.cssText = `
        display: flex;
        position: fixed;
        top: ${inputRect.top - 40}px;
        left: ${inputRect.right - 100}px;
        z-index: 1000;
      `;
      document.body.appendChild(buttonContainer);
      status = "created_custom_container";
    }
    
    // If we couldn't find a suitable container, bail out
    if (!buttonContainer) {
      return;
    }
    
    // Create button using DeepSeek styling
    const contextZeroButton = new DeepSeekContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      }
    });
    
    const buttonElement = contextZeroButton.createContainer();
    this.contextZeroButton = contextZeroButton;
    
    // Insert the button in the appropriate position
    try {
      if (status === "found_search_button_container") {
        // Position after the search button in the same container
        const foundSearchButton = buttonContainer.querySelector('div[role="button"]');
        if (foundSearchButton) {
          // Insert immediately after the search button
          if (foundSearchButton.nextSibling) {
            buttonContainer.insertBefore(buttonElement, foundSearchButton.nextSibling);
          } else {
            buttonContainer.appendChild(buttonElement);
          }
        } else {
          buttonContainer.appendChild(buttonElement);
        }
      } else if (status === "found_toolbar") {
        // Find an appropriate position in the toolbar - prefer the right side
        const lastChild = buttonContainer.lastChild;
        if (lastChild) {
          buttonContainer.insertBefore(buttonElement, null); // append to end
        } else {
          buttonContainer.appendChild(buttonElement);
        }
      } else if (status === "created_custom_container") {
        // Custom container - just append
        buttonContainer.appendChild(buttonElement);
      } else {
        // Other cases - try to position after any buttons in the container
        const buttons = buttonContainer.querySelectorAll('div[role="button"]');
        if (buttons.length > 0) {
          const lastButton = buttons[buttons.length - 1];
          buttonContainer.insertBefore(buttonElement, lastButton.nextSibling);
        } else {
          buttonContainer.appendChild(buttonElement);
        }
      }
    } catch (e) {
      console.error('ContextZero: Failed to insert button:', e);
    }
    
    this.updateNotificationDot();
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
        alert('Please enter a message first, then click the memory button to add relevant context.');
        return;
      }
      
      // Show loading state
      const button = document.querySelector('#contextzero-icon-button');
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
      const button = document.querySelector('#contextzero-icon-button');
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
    
    console.log(`ContextZero: Injected ${memories.length} memories into DeepSeek prompt`);
  }
  
  /**
   * Setup message capture for memory extraction
   */
  setupMessageCapture() {
    // Listen for send button clicks
    document.addEventListener('click', async (event) => {
      const sendButton = this.getSendButtonElement();
      if (sendButton && (event.target === sendButton || sendButton.contains(event.target))) {
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
        platform: 'deepseek',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
        console.log(`ContextZero: Extracted ${memories.length} memories from DeepSeek message`);
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing DeepSeek message:', error);
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
            platform: 'deepseek',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing DeepSeek conversation messages:', error);
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
          sendResponse({ success: true, platform: 'deepseek' });
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
        platform: 'deepseek',
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
      }, 1000);
    }
  }
}

// Initialize when DOM is ready
function initializeDeepSeekAdapter() {
  if (window.location.hostname.includes('deepseek.com') || 
      window.location.hostname.includes('chat.deepseek.com')) {
    const adapter = new DeepSeekAdapter();
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        adapter.reinitialize();
      }
    }, 1000);
    
    // Make adapter globally available for debugging
    window.contextZeroDeepSeek = adapter;
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeDeepSeekAdapter);
} else {
  initializeDeepSeekAdapter();
}

// Handle dynamic page loads
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(initializeDeepSeekAdapter, 500);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('ContextZero: DeepSeek content script loaded');