/**
 * ContextZero Test Runner
 * Orchestrates and runs all automated tests
 * 
 * Usage:
 * 1. Load extension
 * 2. Navigate to any supported platform
 * 3. Open DevTools console
 * 4. Run: TestRunner.runAll()
 */

class TestRunner {
  constructor() {
    this.testResults = {};
    this.currentPlatform = this.detectPlatform();
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Run all available tests for current platform
   */
  async runAll() {
    console.log('🚀 ContextZero Test Runner - Starting Comprehensive Tests');
    console.log('=========================================================');
    
    this.startTime = Date.now();
    
    try {
      // 1. Run core framework tests
      await this.runFrameworkTests();
      
      // 2. Run platform-specific tests
      await this.runPlatformTests();
      
      // 3. Run integration tests
      await this.runIntegrationTests();
      
      // 4. Run performance tests
      await this.runPerformanceTests();
      
      // 5. Run memory stress tests
      await this.runStressTests();
      
      this.endTime = Date.now();
      
      // Generate comprehensive report
      this.generateComprehensiveReport();
      
      // Store all results
      await this.storeAllResults();
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      this.testResults.error = error.message;
    }
  }

  /**
   * Run framework tests
   */
  async runFrameworkTests() {
    console.log('\n📚 Running Framework Tests...');
    
    try {
      const framework = new ContextZeroTestFramework();
      await framework.runAllTests();
      
      this.testResults.framework = {
        results: framework.results,
        summary: this.summarizeResults(framework.results)
      };
      
      console.log('✅ Framework tests completed');
    } catch (error) {
      console.error('❌ Framework tests failed:', error);
      this.testResults.framework = { error: error.message };
    }
  }

  /**
   * Run platform-specific tests
   */
  async runPlatformTests() {
    console.log('\n🌐 Running Platform-Specific Tests...');
    
    try {
      const platformTests = new AllPlatformsTests();
      await platformTests.runForCurrentPlatform();
      
      this.testResults.platform = {
        platform: this.currentPlatform,
        results: platformTests.results,
        summary: this.summarizeResults(platformTests.results)
      };
      
      // Also run specialized tests if available
      if (this.currentPlatform === 'chatgpt' && window.ChatGPTTests) {
        const chatgptTests = new ChatGPTTests();
        await chatgptTests.runAll();
        this.testResults.chatgpt_specific = {
          results: chatgptTests.results,
          summary: this.summarizeResults(chatgptTests.results)
        };
      }
      
      if (this.currentPlatform === 'claude' && window.ClaudeTests) {
        const claudeTests = new ClaudeTests();
        await claudeTests.runAll();
        this.testResults.claude_specific = {
          results: claudeTests.results,
          summary: this.summarizeResults(claudeTests.results)
        };
      }
      
      console.log('✅ Platform-specific tests completed');
    } catch (error) {
      console.error('❌ Platform tests failed:', error);
      this.testResults.platform = { error: error.message };
    }
  }

  /**
   * Run integration tests
   */
  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    try {
      const integrationResults = [];
      
      // Test 1: End-to-end memory workflow
      await this.test('End-to-end memory workflow', async () => {
        const memoryManager = new MemoryManager();
        
        // Store a memory
        const testMemory = 'Integration test: I am a test user working on automated testing';
        const stored = await memoryManager.storeMemory(testMemory, {
          platform: this.currentPlatform,
          source: 'integration-test'
        });
        
        // Search for it
        const found = await memoryManager.searchMemories('test user automated testing', {
          limit: 5,
          threshold: 0.1
        });
        
        // Format for injection
        const formatted = memoryManager.formatMemoriesForInjection(found);
        
        return stored.length > 0 && found.length > 0 && formatted.length > 0;
      }, integrationResults);
      
      // Test 2: UI interaction flow
      await this.test('UI interaction flow', async () => {
        const adapter = this.getAdapter();
        if (!adapter) return false;
        
        // Set input text
        const testText = 'UI integration test';
        adapter.setInputText(testText);
        
        // Get memory button
        const button = document.querySelector('.contextzero-memory-btn');
        if (!button) return false;
        
        // Simulate click (without triggering modal)
        let clickHandled = false;
        const originalHandler = adapter.handleMemoryButtonClick;
        adapter.handleMemoryButtonClick = async () => {
          clickHandled = true;
        };
        
        button.click();
        
        // Restore handler
        adapter.handleMemoryButtonClick = originalHandler;
        
        return clickHandled;
      }, integrationResults);
      
      // Test 3: Storage persistence
      await this.test('Storage persistence', async () => {
        const storage = new LocalStorage();
        
        // Save test data
        const testSettings = {
          integrationTest: true,
          timestamp: Date.now()
        };
        
        await storage.saveSettings(testSettings);
        
        // Retrieve and verify
        const retrieved = await storage.getSettings();
        
        return retrieved.integrationTest === true;
      }, integrationResults);
      
      // Test 4: Cross-component communication
      await this.test('Cross-component communication', async () => {
        // Test message passing between components
        return new Promise((resolve) => {
          chrome.runtime.sendMessage({ action: 'ping' }, (response) => {
            resolve(response && response.success);
          });
        });
      }, integrationResults);
      
      this.testResults.integration = {
        results: integrationResults,
        summary: this.summarizeResults(integrationResults)
      };
      
      console.log('✅ Integration tests completed');
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      this.testResults.integration = { error: error.message };
    }
  }

