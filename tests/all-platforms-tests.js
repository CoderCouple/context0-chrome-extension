/**
 * Comprehensive Automated Tests for All Platforms
 * 
 * Usage:
 * 1. Navigate to any supported platform
 * 2. Load extension
 * 3. Open DevTools console
 * 4. Run: AllPlatformsTests.runForCurrentPlatform()
 */

class AllPlatformsTests {
  constructor() {
    this.results = [];
    this.currentPlatform = this.detectPlatform();
    this.adapter = this.getAdapter();
    this.config = this.getPlatformConfig();
  }

  /**
   * Run tests for current platform
   */
  async runForCurrentPlatform() {
    console.log(`🚀 Running tests for ${this.currentPlatform}...`);
    
    if (!this.adapter) {
      console.error(`❌ ${this.currentPlatform} adapter not found`);
      return;
    }

    if (!this.config) {
      console.error(`❌ ${this.currentPlatform} configuration not found`);
      return;
    }

    try {
      await this.runBasicTests();
      await this.runPlatformSpecificTests();
      await this.runMemoryTests();
      await this.runUITests();
      await this.runPerformanceTests();
      
      this.generateReport();
    } catch (error) {
      console.error(`❌ ${this.currentPlatform} test suite failed:`, error);
    }
  }

  /**
   * Run basic functionality tests
   */
  async runBasicTests() {
    console.log('\n📋 Testing Basic Functionality');
    
    // Test input element detection
    await this.test('Input element detection', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      const expectedType = this.config.inputType;
      if (expectedType === 'textarea') {
        return input.tagName.toLowerCase() === 'textarea';
      } else if (expectedType === 'contenteditable') {
        return input.contentEditable === 'true';
      }
      
      return true;
    });

    // Test send button detection
    await this.test('Send button detection', () => {
      const sendButton = document.querySelector(this.adapter.selectors.sendButton);
      return sendButton !== null;
    });

    // Test input text operations
    await this.test('Input text get/set operations', () => {
      const originalText = this.adapter.getInputText();
      const testText = `Test input for ${this.currentPlatform}`;
      
      this.adapter.setInputText(testText);
      const retrievedText = this.adapter.getInputText();
      
      // Restore original text
      this.adapter.setInputText(originalText);
      
      return retrievedText === testText;
    });

    // Test button container detection
    await this.test('Button container detection', () => {
      const container = this.adapter.getButtonContainer();
      return container !== null;
    });

