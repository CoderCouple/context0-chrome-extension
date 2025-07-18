# ContextZero Data Flow Documentation

## Overview

This document provides a detailed explanation of how data flows through the ContextZero Chrome extension, from user input to memory storage and retrieval.

## High-Level Data Flow

```
User Input → Platform Capture → Memory Extraction → Local Storage → Memory Search → Context Injection
```

## Detailed Data Flow Diagrams

### 1. Memory Extraction Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Memory Extraction Process                                │
└─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   User Types    │
    │   Message in    │──────────────────────────────────────────────────────────┐
    │   AI Platform   │                                                          │
    └─────────────────┘                                                          │
                                                                                 │
    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
    │   User Clicks   │    │   User Presses  │    │   Auto-Capture  │          │
    │   Send Button   │    │   Enter Key     │    │   on Message    │          │
    │                 │    │                 │    │   Detection     │          │
    └─────────────────┘    └─────────────────┘    └─────────────────┘          │
            │                       │                       │                  │
            └───────────────────────┼───────────────────────┘                  │
                                    │                                          │
                                    ▼                                          │
                        ┌─────────────────┐                                    │
                        │   Platform      │                                    │
                        │   Adapter       │◄───────────────────────────────────┘
                        │   Captures      │
                        │   Message       │
                        └─────────────────┘
                                    │
                                    ▼
                        ┌─────────────────┐
                        │   Memory        │
                        │   Extractor     │
                        │   Processes     │
                        │   Text          │
                        └─────────────────┘
                                    │
                                    ▼
                        ┌─────────────────┐
                        │   Pattern       │
                        │   Matching      │
                        │   Engine        │
                        │   Extracts      │
                        │   Facts         │
                        └─────────────────┘
                                    │
                                    ▼
                        ┌─────────────────┐
                        │   Memory        │
                        │   Manager       │
                        │   Stores        │
                        │   Memories      │
                        └─────────────────┘
                                    │
                                    ▼
                        ┌─────────────────┐
                        │   Chrome        │
                        │   Local         │
                        │   Storage       │
                        └─────────────────┘
```

### 2. Memory Retrieval Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            Memory Retrieval Process                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │   User Types    │
    │   New Prompt    │
    │   in AI         │
    │   Platform      │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   User Clicks   │
    │   🧠 Memory     │
    │   Button        │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Memory        │
    │   Manager       │
    │   Receives      │
    │   Search        │
    │   Request       │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Search        │
    │   Algorithm     │
    │   Processes     │
    │   Query         │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Chrome        │
    │   Local         │
    │   Storage       │
    │   Searched      │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Relevance     │
    │   Scoring &     │
    │   Ranking       │
    │   Applied       │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Memory        │
    │   Selection     │
    │   Modal         │
    │   Displayed     │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   User Selects  │
    │   Relevant      │
    │   Memories      │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Selected      │
    │   Memories      │
    │   Formatted     │
    │   for Injection │
    └─────────────────┘
                │
                ▼
    ┌─────────────────┐
    │   Formatted     │
    │   Context       │
    │   Injected      │
    │   into Prompt   │
    └─────────────────┘
```

### 3. Cross-Component Communication

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        Component Communication Flow                                 │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│   Content       │                    │   Background    │                    │   Popup         │
│   Script        │                    │   Service       │                    │   Interface     │
│   (Platform     │                    │   Worker        │                    │                 │
│   Adapter)      │                    │                 │                    │                 │
└─────────────────┘                    └─────────────────┘                    └─────────────────┘
         │                                       │                                       │
         │ chrome.runtime.sendMessage()         │                                       │
         │────────────────────────────────────►│                                       │
         │                                     │                                       │
         │                                     │ chrome.runtime.sendMessage()         │
         │                                     │────────────────────────────────────►│
         │                                     │                                       │
         │                                     │◄────────────────────────────────────│
         │                                     │ Response                              │
         │                                     │                                       │
         │◄────────────────────────────────────│                                       │
         │ Response                            │                                       │
         │                                     │                                       │
         │                                     │                                       │
         │ Storage Operations                  │                                       │
         │────────────────────────────────────►│                                       │
         │                                     │                                       │
         │                                     │ Storage Operations                    │
         │                                     │────────────────────────────────────►│
         │                                     │                                       │
```

## Component-Level Data Flow

### 1. Content Script Data Flow

#### Input Capture
```javascript
// Event listeners capture user input
document.addEventListener('click', async (event) => {
  const sendButton = event.target.closest(this.selectors.sendButton);
  if (sendButton) {
    await this.captureUserMessage();
  }
});

