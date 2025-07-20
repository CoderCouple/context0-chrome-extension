/**
 * Gemini-themed ContextZero button
 * Matches Google's design system and color scheme
 */

class GeminiContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'gemini' });
  }

  /**
   * Apply Gemini-specific styles (Google design language)
   */
  applyPlatformStyles(button) {
    // Use Google's Material Design tokens
    button.style.cssText += `
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      border: none;
      color: #3c4043;
      transition: all 0.15s ease;
      font-family: 'Google Sans', Roboto, sans-serif;
      gap: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
      box-shadow: none;
    `;

    // Apply Gemini's color scheme based on theme
    if (this.isGeminiDarkMode()) {
      button.style.cssText += `
        color: #e8eaed;
        background: rgba(32, 33, 36, 0.95);
      `;
    }
  }

  /**
   * Check if Gemini is in dark mode
   */
  isGeminiDarkMode() {
    // Check for Google's dark mode indicators
    return document.documentElement.getAttribute('data-dark-theme') === 'true' ||
           document.body.classList.contains('dark-theme') ||
           document.body.classList.contains('dark') ||
           getComputedStyle(document.body).backgroundColor === 'rgb(32, 33, 36)' ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Gemini-specific hover behavior
   */
  onMouseEnter(e) {
    if (this.button) {
      if (this.isGeminiDarkMode()) {
        // Dark mode hover
        this.button.style.backgroundColor = 'rgba(138, 180, 248, 0.08)';
        this.button.style.color = '#8ab4f8';
      } else {
        // Light mode hover
        this.button.style.backgroundColor = 'rgba(26, 115, 232, 0.04)';
        this.button.style.color = '#1a73e8';
      }
    }
  }

  /**
   * Gemini-specific hover leave behavior
   */
  onMouseLeave(e) {
    if (this.button) {
      if (this.isGeminiDarkMode()) {
        this.button.style.backgroundColor = 'rgba(32, 33, 36, 0.95)';
        this.button.style.color = '#e8eaed';
      } else {
        this.button.style.backgroundColor = 'transparent';
        this.button.style.color = '#3c4043';
      }
    }
  }

  /**
   * Customize notification dot for Gemini theme
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    
    const borderColor = this.isGeminiDarkMode() ? '#202124' : '#ffffff';
    
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      background-color: #34a853;
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
   * Customize tooltip for Gemini theme
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
    
    const isDark = this.isGeminiDarkMode();
    const bgColor = isDark ? '#2d2e30' : '#3c4043';
    const textColor = isDark ? '#e8eaed' : 'white';
    
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
      box-shadow: 0 4px 12px rgba(60, 64, 67, 0.15);
      font-family: 'Google Sans', Roboto, sans-serif;
    `;
    
    // Add arrow with Gemini styling
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
   * Create button content with Gemini-specific styling
   */
  createButtonContent(button) {
    // Create icon (brain emoji)
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      filter: saturate(0.9);
    `;
    icon.textContent = '🧠';
    
    // Create text with Google typography
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.25px;
      font-weight: 500;
      font-family: 'Google Sans', Roboto, sans-serif;
    `;
    text.textContent = 'ctx0';
    
    button.appendChild(icon);
    button.appendChild(text);
  }

  /**
   * Create container for both toolbox-drawer and fallback integration
   */
  createContainer() {
    // Try to detect if we're in a toolbox drawer context
    const toolboxDrawer = document.querySelector('toolbox-drawer .toolbox-drawer-container');
    const useToolboxDrawer = toolboxDrawer && (this.containerStyle?.includes('position: fixed') !== true);
    
    let container;
    
    if (useToolboxDrawer) {
      // Create toolbox-drawer-item container to match Gemini's structure
      container = document.createElement('toolbox-drawer-item');
      container.className = 'mat-mdc-tooltip-trigger toolbox-drawer-item-button ng-tns-c1279795495-8 mat-mdc-tooltip-disabled ng-star-inserted';
    } else {
      // Create simple div container for other locations
      container = document.createElement('div');
    }
    
    container.style.cssText = `
      position: relative;
      background-color: transparent;
      border: none;
      ${this.containerStyle || ''}
    `;
    
    // Create the actual button
    const button = document.createElement('button');
    if (useToolboxDrawer) {
      button.className = 'mat-ripple mat-mdc-tooltip-trigger toolbox-drawer-item-button gds-label-l is-mobile ng-star-inserted';
      button.setAttribute('matripple', '');
      button.setAttribute('aria-pressed', 'false');
    } else {
      button.className = 'contextzero-memory-btn';
    }
    button.setAttribute('aria-label', 'ContextZero');
    button.id = 'contextzero-icon-button';
    button.type = 'button';
    
    // Apply platform styles
    this.applyPlatformStyles(button);
    
    // Override with any custom button styles
    if (this.buttonStyle) {
      button.style.cssText += this.buttonStyle;
    }
    
    if (useToolboxDrawer) {
      // Create button label div to match other toolbox items
      const buttonLabel = document.createElement('div');
      buttonLabel.className = 'toolbox-drawer-button-label label';
      buttonLabel.style.cssText = `
        display: flex;
        align-items: center;
        gap: 6px;
        font-family: 'Google Sans', Roboto, sans-serif;
        font-size: 14px;
        font-weight: 500;
        background-color: transparent;
      `;
      
      // Create button content
      this.createButtonContent(buttonLabel);
      
      // Assemble button
      button.appendChild(buttonLabel);
    } else {
      // Create simple button content
      this.createButtonContent(button);
    }
    
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
    if (this.tooltip && this.button) {
      const rect = this.button.getBoundingClientRect();
      const buttonCenterX = rect.left + rect.width / 2;
      
      this.tooltip.style.display = 'block';
      
      const tooltipHeight = this.tooltip.offsetHeight || 30;
      this.tooltip.style.left = `${buttonCenterX}px`;
      this.tooltip.style.top = `${rect.top - tooltipHeight - 8}px`;
      
      setTimeout(() => {
        this.tooltip.style.opacity = '1';
      }, 10);
    }
  }

  /**
   * Hide tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.style.opacity = '0';
      setTimeout(() => {
        this.tooltip.style.display = 'none';
      }, 200);
    }
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
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.GeminiContextZeroButton = GeminiContextZeroButton;
}