# ContextZero Chrome Extension - Comprehensive Testing Guide

## Overview
This guide provides detailed testing procedures for the ContextZero Chrome extension across all supported platforms.

## Pre-Testing Setup

### 1. Extension Installation
```bash
# Load extension in Chrome
1. Open Chrome and go to chrome://extensions/
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked" and select the extension directory
4. Verify extension loads without errors
5. Check that the extension icon appears in the toolbar
```

### 2. Enable Debug Mode
```javascript
// In Chrome DevTools Console on any supported platform:
chrome.storage.local.get(['contextzero_settings'], (result) => {
  const settings = result.contextzero_settings || {};
  settings.debugMode = true;
  chrome.storage.local.set({ contextzero_settings: settings });
  console.log('Debug mode enabled');
});
```

### 3. Clear Test Data (if needed)
```javascript
// Clear all memories and reset for fresh testing
chrome.storage.local.clear(() => {
  console.log('Storage cleared for testing');
  location.reload();
});
```

## Testing Methodology

### Phase 1: Basic Functionality Testing

#### A. Extension Loading and Initialization
- [ ] Extension loads without console errors
- [ ] Background script initializes successfully
- [ ] Default settings are created on first install
- [ ] Icon appears in Chrome toolbar

#### B. Content Script Injection
For each platform (ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek):
- [ ] Content script loads on page load
- [ ] No console errors during injection
- [ ] Memory button appears in the interface
- [ ] Button has correct styling for the platform

### Phase 2: Memory Extraction Testing

#### Test Data Sets
Create test messages containing different fact types:

```javascript
// Test messages for memory extraction
const testMessages = [
  // Identity
  "Hi, my name is John Smith and I go by Johnny",
  "I'm Sarah, but everyone calls me Saz",
  
  // Location
  "I live in San Francisco, California",
  "I'm currently in New York for work",
  "I'm based in London, UK",
  
  // Preferences
  "I love pizza and Italian food",
  "I hate spicy food and can't eat dairy",
  "My favorite color is blue",
  
  // Work
  "I work as a software engineer at Google",
  "I'm a freelance graphic designer",
  "My job involves data analysis and reporting",
  
  // Education
  "I studied computer science at Stanford",
  "I have a degree in marketing from UCLA",
  "I'm currently studying for my MBA",
  
  // Family
  "I have two kids, ages 8 and 12",
  "My wife is a teacher",
  "My brother lives in Seattle",
  
  // Hobbies
  "I enjoy playing guitar in my free time",
  "I love hiking and outdoor activities",
  "I collect vintage vinyl records",
  
  // Goals
  "I want to learn Spanish this year",
  "My goal is to run a marathon",
  "I'm planning to start my own business",
  
  // Health
  "I'm allergic to peanuts",
  "I have diabetes and need to watch my sugar intake",
  "I'm vegetarian and don't eat meat",
  
  // Tech
  "I use a MacBook Pro for development",
  "I prefer React over Vue.js",
  "I'm learning Python for data science"
];
```

#### Memory Extraction Process
For each platform:
1. **Input Test Messages**
   - [ ] Enter test message in platform's input field
   - [ ] Send message (click send button or press Enter)
   - [ ] Check console for extraction logs
   - [ ] Verify facts are extracted correctly

2. **Verify Storage**
   ```javascript
   // Check stored memories
   chrome.storage.local.get(['contextzero_memories'], (result) => {
     const memories = result.contextzero_memories || [];
     console.log('Stored memories:', memories);
     
     // Verify each memory has required fields
     memories.forEach(memory => {
       console.log('Memory:', {
         id: memory.id,
         content: memory.content,
         type: memory.metadata.type,
         category: memory.metadata.category,
         confidence: memory.metadata.confidence,
         platform: memory.metadata.platform,
         timestamp: memory.timestamp
       });
     });
   });
   ```

### Phase 3: Memory Search and Injection Testing

#### A. Memory Button Functionality
For each platform:
- [ ] Memory button (🧠) appears in interface
- [ ] Button has correct positioning and styling
- [ ] Hover effects work correctly
- [ ] Click handler executes without errors

#### B. Memory Search Testing
1. **Search with relevant queries**
   ```javascript
   // Test queries that should find memories
   const testQueries = [
     "What's my name?",
     "Where do I live?",
     "What food do I like?",
     "What's my job?",
     "What are my hobbies?",
     "Tell me about my goals",
     "What are my dietary restrictions?",
     "What technology do I use?"
   ];
   ```

2. **Test Search Process**
   - [ ] Enter test query in input field
   - [ ] Click memory button
   - [ ] Verify loading state (⏳) appears
   - [ ] Check that relevant memories are found
   - [ ] Verify modal opens with memory selection

#### C. Memory Injection Testing
- [ ] Select memories from modal
- [ ] Click "Inject Selected" button
- [ ] Verify memories are appended to input
- [ ] Check formatting is correct
- [ ] Verify cursor position is at end

### Phase 4: UI Component Testing

