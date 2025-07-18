# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ContextZero is a Chrome extension that serves as a personal memory agent for AI conversations. It automatically captures and extracts facts from conversations on AI platforms (ChatGPT, Claude, Perplexity, Grok) and injects relevant context into future prompts to provide more personalized responses.

## Architecture

### Core Components

- **background.js**: Service worker that handles extension lifecycle, message routing, and background operations
- **shared/**: Core business logic shared across all content scripts
  - `memory-manager.js`: Central memory management system with fact extraction, storage, and retrieval
  - `storage.js`: Local storage wrapper for Chrome storage API with memory persistence
  - `memory-extractor.js`: Pattern-based fact extraction from conversations (identity, location, preferences, work, etc.)
  - `ui-components.js`: Reusable UI components for memory panels and interactions
- **content-scripts/**: Platform-specific adapters for different AI platforms
  - `chatgpt/chatgpt.js`: ChatGPT interface integration
  - `claude/claude.js`: Claude.ai interface integration  
  - `perplexity/perplexity.js`: Perplexity.ai interface integration
  - `grok.js`: Grok/X.ai interface integration (referenced in manifest)
- **popup.js**: Extension popup interface for viewing memories and settings
- **manifest.json**: Chrome extension configuration with content script injection rules

### Key Data Flow

1. Content scripts capture user messages and AI responses
2. MemoryExtractor processes text using regex patterns to extract facts
3. MemoryManager stores facts with metadata (type, category, confidence, platform)
4. When users type new prompts, relevant memories are searched and injected as context
5. Background script handles cross-tab communication and storage operations

### Memory System

- **Storage Keys**: `contextzero_memories`, `contextzero_settings`, `contextzero_user_data`
- **Memory Structure**: Each memory has id, content, metadata (type, category, confidence, platform), timestamp
- **Fact Categories**: identity, location, preference, work, education, family, hobby, goal, health, tech
- **Search**: Simple scoring system based on keyword matching and recency

## Common Development Tasks

### Testing the Extension

#### Manual Testing
1. Load extension in Chrome's developer mode
2. Navigate to supported platforms (ChatGPT, Claude, Perplexity, Grok, Gemini, DeepSeek)
3. Test memory extraction by having conversations with personal information
4. Verify memory injection by checking enhanced prompts
5. Use popup interface to view stored memories and statistics

#### Automated Testing
1. Navigate to any supported platform
2. Open DevTools console
3. Run comprehensive tests: `new TestRunner().runAll()`
4. Run platform-specific tests: `new AllPlatformsTests().runForCurrentPlatform()`
5. View test results and debug any failures

#### Test Files
- `tests/test-framework.js` - Main testing framework
- `tests/test-runner.js` - Test orchestration and reporting
- `tests/chatgpt-tests.js` - ChatGPT-specific tests
- `tests/claude-tests.js` - Claude-specific tests  
- `tests/all-platforms-tests.js` - Universal platform tests

### Adding New Platform Support

1. Create new content script in `content-scripts/[platform]/`
2. Implement platform-specific adapter class with DOM selectors
3. Add platform to `manifest.json` content scripts array
4. Update background script's supported domains list
5. Test memory extraction and injection for the new platform

### Debugging

- Enable `debugMode` in settings to see detailed console logs
- Use Chrome DevTools to inspect storage: `chrome.storage.local.get()`
- Monitor background script logs for message routing issues
- Check content script injection on page load

## Platform-Specific Notes

- **ChatGPT**: Uses `#prompt-textarea` selector, requires waiting for dynamic DOM loading
- **Claude**: Monitors for Claude-specific message containers and input fields, uses contenteditable div
- **Perplexity**: Different UI structure requires custom selectors, search-based interaction
- **Grok**: Twitter-style interface with message threading considerations
- **Gemini**: Multiple Google domains (gemini.google.com, bard.google.com, ai.google.dev), mixed input types
- **DeepSeek**: Flexible input handling for different interface configurations

## Security Considerations

- Only processes text content, no sensitive data handling
- Uses Chrome's local storage API for data persistence
- Context menu integration for manual memory management
- No external API calls or data transmission