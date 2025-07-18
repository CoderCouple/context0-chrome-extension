# ContextZero Architecture Documentation

## System Overview

ContextZero is designed as a modular Chrome extension that seamlessly integrates with multiple AI platforms while maintaining strict privacy and performance standards.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           ContextZero Chrome Extension                          │
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                          Extension Layer                                    │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │ │
│  │  │   Background    │  │     Popup       │  │   Content       │            │ │
│  │  │   Service       │  │   Interface     │  │   Scripts       │            │ │
│  │  │   Worker        │  │                 │  │   (6 Platforms) │            │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Core Business Logic                                 │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐            │ │
│  │  │    Memory       │  │    Storage      │  │    Memory       │            │ │
│  │  │    Manager      │  │    Manager      │  │   Extractor     │            │ │
│  │  │                 │  │                 │  │                 │            │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────┘            │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Platform Adapters                                  │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │ │
│  │  │   ChatGPT   │ │   Claude    │ │ Perplexity  │ │    Grok     │          │ │
│  │  │   Adapter   │ │   Adapter   │ │   Adapter   │ │   Adapter   │          │ │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │ │
│  │  ┌─────────────┐ ┌─────────────┐                                          │ │
│  │  │   Gemini    │ │  DeepSeek   │                                          │ │
│  │  │   Adapter   │ │   Adapter   │                                          │ │
│  │  └─────────────┘ └─────────────┘                                          │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                           │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │
│  │                         Storage Layer                                      │ │
│  │              ┌─────────────────────────────────────────┐                   │ │
│  │              │        Chrome Local Storage             │                   │ │
│  │              │                                         │                   │
│  │              │  ┌─────────────┐  ┌─────────────┐      │                   │ │
│  │              │  │  Memories   │  │  Settings   │      │                   │ │
│  │              │  │             │  │             │      │                   │ │
│  │              │  └─────────────┘  └─────────────┘      │                   │ │
│  │              │                                         │                   │ │
│  │              │  ┌─────────────┐  ┌─────────────┐      │                   │ │
│  │              │  │ User Data   │  │Test Results │      │                   │ │
│  │              │  │             │  │             │      │                   │ │
│  │              │  └─────────────┘  └─────────────┘      │                   │ │
│  │              └─────────────────────────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Architecture

### Memory Extraction Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Types    │    │   Platform      │    │   Memory        │
│   Message       │───▶│   Adapter       │───▶│   Extractor     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Chrome Local  │    │   Memory        │    │   Pattern       │
│   Storage       │◀───│   Manager       │◀───│   Matching      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Memory Retrieval Flow
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Clicks   │    │   Memory        │    │   Search        │
│   🧠 Button     │───▶│   Manager       │───▶│   Algorithm     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Updated       │    │   Memory        │    │   Relevant      │
│   Prompt        │◀───│   Injection     │◀───│   Memories      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Details

### 1. Extension Layer

#### Background Service Worker (`background.js`)
- **Purpose**: Central coordinator for all extension operations
- **Responsibilities**:
  - Extension lifecycle management
  - Message routing between components
  - Cross-tab communication
  - Context menu integration
  - Periodic cleanup tasks
  - Settings initialization

#### Popup Interface (`popup.html`, `popup.js`)
- **Purpose**: User interface for extension management
- **Responsibilities**:
  - Display memory statistics
  - Memory management (view, delete, export)
  - Settings configuration
  - Data import/export

#### Content Scripts (Platform-specific)
- **Purpose**: Inject functionality into AI platform pages
- **Responsibilities**:
  - DOM manipulation and event handling
  - Message capture and processing
  - Memory button injection
  - Platform-specific adaptations

### 2. Core Business Logic

#### Memory Manager (`shared/memory-manager.js`)
- **Purpose**: Central hub for all memory operations
- **Key Methods**:
  ```javascript
  storeMemory(content, metadata)     // Store new memory
  searchMemories(query, options)     // Search existing memories
  getStatistics()                    // Get usage statistics
  formatMemoriesForInjection()       // Format for prompt injection
  ```

#### Storage Manager (`shared/storage.js`)
- **Purpose**: Abstraction layer for Chrome storage
- **Key Methods**:
  ```javascript
  saveMemory(memory)                 // Save single memory
  getMemories()                      // Get all memories
  searchMemories(query, limit)       // Search with scoring
  exportData()                       // Export all data
  importData(data)                   // Import from backup
  ```

#### Memory Extractor (`shared/memory-extractor.js`)
- **Purpose**: Extract structured information from text
- **Key Methods**:
  ```javascript
  extractFacts(text)                 // Extract facts from text
  categorizeContent(text)            // Categorize content type
  extractKeywords(text)              // Extract relevant keywords
  ```

### 3. Platform Adapters

Each platform adapter follows a common interface:

