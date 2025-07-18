# ContextZero Automated Testing Suite

This directory contains comprehensive automated tests for the ContextZero Chrome extension across all supported platforms.

## Quick Start

### 1. Basic Testing (Any Platform)
```javascript
// Navigate to any AI platform and run:
new TestRunner().runAll()
```

### 2. Platform-Specific Testing
```javascript
// Run tests for current platform:
new AllPlatformsTests().runForCurrentPlatform()

// Run ChatGPT-specific tests (on chatgpt.com):
new ChatGPTTests().runAll()

// Run Claude-specific tests (on claude.ai):
new ClaudeTests().runAll()
```

### 3. Individual Test Categories
```javascript
// Run core framework tests:
new ContextZeroTestFramework().runAllTests()

// Run specific test suites:
const framework = new ContextZeroTestFramework();
framework.runCoreTests()
framework.runMemoryExtractionTests()
framework.runMemorySearchTests()
framework.runUITests()
framework.runPerformanceTests()
```

## Test Files

### Core Framework
- **`test-framework.js`** - Main testing framework with comprehensive test suites
- **`test-runner.js`** - Orchestrates all tests and generates reports

### Platform-Specific Tests
- **`all-platforms-tests.js`** - Universal tests that work on all platforms
- **`chatgpt-tests.js`** - ChatGPT-specific tests (textarea input, send button behavior)
- **`claude-tests.js`** - Claude-specific tests (contenteditable input, message listeners)

## Test Categories

### 1. Core Functionality Tests
- Extension loading and initialization
- Memory Manager setup
- Storage operations
- Settings persistence

### 2. Platform-Specific Tests
- DOM element detection
- Input handling (textarea vs contenteditable)
- Message capture
- Memory button functionality
- Conversation processing

### 3. Memory System Tests
- Memory extraction from text
- Memory search and scoring
- Memory formatting for injection
- Deduplication logic

### 4. UI Component Tests
- Memory button injection and styling
- Modal creation and interaction
- Hover effects and animations
- Input focus and cursor positioning

### 5. Performance Tests
- Memory storage speed
- Search performance
- DOM manipulation efficiency
- Memory usage monitoring

### 6. Integration Tests
- End-to-end workflows
- Cross-component communication
- Storage persistence
- UI interaction flows

### 7. Stress Tests
- Large memory datasets
- Rapid input changes
- Concurrent operations
- Memory pressure testing

## Running Tests

### Method 1: Direct Console Commands
1. Load the extension in Chrome
2. Navigate to any supported platform
3. Open DevTools console
4. Run test commands

### Method 2: URL Parameters
Add parameters to the URL for automatic testing:
- `?autotest=true` - Run all platform tests
- `?run-all-tests=true` - Run comprehensive test suite
- `?chatgpt-test=true` - Run ChatGPT-specific tests
- `?claude-test=true` - Run Claude-specific tests

### Method 3: Bookmarklet
Create a bookmarklet for quick testing:
```javascript
javascript:(function(){new TestRunner().runAll();})()
```

## Test Data

The tests use predefined data sets covering:
- **Identity**: Names, personal information
- **Location**: Cities, addresses, current location
- **Work**: Jobs, companies, professional details
- **Preferences**: Likes, dislikes, favorite things
- **Education**: Schools, degrees, certifications
- **Family**: Relationships, family members
- **Hobbies**: Interests, activities, passions
- **Goals**: Aspirations, plans, objectives
- **Health**: Allergies, dietary restrictions
- **Technology**: Tools, languages, frameworks

## Platform-Specific Considerations

### ChatGPT (chatgpt.com, chat.openai.com)
- Uses `textarea` for input
- Send button has `data-testid="send-button"`
- Message containers use `.group` class
- Button styled with ChatGPT green (`#10a37f`)

### Claude (claude.ai)
- Uses `contenteditable` div for input
- More complex cursor positioning
- Message listeners for panel commands
- Button styled with Claude bronze (`#cd7f32`)

### Perplexity (perplexity.ai)
- Uses `textarea` for search input
- Question-based interaction model
- Different message container structure
- Button styled with Perplexity teal (`#20808d`)

### Grok (x.ai)
- Twitter-style interface
- Message threading considerations
- Button styled with Twitter blue (`#1d9bf0`)

### Gemini (gemini.google.com, bard.google.com)
- Mixed input types (textarea and contenteditable)
- Multiple domain support
- Google-style interface elements
- Button styled with Google blue (`#4285f4`)

### DeepSeek (deepseek.com, chat.deepseek.com)
- Flexible input handling
- Various interface configurations
- Button styled with DeepSeek purple (`#6c5ce7`)

## Reading Test Results

### Console Output
Tests provide real-time feedback:
- 🧪 Test running
- ✅ Test passed
- ❌ Test failed
- 💥 Test error

### Stored Results
Results are stored in Chrome extension storage:
```javascript
// Get results for a specific platform
TestRunner.getStoredResults('chatgpt')

// Clear all stored results
TestRunner.clearAllResults()
```

### Report Format
```javascript
{
  platform: 'chatgpt',
  timestamp: 1640995200000,
  duration: 15000,
  testResults: {
    framework: { passed: 25, failed: 2, total: 27 },
    platform: { passed: 18, failed: 1, total: 19 },
    integration: { passed: 4, failed: 0, total: 4 },
    performance: { passed: 4, failed: 0, total: 4 },
    stress: { passed: 3, failed: 0, total: 3 }
  },
  summary: {
    total: 57,
    passed: 54,
    failed: 3,
    successRate: '94.7%'
  }
}
```

## Troubleshooting

### Common Issues

1. **"Adapter not found"**
   - Ensure you're on the correct platform
   - Check that the extension is loaded
   - Verify content script injection

2. **"DOM elements not found"**
   - Platform may have updated their interface
   - Check selector definitions in adapters
   - Wait for page to fully load

3. **"Memory operations failed"**
   - Check storage permissions
   - Verify extension has proper permissions
   - Clear storage if corrupted

4. **"Performance tests failing"**
   - Close other Chrome tabs
   - Disable other extensions temporarily
   - Check system resources

### Debug Mode
Enable debug logging:
```javascript
chrome.storage.local.get(['contextzero_settings'], (result) => {
  const settings = result.contextzero_settings || {};
  settings.debugMode = true;
  chrome.storage.local.set({ contextzero_settings: settings });
});
```

## Contributing

When adding new tests:
1. Follow the existing test structure
2. Include both positive and negative test cases
3. Add appropriate error handling
4. Update this README with new test descriptions
5. Test across all supported platforms

## Test Coverage

Current test coverage includes:
- ✅ Core extension functionality
- ✅ All 6 platform adapters
- ✅ Memory extraction and storage
- ✅ Search and retrieval
- ✅ UI components and interactions
- ✅ Performance and stress testing
- ✅ Integration workflows
- ✅ Error handling and edge cases

## Performance Benchmarks

Target performance criteria:
- Memory storage: < 3 seconds for 20 memories
- Search operations: < 2 seconds for 5 searches
- DOM manipulation: < 1 second for 100 operations
- Memory usage: < 20MB increase during testing
- UI responsiveness: < 500ms for button interactions

Run tests regularly to ensure performance standards are maintained across all platforms.