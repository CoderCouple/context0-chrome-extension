/**
 * ChatGPT content script for ContextZero
 * Handles memory injection and extraction for ChatGPT interface
 */

class ChatGPTAdapter {
  constructor() {
    // Updated selectors for modern ChatGPT interface
    this.selectors = {
      input: '#prompt-textarea, [data-id="root"] textarea, textarea[placeholder*="Message"]',
      sendButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"]',
      messageContainer: '[data-testid="conversation-turn"], .group, [class*="conversation-turn"]',
      buttonContainer: 'form[class*="stretch"], div[class*="composer"]',
      conversationContainer: 'main [class*="conversation"], main[class*="chat"], .conversation-container'
    };
    
    this.isInitialized = false;
    this.lastProcessedMessage = '';
    
    // Initialize memory components safely
    try {
      if (typeof MemoryManager !== 'undefined') {
        this.memoryManager = new MemoryManager();
      }
      if (typeof MemoryExtractor !== 'undefined') {
        this.memoryExtractor = new MemoryExtractor();
      }
    } catch (error) {
      console.warn('ContextZero: Could not initialize memory components:', error.message);
    }
    
    this.init();
  }
  
  /**
   * Initialize the adapter
   */
  async init() {
    try {
      console.log('ContextZero: Initializing ChatGPT adapter...');
      await this.waitForDOM();
      
  
      this.injectMemoryButton();
      
      this.setupMessageCapture();
      this.setupAutoMemoryExtraction();
      this.isInitialized = true;
      console.log('ContextZero: ChatGPT adapter initialized');
    } catch (error) {
      console.error('ContextZero: Failed to initialize ChatGPT adapter:', error.message || error);
      console.error('ContextZero: Error details:', error.stack || error);
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
   * Get the input text area element
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
    }
  }
  
  /**
   * Inject memory button - mem0 approach
   */
  injectMemoryButton() {
    console.log('ContextZero: Starting button injection...');
    
    // Remove existing button if any
    const existingButton = document.getElementById('contextzero-icon-button');
    if (existingButton && existingButton.parentNode) {
      existingButton.parentNode.remove();
      console.log('ContextZero: Removed existing button');
    }
    
    // Look for the mic container using mem0's approach
    const micContainer = document.querySelector('div[data-testid="composer-trailing-actions"] div.ms-auto');
    
    if (micContainer && !document.querySelector('#contextzero-icon-button')) {
      // Look for the mic button
      const micButton = micContainer.querySelector('button[aria-label="Dictate button"]');
      if (micButton) {
        this.createMem0StyleButton(micContainer);
      } else {
        console.log('ContextZero: Mic button not found, trying fallback');
        // Fallback to floating button
        this.createFloatingButton();
      }
    } else {
      console.log('ContextZero: Mic container not found, using floating button');
      this.createFloatingButton();
    }
  }

  /**
   * Create button using ContextZero common button component
   */
  createMem0StyleButton(micContainer) {
    console.log('ContextZero: Creating ContextZero button');
    
    // Create the button using the ChatGPT-specific component
    const contextZeroButton = new ChatGPTContextZeroButton({
      onClick: async (e) => {
        await this.handleMemoryButtonClick();
      },
      containerStyle: `
        margin: 0 4px;
        flex-shrink: 0;
      `
    });
    
    const buttonContainer = contextZeroButton.createContainer();
    
    // Insert before the mic button (at the beginning of the container)
    micContainer.insertBefore(buttonContainer, micContainer.firstChild);
    
    // Store reference for updating notification dot
    this.contextZeroButton = contextZeroButton;
    
    console.log('ContextZero: Button injected successfully using ContextZero component');
    
    // Update notification dot based on input
    this.updateNotificationDot();
  }