#### A. Memory Selection Modal
- [ ] Modal opens when memories are found
- [ ] Memory items display correctly
- [ ] Checkboxes work for selection
- [ ] Category grouping works (if enabled)
- [ ] Close button works
- [ ] Click outside modal closes it

#### B. Memory Panel (Extension Icon)
- [ ] Click extension icon on supported platforms
- [ ] Panel opens showing memory statistics
- [ ] Recent memories display correctly
- [ ] Settings toggles work
- [ ] Export/import functionality works
- [ ] Clear memories function works

#### C. Context Menu Integration
- [ ] Right-click selected text shows context menu
- [ ] "Add to ContextZero memories" option works
- [ ] "Search ContextZero memories" option works
- [ ] Manual memory addition works correctly

### Phase 5: Cross-Platform Testing

#### Platform-Specific Testing Checklist

**ChatGPT (chatgpt.com, chat.openai.com)**
- [ ] Memory button appears next to send button
- [ ] Text extraction works with textarea input
- [ ] Message capture works on send button click
- [ ] Message capture works on Enter key press
- [ ] Auto-extraction from conversation works
- [ ] Page navigation doesn't break functionality

**Claude (claude.ai)**
- [ ] Memory button appears in input container
- [ ] Text extraction works with contenteditable div
- [ ] Focus and cursor positioning works correctly
- [ ] Message capture works with Claude's interface
- [ ] Auto-extraction from conversation works

**Perplexity (perplexity.ai)**
- [ ] Memory button appears in search interface
- [ ] Text extraction works with textarea
- [ ] Question-based memory extraction works
- [ ] Search results don't interfere with memory capture

**Grok (x.ai)**
- [ ] Memory button appears in chat interface
- [ ] Text extraction works with platform's input
- [ ] Twitter-style interface compatibility
- [ ] Message threading doesn't break functionality

**Gemini (gemini.google.com, bard.google.com, ai.google.dev)**
- [ ] Memory button works across all Gemini domains
- [ ] Handles both contenteditable and textarea inputs
- [ ] Google's interface changes don't break functionality
- [ ] Multi-turn conversations work correctly

**DeepSeek (deepseek.com, chat.deepseek.com)**
- [ ] Memory button appears in chat interface
- [ ] Flexible input handling works
- [ ] Platform-specific styling is correct
- [ ] Message capture works reliably

### Phase 6: Data Integrity Testing

#### A. Memory Storage Testing
```javascript
// Test memory storage limits and cleanup
const testStorageLimit = async () => {
  const storage = new LocalStorage();
  const memories = await storage.getMemories();
  
  console.log('Current memory count:', memories.length);
  console.log('Storage limit:', storage.maxMemories);
  
  // Test duplicate prevention
  const testMemory = {
    id: 'test-duplicate',
    content: 'Test duplicate content',
    metadata: { type: 'identity', platform: 'test' },
    timestamp: Date.now()
  };
  
  await storage.saveMemory(testMemory);
  await storage.saveMemory(testMemory); // Should not create duplicate
  
  const updatedMemories = await storage.getMemories();
  console.log('After duplicate test:', updatedMemories.length);
};
```

#### B. Settings Persistence Testing
```javascript
// Test settings persistence across sessions
const testSettings = async () => {
  const storage = new LocalStorage();
  
  // Set test settings
  const testSettings = {
    memoryEnabled: false,
    autoCapture: false,
    maxMemories: 500,
    platforms: { chatgpt: false, claude: true }
  };
  
  await storage.saveSettings(testSettings);
  
  // Reload page and check settings persist
  location.reload();
  
  setTimeout(async () => {
    const loadedSettings = await storage.getSettings();
    console.log('Settings persistence test:', loadedSettings);
  }, 1000);
};
```

### Phase 7: Performance Testing

#### A. Memory Search Performance
```javascript
// Test search performance with large datasets
const testSearchPerformance = async () => {
  const memoryManager = new MemoryManager();
  
  // Generate test memories
  const testMemories = [];
  for (let i = 0; i < 1000; i++) {
    testMemories.push({
      id: `test-${i}`,
      content: `Test memory content ${i} with various keywords`,
      metadata: { type: 'general', platform: 'test' },
      timestamp: Date.now() - (i * 1000)
    });
  }
  
  // Store memories
  console.time('Memory Storage');
  for (const memory of testMemories) {
    await memoryManager.storage.saveMemory(memory);
  }
  console.timeEnd('Memory Storage');
  
  // Test search performance
  console.time('Memory Search');
  const results = await memoryManager.searchMemories('test keywords', {
    limit: 10,
    threshold: 0.3
  });
  console.timeEnd('Memory Search');
  
  console.log('Search results:', results.length);
};
```

#### B. Content Script Performance
- [ ] Page load time impact measurement
- [ ] Memory usage monitoring
- [ ] DOM mutation observer performance
- [ ] Event listener efficiency

### Phase 8: Error Handling Testing

#### A. Network Error Testing
- [ ] Test with slow network connections
- [ ] Test with intermittent connectivity
- [ ] Verify graceful degradation

