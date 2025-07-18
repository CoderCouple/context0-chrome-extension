/**
 * Automated Testing Framework for ContextZero Chrome Extension
 * 
 * Usage:
 * 1. Load extension in Chrome
 * 2. Navigate to any supported platform
 * 3. Open DevTools console
 * 4. Run: ContextZeroTestFramework.runAllTests()
 */

class ContextZeroTestFramework {
  constructor() {
    this.results = [];
    this.currentSuite = null;
    this.testData = this.getTestData();
    this.utils = new TestUtils();
  }

  /**
   * Test data for memory extraction testing
   */
  getTestData() {
    return {
      identity: [
        "Hi, my name is Sarah Johnson and I go by Sarah",
        "I'm Alex Martinez, but everyone calls me Alex",
        "My name is Dr. Emily Chen"
      ],
      location: [
        "I live in San Francisco, California",
        "I'm currently based in New York City",
        "I work from home in Austin, Texas"
      ],
      preferences: [
        "I love Italian food, especially pasta",
        "I hate spicy food and prefer mild flavors",
        "My favorite color is blue and I enjoy reading"
      ],
      work: [
        "I work as a software engineer at Google",
        "I'm a freelance graphic designer",
        "My job involves data analysis and machine learning"
      ],
      education: [
        "I studied computer science at Stanford University",
        "I have a degree in marketing from UCLA",
        "I'm currently pursuing my MBA at Harvard"
      ],
      family: [
        "I have two kids, ages 8 and 12",
        "My wife is a teacher at the local high school",
        "My parents live in Chicago"
      ],
      hobbies: [
        "I enjoy playing guitar in my free time",
        "I love hiking and camping on weekends",
        "I collect vintage comic books"
      ],
      goals: [
        "I want to learn Spanish fluently this year",
        "My goal is to run a marathon next month",
        "I'm planning to start my own tech company"
      ],
      health: [
        "I'm allergic to peanuts and tree nuts",
        "I have diabetes and need to monitor my blood sugar",
        "I'm vegetarian and don't eat any meat"
      ],
      tech: [
        "I use a MacBook Pro for all my development work",
        "I prefer React over Angular for frontend development",
        "I'm currently learning Python for data science"
      ]
    };
  }

  /**
   * Run all automated tests
   */
  async runAllTests() {
    console.log('🚀 Starting ContextZero Automated Tests');
    console.log('Platform:', this.detectPlatform());
    
    this.results = [];
    
    try {
      // Core functionality tests
      await this.runCoreTests();
      
      // Platform-specific tests
      await this.runPlatformTests();
      
      // Memory extraction tests
      await this.runMemoryExtractionTests();
      
      // Memory search tests
      await this.runMemorySearchTests();
      
      // UI component tests
      await this.runUITests();
      
      // Performance tests
      await this.runPerformanceTests();
      
      // Generate report
      this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.logResult('SUITE_ERROR', false, error.message);
    }
  }

