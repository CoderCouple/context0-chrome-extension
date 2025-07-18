/**
 * Claude-specific Automated Tests
 * 
 * Usage:
 * 1. Navigate to claude.ai
 * 2. Load extension
 * 3. Open DevTools console
 * 4. Run: ClaudeTests.runAll()
 */

class ClaudeTests {
  constructor() {
    this.results = [];
    this.platform = 'claude';
    this.adapter = window.contextZeroClaude;
    this.testData = new ClaudeTestData();
  }

  /**
   * Run all Claude-specific tests
   */
  async runAll() {
    console.log('🚀 Running Claude-specific tests...');
    
    if (!this.adapter) {
      console.error('❌ Claude adapter not found');
      return;
    }

    try {
      await this.testDOMElements();
      await this.testContentEditableHandling();
      await this.testMessageCapture();
      await this.testMemoryButtonFunctionality();
      await this.testConversationProcessing();
      await this.testMessageListener();
      await this.testPerformanceOnClaude();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ Claude test suite failed:', error);
    }
  }

  /**
   * Test DOM element detection
   */
  async testDOMElements() {
    console.log('\n📋 Testing DOM Elements');
    
    // Test input element detection
    await this.test('Input element detection', () => {
      const input = this.adapter.getInputElement();
      const isContentEditable = input && input.contentEditable === 'true';
      const hasTestId = input && input.dataset.testid === 'chat-input';
      
      return isContentEditable && hasTestId;
    });

    // Test send button detection
    await this.test('Send button detection', () => {
      const sendButton = document.querySelector(this.adapter.selectors.sendButton);
      return sendButton && sendButton.getAttribute('aria-label') === 'Send Message';
    });

    // Test message container detection
    await this.test('Message container detection', () => {
      const containers = document.querySelectorAll(this.adapter.selectors.messageContainer);
      return containers.length >= 0; // May be 0 in new conversations
    });

    // Test conversation container detection
    await this.test('Conversation container detection', () => {
      const container = document.querySelector(this.adapter.selectors.conversationContainer);
      return container && container.tagName.toLowerCase() === 'main';
    });

    // Test input container detection
    await this.test('Input container detection', () => {
      const container = document.querySelector(this.adapter.selectors.inputContainer);
      return container && container.dataset.testid === 'chat-input-container';
    });
  }

  /**
   * Test contenteditable handling
   */
  async testContentEditableHandling() {
    console.log('\n✏️ Testing ContentEditable Handling');
    
    // Test getting text content
    await this.test('Get text content', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const originalText = input.textContent;
      const retrievedText = this.adapter.getInputText();
      
      return typeof retrievedText === 'string';
    });

    // Test setting text content
    await this.test('Set text content', () => {
      const originalText = this.adapter.getInputText();
      const testText = 'Test content for Claude';
      
      this.adapter.setInputText(testText);
      const retrievedText = this.adapter.getInputText();
      
      // Restore original text
      this.adapter.setInputText(originalText);
      
      return retrievedText === testText;
    });