#### B. Storage Error Testing
```javascript
// Test storage quota exceeded
const testStorageQuota = async () => {
  try {
    // Fill storage to capacity
    const largeData = new Array(1000000).fill('x').join('');
    await chrome.storage.local.set({ test_large_data: largeData });
    console.log('Storage quota test passed');
  } catch (error) {
    console.log('Storage quota error handled:', error.message);
  }
};
```

#### C. Invalid Input Testing
- [ ] Test with empty inputs
- [ ] Test with very long inputs
- [ ] Test with special characters
- [ ] Test with HTML/script content

### Phase 9: Security Testing

#### A. Content Security Policy
- [ ] Verify no CSP violations in console
- [ ] Test with strict CSP environments
- [ ] Verify no inline script execution

#### B. Data Sanitization
- [ ] Test XSS prevention in memory content
- [ ] Verify HTML escaping in UI components
- [ ] Test script injection prevention

### Phase 10: Browser Compatibility Testing

#### A. Chrome Versions
- [ ] Test on Chrome stable
- [ ] Test on Chrome beta
- [ ] Test on Chrome dev
- [ ] Test on different operating systems

#### B. Extension API Compatibility
- [ ] Verify Manifest V3 compliance
- [ ] Test service worker lifecycle
- [ ] Test content script injection

## Automated Testing Setup

### 1. Extension Testing Framework
```javascript
// Add to content script for automated testing
window.contextZeroTest = {
  async runBasicTests() {
    console.log('Running basic ContextZero tests...');
    
    // Test 1: Memory Manager initialization
    const memoryManager = new MemoryManager();
    console.assert(memoryManager, 'Memory Manager should initialize');
    
    // Test 2: Storage functionality
    const testMemory = {
      id: 'test-auto',
      content: 'Automated test memory',
      metadata: { type: 'test', platform: 'auto' },
      timestamp: Date.now()
    };
    
    const stored = await memoryManager.storage.saveMemory(testMemory);
    console.assert(stored.id === 'test-auto', 'Memory should be stored');
    
    // Test 3: Search functionality
    const results = await memoryManager.searchMemories('test', { limit: 5 });
    console.assert(results.length > 0, 'Search should return results');
    
    console.log('Basic tests completed');
  },
  
  async runPlatformTests() {
    console.log('Running platform-specific tests...');
    
    // Test input element detection
    const adapter = window.contextZeroChatGPT || window.contextZeroClaude || 
                   window.contextZeroPerplexity || window.contextZeroGrok ||
                   window.contextZeroGemini || window.contextZeroDeepSeek;
    
    if (adapter) {
      const input = adapter.getInputElement();
      console.assert(input, 'Input element should be detected');
      
      const container = adapter.getButtonContainer();
      console.assert(container, 'Button container should be found');
    }
    
    console.log('Platform tests completed');
  }
};
```

### 2. Performance Monitoring
```javascript
// Add performance monitoring
window.contextZeroPerf = {
  startTiming(label) {
    console.time(label);
  },
  
  endTiming(label) {
    console.timeEnd(label);
  },
  
  measureMemoryUsage() {
    if (performance.memory) {
      console.log('Memory usage:', {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      });
    }
  }
};
```

## Testing Checklist Summary

### Pre-Testing
- [ ] Extension installed and loaded
- [ ] Debug mode enabled
- [ ] Test data prepared
- [ ] DevTools opened for monitoring

### Core Functionality
- [ ] Memory extraction works on all platforms
- [ ] Memory search returns relevant results
- [ ] Memory injection works correctly
- [ ] UI components function properly

### Platform Coverage
- [ ] ChatGPT - Full functionality tested
- [ ] Claude - Full functionality tested
- [ ] Perplexity - Full functionality tested
- [ ] Grok - Full functionality tested
- [ ] Gemini - Full functionality tested
- [ ] DeepSeek - Full functionality tested

### Data Integrity
- [ ] Memory storage and retrieval
- [ ] Settings persistence
- [ ] Export/import functionality
- [ ] Data cleanup and limits

### Performance
- [ ] Search performance acceptable
- [ ] Memory usage within limits
- [ ] No significant page load impact
- [ ] Responsive UI interactions

### Error Handling
- [ ] Network errors handled gracefully
- [ ] Storage errors managed
- [ ] Invalid inputs rejected
- [ ] Security measures effective

## Troubleshooting Common Issues

### Memory Button Not Appearing
1. Check console for content script errors
2. Verify platform domain matches manifest
3. Check if DOM selectors need updating
4. Ensure content script injection timing

### Memory Extraction Not Working
1. Verify fact extraction patterns
2. Check storage permissions
3. Monitor message capture events
4. Validate memory format and structure

### Search Results Poor
1. Adjust similarity threshold
2. Check keyword extraction
3. Verify scoring algorithm
4. Review search filters

### Performance Issues
1. Check memory usage patterns
2. Optimize DOM observers
3. Review storage operations
4. Monitor background script activity

## Reporting Issues

When reporting bugs, include:
- Chrome version and OS
- Platform where issue occurred
- Console logs and errors
- Steps to reproduce
- Expected vs actual behavior
- Extension version and settings

This comprehensive testing approach ensures the ContextZero extension works reliably across all supported platforms and use cases.