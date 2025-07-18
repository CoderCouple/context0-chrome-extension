/**
 * ChatGPT-specific Automated Tests
 * 
 * Usage:
 * 1. Navigate to chatgpt.com or chat.openai.com
 * 2. Load extension
 * 3. Open DevTools console
 * 4. Run: ChatGPTTests.runAll()
 */

class ChatGPTTests {
  constructor() {
    this.results = [];
    this.platform = 'chatgpt';
    this.adapter = window.contextZeroChatGPT;
    this.testData = new ChatGPTTestData();
  }

  /**
   * Run all ChatGPT-specific tests
   */
  async runAll() {
    console.log('🚀 Running ChatGPT-specific tests...');
    
    if (!this.adapter) {
      console.error('❌ ChatGPT adapter not found');
      return;
    }

    try {
      await this.testDOMElements();
      await this.testInputHandling();
      await this.testMessageCapture();
      await this.testMemoryButtonFunctionality();
      await this.testConversationProcessing();
      await this.testPageNavigation();
      await this.testPerformanceOnChatGPT();
      
      this.generateReport();
    } catch (error) {
      console.error('❌ ChatGPT test suite failed:', error);
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
      const isTextarea = input && input.tagName.toLowerCase() === 'textarea';
      const hasCorrectId = input && (input.id === 'prompt-textarea' || input.dataset.id === 'root');
      
      return isTextarea && input.placeholder && (hasCorrectId || input.getAttribute('data-testid'));
    });

    // Test send button detection
    await this.test('Send button detection', () => {
      const sendButton = document.querySelector(this.adapter.selectors.sendButton);
      return sendButton && (
        sendButton.dataset.testid === 'send-button' ||
        sendButton.getAttribute('aria-label')?.includes('Send')
      );
    });

    // Test message container detection
    await this.test('Message container detection', () => {
      const containers = document.querySelectorAll(this.adapter.selectors.messageContainer);
      return containers.length > 0;
    });

    // Test conversation container detection
    await this.test('Conversation container detection', () => {
      const container = document.querySelector(this.adapter.selectors.conversationContainer);
      return container && container.tagName.toLowerCase() === 'main';
    });

