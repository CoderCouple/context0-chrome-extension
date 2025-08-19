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
      title: options.title || 'ContextZero',
      allowMultiple: options.allowMultiple !== false
    };
    this.selectedMemories = new Set();
    this.currentPage = 0;
    this.memoriesPerPage = 3; // Show 3 memories at a time
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
    const totalPages = Math.max(1, Math.ceil(this.memories.length / this.memoriesPerPage));
    const currentMemories = this.getCurrentMemories();
    
    return `
      <div class="contextzero-modal-overlay">
        <div class="contextzero-modal-content modern">
          <div class="contextzero-modal-header modern">
            <div class="header-left">
              <div class="logo-container">
                <svg class="logo-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="currentColor"/>
                  <circle cx="12" cy="4" r="2" fill="currentColor"/>
                  <circle cx="12" cy="20" r="2" fill="currentColor"/>
                  <circle cx="4" cy="12" r="2" fill="currentColor"/>
                  <circle cx="20" cy="12" r="2" fill="currentColor"/>
                </svg>
                <h3>${this.options.title}</h3>
              </div>
            </div>
            <div class="header-center">
              <button class="contextzero-btn contextzero-btn-primary add-to-prompt-btn" id="contextzero-add-to-prompt">
                Add All to Prompt →
              </button>
            </div>
            <div class="header-right">
              <button class="settings-btn" id="contextzero-settings-btn" title="Settings">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" stroke="currentColor" stroke-width="2"/>
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
              <button class="close-btn" id="contextzero-close-btn" title="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="contextzero-modal-body modern">
            ${this.memories.length === 0 ? 
              '<div class="no-memories modern">No relevant memories found.</div>' :
              this.renderModernMemoryView(currentMemories, totalPages)
            }
          </div>
          ${this.memories.length > 1 ? this.renderNavigation() : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render the modern memory view
   * @param {Array} memories - Current page memories to display
   * @param {number} totalPages - Total number of pages
   * @returns {string} Modern memory view HTML
   */
  renderModernMemoryView(memories, totalPages) {
    if (!memories || memories.length === 0) return '<div class="no-memories modern">No memories to display</div>';
    
    return `
      <div class="memory-section-header">
        <h4>${this.memories.length} Memor${this.memories.length === 1 ? 'y' : 'ies'}</h4>
      </div>
      <div class="modern-memory-container">
        ${memories.map(memory => `
          <div class="modern-memory-item" data-memory-id="${memory.id}">
            <div class="memory-content-wrapper">
              <div class="memory-main-content">
                <div class="memory-text">${this.escapeHtml(memory.content)}</div>
              </div>
              <div class="memory-actions">
                <button class="memory-action-btn add-memory-btn" data-memory-id="${memory.id}" title="Add this memory to prompt">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="memory-action-btn delete-memory-btn" data-memory-id="${memory.id}" title="Delete this memory">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div class="memory-metadata">
              <span class="memory-type-badge">${memory.metadata.type}</span>
              <span class="memory-platform">${memory.metadata.platform}</span>
              <span class="memory-date">${this.formatDate(memory.timestamp)}</span>
              ${memory.score || memory.enhancedScore ? 
                `<span class="memory-score">Score: ${(memory.score || memory.enhancedScore || 0).toFixed(1)}</span>` : 
                ''
              }
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Render navigation arrows
   * @returns {string} Navigation HTML
   */
  renderNavigation() {
    const totalPages = Math.ceil(this.memories.length / this.memoriesPerPage);
    const hasPrev = this.currentPage > 0;
    const hasNext = this.currentPage < totalPages - 1;
    
    return `
      <div class="contextzero-modal-navigation">
        <button class="nav-btn prev-btn" ${!hasPrev ? 'disabled' : ''} id="contextzero-prev-memory">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="nav-btn next-btn" ${!hasNext ? 'disabled' : ''} id="contextzero-next-memory">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    `;
  }

  /**
   * Get current memories based on pagination
   * @returns {Array} Current page memories
   */
  getCurrentMemories() {
    const startIndex = this.currentPage * this.memoriesPerPage;
    const endIndex = startIndex + this.memoriesPerPage;
    return this.memories.slice(startIndex, endIndex);
  }

  /**
   * Render the list of memories (legacy method - kept for compatibility)
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
    console.log('ContextZero: Attaching event listeners to modal');
    
    // Add All to Prompt button (main action)
    const addToPromptBtn = modal.querySelector('#contextzero-add-to-prompt');
    if (addToPromptBtn) {
      console.log('ContextZero: Found Add All to Prompt button');
      addToPromptBtn.addEventListener('click', () => {
        console.log('ContextZero: Add All to Prompt clicked');
        // Add ALL memories (not just current page)
        this.memories.forEach(memory => {
          this.selectedMemories.add(memory.id);
        });
        this.addSelectedMemories();
      });
    }

    // Settings button
    const settingsBtn = modal.querySelector('#contextzero-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        this.openSettings();
      });
    }

    // Close button
    const closeBtn = modal.querySelector('#contextzero-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Check if individual memory buttons exist
    const memoryButtons = modal.querySelectorAll('.add-memory-btn');
    console.log('ContextZero: Found', memoryButtons.length, 'individual memory add buttons');
    
    // Individual memory add button - use event delegation on modal
    modal.addEventListener('click', (e) => {
      console.log('ContextZero: Modal click event, target:', e.target);
      console.log('ContextZero: Target classes:', e.target.className);
      console.log('ContextZero: Target parent:', e.target.parentElement);
      
      const addBtn = e.target.closest('.add-memory-btn');
      if (addBtn) {
        console.log('ContextZero: Add memory button clicked');
        e.preventDefault();
        e.stopPropagation();
        
        const memoryId = addBtn.dataset.memoryId;
        console.log('ContextZero: Memory ID:', memoryId);
        // Clear previous selections and add only this memory
        this.selectedMemories.clear();
        this.selectedMemories.add(memoryId);
        console.log('ContextZero: Selected memories:', this.selectedMemories);
        this.addSelectedMemories();
      }
    }, true); // Use capture phase

    // Delete memory button
    modal.addEventListener('click', async (e) => {
      if (e.target.closest('.delete-memory-btn')) {
        const memoryId = e.target.closest('.delete-memory-btn').dataset.memoryId;
        const memory = this.memories.find(m => m.id === memoryId);
        
        if (memory && confirm(`Delete this memory?\n\n"${memory.content}"`)) {
          await this.deleteMemory(memoryId);
        }
      }
    });

    // Navigation buttons
    const prevBtn = modal.querySelector('#contextzero-prev-memory');
    const nextBtn = modal.querySelector('#contextzero-next-memory');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.navigateToPrevious();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.navigateToNext();
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (modal.style.display !== 'none') {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.navigateToPrevious();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.navigateToNext();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const currentMemories = this.getCurrentMemories();
          if (currentMemories && currentMemories.length > 0) {
            // Add all memories from the current page
            currentMemories.forEach(memory => {
              this.selectedMemories.add(memory.id);
            });
            this.addSelectedMemories();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.close();
        }
      }
    });

    // Legacy event listeners for compatibility
    const cancelBtn = modal.querySelector('#contextzero-cancel');
    const addMemoriesBtn = modal.querySelector('#contextzero-add-memories');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close();
      });
    }

    if (addMemoriesBtn) {
      addMemoriesBtn.addEventListener('click', () => {
        this.addSelectedMemories();
      });
    }

    // Memory selection (legacy)
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
    console.log('ContextZero: addSelectedMemories called');
    console.log('ContextZero: this.selectedMemories:', this.selectedMemories);
    console.log('ContextZero: this.memories:', this.memories);
    
    const selectedMemoryObjects = this.memories.filter(m => 
      this.selectedMemories.has(m.id)
    );
    
    console.log('ContextZero: Selected memory objects:', selectedMemoryObjects);
    console.log('ContextZero: Calling onSelect callback...');
    
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

  /**
   * Navigate to previous memory
   */
  navigateToPrevious() {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.updateModalContent();
    }
  }

  /**
   * Navigate to next memory
   */
  navigateToNext() {
    const totalPages = Math.ceil(this.memories.length / this.memoriesPerPage);
    if (this.currentPage < totalPages - 1) {
      this.currentPage++;
      this.updateModalContent();
    }
  }

  /**
   * Update modal content after navigation
   */
  updateModalContent() {
    const modal = document.querySelector('.contextzero-modal');
    if (modal) {
      const modalContent = modal.querySelector('.contextzero-modal-content');
      const newModal = document.createElement('div');
      newModal.innerHTML = this.getModalHTML();
      
      modalContent.innerHTML = newModal.querySelector('.contextzero-modal-content').innerHTML;
      this.attachEventListeners(modal);
    }
  }

  /**
   * Open settings menu
   */
  openSettings() {
    // For now, just show an alert - you can implement a settings modal later
    alert('Settings menu - coming soon!');
  }

  /**
   * Delete a memory
   * @param {string} memoryId - Memory ID to delete
   */
  async deleteMemory(memoryId) {
    try {
      // Delete from storage
      if (typeof LocalStorage !== 'undefined') {
        const storage = new LocalStorage();
        await storage.deleteMemory(memoryId);
      }
      
      // Delete from cloud if available
      if (typeof CloudAPI !== 'undefined') {
        const cloudAPI = new CloudAPI();
        await cloudAPI.init();
        if (cloudAPI.isCloudEnabled()) {
          try {
            await cloudAPI.deleteMemoryFromCloud(memoryId);
          } catch (error) {
            console.warn('Failed to delete from cloud:', error);
          }
        }
      }
      
      // Remove from current memories array
      this.memories = this.memories.filter(m => m.id !== memoryId);
      
      // If we deleted all memories on current page, go to previous page
      const currentMemories = this.getCurrentMemories();
      if (currentMemories.length === 0 && this.currentPage > 0) {
        this.currentPage--;
      }
      
      // Update the modal content
      this.updateModalContent();
      
      // Show success message
      AlertDialog.show('Memory deleted successfully', {
        type: 'success',
        targetElement: document.querySelector('.contextzero-modal-content'),
        position: 'top'
      });
      
    } catch (error) {
      console.error('Error deleting memory:', error);
      AlertDialog.show('Failed to delete memory', {
        type: 'error'
      });
    }
  }

  /**
   * Show memory options menu
   * @param {string} memoryId - Memory ID
   */
  showMemoryOptions(memoryId) {
    const memory = this.memories.find(m => m.id === memoryId);
    if (memory) {
      const action = confirm(`Memory: "${memory.content}"\n\nWould you like to delete this memory?`);
      if (action) {
        this.deleteMemory(memoryId);
      }
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

/**
 * Custom Alert Dialog Component
 */
class AlertDialog {
  constructor(message, options = {}) {
    this.message = message;
    this.options = {
      title: options.title || 'ContextZero',
      type: options.type || 'info', // info, warning, error, success
      buttonText: options.buttonText || 'OK',
      onClose: options.onClose || (() => {}),
      targetElement: options.targetElement || null, // Element to point to
      position: options.position || 'top' // top, bottom, left, right
    };
  }

  /**
   * Show the alert dialog
   */
  static show(message, options = {}) {
    const dialog = new AlertDialog(message, options);
    const element = dialog.render();
    document.body.appendChild(element);
    return dialog;
  }

  /**
   * Show as popover pointing to an element
   */
  static showPopover(message, targetElement, options = {}) {
    return AlertDialog.show(message, {
      ...options,
      targetElement
    });
  }

  /**
   * Render the alert dialog
   * @returns {HTMLElement} Alert dialog element
   */
  render() {
    const dialog = document.createElement('div');
    dialog.className = 'contextzero-alert-dialog';
    dialog.innerHTML = this.getDialogHTML();
    
    // Position as popover if target element provided
    if (this.options.targetElement) {
      this.positionPopover(dialog);
    }
    
    // Add event listeners
    this.attachEventListeners(dialog);
    
    return dialog;
  }

  /**
   * Position the dialog as a popover
   * @param {HTMLElement} dialog - Dialog element
   */
  positionPopover(dialog) {
    const target = this.options.targetElement;
    if (!target) return;

    // Get target element position
    const targetRect = target.getBoundingClientRect();
    const content = dialog.querySelector('.contextzero-alert-content');
    
    // Add popover class
    content.classList.add('popover');
    
    // Calculate position
    requestAnimationFrame(() => {
      const contentRect = content.getBoundingClientRect();
      let top, left;
      
      // Position above the button by default
      top = targetRect.top - contentRect.height - 12; // 12px gap
      left = targetRect.left + (targetRect.width / 2) - (contentRect.width / 2);
      
      // Ensure it stays within viewport
      if (top < 10) {
        // Position below if no room above
        top = targetRect.bottom + 12;
        content.classList.add('below');
      }
      
      if (left < 10) left = 10;
      if (left + contentRect.width > window.innerWidth - 10) {
        left = window.innerWidth - contentRect.width - 10;
      }
      
      content.style.position = 'fixed';
      content.style.top = `${top}px`;
      content.style.left = `${left}px`;
    });
  }

  /**
   * Generate alert dialog HTML
   * @returns {string} Dialog HTML
   */
  getDialogHTML() {
    const iconMap = {
      info: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 16v-4m0-4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      warning: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 9v4m0 4h.01M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      error: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M15 9l-6 6m0-6l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>`,
      success: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>`
    };

    const isPopover = !!this.options.targetElement;
    
    if (isPopover) {
      // Compact popover design
      return `
        <div class="contextzero-alert-overlay">
          <div class="contextzero-alert-content ${this.options.type} popover">
            <div class="popover-arrow"></div>
            <div class="popover-body">
              <p class="alert-message">${this.escapeHtml(this.message)}</p>
            </div>
          </div>
        </div>
      `;
    } else {
      // Full dialog design
      return `
        <div class="contextzero-alert-overlay">
          <div class="contextzero-alert-content ${this.options.type}">
            <div class="contextzero-alert-header">
              <div class="alert-icon ${this.options.type}">
                ${iconMap[this.options.type]}
              </div>
              <h3 class="alert-title">${this.options.title}</h3>
            </div>
            <div class="contextzero-alert-body">
              <p class="alert-message">${this.escapeHtml(this.message)}</p>
            </div>
            <div class="contextzero-alert-footer">
              <button class="contextzero-alert-btn" id="contextzero-alert-ok">
                ${this.options.buttonText}
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  /**
   * Attach event listeners
   * @param {HTMLElement} dialog - Dialog element
   */
  attachEventListeners(dialog) {
    const isPopover = !!this.options.targetElement;
    
    if (isPopover) {
      // Auto-dismiss popover after 3 seconds
      setTimeout(() => {
        this.close();
      }, 3000);
      
      // Click anywhere to dismiss
      setTimeout(() => {
        document.addEventListener('click', () => {
          this.close();
        }, { once: true });
      }, 100);
    } else {
      // OK button for full dialogs
      const okBtn = dialog.querySelector('#contextzero-alert-ok');
      if (okBtn) {
        okBtn.addEventListener('click', () => {
          this.close();
        });
        // Focus the OK button
        setTimeout(() => okBtn?.focus(), 100);
      }
    }

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Close the dialog
   */
  close() {
    this.options.onClose();
    this.remove();
  }

  /**
   * Remove dialog from DOM
   */
  remove() {
    const dialog = document.querySelector('.contextzero-alert-dialog');
    if (dialog) {
      dialog.remove();
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
}

/**
 * Sign In Dialog Component
 */
class SignInDialog {
  constructor(options = {}) {
    this.options = {
      onSignIn: options.onSignIn || (() => {}),
      onClose: options.onClose || (() => {})
    };
  }

  /**
   * Show the sign in dialog
   */
  static show(options = {}) {
    const dialog = new SignInDialog(options);
    const element = dialog.render();
    document.body.appendChild(element);
    return dialog;
  }

  /**
   * Render the dialog
   * @returns {HTMLElement} Dialog element
   */
  render() {
    const dialog = document.createElement('div');
    dialog.className = 'contextzero-signin-dialog';
    dialog.innerHTML = this.getDialogHTML();
    
    // Add event listeners
    this.attachEventListeners(dialog);
    
    return dialog;
  }

  /**
   * Generate dialog HTML
   * @returns {string} Dialog HTML
   */
  getDialogHTML() {
    return `
      <div class="contextzero-signin-overlay">
        <div class="contextzero-signin-content">
          <button class="signin-close-btn" id="contextzero-signin-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
          
          <h1 class="signin-title">Sign in to ContextZero</h1>
          
          <p class="signin-subtitle">
            Please sign in to access your memories and personalize your conversations!
          </p>
          
          <button class="signin-btn" id="contextzero-signin-btn">
            <svg class="signin-logo" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="currentColor"/>
              <circle cx="12" cy="4" r="2" fill="currentColor"/>
              <circle cx="12" cy="20" r="2" fill="currentColor"/>
              <circle cx="4" cy="12" r="2" fill="currentColor"/>
              <circle cx="20" cy="12" r="2" fill="currentColor"/>
              <path d="M12 7v2M12 15v2M7 12h2M15 12h2" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Sign in with ContextZero</span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Attach event listeners
   * @param {HTMLElement} dialog - Dialog element
   */
  attachEventListeners(dialog) {
    // Sign in button
    const signInBtn = dialog.querySelector('#contextzero-signin-btn');
    if (signInBtn) {
      signInBtn.addEventListener('click', () => {
        this.handleSignIn();
      });
    }

    // Close button
    const closeBtn = dialog.querySelector('#contextzero-signin-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Don't close on overlay click since there's no backdrop
    // Users must click X button or press Escape

    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  /**
   * Handle sign in
   */
  async handleSignIn() {
    try {
      // Show loading state
      const signInBtn = document.querySelector('#contextzero-sign-in-btn');
      if (signInBtn) {
        signInBtn.textContent = 'Signing in...';
        signInBtn.disabled = true;
      }
      
      // Start authentication flow
      if (typeof ClerkAuth !== 'undefined') {
        const clerkAuth = new ClerkAuth();
        
        // Start polling and open sign-in page
        clerkAuth.startAuthFlow()
          .then((authData) => {
            // Authentication successful
            console.log('ContextZero: Authentication successful');
            
            if (this.options.onSignIn) {
              this.options.onSignIn(authData);
            }
            
            // Close dialog and refresh the page/UI
            this.close();
            
            // Optionally reload to refresh auth state
            window.location.reload();
          })
          .catch((error) => {
            console.error('ContextZero: Authentication failed:', error);
            
            // Reset button state
            if (signInBtn) {
              signInBtn.textContent = 'Sign In';
              signInBtn.disabled = false;
            }
            
            // Show error message
            AlertDialog.show(
              'Authentication failed. Please try again.',
              { type: 'error' }
            );
          });
      } else {
        // Fallback to simple redirect
        const frontendHost = 'https://www.context0.ai';
        window.open(`${frontendHost}/sign-in`, '_blank');
      }
      
      // Don't close immediately - wait for auth to complete
    } catch (error) {
      console.error('ContextZero: Error in sign-in handler:', error);
      
      // Reset button state
      const signInBtn = document.querySelector('#contextzero-sign-in-btn');
      if (signInBtn) {
        signInBtn.textContent = 'Sign In';
        signInBtn.disabled = false;
      }
    }
  }

  /**
   * Close the dialog
   */
  close() {
    this.options.onClose();
    this.remove();
  }

  /**
   * Remove dialog from DOM
   */
  remove() {
    const dialog = document.querySelector('.contextzero-signin-dialog');
    if (dialog) {
      dialog.remove();
    }
  }
}

/**
 * Simple Tooltip Popover Component
 */
class TooltipPopover {
  constructor(text, targetElement) {
    this.text = text;
    this.targetElement = targetElement;
    this.tooltip = null;
  }

  /**
   * Show the tooltip
   */
  show() {
    if (this.tooltip) return;
    
    // Create tooltip element
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'contextzero-tooltip-popover';
    this.tooltip.innerHTML = `
      <div class="tooltip-content">
        <div class="tooltip-arrow"></div>
        <span class="tooltip-text">${this.escapeHtml(this.text)}</span>
      </div>
    `;
    
    document.body.appendChild(this.tooltip);
    
    // Position the tooltip
    this.position();
    
    // Add show animation
    requestAnimationFrame(() => {
      this.tooltip.classList.add('show');
    });
  }

  /**
   * Hide the tooltip
   */
  hide() {
    if (!this.tooltip) return;
    
    this.tooltip.classList.remove('show');
    setTimeout(() => {
      if (this.tooltip && this.tooltip.parentNode) {
        this.tooltip.parentNode.removeChild(this.tooltip);
      }
      this.tooltip = null;
    }, 200);
  }

  /**
   * Position the tooltip above the target
   */
  position() {
    if (!this.tooltip || !this.targetElement) return;
    
    const targetRect = this.targetElement.getBoundingClientRect();
    const content = this.tooltip.querySelector('.tooltip-content');
    
    // Calculate position (centered above target with more gap)
    const top = targetRect.top - 45; // 45px above to prevent overlap
    const left = targetRect.left + (targetRect.width / 2);
    
    content.style.position = 'fixed';
    content.style.top = `${top}px`;
    content.style.left = `${left}px`;
    content.style.transform = 'translateX(-50%)';
    
    // Ensure tooltip doesn't block mouse events to button
    this.tooltip.style.pointerEvents = 'none';
    content.style.pointerEvents = 'none';
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
  window.MemoryModal = MemoryModal;
  window.MemoryPanel = MemoryPanel;
  window.AlertDialog = AlertDialog;
  window.SignInDialog = SignInDialog;
  window.TooltipPopover = TooltipPopover;
}