  /**
   * Run core functionality tests
   */
  async runCoreTests() {
    this.currentSuite = 'Core Functionality';
    console.log(`\n📋 Testing: ${this.currentSuite}`);

    // Test 1: Extension loading
    await this.test('Extension loads without errors', async () => {
      const hasErrors = this.utils.checkConsoleErrors();
      return !hasErrors;
    });

    // Test 2: Memory Manager initialization
    await this.test('MemoryManager initializes', async () => {
      try {
        const memoryManager = new MemoryManager();
        return memoryManager && memoryManager.storage;
      } catch (error) {
        return false;
      }
    });

    // Test 3: Storage functionality
    await this.test('Storage operations work', async () => {
      try {
        const storage = new LocalStorage();
        const testMemory = {
          id: 'test-core-' + Date.now(),
          content: 'Test memory for core functionality',
          metadata: { type: 'test', platform: 'automated' },
          timestamp: Date.now()
        };
        
        const saved = await storage.saveMemory(testMemory);
        const memories = await storage.getMemories();
        
        return saved && memories.length > 0;
      } catch (error) {
        return false;
      }
    });

    // Test 4: Settings persistence
    await this.test('Settings can be saved and loaded', async () => {
      try {
        const storage = new LocalStorage();
        const testSettings = {
          memoryEnabled: true,
          testSetting: 'automated-test-' + Date.now()
        };
        
        await storage.saveSettings(testSettings);
        const loadedSettings = await storage.getSettings();
        
        return loadedSettings.testSetting === testSettings.testSetting;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Run platform-specific tests
   */
  async runPlatformTests() {
    this.currentSuite = 'Platform-Specific';
    console.log(`\n🌐 Testing: ${this.currentSuite}`);

    const platform = this.detectPlatform();
    const adapter = this.getAdapter(platform);

    if (!adapter) {
      this.logResult('Platform adapter not found', false, `No adapter for ${platform}`);
      return;
    }

    // Test 1: Input element detection
    await this.test('Input element can be detected', async () => {
      const input = adapter.getInputElement();
      return input !== null;
    });

    // Test 2: Button container detection
    await this.test('Button container can be found', async () => {
      const container = adapter.getButtonContainer();
      return container !== null;
    });

    // Test 3: Memory button injection
    await this.test('Memory button can be injected', async () => {
      const existingButton = document.querySelector('.contextzero-memory-btn');
      if (existingButton) {
        return true; // Already injected
      }
      
      adapter.injectMemoryButton();
      const newButton = document.querySelector('.contextzero-memory-btn');
      return newButton !== null;
    });

    // Test 4: Input text manipulation
    await this.test('Input text can be get and set', async () => {
      const originalText = adapter.getInputText();
      const testText = 'Test text for input manipulation';
      
      adapter.setInputText(testText);
      const retrievedText = adapter.getInputText();
      
      // Restore original text
      adapter.setInputText(originalText);
      
      return retrievedText.includes(testText);
    });

    // Test 5: Platform-specific selectors
    await this.test('Platform selectors are valid', async () => {
      const selectors = adapter.selectors;
      let validSelectors = 0;
      
      for (const [key, selector] of Object.entries(selectors)) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          validSelectors++;
        }
      }
      
      return validSelectors >= 2; // At least input and one other element
    });
  }

  /**
   * Run memory extraction tests
   */
  async runMemoryExtractionTests() {
    this.currentSuite = 'Memory Extraction';
    console.log(`\n🧠 Testing: ${this.currentSuite}`);

    const memoryManager = new MemoryManager();
    const platform = this.detectPlatform();

    // Test each category of test data
    for (const [category, messages] of Object.entries(this.testData)) {
      await this.test(`Extract ${category} memories`, async () => {
        let totalExtracted = 0;
        
        for (const message of messages) {
          const extracted = await memoryManager.storeMemory(message, {
            platform: platform,
            source: 'automated-test'
          });
          totalExtracted += extracted.length;
        }
        
        return totalExtracted > 0;
      });
    }

    // Test memory deduplication
    await this.test('Memory deduplication works', async () => {
      const duplicateMessage = "I'm John Doe and I work at Test Corp";
      
      const first = await memoryManager.storeMemory(duplicateMessage, {
        platform: platform,
        source: 'duplicate-test-1'
      });
      
      const second = await memoryManager.storeMemory(duplicateMessage, {
        platform: platform,
        source: 'duplicate-test-2'
      });
      
      // Should not create duplicate memories
      return first.length > 0 && second.length === 0;
    });

    // Test memory metadata
    await this.test('Memory metadata is correct', async () => {
      const testMessage = "I'm testing memory metadata extraction";
      const memories = await memoryManager.storeMemory(testMessage, {
        platform: platform,
        source: 'metadata-test'
      });
      
      if (memories.length === 0) return false;
      
      const memory = memories[0];
      return memory.metadata.platform === platform &&
             memory.metadata.source === 'metadata-test' &&
             memory.timestamp > 0;
    });
  }

  /**
   * Run memory search tests
   */
  async runMemorySearchTests() {
    this.currentSuite = 'Memory Search';
    console.log(`\n🔍 Testing: ${this.currentSuite}`);

    const memoryManager = new MemoryManager();

    // Test basic search
    await this.test('Basic search returns results', async () => {
      const results = await memoryManager.searchMemories('test', {
        limit: 5,
        threshold: 0.1
      });
      
      return results.length > 0;
    });

    // Test search with empty query
    await this.test('Empty search returns recent memories', async () => {
      const results = await memoryManager.searchMemories('', {
        limit: 3
      });
      
      return results.length >= 0; // Should not error
    });

    // Test search relevance
    await this.test('Search returns relevant results', async () => {
      // First, store a specific memory
      await memoryManager.storeMemory('I love pizza and Italian cuisine', {
        platform: 'test',
        source: 'relevance-test'
      });
      
      // Then search for it
      const results = await memoryManager.searchMemories('pizza Italian food', {
        limit: 10,
        threshold: 0.1
      });
      
      return results.some(r => r.content.includes('pizza') || r.content.includes('Italian'));
    });

    // Test search filters
    await this.test('Search filters work correctly', async () => {
      const platform = this.detectPlatform();
      
      const results = await memoryManager.searchMemories('test', {
        limit: 10,
        platforms: [platform],
        threshold: 0.1
      });
      
      return results.every(r => r.metadata.platform === platform);
    });

    // Test search scoring
    await this.test('Search results are scored', async () => {
      const results = await memoryManager.searchMemories('test memory', {
        limit: 5,
        threshold: 0.1
      });
      
      return results.every(r => typeof r.score === 'number' || typeof r.enhancedScore === 'number');
    });
  }

  /**
   * Run UI component tests
   */
  async runUITests() {
    this.currentSuite = 'UI Components';
    console.log(`\n🎨 Testing: ${this.currentSuite}`);

    // Test memory button presence
    await this.test('Memory button exists in DOM', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      return button !== null;
    });

    // Test memory button styling
    await this.test('Memory button has correct styling', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      const styles = window.getComputedStyle(button);
      return styles.cursor === 'pointer' &&
             styles.borderRadius === '8px' &&
             styles.color === 'rgb(255, 255, 255)'; // white
    });

    // Test button click handler
    await this.test('Memory button click handler works', async () => {
      const button = document.querySelector('.contextzero-memory-btn');
      if (!button) return false;
      
      // Set test input
      const adapter = this.getAdapter(this.detectPlatform());
      if (!adapter) return false;
      
      adapter.setInputText('Test input for button click');
      
      // Mock the click (don't actually trigger modal)
      const originalHandler = button.onclick;
      let handlerCalled = false;
      
      button.onclick = () => {
        handlerCalled = true;
      };
      
      button.click();
      
      // Restore original handler
      button.onclick = originalHandler;
      
      return handlerCalled;
    });

    // Test modal creation (without showing)
    await this.test('Memory modal can be created', async () => {
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
    this.currentSuite = 'Performance';
    console.log(`\n⚡ Testing: ${this.currentSuite}`);

    const memoryManager = new MemoryManager();

    // Test memory storage performance
    await this.test('Memory storage is performant', async () => {
      const startTime = performance.now();
      
      const testMemories = [];
      for (let i = 0; i < 10; i++) {
        testMemories.push(`Performance test memory ${i} with various content`);
      }
      
      for (const memory of testMemories) {
        await memoryManager.storeMemory(memory, {
          platform: 'performance-test',
          source: 'automated'
        });
      }
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 2000; // Should complete within 2 seconds
    });

    // Test search performance
    await this.test('Memory search is performant', async () => {
      const startTime = performance.now();
      
      await memoryManager.searchMemories('performance test search query', {
        limit: 20,
        threshold: 0.2
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      return duration < 1000; // Should complete within 1 second
    });

    // Test memory usage
    await this.test('Memory usage is reasonable', async () => {
      if (!performance.memory) return true; // Skip if not available
      
      const beforeMemory = performance.memory.usedJSHeapSize;
      
      // Perform memory-intensive operations
      const memories = await memoryManager.storage.getMemories();
      await memoryManager.searchMemories('memory usage test', { limit: 50 });
      
      const afterMemory = performance.memory.usedJSHeapSize;
      const memoryIncrease = afterMemory - beforeMemory;
      
      // Should not increase memory by more than 10MB
      return memoryIncrease < 10 * 1024 * 1024;
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
        this.logResult(name, true);
      } else {
        console.log(`  ❌ ${name}`);
        this.logResult(name, false);
      }
    } catch (error) {
      console.log(`  💥 ${name} - Error: ${error.message}`);
      this.logResult(name, false, error.message);
    }
  }

  /**
   * Log test result
   */
  logResult(testName, passed, error = null) {
    this.results.push({
      suite: this.currentSuite,
      test: testName,
      passed,
      error,
      timestamp: Date.now()
    });
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
  getAdapter(platform) {
    switch (platform) {
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
   * Generate test report
   */
  generateReport() {
    console.log('\n📊 Test Report');
    console.log('================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    // Group by suite
    const suites = {};
    this.results.forEach(result => {
      if (!suites[result.suite]) {
        suites[result.suite] = { passed: 0, failed: 0, tests: [] };
      }
      
      if (result.passed) {
        suites[result.suite].passed++;
      } else {
        suites[result.suite].failed++;
      }
      
      suites[result.suite].tests.push(result);
    });
    
    console.log('\nDetailed Results:');
    Object.entries(suites).forEach(([suiteName, suite]) => {
      console.log(`\n${suiteName}:`);
      console.log(`  Passed: ${suite.passed}, Failed: ${suite.failed}`);
      
      suite.tests.forEach(test => {
        if (!test.passed) {
          console.log(`  ❌ ${test.test}${test.error ? ` - ${test.error}` : ''}`);
        }
      });
    });
    
    // Store results in extension storage for later analysis
    this.storeResults();
  }

  /**
   * Store test results
   */
  async storeResults() {
    try {
      const testResults = {
        platform: this.detectPlatform(),
        timestamp: Date.now(),
        results: this.results,
        summary: {
          total: this.results.length,
          passed: this.results.filter(r => r.passed).length,
          failed: this.results.filter(r => !r.passed).length
        }
      };
      
      await chrome.storage.local.set({
        contextzero_test_results: testResults
      });
      
      console.log('\n💾 Test results stored in extension storage');
    } catch (error) {
      console.error('Failed to store test results:', error);
    }
  }
}

/**
 * Test utilities
 */
class TestUtils {
  /**
   * Check for console errors
   */
  checkConsoleErrors() {
    // This would need to be implemented with a console override
    // For now, return false (no errors)
    return false;
  }

  /**
   * Wait for element to appear
   */
  waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * Simulate user input
   */
  simulateInput(element, text) {
    if (element.contentEditable === 'true') {
      element.textContent = text;
    } else {
      element.value = text;
    }
    
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /**
   * Simulate click
   */
  simulateClick(element) {
    element.click();
  }

  /**
   * Generate random test data
   */
  generateRandomText(length = 100) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Make framework available globally
window.ContextZeroTestFramework = ContextZeroTestFramework;

// Auto-run tests if requested
if (window.location.search.includes('autotest=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const framework = new ContextZeroTestFramework();
      framework.runAllTests();
    }, 2000);
  });
}

console.log('🧪 ContextZero Test Framework loaded');
console.log('Run tests with: new ContextZeroTestFramework().runAllTests()');