/**
 * HAPPY HEART THEME - MAIN SCRIPT
 * Initializes all components and manages the new tab page
 */

// Import popup manager
import { popupManager } from '../components/Popup/popup-manager.js';

// Import utilities
import { getStoredData, setStoredData, removeStoredData } from '../src/utils/storage.js';
import { initPerformanceMonitoring } from '../src/utils/performance.js';

// Import sections
import { initLeftSidebar } from '../src/section/left-sidebar/left-sidebar.js';
import { initVerticalRightBar } from '../src/section/vertical-right-bar/vertical-right-bar.js';
import { initToolBar } from '../src/section/tool-bar/toolbar.js';
import { initMiddleSection } from '../src/section/middle-section/middle-section.js';

// Import tools
import { initBackgroundTool } from '../src/section/tool-bar/background-image/background-image.js';
import { initFileConverterTool } from '../src/section/tool-bar/file-converter/file-converter.js';
import { initGamesTool } from '../src/section/tool-bar/games/games.js';
import { initCalculatorTool } from '../src/section/tool-bar/calculator-and-unit-converter/calculator-and-unit-converter.js';


class HappyHeartTheme {
  constructor() {
    console.log('🏗️ HappyHeartTheme constructor called');
    this.isInitialized = false;
    this.components = new Map();
    this.init();
  }

  async init() {
    try {
      console.log('🎨 Initializing Happy Heart Theme...');
      
      // Initialize performance monitoring first
      initPerformanceMonitoring();
      
      // Initialize all sections
      await this.initSections();
      
      // Initialize tools
      await this.initTools();
      
      // Set up global event listeners
      this.setupGlobalEvents();
      
      this.isInitialized = true;
      console.log('✅ Happy Heart Theme initialized successfully!');
      
    } catch (error) {
      console.error('❌ Failed to initialize Happy Heart Theme:', error);
    }
  }



  async initSections() {
    console.log('🔧 Initializing sections...');
    
    // Initialize left sidebar
    console.log('📋 Initializing left sidebar...');
    this.components.set('leftSidebar', await initLeftSidebar());
    console.log('✅ Left sidebar initialized');
    
    // Initialize vertical right bar
    console.log('📋 Initializing vertical right bar...');
    this.components.set('verticalRightBar', await initVerticalRightBar());
    console.log('✅ Vertical right bar initialized');
    
    // Initialize middle section
    console.log('📋 Initializing middle section...');
    this.components.set('middleSection', await initMiddleSection());
    console.log('✅ Middle section initialized');
  }

  async initTools() {
    // Initialize tool bar
    this.components.set('toolBar', await initToolBar());
    
    // Initialize individual tools
    this.components.set('backgroundTool', await initBackgroundTool());
    this.components.set('fileConverterTool', await initFileConverterTool());
    this.components.set('gamesTool', await initGamesTool());
    this.components.set('calculatorTool', await initCalculatorTool());
  }

  setupGlobalEvents() {
    // Handle popup events
    document.addEventListener('popup:opened', (event) => {
      console.log('Popup opened:', event.detail.popup.id);
    });
    
    document.addEventListener('popup:closed', (event) => {
      console.log('Popup closed:', event.detail.popup.id);
    });
    
    // Handle window events
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
    
    // Handle resize events
    window.addEventListener('resize', this.debounce(() => {
      this.handleResize();
    }, 250));
  }

  handleResize() {
    // Notify all components of resize
    this.components.forEach(component => {
      if (component && typeof component.handleResize === 'function') {
        component.handleResize();
      }
    });
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  cleanup() {
    // Cleanup all components
    this.components.forEach(component => {
      if (component && typeof component.cleanup === 'function') {
        component.cleanup();
      }
    });
    
    // Cleanup popup manager
    popupManager.destroy();
    
    console.log('🧹 Happy Heart Theme cleaned up');
  }

  // Public API
  getComponent(name) {
    return this.components.get(name);
  }

  async saveSettings(settings) {
    await setStoredData('theme_settings', settings);
  }

  async loadSettings() {
    return await getStoredData('theme_settings') || {};
  }
}

// Initialize when DOM is ready
console.log('📄 Script loaded, waiting for DOM...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOM Content Loaded, initializing Happy Heart Theme...');
  window.happyHeartTheme = new HappyHeartTheme();
});

// Export for global access
export default HappyHeartTheme;