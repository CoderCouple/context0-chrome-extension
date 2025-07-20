/**
 * Grok-themed ContextZero button
 * Matches Grok/Twitter's design system and color scheme
 */

class GrokContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'grok' });
  }

  /**
   * Apply Grok-specific styles (Twitter/X design language)
   */
  applyPlatformStyles(button) {
    // Use Twitter/X design tokens - rounded corners, modern styling
    button.style.cssText += `
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      background: transparent;
      border: 1px solid #536471;
      color: #e7e9ea;
      transition: all 0.2s ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      gap: 6px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 36px;
    `;

    // Apply Grok's color scheme based on theme
    if (this.isGrokDarkMode()) {
      button.style.cssText += `
        border-color: #536471;
        color: #e7e9ea;
        background: rgba(0, 0, 0, 0.75);
      `;
    } else {
      button.style.cssText += `
        border-color: #cfd9de;
        color: #0f1419;
        background: rgba(255, 255, 255, 0.85);
      `;
    }
  }

  /**
   * Check if Grok is in dark mode (default for X/Twitter)
   */
  isGrokDarkMode() {
    // Twitter/X is predominantly dark mode, check for light mode indicators
    const lightModeIndicators = [
      document.documentElement.classList.contains('light'),
      document.body.classList.contains('light'),
      document.body.style.backgroundColor === 'rgb(255, 255, 255)',
      getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)'
    ];
    
    return !lightModeIndicators.some(indicator => indicator);
  }

  /**
   * Grok-specific hover behavior
   */
  onMouseEnter(e) {
    if (this.button) {
      if (this.isGrokDarkMode()) {
        // Dark mode hover - lighter background
        this.button.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        this.button.style.borderColor = '#1d9bf0';
        this.button.style.color = '#1d9bf0';
      } else {
        // Light mode hover
        this.button.style.backgroundColor = 'rgba(29, 155, 240, 0.1)';
        this.button.style.borderColor = '#1d9bf0';
        this.button.style.color = '#1d9bf0';
      }
      this.button.style.transform = 'scale(1.02)';
    }
  }

  /**
   * Grok-specific hover leave behavior
   */
  onMouseLeave(e) {
    if (this.button) {
      if (this.isGrokDarkMode()) {
        this.button.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
        this.button.style.borderColor = '#536471';
        this.button.style.color = '#e7e9ea';
      } else {
        this.button.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
        this.button.style.borderColor = '#cfd9de';
        this.button.style.color = '#0f1419';
      }
      this.button.style.transform = 'scale(1)';
    }
  }

  /**
   * Customize notification dot for Grok theme
   */
  createNotificationDot(button) {
    this.notificationDot = document.createElement('div');
    this.notificationDot.id = 'contextzero-notification-dot';
    
    const borderColor = this.isGrokDarkMode() ? '#000000' : '#ffffff';
    
    this.notificationDot.style.cssText = `
      position: absolute;
      top: -4px;
      right: -4px;
      width: 8px;
      height: 8px;
      background-color: #1d9bf0;
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
   * Customize tooltip for Grok theme
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
    
    const isDark = this.isGrokDarkMode();
    const bgColor = isDark ? '#1c2732' : '#657786';
    const textColor = isDark ? '#e7e9ea' : 'white';
    
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
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    // Add arrow with Grok styling
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
   * Create button content with Grok-specific styling
   */
  createButtonContent(button) {
    // Create icon (brain emoji)
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      filter: contrast(1.1);
    `;
    icon.textContent = '🧠';
    
    // Create text with Twitter/X typography
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.1px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
  window.GrokContextZeroButton = GrokContextZeroButton;
}