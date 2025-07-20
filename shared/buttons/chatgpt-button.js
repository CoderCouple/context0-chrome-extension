/**
 * ChatGPT-themed ContextZero button
 * Matches ChatGPT's design system and color scheme
 */

class ChatGPTContextZeroButton extends BaseContextZeroButton {
  constructor(options = {}) {
    super({ ...options, platform: 'chatgpt' });
  }

  /**
   * Apply ChatGPT-specific styles
   */
  applyPlatformStyles(button) {
    // Use ChatGPT's design tokens and styling
    button.className = 'btn relative btn-primary btn-small flex items-center justify-center border border-token-border-default text-token-text-secondary focus-visible:outline-black dark:text-token-text-secondary dark:focus-visible:outline-white bg-transparent dark:bg-transparent can-hover:hover:bg-token-main-surface-secondary dark:hover:bg-transparent dark:hover:opacity-100';
    
    button.style.cssText += `
      height: 32px;
      min-height: 32px;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      background: transparent;
      border: 1px solid var(--token-border-default, #d1d5db);
      color: var(--token-text-secondary, #6b7280);
      gap: 6px;
    `;
  }

  /**
   * ChatGPT-specific hover behavior
   */
  onMouseEnter(e) {
    if (this.button) {
      // Use ChatGPT's hover colors
      this.button.style.backgroundColor = 'var(--token-main-surface-secondary, rgba(0, 0, 0, 0.05))';
      this.button.style.borderColor = 'var(--token-border-medium, #9ca3af)';
      this.button.style.color = 'var(--token-text-primary, #374151)';
    }
  }

  /**
   * ChatGPT-specific hover leave behavior
   */
  onMouseLeave(e) {
    if (this.button) {
      this.button.style.backgroundColor = 'transparent';
      this.button.style.borderColor = 'var(--token-border-default, #d1d5db)';
      this.button.style.color = 'var(--token-text-secondary, #6b7280)';
    }
  }

  /**
   * Customize notification dot for ChatGPT theme
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
      border: 2px solid var(--token-main-surface-primary, white);
      display: none;
      z-index: 1001;
      pointer-events: none;
    `;
    button.appendChild(this.notificationDot);
    
    this.addNotificationAnimation();
  }

  /**
   * Customize tooltip for ChatGPT theme
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
      background-color: var(--token-surface-tertiary, #1f2937);
      color: var(--token-text-primary-on-surface, white);
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: normal;
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
      transform: translateX(-50%);
      opacity: 0;
      transition: opacity 0.2s ease;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border: 1px solid var(--token-border-light, rgba(255, 255, 255, 0.1));
    `;
    
    // Add arrow with ChatGPT styling
    const arrow = document.createElement('div');
    arrow.style.cssText = `
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 5px solid var(--token-surface-tertiary, #1f2937);
    `;
    this.tooltip.appendChild(arrow);
    
    document.body.appendChild(this.tooltip);
  }

  /**
   * Create button content with ChatGPT-specific styling
   */
  createButtonContent(button) {
    // Create icon (brain emoji)
    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 16px;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      filter: grayscale(0.2);
    `;
    icon.textContent = '🧠';
    
    // Create text with ChatGPT typography
    const text = document.createElement('span');
    text.style.cssText = `
      font-size: 13px;
      line-height: 1;
      letter-spacing: 0.3px;
      font-weight: 500;
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    `;
    text.textContent = 'ctx0';
    
    button.appendChild(icon);
    button.appendChild(text);
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.ChatGPTContextZeroButton = ChatGPTContextZeroButton;
}