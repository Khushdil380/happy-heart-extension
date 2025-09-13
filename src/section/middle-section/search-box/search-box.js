/**
 * SEARCH BOX COMPONENT
 * Manages the search functionality with multiple search engines
 */

import { getStoredData, setStoredData } from '../../../utils/storage.js';
import { popupManager } from '../../../../components/Popup/popup-manager.js';

class SearchBox {
  constructor() {
    this.isInitialized = false;
    this.currentSearchEngine = null;
    this.searchEngines = [
      { 
        name: 'Google', 
        icon: '🔍', 
        url: 'https://www.google.com/search?q='
      },
      { 
        name: 'Bing', 
        icon: '🔎', 
        url: 'https://www.bing.com/search?q='
      },
      { 
        name: 'Yahoo', 
        icon: '🌐', 
        url: 'https://search.yahoo.com/search?p='
      },
      { 
        name: 'DuckDuckGo', 
        icon: '🦆', 
        url: 'https://duckduckgo.com/?q='
      }
    ];
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize UI
      this.initUI();
      
      // Load saved search engine
      await this.loadSavedSearchEngine();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Search Box component initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Search Box component:', error);
    }
  }

  initUI() {
    const searchBox = document.getElementById('search-box');
    if (!searchBox) return;

    // Add animation class
    searchBox.classList.add('animate-fade-in');
  }

  openSearchEnginePopup() {
    const content = `
      <div class="search-engine-popup-content">
        <div class="search-engine-list">
          ${this.searchEngines.map(engine => `
            <div class="search-engine-option" data-engine='${JSON.stringify(engine)}'>
              <span class="engine-icon">${engine.icon}</span>
              <span class="engine-name">${engine.name}</span>
              ${this.currentSearchEngine && this.currentSearchEngine.name === engine.name ? '<span class="current-indicator">✓</span>' : ''}
            </div>
          `).join('')}
        </div>
        <div class="popup-actions">
          <button class="glass-button" id="close-search-engine-popup">Close</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Select Search Engine', content, {
      id: 'search-engine-popup',
      size: 'small'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const closeBtn = popupBody.querySelector('#close-search-engine-popup');
    
    // Add click handlers for search engine options
    popupBody.querySelectorAll('.search-engine-option').forEach(option => {
      option.addEventListener('click', () => {
        const engine = JSON.parse(option.dataset.engine);
        this.selectSearchEngine(engine);
        popupManager.closePopup(popup);
      });
    });

    closeBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const searchEngineBtn = document.getElementById('search-engine-btn');
    
    if (!searchInput || !searchBtn || !searchEngineBtn) return;

    // Search input events
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Search input focus/blur for better UX
    searchInput.addEventListener('focus', () => {
      searchInput.parentElement.classList.add('focused');
    });

    searchInput.addEventListener('blur', () => {
      searchInput.parentElement.classList.remove('focused');
    });

    // Search button event
    searchBtn.addEventListener('click', () => {
      this.performSearch();
    });

    // Search engine popup toggle
    searchEngineBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openSearchEnginePopup();
    });
  }

  async loadSavedSearchEngine() {
    const savedEngine = await getStoredData('selected_search_engine');
    
    if (savedEngine) {
      this.currentSearchEngine = savedEngine;
    } else {
      // Default to Google
      this.currentSearchEngine = this.searchEngines[0];
      await this.saveSearchEngine(this.currentSearchEngine);
    }
    
    this.updateSearchEngineDisplay();
  }

  selectSearchEngine(engine) {
    this.currentSearchEngine = engine;
    this.updateSearchEngineDisplay();
    this.saveSearchEngine(engine);
  }

  updateSearchEngineDisplay() {
    const searchEngineIcon = document.getElementById('search-engine-icon');
    if (!searchEngineIcon || !this.currentSearchEngine) return;

    // Update emoji icon
    searchEngineIcon.textContent = this.currentSearchEngine.icon;
    searchEngineIcon.setAttribute('title', this.currentSearchEngine.name);
  }


  performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
      searchInput.focus();
      return;
    }
    
    if (!this.currentSearchEngine) {
      console.error('No search engine selected');
      return;
    }

    // Save search query for suggestions (optional)
    this.saveSearchQuery(query);
    
    // Perform search
    const searchUrl = this.currentSearchEngine.url + encodeURIComponent(query);
    window.open(searchUrl, '_blank');
    
    // Clear input after search
    searchInput.value = '';
  }

  async saveSearchEngine(engine) {
    await setStoredData('selected_search_engine', engine);
  }

  async saveSearchQuery(query) {
    const searchHistory = await getStoredData('search_history') || [];
    
    // Add to beginning and limit to 10 items
    searchHistory.unshift({
      query,
      engine: this.currentSearchEngine.name,
      timestamp: new Date().toISOString()
    });
    
    const limitedHistory = searchHistory.slice(0, 10);
    await setStoredData('search_history', limitedHistory);
  }

  // Public methods for external access
  getCurrentSearchEngine() {
    return this.currentSearchEngine;
  }

  setSearchEngine(engineName) {
    const engine = this.searchEngines.find(e => e.name === engineName);
    if (engine) {
      this.selectSearchEngine(engine);
    }
  }

  getSearchHistory() {
    return getStoredData('search_history') || [];
  }

  clearSearchHistory() {
    return setStoredData('search_history', []);
  }

  cleanup() {
    // Cleanup if needed
  }
}

// Initialize and export
export async function initSearchBox() {
  const searchBox = new SearchBox();
  await searchBox.init();
  return searchBox;
}
