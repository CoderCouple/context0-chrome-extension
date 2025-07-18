/**
 * Memory extraction patterns and utilities
 */
class MemoryExtractor {
  constructor() {
    // Pattern definitions for extracting facts from text
    this.patterns = {
      // Personal identity
      identity: [
        /(?:my name is|i'm|i am|call me)\s+([a-zA-Z\s]+?)(?:\s|$|[.,!?])/i,
        /(?:i go by|people call me)\s+([a-zA-Z\s]+?)(?:\s|$|[.,!?])/i
      ],
      
      // Location information
      location: [
        /(?:i live in|i'm from|i am from|i'm based in|i reside in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:my location is|i'm located in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i'm in|currently in)\s+([a-zA-Z\s,]+?)(?:\s|$|[.,!?])/i
      ],
      
      // Preferences and likes
      preference: [
        /(?:i like|i love|i enjoy|i prefer|i'm into)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:my favorite|i really like|i'm a fan of)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i hate|i dislike|i don't like|i can't stand)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Work and profession
      work: [
        /(?:i work at|i work for|my job is|i'm employed by)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i'm a|i am a|my profession is|my role is)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i do|my work involves|i specialize in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Education
      education: [
        /(?:i studied|i study|i'm studying|my degree is in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i went to|i attend|i attended)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i have a degree in|my major is|i majored in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Family and relationships
      family: [
        /(?:my wife|my husband|my partner|my spouse)\s+([^.,!?\n]*?)(?:[.,!?\n]|$)/i,
        /(?:i have|i've got)\s+(\d+)\s+(?:kids|children|sons|daughters)/i,
        /(?:my (?:mom|mother|dad|father|brother|sister|son|daughter))\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Hobbies and interests
      hobby: [
        /(?:in my free time|as a hobby|i enjoy|for fun)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:my hobbies include|my interests are|i'm interested in)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Goals and aspirations
      goal: [
        /(?:my goal is|i want to|i hope to|i plan to|i aim to)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:i'm working towards|i'm trying to|my objective is)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Health and medical
      health: [
        /(?:i have|i suffer from|i'm allergic to|i can't eat)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i,
        /(?:my condition|my allergy|my medication)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ],
      
      // Technology and tools
      tech: [
        /(?:i use|i work with|i'm familiar with|i know)\s+([^.,!?\n]+?)(?:\s+(?:programming|software|tool|language|framework))/i,
        /(?:my setup|my computer|my phone|my device)\s+([^.,!?\n]+?)(?:[.,!?\n]|$)/i
      ]
    };
    
    // Stop words to filter out
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'can', 'that', 'which', 'who', 'what', 'where',
      'when', 'why', 'how', 'this', 'these', 'that', 'those'
    ]);
  }
  
  /**
   * Extract facts from text using pattern matching
   * @param {string} text - Input text to analyze
   * @returns {Array} Array of extracted facts
   */
  extractFacts(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    const facts = [];
    const cleanText = this.cleanText(text);
    
    // Process each pattern category
    for (const [category, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const matches = cleanText.match(pattern);
        if (matches && matches[1]) {
          const content = this.cleanExtractedContent(matches[1]);
          
          if (this.isValidFact(content, category)) {
            facts.push({
              type: category,
              content: content,
              original: matches[0],
              confidence: this.calculateConfidence(matches[0], pattern),
              timestamp: Date.now()
            });
          }
        }
      }
    }
    
    // Remove duplicates and return
    return this.deduplicateFacts(facts);
  }
  
  /**
   * Clean and normalize text for processing
   * @param {string} text - Input text
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      .toLowerCase()
      .replace(/[""'']/g, '"')  // Normalize quotes
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }
  
  /**
   * Clean extracted content
   * @param {string} content - Extracted content
   * @returns {string} Cleaned content
   */
  cleanExtractedContent(content) {
    return content
      .trim()
      .replace(/^(and|or|but)\s+/i, '')  // Remove leading conjunctions
      .replace(/\s+/g, ' ')              // Normalize whitespace
      .replace(/[.,!?]+$/, '');          // Remove trailing punctuation
  }
  
  /**
   * Validate if extracted content is a meaningful fact
   * @param {string} content - Extracted content
   * @param {string} category - Fact category
   * @returns {boolean} Whether the fact is valid
   */
  isValidFact(content, category) {
    // Basic validation
    if (!content || content.length < 2 || content.length > 200) {
      return false;
    }
    
    // Check if it's mostly stop words
    const words = content.toLowerCase().split(/\s+/);
    const meaningfulWords = words.filter(word => !this.stopWords.has(word));
    
    if (meaningfulWords.length === 0) {
      return false;
    }
    
    // Category-specific validation
    switch (category) {
      case 'identity':
        return /^[a-zA-Z\s]+$/.test(content) && words.length <= 4;
      
      case 'location':
        return words.length <= 10 && !/^(here|there|somewhere)$/i.test(content);
      
      case 'work':
        return words.length <= 15;
      
      default:
        return true;
    }
  }
  
  /**
   * Calculate confidence score for a match
   * @param {string} match - The matched text
   * @param {RegExp} pattern - The pattern used
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(match, pattern) {
    let confidence = 0.5; // Base confidence
    
    // Longer matches tend to be more specific
    if (match.length > 20) confidence += 0.2;
    
    // Complete sentence matches are more reliable
    if (match.includes('.') || match.includes('!')) confidence += 0.1;
    
    // Specific verbs indicate higher confidence
    if (/\b(am|is|work|live|like|love|hate)\b/i.test(match)) {
      confidence += 0.2;
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Remove duplicate facts
   * @param {Array} facts - Array of facts
   * @returns {Array} Deduplicated facts
   */
  deduplicateFacts(facts) {
    const seen = new Set();
    return facts.filter(fact => {
      const key = `${fact.type}:${fact.content.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Extract context keywords from text
   * @param {string} text - Input text
   * @returns {Array} Array of keywords
   */
  extractKeywords(text) {
    if (!text) return [];
    
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !this.stopWords.has(word) &&
        !/^\d+$/.test(word)
      );
    
    // Count word frequency
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Return top keywords sorted by frequency
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }
  
  /**
   * Categorize general text content
   * @param {string} text - Input text
   * @returns {string} Predicted category
   */
  categorizeContent(text) {
    const lowerText = text.toLowerCase();
    
    // Simple keyword-based categorization
    if (/\b(work|job|career|company|office|business)\b/.test(lowerText)) {
      return 'work';
    }
    
    if (/\b(family|wife|husband|child|parent|brother|sister)\b/.test(lowerText)) {
      return 'family';
    }
    
    if (/\b(like|love|enjoy|hobby|interest|favorite)\b/.test(lowerText)) {
      return 'preference';
    }
    
    if (/\b(live|from|location|city|country|address)\b/.test(lowerText)) {
      return 'location';
    }
    
    if (/\b(study|school|university|degree|education)\b/.test(lowerText)) {
      return 'education';
    }
    
    if (/\b(health|medical|condition|allergy|medication)\b/.test(lowerText)) {
      return 'health';
    }
    
    return 'general';
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MemoryExtractor = MemoryExtractor;
}