    // Test memory button injection
    await this.test('Memory button injection', () => {
      const existingButton = document.querySelector('.contextzero-memory-btn');
      if (existingButton) {
        existingButton.remove();
      }
      
      this.adapter.injectMemoryButton();
      
      const newButton = document.querySelector('.contextzero-memory-btn');
      return newButton && newButton.innerHTML === '🧠';
    });
  }

  /**
   * Run platform-specific tests
   */
  async runPlatformSpecificTests() {
    console.log('\n🌐 Testing Platform-Specific Features');
    
    // Test platform-specific styling
    await this.test('Platform-specific button styling', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      const expectedColor = this.config.buttonColor;
      
      return styles.backgroundColor === expectedColor;
    });

    // Test platform-specific selectors
    await this.test('Platform selectors validity', () => {
      const selectors = this.adapter.selectors;
      let validSelectors = 0;
      
      for (const [key, selector] of Object.entries(selectors)) {
        try {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            validSelectors++;
          }
        } catch (error) {
          console.warn(`Invalid selector ${key}: ${selector}`);
        }
      }
      
      return validSelectors >= 2; // At least input and one other element
    });

    // Test message capture setup
    await this.test('Message capture setup', () => {
      return typeof this.adapter.captureUserMessage === 'function' &&
             typeof this.adapter.setupMessageCapture === 'function';
    });

    // Test conversation processing setup
    await this.test('Conversation processing setup', () => {
      return typeof this.adapter.processConversationMessages === 'function' &&
             typeof this.adapter.setupAutoMemoryExtraction === 'function';
    });
  }

  /**
   * Run memory-related tests
   */
  async runMemoryTests() {
    console.log('\n🧠 Testing Memory Functionality');
    
    // Test memory extraction
    await this.test('Memory extraction', async () => {
      const testMessage = `My name is TestUser and I work at ${this.currentPlatform.toUpperCase()} Corp`;
      const memoryManager = new MemoryManager();
      
      const memories = await memoryManager.storeMemory(testMessage, {
        platform: this.currentPlatform,
        source: 'automated-test'
      });
      
      return memories.length > 0;
    });

    // Test memory search
    await this.test('Memory search', async () => {
      const memoryManager = new MemoryManager();
      const results = await memoryManager.searchMemories('test', {
        limit: 5,
        threshold: 0.1
      });
      
      return results.length >= 0; // Should not error
    });

    // Test memory formatting
    await this.test('Memory formatting for injection', () => {
      const memoryManager = new MemoryManager();
      const testMemories = [{
        id: 'test-format',
        content: 'Test memory content',
        metadata: { type: 'test' },
        timestamp: Date.now()
      }];
      
      const formatted = memoryManager.formatMemoriesForInjection(testMemories);
      
      return formatted.includes('Test memory content');
    });

    // Test memory button click handling
    await this.test('Memory button click handling', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      this.adapter.setInputText('Test input for button click');
      
      // Mock the handler to avoid modal
      let handlerCalled = false;
      const originalHandler = this.adapter.handleMemoryButtonClick;
      this.adapter.handleMemoryButtonClick = async () => {
        handlerCalled = true;
      };
      
      button.click();
      
      // Restore original handler
      this.adapter.handleMemoryButtonClick = originalHandler;
      
      return handlerCalled;
    });
  }

  /**
   * Run UI tests
   */
  async runUITests() {
    console.log('\n🎨 Testing UI Components');
    
    // Test button styling
    await this.test('Button styling', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      return styles.borderRadius === '8px' &&
             styles.cursor === 'pointer' &&
             styles.color === 'rgb(255, 255, 255)';
    });

    // Test button hover effects
    await this.test('Button hover effects', () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const originalColor = window.getComputedStyle(button).backgroundColor;
      
      // Simulate hover
      button.dispatchEvent(new MouseEvent('mouseenter'));
      const hoverColor = window.getComputedStyle(button).backgroundColor;
      
      // Simulate leave
      button.dispatchEvent(new MouseEvent('mouseleave'));
      const leaveColor = window.getComputedStyle(button).backgroundColor;
      
      return hoverColor !== originalColor && leaveColor === originalColor;
    });

    // Test input focus
    await this.test('Input focus functionality', () => {
      const input = this.adapter.getInputElement();
      if (!input) return false;
      
      input.focus();
      return document.activeElement === input;
    });

    // Test modal creation capability
    await this.test('Modal creation capability', () => {
      try {
        const testMemories = [{
          id: 'test-modal',
          content: 'Test memory for modal',
          metadata: { type: 'test' },
          timestamp: Date.now()
        }];
        
        const modal = new MemoryModal(testMemories, {
          onSelect: () => {},
          onClose: () => {}
        });
        
        return modal !== null;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('\n⚡ Testing Performance');
    
    // Test input manipulation performance
    await this.test('Input manipulation performance', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 50; i++) {
        this.adapter.setInputText(`Performance test ${i}`);
        this.adapter.getInputText();
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 1000; // Should complete within 1 second
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
      
      return duration < 200; // Should complete within 200ms
    });

    // Test memory operations performance
    await this.test('Memory operations performance', async () => {
      const startTime = performance.now();
      const memoryManager = new MemoryManager();
      
      // Store some test memories
      for (let i = 0; i < 5; i++) {
        await memoryManager.storeMemory(`Performance test memory ${i}`, {
          platform: this.currentPlatform,
          source: 'performance-test'
        });
      }
      
      // Search memories
      await memoryManager.searchMemories('performance', { limit: 10 });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 2000; // Should complete within 2 seconds
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
   * Detect current platform
   */
  detectPlatform() {
    const hostname = window.location.hostname;
    
    if (hostname.includes('openai.com') || hostname.includes('chatgpt.com')) {
      return 'chatgpt';
    } else if (hostname.includes('claude.ai')) {
      return 'claude';
    } else if (hostname.includes('perplexity.ai')) {
      return 'perplexity';
    } else if (hostname.includes('x.ai')) {
      return 'grok';
    } else if (hostname.includes('gemini.google.com') || hostname.includes('bard.google.com')) {
      return 'gemini';
    } else if (hostname.includes('deepseek.com')) {
      return 'deepseek';
    }
    
    return 'unknown';
  }

  /**
   * Get platform adapter
   */
  getAdapter() {
    switch (this.currentPlatform) {
      case 'chatgpt':
        return window.contextZeroChatGPT;
      case 'claude':
        return window.contextZeroClaude;
      case 'perplexity':
        return window.contextZeroPerplexity;
      case 'grok':
        return window.contextZeroGrok;
      case 'gemini':
        return window.contextZeroGemini;
      case 'deepseek':
        return window.contextZeroDeepSeek;
      default:
        return null;
    }
  }

  /**
   * Get platform configuration
   */
  getPlatformConfig() {
    const configs = {
      chatgpt: {
        inputType: 'textarea',
        buttonColor: 'rgb(16, 163, 127)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      },
      claude: {
        inputType: 'contenteditable',
        buttonColor: 'rgb(205, 127, 50)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      },
      perplexity: {
        inputType: 'textarea',
        buttonColor: 'rgb(32, 128, 141)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      },
      grok: {
        inputType: 'textarea',
        buttonColor: 'rgb(29, 155, 240)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      },
      gemini: {
        inputType: 'mixed', // Can be either
        buttonColor: 'rgb(66, 133, 244)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      },
      deepseek: {
        inputType: 'mixed', // Can be either
        buttonColor: 'rgb(108, 92, 231)',
        expectedSelectors: ['input', 'sendButton', 'messageContainer']
      }
    };
    
    return configs[this.currentPlatform] || null;
  }

  /**
   * Generate test report
   */
  generateReport() {
    console.log(`\n📊 ${this.currentPlatform.toUpperCase()} Test Report`);
    console.log('='.repeat(30));
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Platform: ${this.currentPlatform}`);
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
        platform: this.currentPlatform,
        timestamp: Date.now(),
        results: this.results,
        summary: {
          total: this.results.length,
          passed: this.results.filter(r => r.passed).length,
          failed: this.results.filter(r => !r.passed).length
        }
      };
      
      await chrome.storage.local.set({
        [`contextzero_test_results_${this.currentPlatform}`]: testResults
      });
      
      console.log(`💾 ${this.currentPlatform} test results stored`);
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }

  /**
   * Run tests for all platforms (if testing framework is loaded on multiple tabs)
   */
  static async runAllPlatforms() {
    const platforms = ['chatgpt', 'claude', 'perplexity', 'grok', 'gemini', 'deepseek'];
    const results = {};
    
    for (const platform of platforms) {
      try {
        console.log(`\n🌐 Testing ${platform}...`);
        
        // This would require the test to be run on each platform
        // For now, just record that the test should be run
        results[platform] = {
          status: 'pending',
          message: `Navigate to ${platform} and run: new AllPlatformsTests().runForCurrentPlatform()`
        };
        
      } catch (error) {
        results[platform] = {
          status: 'error',
          error: error.message
        };
      }
    }
    
    console.log('\n📋 All Platform Test Status:');
    console.log(results);
    
    return results;
  }
}

/**
 * Test data generator for all platforms
 */
class UniversalTestData {
  static getMemoryTestData() {
    return {
      identity: [
        "Hi, my name is Alex Johnson and I go by Alex",
        "I'm Sarah Williams, but everyone calls me Sarah",
        "My name is Dr. Michael Chen"
      ],
      location: [
        "I live in San Francisco, California",
        "I'm currently based in New York City",
        "I work from home in Austin, Texas"
      ],
      work: [
        "I work as a software engineer at Google",
        "I'm a freelance graphic designer",
        "My job involves data analysis and AI research"
      ],
      preferences: [
        "I love Italian food and craft beer",
        "I hate spicy food and prefer mild flavors",
        "My favorite programming language is Python"
      ],
      hobbies: [
        "I enjoy rock climbing and hiking",
        "I love photography and travel",
        "I collect vintage vinyl records"
      ]
    };
  }

  static getSearchQueries() {
    return [
      "What's my name?",
      "Where do I live?",
      "What do I do for work?",
      "What are my hobbies?",
      "What food do I like?",
      "Tell me about my preferences"
    ];
  }
}

// Make available globally
window.AllPlatformsTests = AllPlatformsTests;
window.UniversalTestData = UniversalTestData;

// Auto-run based on URL parameters
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('autotest') === 'true') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const tests = new AllPlatformsTests();
      tests.runForCurrentPlatform();
    }, 3000);
  });
}

console.log(`🧪 All Platforms Tests loaded for ${new AllPlatformsTests().currentPlatform}`);
console.log('Run with: new AllPlatformsTests().runForCurrentPlatform()');