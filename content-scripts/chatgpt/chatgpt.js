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
      
      // Try to inject button with retries (mem0 approach)
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
   * Inject memory button - simple and direct approach
   */
  injectMemoryButton() {
    console.log('ContextZero: Starting button injection...');
    
    // Remove existing button if any
    const existingButton = document.getElementById('contextzero-icon-button');
    if (existingButton) {
      existingButton.remove();
      console.log('ContextZero: Removed existing button');
    }
    
    // Try multiple strategies to find a suitable container
    const strategies = [
      () => document.querySelector('div[data-testid="composer-trailing-actions"]'),
      () => document.querySelector('[data-testid="send-button"]')?.parentElement,
      () => {
        const sendBtn = document.querySelector('[data-testid="send-button"]');
        return sendBtn?.closest('div[class*="flex"][class*="items-center"]');
      },
      () => document.querySelector('form')?.querySelector('div[class*="flex"]:last-child'),
      () => document.querySelector('#prompt-textarea')?.parentElement?.parentElement,
      () => document.querySelector('textarea')?.closest('form')?.querySelector('div[class*="flex"]'),
      () => document.querySelector('main'),
      () => document.body
    ];
    
    let container = null;
    for (let i = 0; i < strategies.length; i++) {
      try {
        container = strategies[i]();
        if (container) {
          console.log(`ContextZero: Found container using strategy ${i + 1}:`, container);
          break;
        }
      } catch (e) {
        console.log(`ContextZero: Strategy ${i + 1} failed:`, e);
      }
    }
    
    if (!container) {
      console.log('ContextZero: No container found, using floating button as fallback');
      this.createFloatingButton();
      return;
    }
    
    this.createButtonInContainer(container);
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
   * Create button in the specified container (mem0 approach)
   */
  createButtonInContainer(container) {
    try {
      // Create container span like mem0
      const buttonContainer = document.createElement('span');
      buttonContainer.setAttribute('data-state', 'closed');
      buttonContainer.style.cssText = `
        display: inline-flex;
        align-items: center;
        position: relative;
        margin: 0 2px;
        flex-shrink: 0;
      `;
    
    // Create the button exactly like mem0 does
    const button = document.createElement('button');
    button.id = 'contextzero-icon-button';
    button.type = 'button';
    
    // Use mem0's exact className structure but adapt colors
    button.className = 'btn relative btn-primary btn-small flex items-center justify-center rounded-full border border-token-border-default p-1 text-token-text-secondary focus-visible:outline-black dark:text-token-text-secondary dark:focus-visible:outline-white bg-transparent dark:bg-transparent can-hover:hover:bg-token-main-surface-secondary dark:hover:bg-transparent dark:hover:opacity-100 h-9 min-h-9 w-9';
    
    // Add our custom styles while preserving mem0 structure
    button.style.cssText = `
      position: relative;
      transition: all 0.15s ease;
    `;
    
    // Create SVG icon similar to mem0's structure
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('width', '20');
    iconSvg.setAttribute('height', '20');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.style.cssText = 'color: currentColor;';
    
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('d', 'M12 2C13.1 2 14 2.9 14 4C14 4.74 13.6 5.39 13 5.73V7H16C17.1 7 18 7.9 18 9V10.27C18.61 10.6 19 11.26 19 12C19 12.74 18.61 13.4 18 13.73V15C18 16.1 17.1 17 16 17H13V18.27C13.6 18.61 14 19.26 14 20C14 21.1 13.1 22 12 22C10.9 22 10 21.1 10 20C10 19.26 10.4 18.61 11 18.27V17H8C6.9 17 6 16.1 6 15V13.73C5.39 13.4 5 12.74 5 12C5 11.26 5.39 10.6 6 10.27V9C6 7.9 6.9 7 8 7H11V5.73C10.4 5.39 10 4.74 10 4C10 2.9 10.9 2 12 2Z');
    iconPath.setAttribute('fill', 'currentColor');
    
    iconSvg.appendChild(iconPath);
    button.appendChild(iconSvg);
    
    // Create notification dot like mem0
    const notificationDot = document.createElement('div');
    notificationDot.className = 'contextzero-notification-dot';
    notificationDot.style.cssText = `
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      background-color: #ff6b35;
      border-radius: 50%;
      border: 2px solid white;
      display: none;
      z-index: 1001;
    `;
    button.appendChild(notificationDot);
    
    // Add hover effects with our orange theme
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255, 107, 53, 0.1)';
      iconSvg.style.color = '#ff6b35';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = '';
      iconSvg.style.color = 'currentColor';
    });
    
    // Add click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleMemoryButtonClick();
    });
    
    // Create tooltip like mem0
    const tooltip = document.createElement('div');
    tooltip.className = 'contextzero-tooltip';
    tooltip.textContent = 'Add memories to your prompt';
    tooltip.style.cssText = `
      position: absolute;
      bottom: calc(100% + 8px);
      left: 50%;
      transform: translateX(-50%);
      background: #1f1f1f;
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      white-space: nowrap;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
      z-index: 10001;
      pointer-events: none;
    `;
    
    // Add tooltip arrow
    const tooltipArrow = document.createElement('div');
    tooltipArrow.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 6px solid transparent;
      border-right: 6px solid transparent;
      border-top: 6px solid #1f1f1f;
    `;
    tooltip.appendChild(tooltipArrow);
    
    buttonContainer.appendChild(button);
    buttonContainer.appendChild(tooltip);
    
    // Show/hide tooltip on hover
    button.addEventListener('mouseenter', () => {
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
    });
    
    button.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
      tooltip.style.visibility = 'hidden';
    });
    
    // Insert button more carefully to avoid displacing other buttons
    // Look for a specific place in the button group
    const allButtons = Array.from(container.querySelectorAll('button'));
    const micButton = allButtons.find(btn => {
      const ariaLabel = btn.getAttribute('aria-label') || '';
      return ariaLabel.toLowerCase().includes('mic') || ariaLabel.toLowerCase().includes('voice');
    });
    
    if (micButton && micButton.parentElement === container) {
      // Insert before the mic button to keep it and dictation together
      container.insertBefore(buttonContainer, micButton);
    } else {
      // Find the first button that's a direct child
      const directChildButton = allButtons.find(btn => btn.parentElement === container);
      if (directChildButton) {
        container.insertBefore(buttonContainer, directChildButton);
      } else {
        // As last resort, append to container
        container.appendChild(buttonContainer);
      }
    }
    
    console.log('ContextZero: Button injected successfully using mem0 approach');
    } catch (error) {
      console.error('ContextZero: Error creating button in container:', error);
      // Fallback to floating button
      this.createFloatingButton();
    }
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