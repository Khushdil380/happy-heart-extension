/**
 * UNIFIED POPUP MANAGER
 * Handles all popups consistently across the extension
 */

class PopupManager {
  constructor() {
    this.activePopup = null;
    this.popupHistory = [];
    this.init();
  }

  init() {
    // Create global styles if not already present
    this.ensureGlobalStyles();
    
    // Add keyboard event listeners
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Prevent body scroll when popup is open
    this.originalBodyOverflow = document.body.style.overflow;
  }

  ensureGlobalStyles() {
    if (!document.getElementById('popup-manager-styles')) {
      const style = document.createElement('style');
      style.id = 'popup-manager-styles';
      style.textContent = `
        body.popup-open {
          overflow: hidden !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Create a new popup
   * @param {string} title - Popup title
   * @param {string} content - HTML content
   * @param {Object} options - Configuration options
   * @returns {Object} Popup instance
   */
  createPopup(title, content, options = {}) {
    const popupId = options.id || `popup-${Date.now()}`;
    const size = options.size || 'medium';
    const closable = options.closable !== false;
    
    const popup = {
      id: popupId,
      title,
      content,
      size,
      closable,
      element: null,
      isOpen: false
    };

    this.createPopupElement(popup);
    return popup;
  }

  createPopupElement(popup) {
    // Create backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    backdrop.id = `${popup.id}-backdrop`;

    // Create container
    const container = document.createElement('div');
    container.className = `popup-container popup-${popup.size}`;
    container.id = `${popup.id}-container`;

    // Create header
    const header = document.createElement('div');
    header.className = 'popup-header';
    
    const title = document.createElement('h2');
    title.className = 'popup-title';
    title.textContent = popup.title;
    
    header.appendChild(title);

    // Add close button if closable
    if (popup.closable) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'popup-close-btn';
      closeBtn.innerHTML = '×';
      closeBtn.addEventListener('click', () => this.closePopup(popup));
      header.appendChild(closeBtn);
    }

    // Create body
    const body = document.createElement('div');
    body.className = 'popup-body';
    body.innerHTML = popup.content;

    // Assemble popup
    container.appendChild(header);
    container.appendChild(body);
    backdrop.appendChild(container);

    // Store element reference
    popup.element = backdrop;
    popup.header = header;
    popup.body = body;
    popup.closeBtn = header.querySelector('.popup-close-btn');

    // Add to DOM (hidden)
    document.body.appendChild(backdrop);
  }

  /**
   * Open a popup
   * @param {Object} popup - Popup instance
   */
  openPopup(popup) {
    if (this.activePopup) {
      this.closePopup(this.activePopup);
    }

    this.activePopup = popup;
    popup.isOpen = true;
    
    // Add to history
    this.popupHistory.push(popup.id);

    // Show popup
    popup.element.classList.add('active');
    document.body.classList.add('popup-open');

    // Focus management
    this.trapFocus(popup);

    // Emit event
    this.emit('popup:opened', { popup });
  }

  /**
   * Close a popup
   * @param {Object} popup - Popup instance
   */
  closePopup(popup) {
    if (!popup || !popup.isOpen) return;

    popup.isOpen = false;
    popup.element.classList.remove('active');
    
    // Remove from history
    this.popupHistory = this.popupHistory.filter(id => id !== popup.id);

    // Clear active popup if this was it
    if (this.activePopup === popup) {
      this.activePopup = null;
    }

    // Restore body scroll
    if (this.popupHistory.length === 0) {
      document.body.classList.remove('popup-open');
    }

    // Emit event
    this.emit('popup:closed', { popup });
  }

  /**
   * Close all popups
   */
  closeAllPopups() {
    if (this.activePopup) {
      this.closePopup(this.activePopup);
    }
  }

  /**
   * Handle keyboard events
   * @param {KeyboardEvent} event
   */
  handleKeydown(event) {
    if (event.key === 'Escape' && this.activePopup) {
      this.closePopup(this.activePopup);
    }
  }

  /**
   * Focus trap for accessibility
   * @param {Object} popup - Popup instance
   */
  trapFocus(popup) {
    const focusableElements = popup.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    popup.element.addEventListener('keydown', handleTabKey);
    firstElement.focus();

    // Store cleanup function
    popup._cleanupFocus = () => {
      popup.element.removeEventListener('keydown', handleTabKey);
    };
  }

  /**
   * Update popup content
   * @param {Object} popup - Popup instance
   * @param {string} content - New HTML content
   */
  updateContent(popup, content) {
    popup.body.innerHTML = content;
  }

  /**
   * Update popup title
   * @param {Object} popup - Popup instance
   * @param {string} title - New title
   */
  updateTitle(popup, title) {
    const titleElement = popup.header.querySelector('.popup-title');
    if (titleElement) {
      titleElement.textContent = title;
    }
  }

  /**
   * Get popup by ID
   * @param {string} id - Popup ID
   * @returns {Object|null} Popup instance
   */
  getPopup(id) {
    const element = document.getElementById(`${id}-backdrop`);
    if (!element) return null;

    // Find popup object (this is a simplified approach)
    // In a real implementation, you'd maintain a registry
    return {
      id,
      element,
      header: element.querySelector('.popup-header'),
      body: element.querySelector('.popup-body'),
      closeBtn: element.querySelector('.popup-close-btn'),
      isOpen: element.classList.contains('active')
    };
  }

  /**
   * Event emitter functionality
   */
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }

  /**
   * Cleanup method
   */
  destroy() {
    this.closeAllPopups();
    document.removeEventListener('keydown', this.handleKeydown.bind(this));
    document.body.classList.remove('popup-open');
  }
}

// Create global instance
const popupManager = new PopupManager();

// Export for use in modules
export { popupManager };
export default popupManager;
