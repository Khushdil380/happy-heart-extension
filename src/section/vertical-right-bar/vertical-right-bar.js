/**
 * VERTICAL RIGHT BAR MANAGER
 * Handles browser shortcuts and navigation
 */

class VerticalRightBar {
  constructor() {
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize UI
      this.initUI();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Vertical Right Bar initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Vertical Right Bar:', error);
    }
  }

  initUI() {
    const rightBar = document.getElementById('vertical-right-bar');
    if (!rightBar) return;

    // Add animation class
    rightBar.classList.add('animate-fade-in');
    
    // Add hover effects to buttons
    const buttons = rightBar.querySelectorAll('.shortcut-btn');
    buttons.forEach((button, index) => {
      button.style.animationDelay = `${index * 0.1}s`;
    });
  }

  setupEventListeners() {
    const rightBar = document.getElementById('vertical-right-bar');
    if (!rightBar) return;

    const buttons = rightBar.querySelectorAll('.shortcut-btn');
    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        
        // Add visual feedback
        this.addClickFeedback(button);
        
        // Handle the click
        this.handleShortcutClick(action);
      });
    });
  }

  addClickFeedback(button) {
    // Add a temporary class for visual feedback
    button.classList.add('clicked');
    
    // Remove the class after animation
    setTimeout(() => {
      button.classList.remove('clicked');
    }, 200);
  }

  async tryOpenUrl(urls, pageName) {
    for (const url of urls) {
      try {
        // Method 1: Try chrome.tabs.create
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          try {
            await chrome.tabs.create({ url });
            return;
          } catch (error) {
            // Continue to next method
          }
        }
        
        // Method 2: Try window.open
        try {
          const newWindow = window.open(url, '_blank');
          if (newWindow && !newWindow.closed) {
            return;
          }
        } catch (error) {
          // Continue to next method
        }
        
        // Method 3: Try window.location (for same tab)
        try {
          window.location.href = url;
          return;
        } catch (error) {
          // Continue to next URL
        }
        
      } catch (error) {
        // Continue to next URL
      }
    }
    
    // If all methods fail
    console.error(`Failed to open ${pageName}`);
    alert(`Unable to open ${pageName}. Please navigate manually or use keyboard shortcuts.`);
  }

  handleShortcutClick(action) {
    switch (action) {
      case 'downloads':
        this.openDownloads();
        break;
      case 'history':
        this.openHistory();
        break;
      case 'bookmarks':
        this.openBookmarks();
        break;
      case 'settings':
        this.openSettings();
        break;
      case 'extensions':
        this.openExtensions();
        break;
      case 'newtab':
        this.openNewTab();
        break;
      default:
        console.warn('Unknown shortcut action:', action);
    }
  }

  async openDownloads() {
    const urls = ['chrome://downloads/', 'brave://downloads/'];
    await this.tryOpenUrl(urls, 'Downloads');
  }

  async openHistory() {
    const urls = ['chrome://history/', 'brave://history/'];
    await this.tryOpenUrl(urls, 'History');
  }

  async openSettings() {
    const urls = ['chrome://settings/', 'brave://settings/'];
    await this.tryOpenUrl(urls, 'Settings');
  }

  async openBookmarks() {
    const urls = ['chrome://bookmarks/', 'brave://bookmarks/'];
    await this.tryOpenUrl(urls, 'Bookmarks');
  }

  async openExtensions() {
    const urls = ['chrome://extensions/', 'brave://extensions/'];
    await this.tryOpenUrl(urls, 'Extensions');
  }

  async openNewTab() {
    const urls = ['chrome://newtab/', 'brave://newtab/'];
    await this.tryOpenUrl(urls, 'New Tab');
  }

  cleanup() {
    // Cleanup if needed
  }
}

// Initialize and export
export async function initVerticalRightBar() {
  const rightBar = new VerticalRightBar();
  await rightBar.init();
  return rightBar;
}
