/**
 * UI Components for ContextZero Chrome Extension
 */

/**
 * Memory Modal Component for selecting and managing memories
 */
class MemoryModal {
  constructor(memories, options = {}) {
    this.memories = memories;
    this.options = {
      onSelect: options.onSelect || (() => {}),
      onClose: options.onClose || (() => {}),
      title: options.title || 'Select Relevant Memories',
      allowMultiple: options.allowMultiple !== false
    };
    this.selectedMemories = new Set();
  }

  /**
   * Render the modal element
   * @returns {HTMLElement} Modal element
   */
  render() {
    const modal = document.createElement('div');
    modal.className = 'contextzero-modal';
    modal.innerHTML = this.getModalHTML();
    
    // Add event listeners
    this.attachEventListeners(modal);
    
    return modal;
  }

  /**
   * Generate modal HTML
   * @returns {string} Modal HTML
   */
  getModalHTML() {
    return `
      <div class="contextzero-modal-overlay">
        <div class="contextzero-modal-content">
          <div class="contextzero-modal-header">
            <h3>${this.options.title}</h3>
            <button class="contextzero-close-btn" type="button">&times;</button>
          </div>
          <div class="contextzero-modal-body">
            ${this.memories.length === 0 ? 
              '<p class="no-memories">No relevant memories found.</p>' :
              this.renderMemoryList()
            }
          </div>
          <div class="contextzero-modal-footer">
            <button class="contextzero-btn contextzero-btn-secondary" id="contextzero-cancel">Cancel</button>
            <button class="contextzero-btn contextzero-btn-primary" id="contextzero-add-memories" 
                    ${this.memories.length === 0 ? 'disabled' : ''}>
              Add Selected (${this.selectedMemories.size})
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render the list of memories
   * @returns {string} Memory list HTML
   */
  renderMemoryList() {
    return `
      <div class="contextzero-memory-list">
        ${this.memories.map((memory, index) => `
          <div class="contextzero-memory-item" data-memory-id="${memory.id}">
            <label class="contextzero-memory-label">
              <input type="${this.options.allowMultiple ? 'checkbox' : 'radio'}" 
                     name="memory-select" 
                     value="${memory.id}"
                     class="contextzero-memory-checkbox">
              <div class="contextzero-memory-content">
                <div class="contextzero-memory-text">${this.escapeHtml(memory.content)}</div>
                <div class="contextzero-memory-meta">
                  <span class="contextzero-memory-type">${memory.metadata.type}</span>
                  <span class="contextzero-memory-score">Score: ${(memory.score || memory.enhancedScore || 0).toFixed(1)}</span>
                  <span class="contextzero-memory-date">${this.formatDate(memory.timestamp)}</span>
                </div>
              </div>
            </label>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Attach event listeners to modal
   * @param {HTMLElement} modal - Modal element
   */
  attachEventListeners(modal) {
    // Close button
    modal.querySelector('.contextzero-close-btn').addEventListener('click', () => {
      this.close();
    });

    // Cancel button
    modal.querySelector('#contextzero-cancel').addEventListener('click', () => {
      this.close();
    });

    // Add memories button
    modal.querySelector('#contextzero-add-memories').addEventListener('click', () => {
      this.addSelectedMemories();
    });

    // Memory selection
    modal.addEventListener('change', (e) => {
      if (e.target.classList.contains('contextzero-memory-checkbox')) {
        this.handleMemorySelection(e.target);
      }
    });

    // Close on overlay click
    modal.querySelector('.contextzero-modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('contextzero-modal-overlay')) {
        this.close();
      }
    });

    // Prevent modal close on content click
    modal.querySelector('.contextzero-modal-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  /**
   * Handle memory selection change
   * @param {HTMLInputElement} checkbox - Checkbox element
   */
  handleMemorySelection(checkbox) {
    const memoryId = checkbox.value;
    
    if (checkbox.checked) {
      this.selectedMemories.add(memoryId);
    } else {
      this.selectedMemories.delete(memoryId);
    }

    // Update button text
    const button = checkbox.closest('.contextzero-modal').querySelector('#contextzero-add-memories');
    button.textContent = `Add Selected (${this.selectedMemories.size})`;
    button.disabled = this.selectedMemories.size === 0;
  }

  /**
   * Add selected memories and close modal
   */
  addSelectedMemories() {
    const selectedMemoryObjects = this.memories.filter(m => 
      this.selectedMemories.has(m.id)
    );
    
    this.options.onSelect(selectedMemoryObjects);
    this.close();
  }

  /**
   * Close the modal
   */
  close() {
    this.options.onClose();
    this.remove();
  }

  /**
   * Remove modal from DOM
   */
  remove() {
    const modal = document.querySelector('.contextzero-modal');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Timestamp
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 72) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

/**
 * Memory Panel Component for showing memory statistics and management
 */
class MemoryPanel {
  constructor(options = {}) {
    this.options = {
      onClose: options.onClose || (() => {}),
      onDeleteMemory: options.onDeleteMemory || (() => {}),
      onClearAll: options.onClearAll || (() => {}),
      onExport: options.onExport || (() => {}),
      onImport: options.onImport || (() => {})
    };
    this.memories = [];
    this.stats = {};
  }

  /**
   * Load and display memories
   * @param {Array} memories - Array of memory objects
   * @param {Object} stats - Statistics object
   */
  async loadMemories(memories, stats) {
    this.memories = memories;
    this.stats = stats;
    this.render();
  }

  /**
   * Render the panel
   */
  render() {
    const panel = document.createElement('div');
    panel.className = 'contextzero-panel';
    panel.innerHTML = this.getPanelHTML();
    
    // Remove existing panel
    const existing = document.querySelector('.contextzero-panel');
    if (existing) {
      existing.remove();
    }
    
    // Add to body
    document.body.appendChild(panel);
    
    // Attach event listeners
    this.attachEventListeners(panel);
  }

  /**
   * Generate panel HTML
   * @returns {string} Panel HTML
   */
  getPanelHTML() {
    return `
      <div class="contextzero-panel-overlay">
        <div class="contextzero-panel-content">
          <div class="contextzero-panel-header">
            <h3>🧠 ContextZero Memories</h3>
            <button class="contextzero-close-btn" type="button">&times;</button>
          </div>
          
          <div class="contextzero-panel-stats">
            <div class="contextzero-stat">
              <span class="contextzero-stat-value">${this.stats.totalMemories || 0}</span>
              <span class="contextzero-stat-label">Total Memories</span>
            </div>
            <div class="contextzero-stat">
              <span class="contextzero-stat-value">${this.stats.memoriesCreated || 0}</span>
              <span class="contextzero-stat-label">Created</span>
            </div>
            <div class="contextzero-stat">
              <span class="contextzero-stat-value">${this.stats.promptsEnhanced || 0}</span>
              <span class="contextzero-stat-label">Enhanced</span>
            </div>
          </div>
          
          <div class="contextzero-panel-actions">
            <button class="contextzero-btn contextzero-btn-small" id="contextzero-export">Export</button>
            <button class="contextzero-btn contextzero-btn-small" id="contextzero-import">Import</button>
            <button class="contextzero-btn contextzero-btn-danger contextzero-btn-small" id="contextzero-clear-all">Clear All</button>
          </div>
          
          <div class="contextzero-panel-body">
            <div class="contextzero-memory-search">
              <input type="text" 
                     placeholder="Search memories..." 
                     class="contextzero-search-input" 
                     id="contextzero-search">
            </div>
            
            <div class="contextzero-memory-categories">
              ${this.renderCategories()}
            </div>
            
            <div class="contextzero-memory-list-panel">
              ${this.renderMemoryListPanel()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render memory categories
   * @returns {string} Categories HTML
   */
  renderCategories() {
    const categories = this.stats.categories || {};
    return Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([category, count]) => `
        <span class="contextzero-category-tag" data-category="${category}">
          ${category} (${count})
        </span>
      `).join('');
  }

  /**
   * Render memory list for panel
   * @returns {string} Memory list HTML
   */
  renderMemoryListPanel() {
    if (this.memories.length === 0) {
      return '<p class="contextzero-no-memories">No memories found. Start a conversation to create memories!</p>';
    }

    return `
      <div class="contextzero-memory-items">
        ${this.memories.slice(0, 20).map(memory => `
          <div class="contextzero-memory-item-panel" data-memory-id="${memory.id}">
            <div class="contextzero-memory-content-panel">
              <div class="contextzero-memory-text-panel">${this.escapeHtml(memory.content)}</div>
              <div class="contextzero-memory-meta-panel">
                <span class="contextzero-memory-type-panel">${memory.metadata.type}</span>
                <span class="contextzero-memory-platform">${memory.metadata.platform}</span>
                <span class="contextzero-memory-date-panel">${this.formatDate(memory.timestamp)}</span>
              </div>
            </div>
            <button class="contextzero-delete-memory" data-memory-id="${memory.id}" title="Delete memory">
              🗑️
            </button>
          </div>
        `).join('')}
        ${this.memories.length > 20 ? `<p class="contextzero-more-memories">And ${this.memories.length - 20} more...</p>` : ''}
      </div>
    `;
  }

  /**
   * Attach event listeners
   * @param {HTMLElement} panel - Panel element
   */
  attachEventListeners(panel) {
    // Close button
    panel.querySelector('.contextzero-close-btn').addEventListener('click', () => {
      this.close();
    });

    // Action buttons
    panel.querySelector('#contextzero-export').addEventListener('click', () => {
      this.options.onExport();
    });

    panel.querySelector('#contextzero-import').addEventListener('click', () => {
      this.options.onImport();
    });

    panel.querySelector('#contextzero-clear-all').addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all memories? This cannot be undone.')) {
        this.options.onClearAll();
      }
    });

    // Delete individual memories
    panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('contextzero-delete-memory')) {
        const memoryId = e.target.dataset.memoryId;
        if (confirm('Delete this memory?')) {
          this.options.onDeleteMemory(memoryId);
        }
      }
    });

    // Close on overlay click
    panel.querySelector('.contextzero-panel-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('contextzero-panel-overlay')) {
        this.close();
      }
    });

    // Prevent panel close on content click
    panel.querySelector('.contextzero-panel-content').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Search functionality
    const searchInput = panel.querySelector('#contextzero-search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.filterMemories(e.target.value);
      }, 300);
    });

    // Category filtering
    panel.addEventListener('click', (e) => {
      if (e.target.classList.contains('contextzero-category-tag')) {
        const category = e.target.dataset.category;
        this.filterByCategory(category);
      }
    });
  }

  /**
   * Filter memories by search term
   * @param {string} searchTerm - Search term
   */
  filterMemories(searchTerm) {
    const items = document.querySelectorAll('.contextzero-memory-item-panel');
    const term = searchTerm.toLowerCase();

    items.forEach(item => {
      const text = item.querySelector('.contextzero-memory-text-panel').textContent.toLowerCase();
      const visible = !term || text.includes(term);
      item.style.display = visible ? 'flex' : 'none';
    });
  }

  /**
   * Filter memories by category
   * @param {string} category - Category to filter by
   */
  filterByCategory(category) {
    const items = document.querySelectorAll('.contextzero-memory-item-panel');
    
    items.forEach(item => {
      const memoryId = item.dataset.memoryId;
      const memory = this.memories.find(m => m.id === memoryId);
      const visible = !category || memory?.metadata.type === category;
      item.style.display = visible ? 'flex' : 'none';
    });
  }

  /**
   * Close the panel
   */
  close() {
    this.options.onClose();
    this.remove();
  }

  /**
   * Remove panel from DOM
   */
  remove() {
    const panel = document.querySelector('.contextzero-panel');
    if (panel) {
      panel.remove();
    }
  }

  /**
   * Escape HTML characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format timestamp to readable date
   * @param {number} timestamp - Timestamp
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffHours < 72) {
      return `${Math.floor(diffHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MemoryModal = MemoryModal;
  window.MemoryPanel = MemoryPanel;
}