document.addEventListener('keydown', async (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    const input = event.target;
    if (input.matches && input.matches(this.selectors.input)) {
      setTimeout(() => this.captureUserMessage(), 100);
    }
  }
});
```

#### Message Processing
```javascript
async captureUserMessage() {
  const inputText = this.getInputText();
  if (!inputText.trim() || inputText === this.lastProcessedMessage) {
    return;
  }
  
  this.lastProcessedMessage = inputText;
  
  // Extract and store memories
  const memories = await this.memoryManager.storeMemory(inputText, {
    platform: this.platform,
    url: window.location.href,
    timestamp: Date.now()
  });
}
```

### 2. Memory Manager Data Flow

#### Memory Storage
```javascript
async storeMemory(content, metadata = {}) {
  const cleanContent = this.cleanContent(content);
  const facts = this.extractor.extractFacts(cleanContent);
  const storedMemories = [];
  
  // Store each extracted fact as a separate memory
  for (const fact of facts) {
    const memory = {
      id: this.generateId(),
      content: fact.content,
      originalText: content,
      metadata: {
        type: fact.type,
        category: fact.type,
        confidence: fact.confidence,
        platform: metadata.platform || 'unknown',
        source: 'auto_extract',
        keywords: this.extractor.extractKeywords(fact.content),
        ...metadata
      },
      timestamp: Date.now(),
      lastAccessed: Date.now(),
      accessCount: 0
    };
    
    const savedMemory = await this.storage.saveMemory(memory);
    if (savedMemory) {
      storedMemories.push(savedMemory);
    }
  }
  
  return storedMemories;
}
```

#### Memory Search
```javascript
async searchMemories(query, options = {}) {
  const {
    limit = 10,
    threshold = 0.3,
    includeGeneral = true,
    platforms = [],
    categories = [],
    timeRange = null
  } = options;
  
  let memories = await this.storage.searchMemories(query, limit * 2);
  
  // Apply filters
  if (platforms.length > 0) {
    memories = memories.filter(m => platforms.includes(m.metadata.platform));
  }
  
  if (categories.length > 0) {
    memories = memories.filter(m => categories.includes(m.metadata.category));
  }
  
  // Apply threshold filter
  memories = memories.filter(m => (m.score || 0) >= threshold);
  
  // Enhanced scoring
  memories = memories.map(memory => {
    let enhancedScore = memory.score || 0;
    
    // Boost recent memories
    const daysSince = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    enhancedScore += Math.max(0, 2 - daysSince * 0.1);
    
    // Boost frequently accessed memories
    enhancedScore += Math.min(memory.accessCount * 0.1, 1);
    
    // Boost high-confidence memories
    enhancedScore += (memory.metadata.confidence || 0) * 2;
    
    return { ...memory, enhancedScore };
  });
  
  // Sort by enhanced score and limit results
  return memories
    .sort((a, b) => b.enhancedScore - a.enhancedScore)
    .slice(0, limit);
}
```

### 3. Storage Layer Data Flow

#### Storage Operations
```javascript
async saveMemory(memory) {
  const memories = await this.getMemories();
  
  // Check for duplicates
  const duplicate = memories.find(m => 
    m.content === memory.content && 
    m.metadata.type === memory.metadata.type
  );
  
  if (duplicate) {
    return duplicate;
  }
  
  // Add new memory
  memories.push(memory);
  
  // Limit storage size
  if (memories.length > this.maxMemories) {
    memories.sort((a, b) => b.timestamp - a.timestamp);
    memories.splice(this.maxMemories);
  }
  
  await chrome.storage.local.set({
    [this.storageKey]: memories
  });
  
  return memory;
}
```

#### Search Implementation
```javascript
async searchMemories(query, limit = 10) {
  const memories = await this.getMemories();
  
  if (!query || query.trim() === '') {
    return memories.slice(0, limit);
  }
  
  const queryLower = query.toLowerCase();
  
  // Simple relevance scoring
  const scored = memories.map(memory => {
    const contentLower = memory.content.toLowerCase();
    let score = 0;
    
    // Exact phrase match
    if (contentLower.includes(queryLower)) {
      score += 10;
    }
    
    // Word matches
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    
    queryWords.forEach(word => {
      if (contentWords.includes(word)) {
        score += 5;
      }
    });
    
    // Recency bonus
    const daysSinceCreated = (Date.now() - memory.timestamp) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 5 - daysSinceCreated);
    
    return { ...memory, score };
  });
  
  // Sort by score and return top results
  return scored
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
```

## Memory Extraction Process

### Pattern Matching Flow

```javascript
extractFacts(text) {
  const facts = [];
  const cleanText = this.cleanText(text);
  
  // Process each category
  Object.entries(this.patterns).forEach(([category, patterns]) => {
    patterns.forEach(pattern => {
      const matches = cleanText.match(pattern);
      if (matches && matches[1]) {
        const content = matches[1].trim();
        if (content.length > 2 && content.length < 200) {
          facts.push({
            type: category,
            content: content,
            confidence: this.calculateConfidence(content, pattern, category),
            originalMatch: matches[0]
          });
        }
      }
    });
  });
  
  return this.deduplicateFacts(facts);
}
```

### Confidence Calculation
```javascript
calculateConfidence(content, pattern, category) {
  let confidence = 0.5; // Base confidence
  
  // Length bonus
  if (content.length > 10) confidence += 0.1;
  if (content.length > 20) confidence += 0.1;
  
  // Category-specific bonuses
  switch (category) {
    case 'identity':
      if (/^[A-Z][a-z]+ [A-Z][a-z]+$/.test(content)) confidence += 0.2;
      break;
    case 'location':
      if (/[A-Z][a-z]+,\s*[A-Z]{2}/.test(content)) confidence += 0.2;
      break;
    case 'work':
      if (/at [A-Z][a-z]+/.test(content)) confidence += 0.2;
      break;
  }
  
  // Pattern specificity bonus
  if (pattern.source.includes('my name is')) confidence += 0.2;
  if (pattern.source.includes('i work at')) confidence += 0.2;
  
  return Math.min(confidence, 1.0);
}
```

## UI Data Flow

### Memory Button Integration

```javascript
async handleMemoryButtonClick() {
  const inputText = this.getInputText();
  if (!inputText.trim()) {
    alert('Please enter a message first');
    return;
  }
  
  // Show loading state
  const button = document.querySelector('.contextzero-memory-btn');
  button.innerHTML = '⏳';
  button.disabled = true;
  
  // Search for relevant memories
  const memories = await this.memoryManager.searchMemories(inputText, {
    limit: 10,
    threshold: 0.3,
    includeGeneral: true
  });
  
  // Restore button
  button.innerHTML = '🧠';
  button.disabled = false;
  
  if (memories.length === 0) {
    alert('No relevant memories found');
    return;
  }
  
  // Show memory selection modal
  this.showMemoryModal(memories);
}
```

### Memory Injection Process

```javascript
injectMemories(selectedMemories) {
  const currentText = this.getInputText();
  const formattedMemories = this.memoryManager.formatMemoriesForInjection(selectedMemories, {
    groupByCategory: true,
    maxLength: 800
  });
  
  const newText = currentText + formattedMemories;
  this.setInputText(newText);
  
  // Focus and position cursor
  const input = this.getInputElement();
  if (input) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}
