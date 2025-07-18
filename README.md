# ContextZero - Personal Memory Agent for AI Conversations

<div align="center">

![ContextZero Logo](icons/icon128.png)

**A Chrome extension that remembers your personal context across all AI platforms**

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=google-chrome)](https://chrome.google.com/webstore)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Privacy First](https://img.shields.io/badge/Privacy-First-green)](PRIVACY-POLICY.md)

[Features](#features) • [Installation](#installation) • [Usage](#usage) • [Architecture](#architecture) • [Privacy](#privacy) • [Contributing](#contributing)

</div>

## Overview

ContextZero is a privacy-fi
rst Chrome extension that acts as your personal memory agent across AI conversations. It automatically extracts and remembers personal information from your conversations with AI platforms, then intelligently injects relevant context into future prompts to provide more personalized and relevant responses.

### Supported Platforms

- **ChatGPT** (chatgpt.com, chat.openai.com)
- **Claude** (claude.ai)
- **Perplexity** (perplexity.ai)
- **Grok** (x.ai)
- **Gemini** (gemini.google.com, bard.google.com, ai.google.dev)
- **DeepSeek** (deepseek.com, chat.deepseek.com)

## Features

### 🧠 **Intelligent Memory Extraction**
- Automatically extracts personal facts from your conversations
- Categorizes memories into identity, location, work, preferences, education, family, hobbies, goals, health, and technology
- Uses advanced pattern matching to identify relevant information
- Prevents duplicate memory storage

### 🔍 **Smart Memory Search**
- Searches through your personal memories based on conversation context
- Scores memories by relevance and recency
- Filters by platform, category, and time range
- Provides fast, contextual results

### 💬 **Seamless Integration**
- Adds a memory button (🧠) to each AI platform's interface
- One-click memory injection into prompts
- Platform-specific styling and behavior
- Non-intrusive, native-feeling interface

### 📊 **Memory Management**
- View, edit, and delete individual memories
- Export/import memory data
- Statistics and analytics
- Customizable settings and preferences

### 🔒 **Privacy-First Design**
- All data stored locally in Chrome storage
- No external servers or data transmission
- No tracking, analytics, or data collection
- Complete user control over personal information

## Installation

### From Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (link pending)
2. Search for "ContextZero"
3. Click "Add to Chrome"
4. Grant necessary permissions

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked" and select the extension directory
5. The extension icon should appear in your toolbar

### Required Permissions
- **Storage**: To save your personal memories locally
- **Active Tab**: To interact with AI platform interfaces
- **Host Permissions**: To inject content scripts on supported AI platforms

## Usage

### Basic Workflow

1. **Start a Conversation**: Navigate to any supported AI platform and start chatting
2. **Memory Extraction**: ContextZero automatically extracts personal facts from your messages
3. **Memory Search**: When typing new prompts, click the 🧠 button to find relevant memories
4. **Context Injection**: Select and inject relevant memories into your prompt
5. **Enhanced Responses**: The AI now has context about your preferences, background, and goals

### Memory Button
Look for the 🧠 button next to the send button on each platform:
- **ChatGPT**: Green button next to send button
- **Claude**: Bronze button in input container
- **Perplexity**: Teal button in search form
- **Grok**: Blue button in message form
- **Gemini**: Google blue button in input area
- **DeepSeek**: Purple button in chat interface

### Memory Management
- **View Memories**: Click the extension icon to open the memory panel
- **Search Memories**: Use the search function to find specific memories
- **Edit Memories**: Modify or delete individual memories
- **Export/Import**: Backup and restore your memory data
- **Settings**: Customize extraction patterns and preferences

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ContextZero Chrome Extension             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Background    │    │   Content       │    │   Popup     │  │
│  │   Service       │◄──►│   Scripts       │    │   Interface │  │
│  │   Worker        │    │   (Per Platform)│    │             │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                       │                     │       │
│           ▼                       ▼                     ▼       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │    Memory       │    │    Platform     │    │    UI       │  │
│  │    Manager      │    │    Adapters     │    │ Components  │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│           │                                                     │
│           ▼                                                     │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │    Local        │    │    Memory       │    │   Pattern   │  │
│  │    Storage      │    │   Extractor     │    │   Matcher   │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. **Background Service Worker** (`background.js`)
- Handles extension lifecycle and initialization
- Routes messages between components
- Manages cross-tab communication
- Handles context menu integration
- Performs periodic cleanup tasks

#### 2. **Content Scripts** (Platform-specific)
- **ChatGPT Adapter**: Handles textarea input and message capture
- **Claude Adapter**: Manages contenteditable div and message listeners
- **Perplexity Adapter**: Processes search-based interactions
- **Grok Adapter**: Integrates with Twitter-style interface
- **Gemini Adapter**: Supports multiple Google AI interfaces
- **DeepSeek Adapter**: Handles flexible input configurations

#### 3. **Shared Components** (`shared/`)
- **Memory Manager**: Core memory operations and search
- **Storage Manager**: Local data persistence and retrieval
- **Memory Extractor**: Pattern-based fact extraction
- **UI Components**: Reusable interface elements

#### 4. **Pattern Matching Engine**
Extracts personal information using regex patterns:
- **Identity**: Names, personal identifiers
- **Location**: Cities, addresses, current location
- **Work**: Jobs, companies, professional details
- **Preferences**: Likes, dislikes, favorite things
- **Education**: Schools, degrees, certifications
- **Family**: Relationships, family members
- **Hobbies**: Interests, activities, passions
- **Goals**: Aspirations, plans, objectives
- **Health**: Allergies, dietary restrictions
- **Technology**: Tools, languages, frameworks

## Data Flow

### Memory Extraction Flow
```
User Types Message → Platform Adapter → Memory Extractor → Pattern Matching
                                                          ↓
Memory Storage ← Memory Manager ← Fact Categorization ← Extracted Facts
```

### Memory Injection Flow
```
User Clicks 🧠 Button → Memory Manager → Search Algorithm → Relevant Memories
                                                          ↓
Updated Prompt ← Text Injection ← Memory Modal ← Memory Selection
```

### Detailed Data Flow

1. **Message Capture**
   - Content script detects user input
   - Captures message on send button click or Enter key
   - Passes message to Memory Manager

2. **Fact Extraction**
   - Memory Extractor processes message text
   - Applies regex patterns to identify personal facts
   - Categorizes facts by type (identity, location, etc.)
   - Assigns confidence scores

3. **Memory Storage**
   - Memory Manager stores extracted facts
   - Prevents duplicate storage
   - Adds metadata (platform, timestamp, source)
   - Updates user statistics

4. **Memory Search**
   - User clicks memory button
   - Search algorithm finds relevant memories
   - Scores memories by relevance and recency
   - Filters by user preferences

5. **Context Injection**
   - User selects memories from modal
   - Memories formatted for injection
   - Text appended to user's prompt
   - Cursor positioned at end of input

### Storage Schema

#### Memory Object
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

#### Settings Object
```javascript
{
  memoryEnabled: true,
  autoCapture: true,
  maxMemories: 1000,
  similarity_threshold: 0.7,
  enhancementMode: "auto", // auto, manual, disabled
  debugMode: false,
  platforms: {
    chatgpt: true,
    claude: true,
    perplexity: true,
    grok: true,
    gemini: true,
    deepseek: true
  },
  categories: {
    identity: true,
    location: true,
    preference: true,
    work: true,
    education: true,
    family: true,
    hobby: true,
    goal: true,
    health: true,
    tech: true
  }
}
```

## Privacy & Security

### Privacy-First Principles
- **Local Storage Only**: All data stored in Chrome's local storage
- **No External Servers**: No data transmission to external servers
- **No Tracking**: No analytics, metrics, or usage tracking
- **User Control**: Complete control over personal data
- **Transparent Operation**: Open source code for full transparency

### Security Measures
- **Content Security Policy**: Prevents script injection attacks
- **Input Sanitization**: All user inputs sanitized before storage
- **Permission Minimization**: Only requests necessary permissions
- **Secure Storage**: Uses Chrome's secure storage APIs
- **No Persistent Background**: Service worker only runs when needed

### Data Handling
- **Extraction**: Only processes text you explicitly type
- **Storage**: Memories stored locally on your device
- **Retention**: User controls memory retention and deletion
- **Export**: Complete data export capability
- **Deletion**: Secure deletion of all data

## File Structure

```
context0-chrome-extension/
├── manifest.json                 # Extension configuration
├── background.js                 # Background service worker
├── popup.html                    # Extension popup interface
├── popup.js                      # Popup functionality
├── shared/                       # Shared components
│   ├── memory-manager.js         # Core memory operations
│   ├── storage.js                # Local storage interface
│   ├── memory-extractor.js       # Fact extraction engine
│   └── ui-components.js          # Reusable UI elements
├── content-scripts/              # Platform-specific adapters
│   ├── chatgpt/
│   │   └── chatgpt.js           # ChatGPT integration
│   ├── claude/
│   │   └── claude.js            # Claude integration
│   ├── perplexity/
│   │   └── perplexity.js        # Perplexity integration
│   ├── grok/
│   │   └── grok.js              # Grok integration
│   ├── gemini/
│   │   └── gemini.js            # Gemini integration
│   └── deepseek/
│       └── deepseek.js          # DeepSeek integration
├── styles/
│   └── modal.css                # Modal styling
├── icons/                       # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/                       # Automated test suite
│   ├── test-framework.js        # Main testing framework
│   ├── test-runner.js           # Test orchestration
│   ├── chatgpt-tests.js         # ChatGPT-specific tests
│   ├── claude-tests.js          # Claude-specific tests
│   ├── all-platforms-tests.js   # Universal tests
│   └── README.md                # Testing documentation
├── README.md                    # This file
├── CLAUDE.md                    # Claude Code guidance
├── TESTING.md                   # Manual testing guide
├── ARCHITECTURE.md              # Technical architecture
├── PRIVACY-POLICY.md            # Privacy policy
└── LICENSE                      # MIT license
```

## Development

### Prerequisites
- Chrome browser (latest version)
- Basic knowledge of JavaScript and Chrome extension development
- Node.js (for development tools - optional)

### Development Setup
1. Clone the repository
2. Load the extension in Chrome developer mode
3. Make changes to the code
4. Reload the extension to see changes
5. Test across multiple AI platforms

### Testing
- **Manual Testing**: Follow the guide in `TESTING.md`
- **Automated Testing**: Use the test suite in `tests/`
- **Cross-Platform Testing**: Test on all 6 supported platforms

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## API Reference

### Memory Manager
```javascript
const memoryManager = new MemoryManager();

// Store a memory
const memories = await memoryManager.storeMemory(content, metadata);

// Search memories
const results = await memoryManager.searchMemories(query, options);

// Get statistics
const stats = await memoryManager.getStatistics();
```

### Storage Interface
```javascript
const storage = new LocalStorage();

// Save memory
await storage.saveMemory(memory);

// Get all memories
const memories = await storage.getMemories();

// Search memories
const results = await storage.searchMemories(query, limit);
```

### Platform Adapters
```javascript
// Each platform adapter implements:
class PlatformAdapter {
  getInputElement()        // Get the input element
  getInputText()          // Get current input text
  setInputText(text)      // Set input text
  getButtonContainer()    // Get button container
  injectMemoryButton()    // Inject memory button
  handleMemoryButtonClick() // Handle button click
  captureUserMessage()    // Capture user messages
}
```

## Performance

### Benchmarks
- **Memory Storage**: < 3 seconds for 20 memories
- **Search Operations**: < 2 seconds for 5 searches
- **DOM Manipulation**: < 1 second for 100 operations
- **Memory Usage**: < 20MB increase during operation
- **Storage Limit**: 1000 memories (configurable)

### Optimization
- Efficient regex pattern matching
- Cached search results
- Lazy loading of UI components
- Minimal DOM manipulation
- Optimized storage operations

## Browser Compatibility

### Supported Browsers
- **Chrome**: Version 88+ (primary support)
- **Chromium**: Version 88+
- **Edge**: Version 88+ (Chromium-based)
- **Brave**: Version 1.20+
- **Opera**: Version 74+

### Manifest V3
- Uses latest Chrome extension APIs
- Service worker instead of background page
- Modern security practices
- Future-proof architecture

## Troubleshooting

### Common Issues

1. **Memory Button Not Appearing**
   - Refresh the AI platform page
   - Check if extension is enabled
   - Verify platform is supported

2. **Memory Not Being Extracted**
   - Check if auto-capture is enabled
   - Verify message contains extractable facts
   - Check debug mode for extraction logs

3. **Search Not Working**
   - Ensure memories exist in storage
   - Check similarity threshold settings
   - Verify search query relevance

4. **Performance Issues**
   - Clear old memories
   - Reduce memory limit
   - Disable debug mode

### Debug Mode
Enable debug logging:
```javascript
chrome.storage.local.get(['contextzero_settings'], (result) => {
  const settings = result.contextzero_settings || {};
  settings.debugMode = true;
  chrome.storage.local.set({ contextzero_settings: settings });
});
```

## Roadmap

### Version 1.1
- [ ] Advanced memory categorization
- [ ] Improved search algorithms
- [ ] Better UI/UX design
- [ ] Performance optimizations

### Version 1.2
- [ ] Memory sharing between devices
- [ ] Advanced filtering options
- [ ] Custom extraction patterns
- [ ] Memory templates

### Version 2.0
- [ ] AI-powered memory relevance
- [ ] Semantic search capabilities
- [ ] Memory relationship mapping
- [ ] Advanced analytics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### MIT License Summary
- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

## Privacy Policy

For detailed privacy information, see our [Privacy Policy](PRIVACY-POLICY.md).

**TL;DR**: We don't collect, store, or transmit any of your personal data. Everything stays on your device.

## Support

### Getting Help
- **Issues**: Report bugs on [GitHub Issues](https://github.com/contextzero/chrome-extension/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our [Discord](https://discord.gg/contextzero) (if available)

### Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Acknowledgments
- Thanks to all the AI platforms for their innovative interfaces
- Chrome extension community for best practices
- Open source contributors and testers

---

<div align="center">

**Made with ❤️ for the AI community**

[⭐ Star us on GitHub](https://github.com/contextzero/chrome-extension) • [🐛 Report Bug](https://github.com/contextzero/chrome-extension/issues) • [💡 Request Feature](https://github.com/contextzero/chrome-extension/issues)

</div>