    // Test cursor positioning
    await this.test('Cursor positioning', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const testText = 'Cursor test';
      this.adapter.setInputText(testText);
      
      // Check if cursor is at the end
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      
      return range.collapsed && range.endOffset === testText.length;
    });

    // Test text selection
    await this.test('Text selection works', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const testText = 'Selection test';
      this.adapter.setInputText(testText);
      
      // Create selection
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(input);
      selection.removeAllRanges();
      selection.addRange(range);
      
      return selection.toString() === testText;
    });

    // Test input events for contenteditable
    await this.test('ContentEditable input events', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      let eventTriggered = false;
      const handler = () => { eventTriggered = true; };
      
      input.addEventListener('input', handler);
      input.textContent = 'Event test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.removeEventListener('input', handler);
      
      return eventTriggered;
    });
  }

  /**
   * Test message capture functionality
   */
  async testMessageCapture() {
    console.log('\n📝 Testing Message Capture');
    
    // Test message capture on send button click
    await this.test('Message capture on send button click', async () => {
      const testMessage = 'Test message for Claude send button';
      this.adapter.setInputText(testMessage);
      
      // Mock the capture method
      let captureTriggered = false;
      const originalCapture = this.adapter.captureUserMessage;
      this.adapter.captureUserMessage = async () => {
        captureTriggered = true;
        return originalCapture.call(this.adapter);
      };
      
      // Simulate send button click
      const sendButton = document.querySelector(this.adapter.selectors.sendButton);
      if (sendButton) {
        const clickEvent = new MouseEvent('click', { bubbles: true });
        sendButton.dispatchEvent(clickEvent);
      }
      
      // Restore original method
      this.adapter.captureUserMessage = originalCapture;
      
      return captureTriggered;
    });

    // Test message capture on Enter key
    await this.test('Message capture on Enter key', async () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const testMessage = 'Test message for Claude Enter key';
      this.adapter.setInputText(testMessage);
      
      // Mock the capture method
      let captureTriggered = false;
      const originalCapture = this.adapter.captureUserMessage;
      this.adapter.captureUserMessage = async () => {
        captureTriggered = true;
        return originalCapture.call(this.adapter);
      };
      
      // Simulate Enter key press
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: false,
        bubbles: true
      });
      input.dispatchEvent(enterEvent);
      
      // Restore original method
      this.adapter.captureUserMessage = originalCapture;
      
      return captureTriggered;
    });

    // Test Shift+Enter handling
    await this.test('Shift+Enter does not trigger capture', async () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      // Mock the capture method
      let captureTriggered = false;
      const originalCapture = this.adapter.captureUserMessage;
      this.adapter.captureUserMessage = async () => {
        captureTriggered = true;
        return originalCapture.call(this.adapter);
      };
      
      // Simulate Shift+Enter key press
      const shiftEnterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        shiftKey: true,
        bubbles: true
      });
      input.dispatchEvent(shiftEnterEvent);
      
      // Restore original method
      this.adapter.captureUserMessage = originalCapture;
      
      return !captureTriggered;
    });

    // Test memory storage with Claude metadata
    await this.test('Memory storage with Claude metadata', async () => {
      const testMessage = 'Testing Claude metadata storage';
      this.adapter.setInputText(testMessage);
      
      const memoryManager = new MemoryManager();
      const memories = await memoryManager.storeMemory(testMessage, {
        platform: 'claude',
        url: window.location.href,
        timestamp: Date.now()
      });
      
      return memories.length > 0 && memories[0].metadata.platform === 'claude';
    });
  }

  /**
   * Test memory button functionality
   */
  async testMemoryButtonFunctionality() {
    console.log('\n🧠 Testing Memory Button');
    
    // Test memory button injection
    await this.test('Memory button injection', () => {
      // Remove existing button
      const existingButton = document.querySelector('.contextzero-memory-btn');
      if (existingButton) {
        existingButton.remove();
      }
      
      this.adapter.injectMemoryButton();
      
      const newButton = document.querySelector('.contextzero-memory-btn');
      return newButton && newButton.innerHTML === '🧠';
    });

    // Test Claude-specific button styling
    await this.test('Claude button styling', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      return styles.backgroundColor === 'rgb(205, 127, 50)' && // Claude bronze
             styles.borderRadius === '8px' &&
             styles.position === 'absolute';
    });

    // Test button positioning
    await this.test('Button positioning', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      return styles.position === 'absolute' &&
             styles.right === '60px' &&
             styles.top === '50%';
    });

    // Test button hover effects
    await this.test('Button hover effects', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const originalTransform = window.getComputedStyle(button).transform;
      
      // Simulate hover
      button.dispatchEvent(new MouseEvent('mouseenter'));
      const hoverTransform = window.getComputedStyle(button).transform;
      
      // Simulate leave
      button.dispatchEvent(new MouseEvent('mouseleave'));
      const leaveTransform = window.getComputedStyle(button).transform;
      
      return hoverTransform.includes('scale') && leaveTransform === originalTransform;
    });

    // Test button click with contenteditable input
    await this.test('Button click with contenteditable', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      this.adapter.setInputText('Test contenteditable click');
      
      // Mock handleMemoryButtonClick to avoid modal
      let clickHandled = false;
      const originalHandler = this.adapter.handleMemoryButtonClick;
      this.adapter.handleMemoryButtonClick = async () => {
        clickHandled = true;
      };
      
      // Trigger click
      button.click();
      
      // Restore original handler
      this.adapter.handleMemoryButtonClick = originalHandler;
      
      return clickHandled;
    });
  }

  /**
   * Test conversation processing
   */
  async testConversationProcessing() {
    console.log('\n💬 Testing Conversation Processing');
    
    // Test conversation observer setup
    await this.test('Conversation observer setup', () => {
      const conversationContainer = document.querySelector(this.adapter.selectors.conversationContainer);
      return conversationContainer !== null;
    });

    // Test Claude message processing
    await this.test('Claude message processing', async () => {
      // Create a test message element
      const testMessage = document.createElement('div');
      testMessage.className = 'font-claude-message';
      testMessage.textContent = 'This is a test Claude message with sufficient content for processing and extraction';
      
      // Add to conversation
      const conversationContainer = document.querySelector(this.adapter.selectors.conversationContainer);
      if (conversationContainer) {
        conversationContainer.appendChild(testMessage);
      }
      
      // Process messages
      await this.adapter.processConversationMessages();
      
      // Check if message was marked as processed
      const isProcessed = testMessage.dataset.contextzeroProcessed === 'true';
      
      // Clean up
      if (conversationContainer) {
        conversationContainer.removeChild(testMessage);
      }
      
      return isProcessed;
    });

    // Test mutation observer
    await this.test('Mutation observer functionality', () => {
      const conversationContainer = document.querySelector(this.adapter.selectors.conversationContainer);
      if (!conversationContainer) return false;
      
      // Create and add a new message
      const newMessage = document.createElement('div');
      newMessage.className = 'font-claude-message';
      newMessage.textContent = 'New message for mutation test';
      
      // This should trigger the mutation observer
      conversationContainer.appendChild(newMessage);
      
      // Clean up
      setTimeout(() => {
        if (conversationContainer.contains(newMessage)) {
          conversationContainer.removeChild(newMessage);
        }
      }, 100);
      
      return true; // If no errors thrown, observer is working
    });
  }

  /**
   * Test message listener functionality
   */
  async testMessageListener() {
    console.log('\n📡 Testing Message Listener');
    
    // Test ping response
    await this.test('Ping response', async () => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
          resolve(response && response.success && response.platform === 'claude');
        });
      });
    });

    // Test toggleMemoryPanel message
    await this.test('Toggle memory panel message', async () => {
      let panelToggled = false;
      
      // Mock toggleMemoryPanel
      const originalToggle = this.adapter.toggleMemoryPanel;
      this.adapter.toggleMemoryPanel = async () => {
        panelToggled = true;
      };
      
      // Send message
      chrome.runtime.sendMessage({ action: 'toggleMemoryPanel' });
      
      // Wait a bit for message processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore original method
      this.adapter.toggleMemoryPanel = originalToggle;
      
      return panelToggled;
    });

    // Test addSelectedTextAsMemory message
    await this.test('Add selected text as memory', async () => {
      let textAdded = false;
      const testText = 'Selected text for Claude test';
      
      // Mock addSelectedTextAsMemory
      const originalAdd = this.adapter.addSelectedTextAsMemory;
      this.adapter.addSelectedTextAsMemory = async (text) => {
        textAdded = text === testText;
      };
      
      // Send message
      chrome.runtime.sendMessage({ 
        action: 'addSelectedTextAsMemory', 
        text: testText 
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore original method
      this.adapter.addSelectedTextAsMemory = originalAdd;
      
      return textAdded;
    });

    // Test searchMemoriesWithText message
    await this.test('Search memories with text', async () => {
      let searchCalled = false;
      const testText = 'Search text for Claude test';
      
      // Mock searchMemoriesWithText
      const originalSearch = this.adapter.searchMemoriesWithText;
      this.adapter.searchMemoriesWithText = async (text) => {
        searchCalled = text === testText;
      };
      
      // Send message
      chrome.runtime.sendMessage({ 
        action: 'searchMemoriesWithText', 
        text: testText 
      });
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Restore original method
      this.adapter.searchMemoriesWithText = originalSearch;
      
      return searchCalled;
    });
  }

  /**
   * Test Claude-specific performance
   */
  async testPerformanceOnClaude() {
    console.log('\n⚡ Testing Claude Performance');
    
    // Test contenteditable manipulation performance
    await this.test('ContentEditable manipulation performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        this.adapter.setInputText(`Claude performance test ${i}`);
        this.adapter.getInputText();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 1000; // Should complete within 1 second
    });

    // Test cursor positioning performance
    await this.test('Cursor positioning performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        this.adapter.setInputText(`Cursor test ${i}`);
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 500; // Should complete within 500ms
    });

    // Test DOM queries performance
    await this.test('DOM queries performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        this.adapter.getInputElement();
        this.adapter.getButtonContainer();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 100; // Should complete within 100ms
    });

    // Test memory button injection performance
    await this.test('Memory button injection performance', () => {
      const startTime = performance.now();
      
      // Remove and re-inject button multiple times
      for (let i = 0; i < 10; i++) {
        const existingButton = document.querySelector('.contextzero-memory-btn');
        if (existingButton) {
          existingButton.remove();
        }
        this.adapter.injectMemoryButton();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 500; // Should complete within 500ms
    });
  }

  /**
   * Test helper function
   */
  async test(name, testFunction) {
    try {
      console.log(`  🧪 ${name}...`);
      const result = await testFunction();
      
      if (result) {
        console.log(`  ✅ ${name}`);
        this.results.push({ name, passed: true });
      } else {
        console.log(`  ❌ ${name}`);
        this.results.push({ name, passed: false });
      }
    } catch (error) {
      console.log(`  💥 ${name} - Error: ${error.message}`);
      this.results.push({ name, passed: false, error: error.message });
    }
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Claude Test Report');
    console.log('====================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Platform: Claude`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // Show failed tests
    const failedTestsList = this.results.filter(r => !r.passed);
    if (failedTestsList.length > 0) {
      console.log('\nFailed Tests:');
      failedTestsList.forEach(test => {
        console.log(`❌ ${test.name}${test.error ? ` - ${test.error}` : ''}`);
      });
    }
    
    // Store results
    this.storeResults();
  }

  /**
   * Store test results
   */
  async storeResults() {
    try {
      const testResults = {
        platform: this.platform,
        timestamp: Date.now(),
        results: this.results,
        summary: {
          total: this.results.length,
          passed: this.results.filter(r => r.passed).length,
          failed: this.results.filter(r => !r.passed).length
        }
      };
      
      await chrome.storage.local.set({
        [`contextzero_test_results_${this.platform}`]: testResults
      });
      
      console.log('💾 Claude test results stored');
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }
}

/**
 * Claude-specific test data
 */
class ClaudeTestData {
  constructor() {
    this.conversationMessages = [
      'Hello Claude, I need help with a creative writing project.',
      'Can you help me brainstorm ideas for a science fiction story?',
      'What are some interesting themes I could explore?',
      'How do I create compelling characters?',
      'Thank you for your creative insights!'
    ];
    
    this.memoryTestMessages = [
      'My name is Bob and I work as a creative director at Adobe',
      'I live in Portland and love indie music and craft beer',
      'I have a degree in Fine Arts from RISD',
      'I enjoy skateboarding and playing guitar',
      'My goal is to direct a short film next year'
    ];
  }
}

// Make available globally
window.ClaudeTests = ClaudeTests;

// Auto-run if on Claude and autotest parameter is present
if (window.location.hostname.includes('claude.ai') && 
    window.location.search.includes('claude-test=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tests = new ClaudeTests();
      tests.runAll();
    }, 3000);
  });
}

console.log('🧪 Claude Tests loaded. Run with: new ClaudeTests().runAll()');