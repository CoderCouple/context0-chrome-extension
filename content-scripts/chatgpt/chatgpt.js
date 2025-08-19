/**
 * ChatGPT content script for ContextZero
 * Handles memory injection and extraction for ChatGPT interface
 */

class ChatGPTAdapter {
  constructor() {
    // Updated selectors for modern ChatGPT interface
    this.selectors = {
      input: '#prompt-textarea, div#prompt-textarea, textarea[data-id="root"], textarea[placeholder*="Message"], textarea[placeholder*="message"], div[contenteditable="true"][data-placeholder*="Message"], div[contenteditable="true"]',
      sendButton: '[data-testid="send-button"], button[aria-label="Send prompt"], button[data-testid="fruitjuice-send-button"], button[aria-label="Send message"]',
      messageContainer: '[data-testid="conversation-turn"], .group, [class*="conversation-turn"]',
      buttonContainer: 'form[class*="stretch"], div[class*="composer"]',
      conversationContainer: 'main [class*="conversation"], main[class*="chat"], .conversation-container'
    };
    
    this.isInitialized = false;
    this.lastProcessedMessage = '';
    
    // Initialize memory components safely - prefer HybridMemoryManager
    try {
      if (typeof HybridMemoryManager !== 'undefined') {
        this.memoryManager = new HybridMemoryManager();
        console.log('ContextZero: Using HybridMemoryManager for ChatGPT');
      } else if (typeof MemoryManager !== 'undefined') {
        this.memoryManager = new MemoryManager();
        console.log('ContextZero: Fallback to MemoryManager for ChatGPT');
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
    console.log('ContextZero: Looking for input element...');
    for (const selector of this.selectors.input.split(', ')) {
      const element = document.querySelector(selector);
      if (element) {
        console.log('ContextZero: Found input with selector:', selector);
        console.log('ContextZero: Element tag:', element.tagName);
        console.log('ContextZero: ContentEditable:', element.contentEditable);
        return element;
      }
    }
    console.log('ContextZero: No input element found!');
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
      if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
        text = input.value || '';
      } else if (input.contentEditable === 'true' || input.hasAttribute('contenteditable')) {
        text = input.textContent || input.innerText || '';
      } else {
        text = input.value || input.textContent || input.innerText || '';
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
    console.log('ContextZero: setInputText called with:', text);
    const input = this.getInputElement();
    
    if (input) {
      console.log('ContextZero: Setting text on element:', input);
      
      // ChatGPT specific: Check if it's the new prompt-textarea div
      if (input.id === 'prompt-textarea' && input.tagName === 'DIV') {
        console.log('ContextZero: Using ChatGPT-specific method for div#prompt-textarea');
        
        // Clear existing content
        input.innerHTML = '';
        
        // Create paragraph elements for proper formatting
        const lines = text.split('\n');
        lines.forEach((line, index) => {
          const p = document.createElement('p');
          p.textContent = line || '\u200B'; // Use zero-width space for empty lines
          input.appendChild(p);
        });
        
        // Focus and move cursor to end
        input.focus();
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(input.lastChild || input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger proper events
        input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        input.dispatchEvent(new InputEvent('input', { 
          bubbles: true, 
          cancelable: true,
          inputType: 'insertText',
          data: text
        }));
        
      } else if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
        console.log('ContextZero: Using textarea/input method');
        input.value = text;
        // Trigger events for textarea/input
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (input.contentEditable === 'true' || input.hasAttribute('contenteditable')) {
        console.log('ContextZero: Using generic contenteditable method');
        // For contenteditable, we need to properly set the content
        input.innerHTML = text.replace(/\n/g, '<br>');
        
        // Move cursor to end for contenteditable
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Trigger input event for contenteditable
        input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        input.dispatchEvent(new Event('compositionend', { bubbles: true }));
      } else {
        console.log('ContextZero: Using fallback method');
        input.value = text;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // Focus the input
      input.focus();
      
      console.log('ContextZero: Text set complete');
    } else {
      console.error('ContextZero: No input element found to set text!');
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
      ">
        🧠
      </div>
    `;
    
    const floatingBtn = button.firstElementChild;
    
    // Add hover effects with stable tooltip
    let hoverTooltip = null;
    let hoverTimeout = null;
    let isHovering = false;
    
    const showTooltip = () => {
      if (!isHovering || hoverTooltip) return;
      hoverTooltip = new TooltipPopover('Add memories to your prompt', floatingBtn);
      hoverTooltip.show();
    };
    
    const hideTooltip = () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        hoverTimeout = null;
      }
      if (hoverTooltip) {
        hoverTooltip.hide();
        hoverTooltip = null;
      }
    };
    
    floatingBtn.addEventListener('mouseenter', (e) => {
      isHovering = true;
      floatingBtn.style.transform = 'scale(1.1)';
      floatingBtn.style.opacity = '1';
      floatingBtn.style.boxShadow = '0 4px 16px rgba(255, 107, 53, 0.3)';
      
      // Cancel any pending hide
      hideTooltip();
      
      // Show tooltip after delay
      hoverTimeout = setTimeout(showTooltip, 600);
    });
    
    floatingBtn.addEventListener('mouseleave', (e) => {
      isHovering = false;
      floatingBtn.style.transform = 'scale(1)';
      floatingBtn.style.opacity = '0.9';
      floatingBtn.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
      
      // Hide tooltip immediately
      hideTooltip();
    });
    
    // Prevent tooltip on click
    floatingBtn.addEventListener('mousedown', () => {
      isHovering = false;
      hideTooltip();
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
  /**
   * Initialize Clerk authentication
   */
  initClerkAuth() {
    if (!this.clerkAuth && typeof ClerkAuth !== 'undefined') {
      this.clerkAuth = new ClerkAuth();
    }
    return this.clerkAuth;
  }

  /**
   * Check authentication status
   */
  async checkAuthStatus() {
    try {
      this.initClerkAuth();
      
      if (this.clerkAuth) {
        const isAuthenticated = await this.clerkAuth.isAuthenticated();
        
        if (isAuthenticated) {
          const user = await this.clerkAuth.getCurrentUser();
          return {
            isAuthenticated: true,
            userId: user?.id,
            email: user?.email
          };
        }
      }
      
      // Fallback to stored auth state
      const result = await chrome.storage.local.get([
        'contextzero_user_logged_in', 
        'contextzero_user_id',
        'contextzero_user_email'
      ]);
      
      return {
        isAuthenticated: !!result.contextzero_user_logged_in,
        userId: result.contextzero_user_id,
        email: result.contextzero_user_email
      };
    } catch (error) {
      console.error('ContextZero: Error checking auth status:', error);
      return { isAuthenticated: false };
    }
  }

  /**
   * Get all user memories
   */
  async getAllUserMemories() {
    try {
      console.log('ContextZero: Getting all user memories...');
      console.log('ContextZero: Memory manager type:', this.memoryManager?.constructor?.name);
      
      // If using HybridMemoryManager with cloud sync
      if (this.memoryManager && this.memoryManager.getAllMemories) {
        console.log('ContextZero: Using getAllMemories from HybridMemoryManager');
        const memories = await this.memoryManager.getAllMemories();
        console.log('ContextZero: Retrieved memories from cloud:', memories);
        return memories || [];
      }
      
      // Fallback to local storage
      console.log('ContextZero: Falling back to local storage');
      const memories = await this.memoryManager.storage.getMemories();
      console.log('ContextZero: Retrieved memories from local:', memories);
      
      // Sort by most recent first
      return memories.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('ContextZero: Error getting all memories:', error);
      return [];
    }
  }

  async handleMemoryButtonClick() {
    try {
      // First check authentication status
      const authStatus = await this.checkAuthStatus();
      
      if (!authStatus.isAuthenticated) {
        // Show sign-in dialog
        SignInDialog.show({
          onSignIn: async (authData) => {
            console.log('ContextZero: User initiated sign in');
            
            // If authentication was successful, don't show dialog again
            if (authData) {
              console.log('ContextZero: Authentication successful, refreshing memories');
              // Small delay to ensure auth is propagated
              setTimeout(() => {
                // Re-run the memory button click to show memories
                this.handleMemoryButtonClick();
              }, 500);
            }
          },
          onClose: () => {
            console.log('ContextZero: Sign in dialog closed');
          }
        });
        return;
      }
      
      // User is authenticated, show all their memories
      if (!this.memoryManager) {
        AlertDialog.show('Memory system not available. Please refresh the page and try again.', {
          type: 'error'
        });
        return;
      }
      
      // Show loading state
      const button = document.getElementById('contextzero-icon-button');
      const originalIcon = button?.innerHTML;
      if (button) {
        button.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 22L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
          </svg>
        `;
        button.disabled = true;
      }
      
      try {
        // Get ALL user memories (not filtered by input)
        const allMemories = await this.getAllUserMemories();
        
        console.log('ContextZero Debug - Total memories:', allMemories.length);
        
        // Restore button
        if (button) {
          button.innerHTML = originalIcon;
          button.disabled = false;
        }
        
        if (allMemories.length === 0) {
          // Show a friendly message if no memories exist
          AlertDialog.show('No memories found. Start chatting to create your first memory!', {
            type: 'info'
          });
          return;
        }
        
        // Show all memories in the modal
        this.showMemoryModal(allMemories);
        
      } catch (error) {
        console.error('ContextZero: Error loading memories:', error);
        
        // Restore button on error
        if (button) {
          button.innerHTML = originalIcon;
          button.disabled = false;
        }
        
        AlertDialog.show('Error loading memories. Please try again.', {
          type: 'error'
        });
      }
      
    } catch (error) {
      console.error('ContextZero: Error handling memory button click:', error.message || error);
      
      // Restore button on error
      const button = document.getElementById('contextzero-icon-button');
      if (button) {
        button.innerHTML = button.originalIcon || button.innerHTML;
        button.disabled = false;
      }
      
      AlertDialog.show('Error accessing memories. Please refresh the page and try again.', {
        type: 'error'
      });
    }
  }
  
  /**
   * Show memory selection modal
   * @param {Array} memories - Array of relevant memories
   */
  showMemoryModal(memories) {
    console.log('ContextZero Debug - showMemoryModal called with memories:', memories);
    
    // Remove existing modal
    const existingModal = document.querySelector('.contextzero-modal');
    if (existingModal) {
      console.log('ContextZero Debug - Removing existing modal');
      existingModal.remove();
    }
    
    try {
      // Check if MemoryModal class is available
      if (typeof MemoryModal === 'undefined') {
        console.error('ContextZero: MemoryModal class not found');
        AlertDialog.show('Memory modal component not loaded. Please refresh the page.', {
          type: 'error'
        });
        return;
      }
      
      // Create modal
      console.log('ContextZero Debug - Creating MemoryModal');
      const modal = new MemoryModal(memories, {
        onSelect: (selectedMemories) => this.injectMemories(selectedMemories),
        onClose: () => modal.remove()
      });
      
      console.log('ContextZero Debug - Modal created, rendering...');
      const modalElement = modal.render();
      console.log('ContextZero Debug - Modal element:', modalElement);
      
      document.body.appendChild(modalElement);
      console.log('ContextZero Debug - Modal appended to body');
      
    } catch (error) {
      console.error('ContextZero: Error creating modal:', error);
      AlertDialog.show('Error opening memory dialog. Check console for details.', {
        type: 'error'
      });
    }
  }
  
  /**
   * Inject selected memories into the prompt
   * @param {Array} memories - Selected memories
   */
  injectMemories(memories) {
    console.log('ContextZero: injectMemories called with', memories);
    if (memories.length === 0) return;
    
    const currentText = this.getInputText();
    console.log('ContextZero: Current text:', currentText);
    
    const formattedMemories = this.memoryManager.formatMemoriesForInjection(memories, {
      groupByCategory: true,
      maxLength: 800
    });
    console.log('ContextZero: Formatted memories:', formattedMemories);
    
    const newText = currentText + formattedMemories;
    console.log('ContextZero: New text to set:', newText);
    
    this.setInputText(newText);
    
    // Focus the input
    const input = this.getInputElement();
    console.log('ContextZero: Input element after setting text:', input);
    
    if (input) {
      input.focus();
      // Move cursor to end for different input types
      if (input.tagName.toLowerCase() === 'textarea' || input.tagName.toLowerCase() === 'input') {
        input.setSelectionRange(input.value.length, input.value.length);
      }
      
      // Check if text was actually set
      const verifyText = this.getInputText();
      console.log('ContextZero: Text after setting:', verifyText);
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

// Track initialization state
let isInitializing = false;
let lastInitTime = 0;
let urlCheckInterval = null;

function initializeChatGPTAdapter() {
  // Prevent rapid reinitialization
  const now = Date.now();
  if (isInitializing || (now - lastInitTime) < 2000) {
    return;
  }
  
  isInitializing = true;
  lastInitTime = now;
  
  console.log('ContextZero: Attempting to initialize on:', window.location.hostname);
  
  if (window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com') || window.location.hostname.includes('chat.openai.com')) {
    console.log('ContextZero: Domain matched, creating adapter...');
    
    // Only create new adapter if one doesn't exist
    if (!window.contextZeroChatGPT) {
      console.log('ContextZero: Creating new adapter...');
      const adapter = new ChatGPTAdapter();
      window.contextZeroChatGPT = adapter;
      
      // Retry button injection after a delay
      setTimeout(() => {
        console.log('ContextZero: Retrying button injection after delay...');
        adapter.injectMemoryButton();
        isInitializing = false;
      }, 2000);
      
      // Clear existing interval if any
      if (urlCheckInterval) {
        clearInterval(urlCheckInterval);
      }
      
      // Reinitialize on page navigation
      let currentUrl = window.location.href;
      urlCheckInterval = setInterval(() => {
        if (window.location.href !== currentUrl) {
          currentUrl = window.location.href;
          console.log('ContextZero: URL changed, reinitializing...');
          adapter.reinitialize();
        }
      }, 1000);
    } else {
      console.log('ContextZero: Adapter already exists, skipping recreation...');
      isInitializing = false;
    }
    
  } else {
    console.log('ContextZero: Domain not matched:', window.location.hostname);
    isInitializing = false;
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
    // console.log('ContextZero: DOM mutation detected, reinitializing...');
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

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('ContextZero: Received message:', request.action);
  
  (async () => {
    try {
      switch(request.action) {
        case 'addSelectedTextAsMemory':
          await handleAddSelectedTextAsMemory(request.text);
          sendResponse({ success: true });
          break;
          
        case 'searchMemoriesWithText':
          await handleSearchMemoriesWithText(request.text);
          sendResponse({ success: true });
          break;
          
        case 'ping':
          sendResponse({ success: true, status: 'active' });
          break;
          
        default:
          console.log('ContextZero: Unknown action:', request.action);
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('ContextZero: Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Indicates async response
});

// Handle adding selected text as memory to backend
async function handleAddSelectedTextAsMemory(text) {
  console.log('ContextZero: Adding selected text as memory to backend:', text);
  
  try {
    // Get the adapter instance
    const adapter = window.contextZeroChatGPT || window.chatGPTAdapter;
    
    if (!adapter || !adapter.memoryManager) {
      // Try to initialize if not ready
      if (!adapter) {
        initializeChatGPTAdapter();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      const newAdapter = window.contextZeroChatGPT || window.chatGPTAdapter;
      if (!newAdapter || !newAdapter.memoryManager) {
        AlertDialog.show('Memory system not initialized. Please refresh the page.', {
          type: 'error'
        });
        return;
      }
    }
    
    const memoryManager = adapter.memoryManager;
    
    // Store the selected text as a memory with metadata
    const metadata = {
      type: 'note',
      category: 'general',
      source: 'context-menu',
      platform: 'web',
      url: window.location.href,
      title: document.title,
      timestamp: Date.now()
    };
    
    // Store to backend
    const result = await memoryManager.storeMemory(text, metadata);
    
    if (result && result.length > 0) {
      // Show success message
      AlertDialog.show(`Memory saved successfully!`, {
        type: 'success'
      });
      
      console.log('ContextZero: Memory stored successfully:', result);
    } else {
      throw new Error('Failed to store memory');
    }
    
  } catch (error) {
    console.error('ContextZero: Error adding memory:', error);
    AlertDialog.show('Failed to save memory. Please try again.', {
      type: 'error'
    });
  }
}

// Handle searching memories with selected text
async function handleSearchMemoriesWithText(text) {
  console.log('ContextZero: Searching memories with text:', text);
  
  try {
    // Get the adapter instance
    const adapter = window.contextZeroChatGPT || window.chatGPTAdapter;
    
    if (!adapter || !adapter.memoryManager) {
      AlertDialog.show('Memory system not initialized. Please refresh the page.', {
        type: 'error'
      });
      return;
    }
    
    // Search for memories
    const results = await adapter.memoryManager.searchMemories(text, {
      limit: 20,
      threshold: 0.5
    });
    
    if (results.length === 0) {
      AlertDialog.show(`No memories found matching: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`, {
        type: 'info'
      });
      return;
    }
    
    // Show results in a modal
    const modal = new MemoryModal(results, {
      title: `Search Results (${results.length})`,
      onSelect: (selectedMemories) => adapter.injectMemories(selectedMemories),
      onClose: () => modal.remove()
    });
    
    const modalElement = modal.render();
    document.body.appendChild(modalElement);
    
  } catch (error) {
    console.error('ContextZero: Error searching memories:', error);
    AlertDialog.show('Failed to search memories. Please try again.', {
      type: 'error'
    });
  }
}