/**
 * BOOKMARK COMPONENT
 * Manages the bookmark system with folder-based organization
 * Features: Folder creation, bookmark management, Chrome bookmarks integration
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';

class Bookmark {
  constructor() {
    this.isInitialized = false;
    this.maxBookmarksPerFolder = 12;
    this.currentFolder = null;
    this.bookmarkIdCounter = 1;
    this.folderIdCounter = 1;
    this.searchQuery = '';
    this.isChromeBookmarksEnabled = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Check Chrome bookmarks availability
      this.isChromeBookmarksEnabled = typeof chrome !== 'undefined' && 
                                     chrome.bookmarks && 
                                     chrome.permissions;
      
      // Initialize UI
      this.initUI();
      
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        await new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve));
      }
      
      // Clear corrupted storage data if needed
      await this.clearCorruptedStorage();
      
      // Load existing bookmarks
      await this.loadBookmarks();
      
      // Set up event listeners with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupEventListeners();
      }, 100);
      
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ Failed to initialize Bookmark component:', error);
    }
  }

  async clearCorruptedStorage() {
    const bookmarks = await this.getStoredData('bookmarks');
    if (Array.isArray(bookmarks)) {
      await this.setStoredData('bookmarks', { 'General': [] });
    }
  }

  initUI() {
    const bookmarks = document.getElementById('bookmarks');
    if (!bookmarks) return;

    // Add animation class
    bookmarks.classList.add('animate-fade-in');
    
    // Add search functionality to header
    this.addSearchToHeader();
  }

  addSearchToHeader() {
    const bookmarksHeader = document.querySelector('.bookmarks-header');
    if (!bookmarksHeader) return;

    // Insert search box after tabs but before actions
    const searchBox = document.createElement('div');
    searchBox.className = 'bookmark-search-container';
    searchBox.innerHTML = `
      <input type="text" id="bookmark-search" class="glass-input bookmark-search" 
             placeholder="Search bookmarks..." autocomplete="off">
      <button id="clear-search-btn" class="clear-search-btn" style="display: none;">✕</button>
    `;

    // Insert before actions
    const actions = bookmarksHeader.querySelector('.bookmarks-actions');
    if (actions) {
      bookmarksHeader.insertBefore(searchBox, actions);
    }
  }

  setupEventListeners() {
    const addFolderBtn = document.getElementById('add-folder-btn');
    const addBookmarkBtn = document.getElementById('add-bookmark-btn');
    const bookmarksTabs = document.getElementById('bookmarks-tabs');
    const searchInput = document.getElementById('bookmark-search');
    const clearSearchBtn = document.getElementById('clear-search-btn');
    
    if (!addFolderBtn || !addBookmarkBtn || !bookmarksTabs) return;

    // Add folder button
    addFolderBtn.addEventListener('click', () => {
      this.openAddFolderModal();
    });

    // Add bookmark button
    addBookmarkBtn.addEventListener('click', () => {
      this.openAddBookmarkModal();
    });

    // Search functionality
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.trim();
        this.performSearch();
        
        // Show/hide clear button
        if (clearSearchBtn) {
          clearSearchBtn.style.display = this.searchQuery ? 'block' : 'none';
        }
      });

      // Clear search
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          this.searchQuery = '';
          this.performSearch();
          clearSearchBtn.style.display = 'none';
        });
      }
    }

    // Tab click handlers will be added dynamically in loadBookmarks
  }

  async loadBookmarks() {
    let bookmarks = await this.getStoredData('bookmarks') || {};
    
    // Fix if bookmarks is an array instead of object
    if (Array.isArray(bookmarks)) {
      bookmarks = {};
    }
    
    const bookmarksTabs = document.getElementById('bookmarks-tabs');
    const bookmarksContent = document.getElementById('bookmarks-content');
    
    if (!bookmarksTabs || !bookmarksContent) return;

    // Create default folder if none exist
    const folders = Object.keys(bookmarks);
    
    if (folders.length === 0) {
      bookmarks['General'] = [];
      await this.setStoredData('bookmarks', bookmarks);
      folders.push('General');
    }
    
    // Ensure we have a proper object structure
    if (!bookmarks || typeof bookmarks !== 'object' || Array.isArray(bookmarks)) {
      bookmarks = { 'General': [] };
      await this.setStoredData('bookmarks', bookmarks);
      folders.length = 0;
      folders.push('General');
    }

    // Create folder tabs with counts (without three-dot button)
    const tabsHTML = folders.map(folder => {
      const count = bookmarks[folder] ? bookmarks[folder].length : 0;
      return `
        <div class="folder-tab ${folder === folders[0] ? 'active' : ''}" data-folder="${folder}">
          <span class="folder-name">${folder}</span>
          <span class="folder-count">(${count})</span>
        </div>
      `;
    }).join('');
    
    bookmarksTabs.innerHTML = tabsHTML;

    // Set current folder
    this.currentFolder = folders[0];

    // Load first folder's content
    this.loadFolderContent(folders[0], bookmarks[folders[0]] || []);

    // Add tab click handlers (left click to switch, right click for menu)
    bookmarksTabs.querySelectorAll('.folder-tab').forEach(tab => {
      // Left click to switch folder
      tab.addEventListener('click', (e) => {
        const folder = tab.dataset.folder;
        this.switchFolder(folder);
      });
      
      // Right click for context menu
      tab.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const folder = tab.dataset.folder;
        this.showFolderContextMenu(folder, e);
      });
    });
  }

  showFolderContextMenu(folderName, event) {
    // Remove any existing context menu
    const existingMenu = document.querySelector('.folder-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    // Create context menu
    const menu = document.createElement('div');
    menu.className = 'folder-context-menu';
    menu.innerHTML = `
      <div class="menu-item" data-action="rename" data-folder="${folderName}">
        <span>✏️</span>
        <span>Rename</span>
      </div>
      <div class="menu-item" data-action="delete" data-folder="${folderName}">
        <span>🗑️</span>
        <span>Delete</span>
      </div>
    `;

    // Position menu at cursor position
    menu.style.position = 'fixed';
    menu.style.top = `${event.clientY}px`;
    menu.style.left = `${event.clientX}px`;
    menu.style.zIndex = '999999';
    menu.style.pointerEvents = 'auto';

    // Add to document
    document.body.appendChild(menu);

    // Add click handlers
    menu.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action;
        const folder = item.dataset.folder;
        
        if (action === 'rename') {
          this.renameFolder(folder);
        } else if (action === 'delete') {
          this.deleteFolder(folder);
        }
        
        menu.remove();
      });
    });

    // Close menu when clicking outside or pressing escape
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        menu.remove();
        document.removeEventListener('click', closeMenu);
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
      document.addEventListener('keydown', handleEscape);
    }, 100);
  }

  async performSearch() {
    if (!this.searchQuery) {
    // If no search query, show current folder content
    const bookmarks = await this.getStoredData('bookmarks') || {};
    this.loadFolderContent(this.currentFolder, bookmarks[this.currentFolder] || []);
    return;
  }

  // Search across all folders
  const bookmarks = await this.getStoredData('bookmarks') || {};
    const allBookmarks = [];
    
    Object.entries(bookmarks).forEach(([folder, folderBookmarks]) => {
      folderBookmarks.forEach(bookmark => {
        if (bookmark.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(this.searchQuery.toLowerCase())) {
          allBookmarks.push({ ...bookmark, folder });
        }
      });
    });

    this.displaySearchResults(allBookmarks);
  }

  displaySearchResults(results) {
    const bookmarksContent = document.getElementById('bookmarks-content');
    if (!bookmarksContent) return;

    if (results.length === 0) {
      bookmarksContent.innerHTML = `
        <div class="empty-folder">
          <div class="empty-icon">🔍</div>
          <p>No bookmarks found for "${this.searchQuery}"</p>
        </div>
      `;
      return;
    }

    bookmarksContent.innerHTML = `
      <div class="search-results-header">
        <h4>Search Results (${results.length})</h4>
      </div>
      <div class="bookmarks-grid">
        ${results.map(bookmark => `
          <div class="bookmark-item search-result" data-bookmark-id="${bookmark.id}">
            <img src="${bookmark.icon}" alt="${bookmark.title}" class="bookmark-icon">
            <div class="bookmark-title">${bookmark.title}</div>
            <div class="bookmark-actions">
              <button class="bookmark-action-btn edit-btn" data-action="edit" data-bookmark-id="${bookmark.id}">✏️</button>
              <button class="bookmark-action-btn delete-btn" data-action="delete" data-bookmark-id="${bookmark.id}">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for search results
    this.attachBookmarkHandlers();
  }

  switchFolder(folderName) {
    // Clear search when switching folders
    const searchInput = document.getElementById('bookmark-search');
    if (searchInput) {
      searchInput.value = '';
      this.searchQuery = '';
    }

    // Update active tab
    document.querySelectorAll('.folder-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-folder="${folderName}"]`).classList.add('active');

    // Update current folder
    this.currentFolder = folderName;

    // Load folder content
    this.getStoredData('bookmarks').then(bookmarks => {
      this.loadFolderContent(folderName, bookmarks[folderName] || []);
    });
  }


  loadFolderContent(folderName, bookmarks) {
    const bookmarksContent = document.getElementById('bookmarks-content');
    if (!bookmarksContent) return;
    
    // Ensure bookmarks is always an array
    const bookmarksArray = Array.isArray(bookmarks) ? bookmarks : [];
    
    if (bookmarksArray.length === 0) {
      bookmarksContent.innerHTML = `
        <div class="empty-folder">
          <div class="empty-icon">📁</div>
          <p>No bookmarks in this folder yet.</p>
          <p>Click the + Bookmark button to add some!</p>
        </div>
      `;
      return;
    }

    bookmarksContent.innerHTML = `
      <div class="bookmarks-grid">
        ${bookmarksArray.map(bookmark => `
          <div class="bookmark-item" data-bookmark-id="${bookmark.id}">
            <img src="${bookmark.icon}" alt="${bookmark.title}" class="bookmark-icon" 
                 onerror="this.src='../assets/icons/icon16.png'">
            <div class="bookmark-title" title="${bookmark.title}">${bookmark.title}</div>
            <div class="bookmark-actions">
              <button class="bookmark-action-btn edit-btn" data-action="edit" data-bookmark-id="${bookmark.id}" title="Edit bookmark">✏️</button>
              <button class="bookmark-action-btn delete-btn" data-action="delete" data-bookmark-id="${bookmark.id}" title="Delete bookmark">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Add click handlers for bookmarks
    this.attachBookmarkHandlers();
  }

  attachBookmarkHandlers() {
    const bookmarksContent = document.getElementById('bookmarks-content');
    if (!bookmarksContent) return;

    bookmarksContent.querySelectorAll('.bookmark-item').forEach(item => {
      const bookmarkId = item.dataset.bookmarkId;
      
      // Main click to open bookmark
      item.addEventListener('click', (e) => {
        if (!e.target.closest('.bookmark-actions')) {
          this.openBookmark(bookmarkId);
        }
      });

      // Action buttons
      const editBtn = item.querySelector('.edit-btn');
      const deleteBtn = item.querySelector('.delete-btn');

      if (editBtn) {
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.editBookmark(parseInt(bookmarkId));
        });
      }

      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.deleteBookmark(parseInt(bookmarkId));
        });
      }
    });
  }

  truncateUrl(url) {
    if (url.length <= 30) return url;
    return url.substring(0, 27) + '...';
  }

  openBookmark(bookmarkId) {
    this.getStoredData('bookmarks').then(bookmarks => {
      const allBookmarks = Object.values(bookmarks).flat();
      const bookmark = allBookmarks.find(b => b.id == bookmarkId);
      if (bookmark) {
        window.open(bookmark.url, '_blank');
      }
    });
  }

  openAddFolderModal() {
    const content = `
      <div class="folder-modal-content">
        <div class="form-group">
          <label for="folder-name">Folder Name:</label>
          <input type="text" id="folder-name" class="glass-input" placeholder="Enter folder name" required>
        </div>
        <div class="form-actions">
          <button class="glass-button" id="save-folder-btn">Save Folder</button>
          <button class="glass-button" id="cancel-folder-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Add New Folder', content, {
      id: 'add-folder-popup',
      size: 'small'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const saveBtn = popupBody.querySelector('#save-folder-btn');
    const cancelBtn = popupBody.querySelector('#cancel-folder-btn');

    saveBtn.addEventListener('click', async () => {
      const name = popupBody.querySelector('#folder-name').value.trim();
      if (name) {
        await this.saveFolder(name);
        popupManager.closePopup(popup);
        await this.loadBookmarks();
      } else {
        alert('Please enter a folder name');
      }
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  async saveFolder(folderName) {
    const bookmarks = await this.getStoredData('bookmarks') || {};
    
    // Fix if bookmarks is an array instead of object
    let bookmarksObj = bookmarks;
    if (Array.isArray(bookmarks)) {
      bookmarksObj = {};
      // Convert array back to object if possible
      bookmarks.forEach((item, index) => {
        if (typeof item === 'string') {
          bookmarksObj[item] = [];
        }
      });
    }
    
    if (bookmarksObj[folderName]) {
      alert('A folder with this name already exists');
      return;
    }
    
    bookmarksObj[folderName] = [];
    await this.setStoredData('bookmarks', bookmarksObj);
  }


  async renameFolder(oldName) {
    const newName = prompt(`Rename folder "${oldName}" to:`, oldName);
    if (!newName || newName === oldName) return;

    let bookmarks = await this.getStoredData('bookmarks') || {};
    
    // Fix if bookmarks is an array instead of object
    if (Array.isArray(bookmarks)) {
      bookmarks = {};
    }
    
    if (bookmarks[newName]) {
      alert('A folder with this name already exists');
      return;
    }

    // Move bookmarks to new folder name
    bookmarks[newName] = bookmarks[oldName] || [];
    delete bookmarks[oldName];

    await this.setStoredData('bookmarks', bookmarks);
    await this.loadBookmarks();
  }

  async deleteFolder(folderName) {
    let bookmarks = await this.getStoredData('bookmarks') || {};
    
    // Fix if bookmarks is an array instead of object
    if (Array.isArray(bookmarks)) {
      bookmarks = {};
    }
    
    const folderBookmarks = bookmarks[folderName] || [];

    if (folderBookmarks.length > 0) {
      const confirmMessage = `Delete folder "${folderName}" and all ${folderBookmarks.length} bookmarks inside?`;
      if (!confirm(confirmMessage)) return;
    } else {
      if (!confirm(`Delete empty folder "${folderName}"?`)) return;
    }

    delete bookmarks[folderName];
    await this.setStoredData('bookmarks', bookmarks);
    
    // Switch to another folder if deleting current folder
    if (this.currentFolder === folderName) {
      const remainingFolders = Object.keys(bookmarks);
      if (remainingFolders.length > 0) {
        this.switchFolder(remainingFolders[0]);
      }
    }
    
    await this.loadBookmarks();
  }

  async exportFolderBookmarks(folderName) {
    const bookmarks = await this.getStoredData('bookmarks') || {};
    const folderBookmarks = bookmarks[folderName] || [];

    if (folderBookmarks.length === 0) {
      alert('No bookmarks to export in this folder');
      return;
    }

    // Create HTML export
    const htmlContent = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="${Date.now()}" LAST_MODIFIED="${Date.now()}" PERSONAL_TOOLBAR_FOLDER="true">${folderName}</H3>
    <DL><p>
${folderBookmarks.map(bookmark => `
        <DT><A HREF="${bookmark.url}" ADD_DATE="${Date.now()}" ICON="${bookmark.icon}">${bookmark.title}</A>
`).join('')}
    </DL><p>
</DL><p>
    `;

    // Download the file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${folderName}_bookmarks.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  openAddBookmarkModal() {
    if (!this.currentFolder) {
      alert('Please select a folder first');
      return;
    }

    const content = `
      <div class="bookmark-modal-content">
        <div class="form-group">
          <label for="bookmark-url">URL:</label>
          <input type="url" id="bookmark-url" class="glass-input" placeholder="https://example.com" required>
          <small class="form-help">Enter the website URL</small>
        </div>
        <div class="form-group">
          <label for="bookmark-title">Title:</label>
          <input type="text" id="bookmark-title" class="glass-input" placeholder="Enter bookmark title" required>
          <small class="form-help">Will be auto-filled from the website</small>
        </div>
        <div class="form-group">
          <label for="bookmark-icon">Icon URL (optional):</label>
          <input type="url" id="bookmark-icon" class="glass-input" placeholder="Will be auto-detected">
          <small class="form-help">Leave empty to auto-detect favicon</small>
        </div>
        <div class="form-actions">
          <button class="glass-button" id="fetch-info-btn">🔍 Auto-fill Info</button>
          <button class="glass-button" id="save-bookmark-btn">Save Bookmark</button>
          <button class="glass-button" id="cancel-bookmark-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup(`Add Bookmark to ${this.currentFolder}`, content, {
      id: 'add-bookmark-popup',
      size: 'medium'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const saveBtn = popupBody.querySelector('#save-bookmark-btn');
    const cancelBtn = popupBody.querySelector('#cancel-bookmark-btn');
    const fetchBtn = popupBody.querySelector('#fetch-info-btn');
    const urlInput = popupBody.querySelector('#bookmark-url');
    const titleInput = popupBody.querySelector('#bookmark-title');
    const iconInput = popupBody.querySelector('#bookmark-icon');

    // Auto-fetch info button
    fetchBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      if (!url) {
        alert('Please enter a URL first');
        return;
      }

      if (!this.isValidUrl(url)) {
        alert('Please enter a valid URL');
        return;
      }

      fetchBtn.textContent = '🔄 Fetching...';
      fetchBtn.disabled = true;

      try {
        const info = await this.fetchWebsiteInfo(url);
        if (info.title) titleInput.value = info.title;
        if (info.icon) iconInput.value = info.icon;
      } catch (error) {
        console.error('Failed to fetch website info:', error);
        alert('Failed to fetch website information. Please fill manually.');
      } finally {
        fetchBtn.textContent = '🔍 Auto-fill Info';
        fetchBtn.disabled = false;
      }
    });

    saveBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      const url = urlInput.value.trim();
      let icon = iconInput.value.trim();
      
      if (!title || !url) {
        alert('Please fill in all required fields');
        return;
      }

      if (!this.isValidUrl(url)) {
        alert('Please enter a valid URL');
        return;
      }

      // Auto-fetch favicon if not provided
      if (!icon) {
        icon = this.getFaviconUrl(url);
      }

      await this.saveBookmark(this.currentFolder, { title, url, icon });
      popupManager.closePopup(popup);
      await this.loadBookmarks();
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  async fetchWebsiteInfo(url) {
    // This is a simplified version - in a real implementation, you'd need a CORS proxy
    // or server-side solution to fetch website metadata
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      const html = data.contents;
      
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const iconMatch = html.match(/<link[^>]*rel=["']icon["'][^>]*href=["']([^"']+)["']/i) ||
                       html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']icon["']/i);

      return {
        title: titleMatch ? titleMatch[1].trim() : new URL(url).hostname,
        icon: iconMatch ? this.resolveIconUrl(iconMatch[1], url) : this.getFaviconUrl(url)
      };
    } catch (error) {
      // Fallback to basic info
      return {
        title: new URL(url).hostname,
        icon: this.getFaviconUrl(url)
      };
    }
  }

  getFaviconUrl(url) {
    try {
      const domain = new URL(url).origin;
      return `${domain}/favicon.ico`;
    } catch {
      return '../assets/icons/icon16.png';
    }
  }

  resolveIconUrl(iconUrl, baseUrl) {
    if (iconUrl.startsWith('http')) return iconUrl;
    if (iconUrl.startsWith('//')) return `https:${iconUrl}`;
    if (iconUrl.startsWith('/')) {
      try {
        const base = new URL(baseUrl);
        return `${base.origin}${iconUrl}`;
      } catch {
        return iconUrl;
      }
    }
    return iconUrl;
  }

  async saveBookmark(folderName, bookmark) {
    const bookmarks = await this.getStoredData('bookmarks') || {};
    if (!bookmarks[folderName]) {
      bookmarks[folderName] = [];
    }
    
    if (bookmarks[folderName].length >= this.maxBookmarksPerFolder) {
      alert(`You can only add up to ${this.maxBookmarksPerFolder} bookmarks per folder`);
      return;
    }
    
    bookmarks[folderName].push({ 
      ...bookmark, 
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    
    await this.setStoredData('bookmarks', bookmarks);
  }

  async editBookmark(bookmarkId) {
    const bookmarks = await this.getStoredData('bookmarks') || {};
    const allBookmarks = Object.values(bookmarks).flat();
    const bookmark = allBookmarks.find(b => b.id === bookmarkId);
    
    if (!bookmark) return;

    // Find which folder contains this bookmark
    let folderName = null;
    for (const [folder, folderBookmarks] of Object.entries(bookmarks)) {
      if (folderBookmarks.some(b => b.id === bookmarkId)) {
        folderName = folder;
        break;
      }
    }

    const content = `
      <div class="bookmark-modal-content">
        <div class="form-group">
          <label for="bookmark-title">Title:</label>
          <input type="text" id="bookmark-title" class="glass-input" value="${bookmark.title}" required>
        </div>
        <div class="form-group">
          <label for="bookmark-url">URL:</label>
          <input type="url" id="bookmark-url" class="glass-input" value="${bookmark.url}" required>
        </div>
        <div class="form-group">
          <label for="bookmark-icon">Icon URL:</label>
          <input type="url" id="bookmark-icon" class="glass-input" value="${bookmark.icon}">
        </div>
        <div class="form-actions">
          <button class="glass-button" id="update-bookmark-btn">Update Bookmark</button>
          <button class="glass-button" id="cancel-bookmark-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Edit Bookmark', content, {
      id: 'edit-bookmark-popup',
      size: 'medium'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const updateBtn = popupBody.querySelector('#update-bookmark-btn');
    const cancelBtn = popupBody.querySelector('#cancel-bookmark-btn');

    updateBtn.addEventListener('click', async () => {
      const title = popupBody.querySelector('#bookmark-title').value.trim();
      const url = popupBody.querySelector('#bookmark-url').value.trim();
      const icon = popupBody.querySelector('#bookmark-icon').value.trim() || '../images/default-icon.png';
      
      if (title && url) {
        await this.updateBookmark(bookmarkId, { title, url, icon });
        popupManager.closePopup(popup);
        await this.loadBookmarks();
      } else {
        alert('Please fill in all required fields');
      }
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  async updateBookmark(bookmarkId, updatedBookmark) {
    const bookmarks = await this.getStoredData('bookmarks') || {};
    
    for (const [folderName, folderBookmarks] of Object.entries(bookmarks)) {
      const index = folderBookmarks.findIndex(b => b.id === bookmarkId);
      if (index !== -1) {
        bookmarks[folderName][index] = { ...bookmarks[folderName][index], ...updatedBookmark };
        await this.setStoredData('bookmarks', bookmarks);
        break;
      }
    }
  }

  async deleteBookmark(bookmarkId) {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      const bookmarks = await this.getStoredData('bookmarks') || {};
      
      for (const [folderName, folderBookmarks] of Object.entries(bookmarks)) {
        const filteredBookmarks = folderBookmarks.filter(b => b.id !== bookmarkId);
        if (filteredBookmarks.length !== folderBookmarks.length) {
          bookmarks[folderName] = filteredBookmarks;
          await this.setStoredData('bookmarks', bookmarks);
          await this.loadBookmarks();
          break;
        }
      }
    }
  }

  // Storage helper methods
  async getStoredData(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      } else {
        resolve(JSON.parse(localStorage.getItem(key)) || null);
      }
    });
  }

  async setStoredData(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }

  // Public methods
  getCurrentFolder() {
    return this.currentFolder;
  }

  switchToFolder(folderName) {
    this.switchFolder(folderName);
  }

  cleanup() {
    // Cleanup if needed
  }
}

// Initialize and export
export async function initBookmark() {
  const bookmark = new Bookmark();
  await bookmark.init();
  return bookmark;
}