```javascript
class PlatformAdapter {
  constructor() {
    this.selectors = {
      input: '...',              // Input element selector
      sendButton: '...',          // Send button selector
      messageContainer: '...',    // Message container selector
      conversationContainer: '...' // Conversation container selector
    };
    this.memoryManager = new MemoryManager();
    this.isInitialized = false;
  }

  // Core interface methods
  async init()                      // Initialize adapter
  getInputElement()                 // Get input element
  getInputText()                    // Get current input text
  setInputText(text)                // Set input text
  injectMemoryButton()              // Inject memory button
  handleMemoryButtonClick()         // Handle button click
  captureUserMessage()              // Capture user messages
  processConversationMessages()     // Process conversation
  reinitialize()                    // Reinitialize on navigation
}
```

#### Platform-Specific Implementations

##### ChatGPT Adapter
- **Input Type**: `<textarea>`
- **Special Handling**: 
  - Multiple domain support (chatgpt.com, chat.openai.com)
  - Dynamic DOM updates
  - Page navigation handling
- **Button Styling**: ChatGPT green (#10a37f)

##### Claude Adapter
- **Input Type**: `<div contenteditable="true">`
- **Special Handling**:
  - Contenteditable cursor positioning
  - Range selection management
  - Message listener integration
- **Button Styling**: Claude bronze (#cd7f32)

##### Perplexity Adapter
- **Input Type**: `<textarea>`
- **Special Handling**:
  - Search-based interaction model
  - Question processing
  - Result integration
- **Button Styling**: Perplexity teal (#20808d)

##### Grok Adapter
- **Input Type**: `<textarea>`
- **Special Handling**:
  - Twitter-style interface
  - Message threading
  - Real-time updates
- **Button Styling**: Twitter blue (#1d9bf0)

##### Gemini Adapter
- **Input Type**: Mixed (textarea and contenteditable)
- **Special Handling**:
  - Multiple domain support
  - Interface variations
  - Google-style components
- **Button Styling**: Google blue (#4285f4)

##### DeepSeek Adapter
- **Input Type**: Mixed (textarea and contenteditable)
- **Special Handling**:
  - Flexible input detection
  - Interface adaptation
  - Error handling
- **Button Styling**: DeepSeek purple (#6c5ce7)

## Memory Extraction System

### Pattern Matching Engine

The memory extraction system uses a sophisticated pattern matching engine to identify and extract personal information from user messages.

#### Categories and Patterns

```javascript
const patterns = {
  identity: [
    /(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+?)(?:\s|$|[.,!?])/i,
    /(?:i go by|people call me)\s+([a-zA-Z\s]+?)(?:\s|$|[.,!?])/i
  ],
  
  location: [
    /(?:i live in|i'm from|i am from|i'm based in|i reside in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
    /(?:my location is|i'm located in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
  ],
  
  work: [
    /(?:i work at|i work for|my job is|i'm employed by)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
    /(?:i'm a|i am a|my profession is|my role is)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
  ],
  
  preferences: [
    /(?:i like|i love|i enjoy|i prefer|i'm into)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
    /(?:i hate|i dislike|i don't like|i can't stand)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
  ]
  
  // ... more patterns for education, family, hobbies, goals, health, tech
};
```

#### Extraction Process

1. **Text Preprocessing**
   - Normalize whitespace
   - Remove special characters
   - Convert to lowercase for pattern matching

2. **Pattern Matching**
   - Apply regex patterns to text
   - Extract matching groups
   - Assign confidence scores

3. **Fact Validation**
   - Check for minimum content length
   - Validate extracted information
   - Filter out noise and false positives

4. **Categorization**
   - Assign category based on pattern type
   - Add metadata (confidence, keywords)
   - Generate unique ID

### Memory Storage Schema

#### Memory Object Structure
```javascript
{
  id: "memory_1640995200000_abc123def",
  content: "I work as a software engineer at Google",
  originalText: "Hi, I work as a software engineer at Google and...",
  metadata: {
    type: "work",
    category: "work", 
    confidence: 0.9,
    platform: "chatgpt",
    source: "auto_extract",
    keywords: ["work", "software", "engineer", "google"],
    url: "https://chatgpt.com/c/...",
    timestamp: 1640995200000
  },
  timestamp: 1640995200000,
  lastAccessed: 1640995200000,
  accessCount: 3
}
```

#### Storage Keys
- `contextzero_memories`: Array of memory objects
- `contextzero_settings`: User preferences and configuration
- `contextzero_user_data`: Usage statistics and metadata
- `contextzero_test_results_{platform}`: Test results for debugging

## Search Algorithm

### Relevance Scoring

The search algorithm uses multiple factors to determine memory relevance:

```javascript
function calculateRelevance(memory, query) {
  let score = 0;
  
  // 1. Content matching (40% weight)
  score += contentMatch(memory.content, query) * 0.4;
  
  // 2. Keyword matching (30% weight)
  score += keywordMatch(memory.metadata.keywords, query) * 0.3;
  
  // 3. Recency bonus (20% weight)
  const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
  score += Math.max(0, 1 - daysSince * 0.1) * 0.2;
  
  // 4. Access frequency (10% weight)
  score += Math.min(memory.accessCount * 0.1, 1) * 0.1;
  
  return score;
}
```

### Search Process

1. **Query Processing**
   - Normalize search query
   - Extract keywords
   - Apply filters (platform, category, time range)

2. **Initial Filtering**
   - Filter memories by user preferences
   - Apply platform and category filters
   - Remove low-confidence memories

3. **Relevance Scoring**
   - Calculate relevance score for each memory
   - Apply boosting factors
   - Sort by relevance

4. **Result Limiting**
   - Apply threshold filtering
   - Limit to requested number of results
   - Update access tracking

## Performance Optimization

### Memory Management
- **Caching**: Search results cached for 5 minutes
- **Lazy Loading**: UI components loaded on demand
- **Batch Operations**: Multiple storage operations batched
- **Memory Limits**: Maximum 1000 memories (configurable)

### Storage Optimization
- **Indexing**: Efficient search indexing
- **Compression**: Large text content compressed
- **Cleanup**: Automatic cleanup of old memories
- **Deduplication**: Prevents duplicate memory storage

### DOM Optimization
- **Minimal DOM Queries**: Cached DOM element references
- **Event Delegation**: Efficient event handling
- **Debouncing**: Input event debouncing
- **Virtual Scrolling**: For large memory lists

## Security Architecture

### Content Security Policy
```javascript
"content_security_policy": {
  "extension_pages": "script-src 'self'; object-src 'self';"
}
```

### Permission Model
- **Minimal Permissions**: Only requests necessary permissions
- **Explicit Consent**: Clear permission explanations
- **Granular Control**: User can disable features
- **Audit Trail**: All operations logged in debug mode

### Data Protection
- **Local Storage Only**: No external data transmission
- **Encryption**: Sensitive data encrypted at rest
- **Sanitization**: All inputs sanitized
- **Access Control**: Strict component boundaries

## Testing Architecture

### Test Categories
1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Cross-component workflows
3. **Platform Tests**: Platform-specific functionality
4. **Performance Tests**: Speed and memory benchmarks
5. **Security Tests**: XSS and injection prevention

### Test Framework
```javascript
class TestFramework {
  // Core testing methods
  async test(name, testFunction)
  async runCoreTests()
  async runPlatformTests()
  async runPerformanceTests()
  async runStressTests()
  
  // Reporting
  generateReport()
  storeResults()
}
```

### Continuous Testing
- **Automated Testing**: URL parameter triggers
- **Cross-Platform Testing**: All 6 platforms
- **Performance Monitoring**: Benchmarks and thresholds
- **Regression Testing**: Automated test suites

## Deployment Architecture

### Build Process
1. **Code Validation**: Linting and type checking
2. **Asset Optimization**: Icon and CSS optimization
3. **Security Scanning**: Vulnerability detection
4. **Manifest Validation**: Chrome store requirements
5. **Testing**: Automated test execution

### Distribution
- **Chrome Web Store**: Primary distribution channel
- **Manual Installation**: Developer mode for testing
- **Enterprise Deployment**: Group policy support
- **Version Management**: Semantic versioning

### Update Mechanism
- **Automatic Updates**: Chrome handles updates
- **Migration Scripts**: Data migration between versions
- **Rollback Support**: Previous version fallback
- **Feature Flags**: Gradual feature rollout

## Monitoring and Analytics

### Privacy-Compliant Monitoring
- **No External Analytics**: No data sent to external services
- **Local Metrics**: Performance metrics stored locally
- **Error Reporting**: Local error logging only
- **Usage Statistics**: Aggregated, anonymous data

### Performance Monitoring
- **Memory Usage**: Heap size monitoring
- **Execution Time**: Operation timing
- **Error Rates**: Exception tracking
- **Storage Usage**: Storage quota monitoring

## Scalability Considerations

### Memory Scaling
- **Pagination**: Large memory lists paginated
- **Lazy Loading**: Content loaded on demand
- **Indexing**: Efficient search indexing
- **Archiving**: Old memories archived

### Platform Scaling
- **Modular Architecture**: Easy to add new platforms
- **Abstract Interfaces**: Common adapter interface
- **Configuration-Driven**: Platform configs externalized
- **Feature Flags**: Platform-specific features

### Storage Scaling
- **Quota Management**: Storage quota monitoring
- **Compression**: Large content compressed
- **Cleanup**: Automatic old data cleanup
- **Export/Import**: Data portability

This architecture ensures ContextZero remains performant, secure, and maintainable while providing a seamless user experience across all supported AI platforms.