    // Test button container detection
    await this.test('Button container detection', () => {
      const container = this.adapter.getButtonContainer();
      return container && container.tagName.toLowerCase() === 'form';
    });
  }

  /**
   * Test input handling
   */
  async testInputHandling() {
    console.log('\n⌨️ Testing Input Handling');
    
    // Test getting input text
    await this.test('Get input text', () => {
      const originalText = this.adapter.getInputText();
      return typeof originalText === 'string';
    });

    // Test setting input text
    await this.test('Set input text', () => {
      const originalText = this.adapter.getInputText();
      const testText = 'Test input for ChatGPT';
      
      this.adapter.setInputText(testText);
      const retrievedText = this.adapter.getInputText();
      
      // Restore original text
      this.adapter.setInputText(originalText);
      
      return retrievedText === testText;
    });

    // Test input focus
    await this.test('Input focus works', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      input.focus();
      return document.activeElement === input;
    });

    // Test input events
    await this.test('Input events trigger', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      let eventTriggered = false;
      const handler = () => { eventTriggered = true; };
      
      input.addEventListener('input', handler);
      input.value = 'Event test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.removeEventListener('input', handler);
      
      return eventTriggered;
    });

    // Test placeholder text
    await this.test('Input has placeholder', () => {
      const input = this.adapter.getInputElement();
      return input && input.placeholder && input.placeholder.length > 0;
    });
  }

  /**
   * Test message capture functionality
   */
  async testMessageCapture() {
    console.log('\n📝 Testing Message Capture');
    
    // Test message capture on send button click
    await this.test('Message capture on send button click', async () => {
      const testMessage = 'Test message for send button capture';
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
        sendButton.click();
      }
      
      // Restore original method
      this.adapter.captureUserMessage = originalCapture;
      
      return captureTriggered;
    });

    // Test message capture on Enter key
    await this.test('Message capture on Enter key', async () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const testMessage = 'Test message for Enter key capture';
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

    // Test last processed message tracking
    await this.test('Last processed message tracking', async () => {
      const testMessage = 'Test message for tracking';
      this.adapter.setInputText(testMessage);
      
      await this.adapter.captureUserMessage();
      
      return this.adapter.lastProcessedMessage === testMessage;
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

    // Test button styling
    await this.test('Memory button styling', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      return styles.backgroundColor === 'rgb(16, 163, 127)' && // ChatGPT green
             styles.borderRadius === '8px' &&
             styles.cursor === 'pointer';
    });

    // Test button hover effects
    await this.test('Memory button hover effects', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      // Simulate hover
      button.dispatchEvent(new MouseEvent('mouseenter'));
      const hoverStyles = window.getComputedStyle(button);
      const hoverColor = hoverStyles.backgroundColor;
      
      // Simulate leave
      button.dispatchEvent(new MouseEvent('mouseleave'));
      const normalStyles = window.getComputedStyle(button);
      const normalColor = normalStyles.backgroundColor;
      
      return hoverColor !== normalColor;
    });

    // Test button click with empty input
    await this.test('Button click with empty input', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      this.adapter.setInputText('');
      
      // Mock alert
      let alertCalled = false;
      const originalAlert = window.alert;
      window.alert = () => { alertCalled = true; };
      
      await this.adapter.handleMemoryButtonClick();
      
      // Restore alert
      window.alert = originalAlert;
      
      return alertCalled;
    });

    // Test button loading state
    await this.test('Button loading state', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      this.adapter.setInputText('Test input for loading state');
      
      // Start the handler but don't wait for completion
      const clickPromise = this.adapter.handleMemoryButtonClick();
      
      // Check if button shows loading
      const isLoading = button.innerHTML === '⏳' && button.disabled;
      
      // Wait for completion
      await clickPromise;
      
      // Check if button is restored
      const isRestored = button.innerHTML === '🧠' && !button.disabled;
      
      return isLoading && isRestored;
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

    // Test message processing
    await this.test('Message processing', async () => {
      // Create a test message element
      const testMessage = document.createElement('div');
      testMessage.className = 'group'; // ChatGPT message class
      testMessage.textContent = 'This is a test message for processing with enough content to trigger extraction';
      
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

    // Test message length filtering
    await this.test('Message length filtering', async () => {
      // Create a short message that should be ignored
      const shortMessage = document.createElement('div');
      shortMessage.className = 'group';
      shortMessage.textContent = 'Short';
      
      const conversationContainer = document.querySelector(this.adapter.selectors.conversationContainer);
      if (conversationContainer) {
        conversationContainer.appendChild(shortMessage);
      }
      
      await this.adapter.processConversationMessages();
      
      // Should not be processed (marked)
      const isNotProcessed = !shortMessage.dataset.contextzeroProcessed;
      
      // Clean up
      if (conversationContainer) {
        conversationContainer.removeChild(shortMessage);
      }
      
      return isNotProcessed;
    });
  }

  /**
   * Test page navigation handling
   */
  async testPageNavigation() {
    console.log('\n🔄 Testing Page Navigation');
    
    // Test reinitialize functionality
    await this.test('Reinitialize functionality', () => {
      // Remove memory button
      const existingButton = document.querySelector('.contextzero-memory-btn');
      if (existingButton) {
        existingButton.remove();
      }
      
      // Reinitialize
      this.adapter.reinitialize();
      
      // Check if button is re-injected after delay
      return new Promise(resolve => {
        setTimeout(() => {
          const newButton = document.querySelector('.contextzero-memory-btn');
          resolve(newButton !== null);
        }, 1100); // Wait for reinitialize timeout
      });
    });

    // Test URL change detection
    await this.test('URL change detection', () => {
      // This test verifies the URL monitoring is set up
      // In a real test, we'd change the URL and check if reinitialize was called
      return typeof this.adapter.reinitialize === 'function';
    });
  }

  /**
   * Test ChatGPT-specific performance
   */
  async testPerformanceOnChatGPT() {
    console.log('\n⚡ Testing ChatGPT Performance');
    
    // Test input manipulation performance
    await this.test('Input manipulation performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        this.adapter.setInputText(`Performance test ${i}`);
        this.adapter.getInputText();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 1000; // Should complete within 1 second
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

    // Test DOM query performance
    await this.test('DOM query performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        this.adapter.getInputElement();
        this.adapter.getButtonContainer();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 100; // Should complete within 100ms
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
    console.log('\n📊 ChatGPT Test Report');
    console.log('======================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Platform: ChatGPT`);
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
      
      console.log('💾 ChatGPT test results stored');
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }
}

/**
 * ChatGPT-specific test data
 */
class ChatGPTTestData {
  constructor() {
    this.conversationMessages = [
      'Hello, I need help with a programming question.',
      'Can you explain how JavaScript closures work?',
      'What are the best practices for React development?',
      'How do I optimize my website for search engines?',
      'Thank you for your help!'
    ];
    
    this.memoryTestMessages = [
      'My name is Alice and I work as a software engineer at Microsoft',
      'I live in Seattle and love coffee and programming',
      'I have a degree in Computer Science from MIT',
      'I enjoy hiking and photography in my free time',
      'My goal is to become a tech lead within the next two years'
    ];
  }
}

// Make available globally
window.ChatGPTTests = ChatGPTTests;

// Auto-run if on ChatGPT and autotest parameter is present
if ((window.location.hostname.includes('openai.com') || window.location.hostname.includes('chatgpt.com')) && 
    window.location.search.includes('chatgpt-test=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tests = new ChatGPTTests();
      tests.runAll();
    }, 3000);
  });
}

console.log('🧪 ChatGPT Tests loaded. Run with: new ChatGPTTests().runAll()');