  /**
   * Create floating button as primary option
   */
  createFloatingButton() {
    console.log('ContextZero: Creating floating button');
    
    const button = document.createElement('div');
    button.id = 'contextzero-icon-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        bottom: 100px;
        right: 24px;
        width: 48px;
        height: 48px;
        background: #ff6b35;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        transition: all 0.2s ease;
        font-size: 20px;
        color: white;
        user-select: none;
        opacity: 0.9;
      " title="ContextZero - Add memories to your prompt">
        🧠
      </div>
    `;
    
    const floatingBtn = button.firstElementChild;
    
    // Add hover effects
    floatingBtn.addEventListener('mouseenter', () => {
      floatingBtn.style.transform = 'scale(1.1)';
      floatingBtn.style.opacity = '1';
      floatingBtn.style.boxShadow = '0 4px 16px rgba(255, 107, 53, 0.3)';
    });
    
    floatingBtn.addEventListener('mouseleave', () => {
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.opacity = '0.9';
      floatingBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    });
    
    // Add click handler
    floatingBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('ContextZero: Floating button clicked');
      await this.handleMemoryButtonClick();
    });
    
    document.body.appendChild(button);
    console.log('ContextZero: Floating button created and added to page');
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
      
      if (!this.memoryManager) {
        alert('Memory system not available. Please refresh the page and try again.');
        return;
      }
      
      // Show loading state
      const button = document.getElementById('contextzero-icon-button');
      const originalIcon = button.innerHTML;
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 22L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
        </svg>
      `;
      button.disabled = true;
      
      // Search for relevant memories
      const memories = await this.memoryManager.searchMemories(inputText, {
        limit: 10,
        threshold: 0.3,
        includeGeneral: true
      });
      
      // Restore button
      button.innerHTML = originalIcon;
      button.disabled = false;
      
      if (memories.length === 0) {
        alert('No relevant memories found for your prompt.');
        return;
      }
      
      // Show memory selection modal
      this.showMemoryModal(memories);
      
    } catch (error) {
      console.error('ContextZero: Error handling memory button click:', error.message || error);
      
      // Restore button on error
      const button = document.getElementById('contextzero-icon-button');
      if (button) {
        button.innerHTML = button.originalIcon || button.innerHTML;
        button.disabled = false;
      }
      
      alert('Error accessing memories. Please refresh the page and try again.');
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
    
    // Focus the input
    const input = this.getInputElement();
    if (input) {
      input.focus();
      // Move cursor to end
      input.setSelectionRange(input.value.length, input.value.length);
    }
    
    console.log(`ContextZero: Injected ${memories.length} memories into prompt`);
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
        platform: 'chatgpt',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      if (memories.length > 0) {
        console.log(`ContextZero: Extracted ${memories.length} memories from message`);
      }
      
    } catch (error) {
      console.error('ContextZero: Error capturing message:', error);
    }
  }
  
  /**
   * Setup automatic memory extraction from conversation
   */
  setupAutoMemoryExtraction() {
    try {
      // Observe conversation for new messages
      const conversationContainer = document.querySelector(this.selectors.conversationContainer);
      if (!conversationContainer) {
        console.log('ContextZero: No conversation container found for auto extraction');
        return;
      }
      
      const observer = new MutationObserver((mutations) => {
        try {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Check if this is a new message
                const messageElements = node.querySelectorAll ? 
                  node.querySelectorAll(this.selectors.messageContainer) : [];
                
                if (messageElements.length > 0 || (node.matches && node.matches(this.selectors.messageContainer))) {
                  // Process new messages after a delay
                  setTimeout(() => this.processConversationMessages(), 1000);
                }
              }
            });
          });
        } catch (error) {
          console.warn('ContextZero: Error in mutation observer:', error.message);
        }
      });
      
      observer.observe(conversationContainer, {
        childList: true,
        subtree: true
      });
      
      console.log('ContextZero: Auto memory extraction setup complete');
    } catch (error) {
      console.error('ContextZero: Failed to setup auto memory extraction:', error.message);
    }
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
            platform: 'chatgpt',
            source: 'conversation',
            url: window.location.href,
            timestamp: Date.now()
          });
        }
      }
    } catch (error) {
      console.error('ContextZero: Error processing conversation messages:', error);
    }
  }
  
  /**
   * Update notification dot based on input content
   */
  updateNotificationDot() {
    const inputElement = this.getInputElement();
    
    if (inputElement && this.contextZeroButton) {
      // Function to check if input has text
      const checkForText = () => {
        const inputText = inputElement.textContent || inputElement.value || '';
        const hasText = inputText.trim() !== '';
        
        // Use the common button component's method
        this.contextZeroButton.updateNotificationDot(hasText);
      };
      
      // Set up an observer to watch for changes
      const inputObserver = new MutationObserver(checkForText);
      
      // Start observing the input element
      inputObserver.observe(inputElement, { 
        childList: true, 
        characterData: true, 
        subtree: true 
      });
      
      // Also check on input and keyup events
      inputElement.addEventListener('input', checkForText);
      inputElement.addEventListener('keyup', checkForText);
      inputElement.addEventListener('focus', checkForText);
      
      // Initial check
      checkForText();
      
      // Force check after a small delay
      setTimeout(checkForText, 500);
    } else {
      // If elements aren't found, try again after a short delay
      setTimeout(() => this.updateNotificationDot(), 1000);
    }
  }

  /**
   * Reinitialize adapter when page changes
   */
  reinitialize() {
    if (this.isInitialized) {
      // Re-inject button if needed
      setTimeout(() => {
        if (!document.getElementById('contextzero-icon-button')) {
          this.injectMemoryButton();
        }
      }, 1000);
    }
  }
}

