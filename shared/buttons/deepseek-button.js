/**
 * DeepSeek-themed ContextZero button
 * Matches DeepSeek's design system and color scheme
 */

class DeepSeekContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'deepseek' });
  }

  /**
   * Apply DeepSeek-specific styles
   */
  applyPlatformStyles(button) {
    // Use mem0's exact styling approach for DeepSeek
    button.className = 'ds-button ds-button--rect ds-button--m';
    button.setAttribute('role', 'button');
    button.setAttribute('aria-label', 'ContextZero');
    button.setAttribute('tabindex', '0');
    
    // Add fallback styles to ensure visibility
    button.style.cssText = `
      cursor: pointer;
      height: 30px;
      display: inline-flex;
      margin-left: -2px;
      align-items: center;
      padding: 0px 6px;
      border: 1px solid #A1A1AA;
      border-radius: 16px;
      background-color: rgba(255, 255, 255, 0.0);
      transition: background-color 0.2s;
      box-sizing: border-box;
    `;
  }

  /**
   * Check if DeepSeek is in dark mode
   */
  isDeepSeekDarkMode() {
    return document.documentElement.classList.contains('dark') ||
           document.body.classList.contains('dark') ||
           document.querySelector('[data-theme="dark"]') !== null ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * DeepSeek-specific hover behavior
   */
  onMouseEnter(e) {
    if (this.button) {
      this.button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    }
  }

  /**
   * DeepSeek-specific hover leave behavior
   */
  onMouseLeave(e) {
    if (this.button) {
      this.button.style.boxShadow = 'none';
    }
  }

  /**
   * Customize notification dot for DeepSeek theme
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -3px;
      right: -3px;
      width: 8px;
      height: 8px;
      background-color: rgb(128, 221, 162);
      border-radius: 50%;
      border: 1px solid #1C1C1E;
      display: none;
      z-index: 1001;
      pointer-events: none;
    `;
    button.appendChild(this.notificationDot);
    
    this.addNotificationAnimation();
  }

  /**
   * Customize tooltip for DeepSeek theme
   */
  createTooltip() {
    // Remove existing tooltip if any
    const existingTooltip = document.querySelector('#contextzero-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'contextzero-tooltip';
    this.tooltip.className = 'contextzero-tooltip';
    this.tooltip.textContent = 'Add memories to your prompt';
    
    this.tooltip.style.cssText = `
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      background-color: #1C1C1E;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 10001;
      display: none;
      transition: opacity 0.2s;
      opacity: 0;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1;
      max-height: 24px;
    `;
    
    // Add arrow with DeepSeek styling
    const arrow = document.createElement('div');
    arrow.className = 'contextzero-tooltip-arrow';
    arrow.style.cssText = `
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 6px;
      height: 6px;
      background-color: #1C1C1E;
      pointer-events: none;
    `;
    this.tooltip.appendChild(arrow);
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Create button content with DeepSeek-specific styling
   */
  createButtonContent(button) {
    // Create icon container matching DeepSeek's structure
    const iconContainer = document.createElement('div');
    iconContainer.className = 'ds-button__icon';
    iconContainer.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 2px;
    `;
    
    // Create the icon (brain emoji)
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 14px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      padding-right: 4px;
    `;
    icon.textContent = '🧠';
    
    // Create button text matching DeepSeek's style
    const buttonText = document.createElement('span');
    buttonText.style.cssText = `
      color: #A1A1AA;
      font-size: 12px;
      padding-left: 2px;
    `;
    buttonText.textContent = 'ctx0';
    
    iconContainer.appendChild(icon);
    button.appendChild(iconContainer);
    button.appendChild(buttonText);
  }

  /**
   * Create container for DeepSeek integration
   */
  createContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
      display: inline-flex;
      position: relative;
      margin: 0 4px;
      align-items: center;
      vertical-align: middle;
      ${this.containerStyle || ''}
    `;
    
    // Create the actual button
    const button = document.createElement('div');
    button.className = 'contextzero-memory-btn';
    button.id = 'contextzero-icon-button';
    
    // Apply platform styles
    this.applyPlatformStyles(button);
    
    // Override with any custom button styles
    if (this.buttonStyle) {
      button.style.cssText += this.buttonStyle;
    }
    
    // Create button content
    this.createButtonContent(button);
    
    // Store reference
    this.button = button;
    this.container = container;
    
    // Add event handlers
    button.addEventListener('mouseenter', (e) => {
      this.onMouseEnter(e);
      this.showTooltip();
    });
    
    button.addEventListener('mouseleave', (e) => {
      this.onMouseLeave(e);
      this.hideTooltip();
    });
    
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.hideTooltip();
      await this.onClick(e);
    });
    
    // Create notification dot and tooltip
    this.createNotificationDot(button);
    this.createTooltip();
    
    // Assemble container
    container.appendChild(button);
    
    return container;
  }

  /**
   * Show tooltip with debouncing
   */
  showTooltip() {
    // Clear any pending hide timeout
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
    
    // Debounce show tooltip
    if (this.showTooltipTimeout) {
      return;
    }
    
    this.showTooltipTimeout = setTimeout(() => {
      if (this.tooltip && this.button) {
        const rect = this.button.getBoundingClientRect();
        const buttonCenterX = rect.left + rect.width / 2;
        
        this.tooltip.style.display = 'block';
        
        const tooltipHeight = this.tooltip.offsetHeight || 30;
        this.tooltip.style.left = `${buttonCenterX}px`;
        this.tooltip.style.top = `${rect.top - tooltipHeight - 8}px`;
        
        setTimeout(() => {
          if (this.tooltip) {
            this.tooltip.style.opacity = '1';
          }
        }, 10);
      }
      this.showTooltipTimeout = null;
    }, 100);
  }

  /**
   * Hide tooltip with debouncing
   */
  hideTooltip() {
    // Clear any pending show timeout
    if (this.showTooltipTimeout) {
      clearTimeout(this.showTooltipTimeout);
      this.showTooltipTimeout = null;
    }
    
    // Debounce hide tooltip
    this.hideTooltipTimeout = setTimeout(() => {
      if (this.tooltip) {
        this.tooltip.style.opacity = '0';
        setTimeout(() => {
          if (this.tooltip) {
            this.tooltip.style.display = 'none';
          }
        }, 200);
      }
      this.hideTooltipTimeout = null;
    }, 50);
  }

  /**
   * Add notification animation
   */
  addNotificationAnimation() {
    if (!document.getElementById('contextzero-notification-animation')) {
      const style = document.createElement('style');
      style.id = 'contextzero-notification-animation';
      style.innerHTML = `
        @keyframes contextzero-notification-pulse {
          0% { transform: scale(0); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        
        #contextzero-notification-dot.active {
          display: block !important;
          animation: contextzero-notification-pulse 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Update notification dot visibility
   */
  updateNotificationDot(hasText) {
    if (this.notificationDot) {
      if (hasText) {
        this.notificationDot.classList.add('active');
        this.notificationDot.style.display = 'block';
      } else {
        this.notificationDot.classList.remove('active');
        this.notificationDot.style.display = 'none';
      }
    }
  }

  /**
   * Update styles when theme changes
   */
  updateTheme() {
    if (this.button) {
      this.applyPlatformStyles(this.button);
      this.createNotificationDot(this.button);
      this.createTooltip();
    }
  }
  
  /**
   * Cleanup method to clear any pending timeouts
   */
  cleanup() {
    if (this.showTooltipTimeout) {
      clearTimeout(this.showTooltipTimeout);
      this.showTooltipTimeout = null;
    }
    if (this.hideTooltipTimeout) {
      clearTimeout(this.hideTooltipTimeout);
      this.hideTooltipTimeout = null;
    }
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.DeepSeekContextZeroButton = DeepSeekContextZeroButton;
}