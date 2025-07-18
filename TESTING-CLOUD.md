# ContextZero Cloud Testing Guide

This guide explains how to test ContextZero's cloud features, including the ability to disable authentication for development and testing purposes.

## Testing Modes

ContextZero supports three testing modes:

1. **Production Mode** - Real Clerk authentication required
2. **Testing Mode** - Mock authentication with simulated AI responses
3. **Local-Only Mode** - No cloud features, only local processing

## Enabling Testing Mode

### Method 1: Using the Testing Utils (Recommended)

Open the browser console on any page and run:

```javascript
// Enable testing mode
await ContextZeroTesting.enableTestingMode();

// Enable with custom test user ID
await ContextZeroTesting.enableTestingMode('my-test-user-123');

// Check if testing mode is enabled
await ContextZeroTesting.isTestingModeEnabled();

// Get current testing configuration
await ContextZeroTesting.getTestingConfig();
```

### Method 2: Direct Chrome Storage

```javascript
// Enable testing mode manually
await chrome.storage.sync.set({
  contextzero_testing_mode: true,
  contextzero_test_user_id: 'test-user-123',
  contextzero_cloud_enabled: true
});
```

## Testing Features

### 1. Mock AI Memory Processing

When testing mode is enabled, the extension will:
- Simulate AI-enhanced memory extraction
- Return mock memories with AI insights
- Add realistic confidence scores and metadata
- Simulate network delays

### 2. Mock Search Results

AI-powered search will return relevant mock results based on query:
- Work-related queries return mock work memories
- Identity queries return mock identity information
- Location queries return mock location data
- General queries return generic mock results

### 3. Mock Analytics

Analytics endpoints return simulated data:
- Memory counts and statistics
- Usage patterns
- Platform distribution
- Confidence score distributions

## Test Data Management

### Populate Test Data

```javascript
// Add 10 mock memories
await ContextZeroTesting.populateTestData(10);

// Add 50 mock memories
await ContextZeroTesting.populateTestData(50);
```

### Clear Test Data

```javascript
// Clear all test data
await ContextZeroTesting.clearTestData();
```

### Debug Extension State

```javascript
// Log current extension state
await ContextZeroTesting.logExtensionState();
```

## Disabling Testing Mode

### Method 1: Using Testing Utils

```javascript
// Disable testing mode
await ContextZeroTesting.disableTestingMode();
```

### Method 2: Direct Chrome Storage

```javascript
// Disable testing mode manually
await chrome.storage.sync.remove([
  'contextzero_testing_mode',
  'contextzero_test_user_id'
]);
```

## Backend API Endpoints

When testing mode is disabled, the extension expects these FastAPI endpoints:

### Authentication
- `POST /auth/verify` - Verify Clerk token
- `GET /auth/clerk-redirect` - Redirect to Clerk auth

### Memory Management
- `POST /memories/process` - Process memories with AI
- `POST /memories/sync` - Sync memories to cloud
- `GET /memories` - Get user memories
- `POST /memories/search` - AI-powered search
- `DELETE /memories/{id}` - Delete memory

### Analytics
- `GET /analytics/{user_id}` - Get user analytics

## Expected Request/Response Format

### Memory Processing Request
```json
{
  "content": "I work as a software engineer at Google",
  "metadata": {
    "userId": "user123",
    "platform": "chatgpt",
    "timestamp": 1640995200000
  }
}
```

### Memory Processing Response
```json
{
  "memories": [
    {
      "id": "memory_123",
      "content": "Software Engineer at Google",
      "metadata": {
        "type": "work",
        "confidence": 0.95,
        "aiInsights": {
          "extractionMethod": "advanced_nlp",
          "contextScore": 0.9,
          "sentimentScore": 0.1,
          "relevanceScore": 0.95
        }
      }
    }
  ]
}
```

## Development Workflow

1. **Enable Testing Mode**
   ```javascript
   await ContextZeroTesting.enableTestingMode();
   ```

2. **Populate Test Data**
   ```javascript
   await ContextZeroTesting.populateTestData(20);
   ```

3. **Test Features**
   - Test memory extraction on AI platforms
   - Test search functionality
   - Test memory injection
   - Test settings and configuration

4. **Debug Issues**
   ```javascript
   await ContextZeroTesting.logExtensionState();
   ```

5. **Clear and Reset**
   ```javascript
   await ContextZeroTesting.clearTestData();
   await ContextZeroTesting.disableTestingMode();
   ```

## Console Testing Commands

After enabling testing mode, you can test cloud features in the console:

```javascript
// Test memory processing
const cloudAPI = new CloudAPI();
await cloudAPI.init();
const memories = await cloudAPI.processMemoriesWithAI(
  "I work as a software engineer at Google",
  { platform: "chatgpt" }
);

// Test search
const results = await cloudAPI.searchMemoriesWithAI("work");

// Check auth status
const authStatus = cloudAPI.getAuthStatus();
```

## Notes

- Always reload the extension after changing testing mode
- Testing mode persists across browser sessions
- Mock data is generated dynamically for realistic testing
- All API calls in testing mode are simulated locally
- No actual network requests are made in testing mode

## Troubleshooting

### Testing Mode Not Working
1. Check if testing mode is enabled: `await ContextZeroTesting.isTestingModeEnabled()`
2. Reload the extension
3. Check console for testing mode messages (🧪 prefix)

### Mock Data Not Appearing
1. Ensure testing mode is enabled
2. Check if test data was populated: `await ContextZeroTesting.logExtensionState()`
3. Verify local storage has mock memories

### Console Errors
1. Check if required scripts are loaded
2. Verify extension permissions
3. Check for conflicts with other extensions