// Force initialization immediately
console.log('ContextZero: Script loaded, checking domain...');

function initializeChatGPTAdapter() {
  console.log('ContextZero: Attempting to initialize on:', window.location.hostname);
  
  if (window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')) {
    console.log('ContextZero: Domain matched, creating adapter...');
    
    // Force create adapter even if one exists
    if (window.contextZeroChatGPT) {
      console.log('ContextZero: Existing adapter found, recreating...');
    }
    
    const adapter = new ChatGPTAdapter();
    window.contextZeroChatGPT = adapter;
    
    // Retry button injection after a delay
    setTimeout(() => {
      console.log('ContextZero: Retrying button injection after delay...');
      adapter.injectMemoryButton();
    }, 2000);
    
    // Reinitialize on page navigation
    let currentUrl = window.location.href;
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        console.log('ContextZero: URL changed, reinitializing...');
        adapter.reinitialize();
      }
    }, 1000);
    
  } else {
    console.log('ContextZero: Domain not matched:', window.location.hostname);
  }
}

// Initialize immediately and repeatedly
console.log('ContextZero: Starting initialization...');
initializeChatGPTAdapter();

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('ContextZero: DOM ready, initializing...');
    initializeChatGPTAdapter();
  });
} else {
  console.log('ContextZero: DOM already ready, initializing again...');
  setTimeout(initializeChatGPTAdapter, 100);
}

// Force initialization after page load
window.addEventListener('load', () => {
  console.log('ContextZero: Window loaded, force initializing...');
  setTimeout(initializeChatGPTAdapter, 500);
});

// Handle dynamic page loads with more aggressive timing
let initTimeout;
const observer = new MutationObserver(() => {
  clearTimeout(initTimeout);
  initTimeout = setTimeout(() => {
    console.log('ContextZero: DOM mutation detected, reinitializing...');
    initializeChatGPTAdapter();
  }, 200);
});

if (document.body) {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
} else {
  // If body doesn't exist yet, wait for it
  setTimeout(() => {
    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }, 100);
}

// Final attempt - try to inject button in text area
setTimeout(() => {
  console.log('ContextZero: Final attempt - checking if button exists...');
  if (!document.getElementById('contextzero-icon-button')) {
    console.log('ContextZero: No button found, making final injection attempt...');
    
    if (window.contextZeroChatGPT) {
      window.contextZeroChatGPT.injectMemoryButton();
    }
  } else {
    console.log('ContextZero: Button already exists');
  }
}, 5000);