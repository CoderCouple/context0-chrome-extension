/**
 * Perplexity-themed ContextZero button
 * Matches Perplexity's design system and color scheme
 */

class PerplexityContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'perplexity' });
  }

  /**
   * Apply Perplexity-specific styles
   */
  applyPlatformStyles(button) {
    // Use mem0's exact styling approach for Perplexity
    button.className = 'focus-visible:bg-offsetPlus dark:focus-visible:bg-offsetPlusDark hover:bg-offsetPlus text-textOff dark:text-textOffDark hover:text-textMain dark:hover:bg-offsetPlusDark dark:hover:text-textMainDark font-sans focus:outline-none outline-none outline-transparent transition duration-300 ease-out font-sans select-none items-center relative group/button justify-center text-center items-center rounded-lg cursor-pointer active:scale-[0.97] active:duration-150 active:ease-outExpo origin-center whitespace-nowrap inline-flex text-sm h-8 aspect-[9/8]';
    button.setAttribute('aria-label', 'ContextZero');
    button.setAttribute('type', 'button');
    
    // Add fallback styles to ensure visibility
    button.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 72px;
      height: 36px;
      padding: 8px 14px;
      background-color: transparent;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      box-sizing: border-box;
    `;
  }

  /**
   * Check if Perplexity is in dark mode
   */
  isPerplexityDarkMode() {
    return document.documentElement.classList.contains('dark') ||
           document.body.classList.contains('dark') ||
           document.querySelector('.dark\\:bg-offsetDark') !== null ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Perplexity-specific hover behavior - handled by CSS classes
   */
  onMouseEnter(e) {
    // Hover styles handled by Perplexity's CSS classes
  }

  /**
   * Perplexity-specific hover leave behavior - handled by CSS classes
   */
  onMouseLeave(e) {
    // Hover styles handled by Perplexity's CSS classes
  }

  /**
   * Customize notification dot for Perplexity theme
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    
    const borderColor = this.isPerplexityDarkMode() ? '#1a1a1a' : '#ffffff';
    
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      background-color: #20a39e;
      border-radius: 50%;
      border: 2px solid ${borderColor};
      display: none;
      z-index: 1001;
      pointer-events: none;
    `;
    button.appendChild(this.notificationDot);
    
    this.addNotificationAnimation();
  }

  /**
   * Customize tooltip for Perplexity theme
   */
  createTooltip() {
    // Remove existing tooltip if any
    const existingTooltip = document.querySelector('#contextzero-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    
    this.tooltip = document.createElement('div');
    this.tooltip.id = 'contextzero-tooltip';
    this.tooltip.textContent = 'Add memories to your prompt';
    
    const isDark = this.isPerplexityDarkMode();
    const bgColor = isDark ? '#2a2a2a' : '#1a1a1a';
    const textColor = isDark ? '#ffffff' : 'white';
    
    this.tooltip.style.cssText = `
      display: none;
      position: fixed;
      background-color: ${bgColor};
      color: ${textColor};
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    `;
    
    // Add arrow with Perplexity styling
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-top: 4px solid ${bgColor};
    `;
    this.tooltip.appendChild(arrow);
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Create button content with Perplexity-specific styling
   */
  createButtonContent(button) {
    // Go back to our working emoji + text approach
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    `;
    icon.textContent = '🧠';
    
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 12px;
      line-height: 1;
      margin-left: 4px;
      font-weight: 500;
    `;
    text.textContent = 'ctx0';
    
    button.appendChild(icon);
    button.appendChild(text);
  }

  /**
   * Create container for Perplexity integration
   */
  createContainer() {
    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
      background-color: transparent;
      border: none;
      ${this.containerStyle || ''}
    `;
    
    // Create the actual button
    const button = document.createElement('button');
    button.className = 'contextzero-memory-btn';
    button.setAttribute('aria-label', 'ContextZero');
    button.id = 'contextzero-icon-button';
    button.type = 'button';
    
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
    
    // Add event handlers manually to avoid base class issues
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
   * Show tooltip
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
    }, 100); // Small delay to prevent flickering
  }

  /**
   * Hide tooltip
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
    }, 50); // Small delay to prevent flickering
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
  window.PerplexityContextZeroButton = PerplexityContextZeroButton;
}