  /**
   * Run performance tests
   */
  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    try {
      const performanceResults = [];
      
      // Test 1: Memory storage performance
      await this.test('Memory storage performance', async () => {
        const memoryManager = new MemoryManager();
        const startTime = performance.now();
        
        const testMemories = [];
        for (let i = 0; i < 20; i++) {
          testMemories.push(`Performance test memory ${i} with detailed content for testing`);
        }
        
        for (const memory of testMemories) {
          await memoryManager.storeMemory(memory, {
            platform: this.currentPlatform,
            source: 'performance-test'
          });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Memory storage took ${duration.toFixed(2)}ms for 20 memories`);
        return duration < 3000; // Should complete within 3 seconds
      }, performanceResults);
      
      // Test 2: Search performance
      await this.test('Search performance', async () => {
        const memoryManager = new MemoryManager();
        const startTime = performance.now();
        
        // Perform multiple searches
        const searchQueries = ['test', 'performance', 'memory', 'user', 'work'];
        for (const query of searchQueries) {
          await memoryManager.searchMemories(query, {
            limit: 10,
            threshold: 0.2
          });
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Search performance took ${duration.toFixed(2)}ms for 5 searches`);
        return duration < 2000; // Should complete within 2 seconds
      }, performanceResults);
      
      // Test 3: DOM manipulation performance
      await this.test('DOM manipulation performance', async () => {
        const adapter = this.getAdapter();
        if (!adapter) return false;
        
        const startTime = performance.now();
        
        // Perform multiple DOM operations
        for (let i = 0; i < 100; i++) {
          adapter.getInputElement();
          adapter.getButtonContainer();
          adapter.setInputText(`Performance test ${i}`);
          adapter.getInputText();
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`DOM manipulation took ${duration.toFixed(2)}ms for 100 operations`);
        return duration < 1000; // Should complete within 1 second
      }, performanceResults);
      
      // Test 4: Memory usage
      await this.test('Memory usage reasonable', async () => {
        if (!performance.memory) return true; // Skip if not available
        
        const beforeMemory = performance.memory.usedJSHeapSize;
        
        // Perform memory-intensive operations
        const memoryManager = new MemoryManager();
        const memories = await memoryManager.storage.getMemories();
        
        for (let i = 0; i < 50; i++) {
          await memoryManager.searchMemories(`memory test ${i}`, { limit: 20 });
        }
        
        const afterMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = afterMemory - beforeMemory;
        
        console.log(`Memory usage increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        return memoryIncrease < 20 * 1024 * 1024; // Should not increase by more than 20MB
      }, performanceResults);
      
      this.testResults.performance = {
        results: performanceResults,
        summary: this.summarizeResults(performanceResults)
      };
      
      console.log('✅ Performance tests completed');
    } catch (error) {
      console.error('❌ Performance tests failed:', error);
      this.testResults.performance = { error: error.message };
    }
  }

  /**
   * Run stress tests
   */
  async runStressTests() {
    console.log('\n🔥 Running Stress Tests...');
    
    try {
      const stressResults = [];
      
      // Test 1: Large memory dataset
      await this.test('Large memory dataset handling', async () => {
        const memoryManager = new MemoryManager();
        
        // Generate large amount of test data
        const testData = [];
        for (let i = 0; i < 100; i++) {
          testData.push(`Stress test memory ${i}: ${this.generateRandomText(100)}`);
        }
        
        // Store all memories
        for (const data of testData) {
          await memoryManager.storeMemory(data, {
            platform: this.currentPlatform,
            source: 'stress-test'
          });
        }
        
        // Verify storage
        const allMemories = await memoryManager.storage.getMemories();
        const stressMemories = allMemories.filter(m => m.metadata.source === 'stress-test');
        
        return stressMemories.length >= 50; // Should store at least 50 memories
      }, stressResults);
      
      // Test 2: Rapid input changes
      await this.test('Rapid input changes', async () => {
        const adapter = this.getAdapter();
        if (!adapter) return false;
        
        const startTime = performance.now();
        
        // Rapidly change input text
        for (let i = 0; i < 200; i++) {
          adapter.setInputText(`Rapid change ${i}`);
          if (i % 50 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
        
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        return duration < 5000; // Should complete within 5 seconds
      }, stressResults);
      
      // Test 3: Concurrent operations
      await this.test('Concurrent operations', async () => {
        const memoryManager = new MemoryManager();
        
        // Run multiple operations concurrently
        const operations = [];
        
        // Storage operations
        for (let i = 0; i < 10; i++) {
          operations.push(
            memoryManager.storeMemory(`Concurrent test ${i}`, {
              platform: this.currentPlatform,
              source: 'concurrent-test'
            })
          );
        }
        
        // Search operations
        for (let i = 0; i < 5; i++) {
          operations.push(
            memoryManager.searchMemories(`concurrent search ${i}`, { limit: 5 })
          );
        }
        
        // Wait for all operations to complete
        const results = await Promise.all(operations);
        
        return results.every(result => result !== null && result !== undefined);
      }, stressResults);
      
      this.testResults.stress = {
        results: stressResults,
        summary: this.summarizeResults(stressResults)
      };
      
      console.log('✅ Stress tests completed');
    } catch (error) {
      console.error('❌ Stress tests failed:', error);
      this.testResults.stress = { error: error.message };
    }
  }

  /**
   * Test helper function
   */
  async test(name, testFunction, results) {
    try {
      console.log(`  🧪 ${name}...`);
      const result = await testFunction();
      
      if (result) {
        console.log(`  ✅ ${name}`);
        results.push({ name, passed: true });
      } else {
        console.log(`  ❌ ${name}`);
        results.push({ name, passed: false });
      }
    } catch (error) {
      console.log(`  💥 ${name} - Error: ${error.message}`);
      results.push({ name, passed: false, error: error.message });
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateComprehensiveReport() {
    const duration = this.endTime - this.startTime;
    
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(50));
    console.log(`Platform: ${this.currentPlatform}`);
    console.log(`Duration: ${(duration / 1000).toFixed(2)} seconds`);
    console.log(`Timestamp: ${new Date().toLocaleString()}`);
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    // Calculate totals
    Object.values(this.testResults).forEach(suite => {
      if (suite.summary) {
        totalTests += suite.summary.total;
        totalPassed += suite.summary.passed;
        totalFailed += suite.summary.failed;
      }
    });
    
    console.log(`\nOVERALL SUMMARY:`);
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ❌`);
    console.log(`Success Rate: ${totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0}%`);
    
    // Suite-by-suite breakdown
    console.log('\nSUITE BREAKDOWN:');
    Object.entries(this.testResults).forEach(([suiteName, suite]) => {
      if (suite.summary) {
        const successRate = suite.summary.total > 0 ? 
          ((suite.summary.passed / suite.summary.total) * 100).toFixed(1) : 0;
        console.log(`${suiteName}: ${suite.summary.passed}/${suite.summary.total} (${successRate}%)`);
      } else if (suite.error) {
        console.log(`${suiteName}: ERROR - ${suite.error}`);
      }
    });
    
    // Failed tests summary
    const allFailedTests = [];
    Object.values(this.testResults).forEach(suite => {
      if (suite.results) {
        const failed = suite.results.filter(r => !r.passed);
        allFailedTests.push(...failed);
      }
    });
    
    if (allFailedTests.length > 0) {
      console.log('\nFAILED TESTS:');
      allFailedTests.forEach(test => {
        console.log(`❌ ${test.name}${test.error ? ` - ${test.error}` : ''}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
  }

  /**
   * Store all test results
   */
  async storeAllResults() {
    try {
      const completeResults = {
        platform: this.currentPlatform,
        timestamp: Date.now(),
        duration: this.endTime - this.startTime,
        testResults: this.testResults,
        summary: this.generateSummary()
      };
      
      await chrome.storage.local.set({
        [`contextzero_complete_test_results_${this.currentPlatform}`]: completeResults
      });
      
      console.log('💾 Complete test results stored');
    } catch (error) {
      console.error('Failed to store complete results:', error);
    }
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.values(this.testResults).forEach(suite => {
      if (suite.summary) {
        totalTests += suite.summary.total;
        totalPassed += suite.summary.passed;
        totalFailed += suite.summary.failed;
      }
    });
    
    return {
      total: totalTests,
      passed: totalPassed,
      failed: totalFailed,
      successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0
    };
  }

  /**
   * Summarize test results
   */
  summarizeResults(results) {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    
    return { total, passed, failed };
  }

  /**
   * Get current platform adapter
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
   * Generate random text for testing
   */
  generateRandomText(length) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Get stored test results
   */
  static async getStoredResults(platform) {
    try {
      const result = await chrome.storage.local.get([`contextzero_complete_test_results_${platform}`]);
      return result[`contextzero_complete_test_results_${platform}`] || null;
    } catch (error) {
      console.error('Failed to get stored results:', error);
      return null;
    }
  }

  /**
   * Clear all test results
   */
  static async clearAllResults() {
    const platforms = ['chatgpt', 'claude', 'perplexity', 'grok', 'gemini', 'deepseek'];
    
    for (const platform of platforms) {
      try {
        await chrome.storage.local.remove([
          `contextzero_test_results_${platform}`,
          `contextzero_complete_test_results_${platform}`
        ]);
      } catch (error) {
        console.error(`Failed to clear results for ${platform}:`, error);
      }
    }
    
    console.log('🧹 All test results cleared');
  }
}

// Make available globally
window.TestRunner = TestRunner;

// Auto-run if requested
if (window.location.search.includes('run-all-tests=true')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const runner = new TestRunner();
      runner.runAll();
    }, 3000);
  });
}

console.log('🧪 Test Runner loaded');
console.log('Run comprehensive tests with: new TestRunner().runAll()');
console.log('View stored results with: TestRunner.getStoredResults("platform")');
console.log('Clear all results with: TestRunner.clearAllResults()');