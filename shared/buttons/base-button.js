/**
 * Base ContextZero button class
 * Shared functionality across all platform-specific buttons
 */

class BaseContextZeroButton {
  constructor(options = {}) {
    this.onClick = options.onClick || (() => {});
    this.containerStyle = options.containerStyle || '';
    this.buttonStyle = options.buttonStyle || '';
    this.tooltip = null;
    this.notificationDot = null;
    this.button = null;
    this.platform = options.platform || 'generic';
  }

  /**
   * Create the base button structure (to be extended by platform-specific buttons)
   * @returns {HTMLElement} The button element
   */
  create() {
    const button = document.createElement('button');
    button.id = 'contextzero-icon-button';
    button.type = 'button';
    button.setAttribute('aria-label', 'ContextZero - Add memories to prompt');
    
    // Platform-specific styling will be applied by subclasses
    this.applyBaseStyles(button);
    this.applyPlatformStyles(button);
    
    // Create content (icon + text)
    this.createButtonContent(button);
    
    // Create notification dot
    this.createNotificationDot(button);
    
    // Create tooltip
    this.createTooltip();
    
    // Add event handlers
    this.addEventHandlers(button);
    
    this.button = button;
    return button;
  }

  /**
   * Apply base styles that are common across all platforms
   */
  applyBaseStyles(button) {
    const baseStyles = `
      display: inline-flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      position: relative;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      user-select: none;
      border: none;
      outline: none;
    `;
    
    button.style.cssText = baseStyles + this.buttonStyle;
  }

  /**
   * Apply platform-specific styles (to be overridden by subclasses)
   */
  applyPlatformStyles(button) {
    // Default generic styling
    button.style.cssText += `
      padding: 6px 12px;
      background: transparent;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
    `;
  }

  /**
   * Create button content (icon + text)
   */
  createButtonContent(button) {
    // Create icon (brain emoji)
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
    `;
    icon.textContent = '🧠';
    
    // Create text
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.5px;
      font-weight: 500;
    `;
    text.textContent = 'ctx0';
    
    button.appendChild(icon);
    button.appendChild(text);
  }

  /**
   * Create notification dot
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      background-color: #ff6b35;
      border-radius: 50%;
      border: 2px solid white;
      display: none;
      z-index: 1001;
      pointer-events: none;
    `;
    button.appendChild(this.notificationDot);
    
    // Add animation styles
    this.addNotificationAnimation();
  }

  /**
   * Create tooltip
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
    this.tooltip.style.cssText = `
      display: none;
      position: fixed;
      background-color: #1f2937;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: normal;
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    `;
    
    // Add arrow
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
      border-top: 4px solid #1f2937;
    `;
    this.tooltip.appendChild(arrow);
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Add event handlers
   */
  addEventHandlers(button) {
    // Hover events (to be customized by platform-specific buttons)
    button.addEventListener('mouseenter', (e) => {
      this.onMouseEnter(e);
      this.showTooltip();
    });
    
    button.addEventListener('mouseleave', (e) => {
      this.onMouseLeave(e);
      this.hideTooltip();
    });
    
    // Click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      this.hideTooltip();
      await this.onClick(e);
    });
  }

  /**
   * Platform-specific hover enter behavior (to be overridden)
   */
  onMouseEnter(e) {
    // Default hover behavior
    if (this.button) {
      this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
      this.button.style.borderColor = '#9ca3af';
    }
  }

  /**
   * Platform-specific hover leave behavior (to be overridden)
   */
  onMouseLeave(e) {
    // Default hover behavior
    if (this.button) {
      this.button.style.backgroundColor = 'transparent';
      this.button.style.borderColor = '#d1d5db';
    }
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
   * Add notification animation styles
   */
  addNotificationAnimation() {
    if (!document.getElementById('contextzero-notification-animation')) {
      const style = document.createElement('style');
      style.id = 'contextzero-notification-animation';
      style.innerHTML = `
        @keyframes contextZeroPopIn {
          0% { 
            transform: scale(0);
            opacity: 0;
          }
          50% { 
            transform: scale(1.2);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        #contextzero-notification-dot.active {
          display: block !important;
          animation: contextZeroPopIn 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Update notification dot visibility
   */
  updateNotificationDot(show) {
    if (this.notificationDot) {
      if (show) {
        this.notificationDot.classList.add('active');
        this.notificationDot.style.display = 'block';
      } else {
        this.notificationDot.classList.remove('active');
        this.notificationDot.style.display = 'none';
      }
    }
  }

  /**
   * Create a button container
   */
  createContainer() {
    const container = document.createElement('span');
    container.style.cssText = `
      position: relative;
      display: inline-flex;
      align-items: center;
    ` + this.containerStyle;
    
    const button = this.create();
    container.appendChild(button);
    
    return container;
  }

  /**
   * Destroy the button and cleanup
   */
  destroy() {
    const button = document.querySelector('#contextzero-icon-button');
    if (button && button.parentNode) {
      button.parentNode.remove();
    }
    
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseContextZeroButton;
}