/**
 * Claude-themed ContextZero button
 * Matches Claude's design system and color scheme
 */

class ClaudeContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'claude' });
  }

  /**
   * Apply Claude-specific styles
   */
  applyPlatformStyles(button) {
    // Use Claude's design language - more minimalist and clean
    button.style.cssText += `
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      border: 1px solid #e5e7eb;
      color: #6b7280;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    `;

    // Apply Claude's color scheme based on theme
    if (this.isClaudeDarkMode()) {
      button.style.cssText += `
        border-color: #374151;
        color: #9ca3af;
        background: rgba(17, 24, 39, 0.5);
      `;
    }
  }

  /**
   * Check if Claude is in dark mode
   */
  isClaudeDarkMode() {
    // Check for Claude's dark mode indicators
    return document.documentElement.classList.contains('dark') ||
           document.body.classList.contains('dark') ||
           window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * Claude-specific hover behavior
   */
  onMouseEnter(e) {
    if (this.button) {
      if (this.isClaudeDarkMode()) {
        // Dark mode hover
        this.button.style.backgroundColor = 'rgba(31, 41, 55, 0.8)';
        this.button.style.borderColor = '#4b5563';
        this.button.style.color = '#d1d5db';
      } else {
        // Light mode hover
        this.button.style.backgroundColor = 'rgba(249, 250, 251, 0.8)';
        this.button.style.borderColor = '#d1d5db';
        this.button.style.color = '#374151';
      }
      this.button.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }
  }

  /**
   * Claude-specific hover leave behavior
   */
  onMouseLeave(e) {
    if (this.button) {
      if (this.isClaudeDarkMode()) {
        this.button.style.backgroundColor = 'rgba(17, 24, 39, 0.5)';
        this.button.style.borderColor = '#374151';
        this.button.style.color = '#9ca3af';
      } else {
        this.button.style.backgroundColor = 'transparent';
        this.button.style.borderColor = '#e5e7eb';
        this.button.style.color = '#6b7280';
      }
      this.button.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
    }
  }

  /**
   * Customize notification dot for Claude theme
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    
    const borderColor = this.isClaudeDarkMode() ? '#1f2937' : 'white';
    
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      background-color: #ff6b35;
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
   * Customize tooltip for Claude theme
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
    
    const isDark = this.isClaudeDarkMode();
    const bgColor = isDark ? '#1f2937' : '#374151';
    const textColor = isDark ? '#f9fafb' : 'white';
    
    this.tooltip.style.cssText = `
      display: none;
      position: fixed;
      background-color: ${bgColor};
      color: ${textColor};
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    
    // Add arrow with Claude styling
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
   * Create button content with Claude-specific styling
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
    
    // Create text with Claude typography
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.2px;
      font-weight: 500;
      font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    text.textContent = 'ctx0';
    
    button.appendChild(icon);
    button.appendChild(text);
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
  window.ClaudeContextZeroButton = ClaudeContextZeroButton;
}