```

## Background Script Data Flow

### Message Routing

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    const storage = new LocalStorage();
    const memoryManager = new MemoryManager();
    
    switch (request.action) {
      case 'addMemory':
        const memories = await memoryManager.storeMemory(request.content, request.metadata);
        sendResponse({ success: true, memories });
        break;
        
      case 'searchMemories':
        const results = await memoryManager.searchMemories(request.query, request.options);
        sendResponse({ success: true, memories: results });
        break;
        
      case 'getStatistics':
        const stats = await memoryManager.getStatistics();
        sendResponse({ success: true, statistics: stats });
        break;
    }
  })();
  
  return true; // Indicates async response
});
```

## Data Validation and Sanitization

### Input Sanitization
```javascript
cleanContent(content) {
  return content
    .replace(/\n+/g, ' ')           // Replace newlines with spaces
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[""'']/g, '"')        // Normalize quotes
    .replace(/<[^>]*>/g, '')        // Remove HTML tags
    .trim();
}
```

### Memory Validation
```javascript
validateMemory(memory) {
  // Required fields
  if (!memory.id || !memory.content || !memory.metadata) {
    return false;
  }
  
  // Content validation
  if (memory.content.length < 2 || memory.content.length > 1000) {
    return false;
  }
  
  // Metadata validation
  if (!memory.metadata.type || !memory.metadata.platform) {
    return false;
  }
  
  // Timestamp validation
  if (!memory.timestamp || memory.timestamp > Date.now()) {
    return false;
  }
  
  return true;
}
```

## Error Handling and Recovery

### Error Boundaries
```javascript
async storeMemory(content, metadata) {
  try {
    const memories = await this.processMemory(content, metadata);
    return memories;
  } catch (error) {
    console.error('Memory storage error:', error);
    // Attempt recovery
    try {
      const fallbackMemory = this.createFallbackMemory(content, metadata);
      return await this.storage.saveMemory(fallbackMemory);
    } catch (fallbackError) {
      console.error('Fallback memory storage failed:', fallbackError);
      return [];
    }
  }
}
```

### Storage Recovery
```javascript
async recoverFromStorageError() {
  try {
    // Check storage quota
    const estimate = await navigator.storage.estimate();
    if (estimate.usage > estimate.quota * 0.9) {
      // Storage almost full, cleanup old memories
      await this.cleanupOldMemories();
    }
    
    // Validate stored data
    const memories = await this.getMemories();
    const validMemories = memories.filter(m => this.validateMemory(m));
    
    if (validMemories.length !== memories.length) {
      // Some memories were invalid, save only valid ones
      await this.saveMemories(validMemories);
    }
    
    return true;
  } catch (error) {
    console.error('Storage recovery failed:', error);
    return false;
  }
}
```

## Performance Optimization

### Caching Strategy
```javascript
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  get(key) {
    const entry = this.cache.get(key);
    if (entry && Date.now() - entry.timestamp < this.cacheTimeout) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### Debounced Operations
```javascript
class DebouncedOperations {
  constructor() {
    this.timeouts = new Map();
  }
  
  debounce(key, operation, delay = 300) {
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }
    
    const timeout = setTimeout(() => {
      operation();
      this.timeouts.delete(key);
    }, delay);
    
    this.timeouts.set(key, timeout);
  }
}
```

This comprehensive data flow documentation shows how ContextZero processes user input through various stages while maintaining privacy and performance. All processing occurs locally on the user's device, with no external data transmission.