/**
 * MIDDLE SECTION MANAGER
 * Manages the main content area and coordinates all middle section components
 */

// Import individual components
import { initSearchBox } from './search-box/search-box.js';
import { initTopWebsite } from './top-website/top-website.js';
import { initBookmark } from './bookmark/bookmark.js';

class MiddleSection {
  constructor() {
    this.components = new Map();
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize UI
      this.initUI();
      
      // Initialize individual components
      await this.initComponents();
      
      this.isInitialized = true;
      console.log('✅ Middle Section initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Middle Section:', error);
    }
  }

  initUI() {
    const middleSection = document.getElementById('middle-section');
    if (!middleSection) return;

    // Add animation class
    middleSection.classList.add('animate-fade-in');
    
    // Add staggered animation delays
    const children = middleSection.children;
    Array.from(children).forEach((child, index) => {
      child.style.animationDelay = `${index * 0.1}s`;
    });
  }

  async initComponents() {
    console.log('🔧 Initializing middle section components...');
    
    // Initialize search box component
    console.log('🔍 Initializing search box...');
    this.components.set('searchBox', await initSearchBox());
    console.log('✅ Search box initialized');
    
    // Initialize top website component
    console.log('🌐 Initializing top website...');
    this.components.set('topWebsite', await initTopWebsite());
    console.log('✅ Top website initialized');
    
    // Initialize bookmark component
    console.log('📁 Initializing bookmark component...');
    this.components.set('bookmark', await initBookmark());
    console.log('✅ Bookmark component initialized');
  }

  // Public methods for component access
  getComponent(name) {
    return this.components.get(name);
  }

  // Get search box component
  getSearchBox() {
    return this.components.get('searchBox');
  }

  // Get top website component
  getTopWebsite() {
    return this.components.get('topWebsite');
  }

  // Get bookmark component
  getBookmark() {
    return this.components.get('bookmark');
  }

  cleanup() {
    this.components.clear();
  }
}

// Initialize and export
export async function initMiddleSection() {
  const middleSection = new MiddleSection();
  await middleSection.init();
  return middleSection;
}
