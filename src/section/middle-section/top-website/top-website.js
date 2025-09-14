/**
 * TOP WEBSITE COMPONENT
 * Manages the top websites section
 */

import { popupManager } from '../../../../assets/components/Popup/popup-manager.js';
import { getStoredData, setStoredData } from '../../../../src/utils/storage.js';
import { Validator } from '../../../../src/utils/validation.js';

class TopWebsite {
  constructor() {
    this.isInitialized = false;
    this.maxWebsites = 8;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Initialize UI
      this.initUI();
      
      // Load existing websites
      await this.loadTopWebsites();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      console.log('✅ Top Website component initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Top Website component:', error);
    }
  }

  initUI() {
    const topWebsites = document.getElementById('top-websites');
    if (!topWebsites) return;

    // Add animation class
    topWebsites.classList.add('animate-fade-in');
  }

  setupEventListeners() {
    const addWebsitePlus = document.getElementById('add-website-plus');
    const websitesGrid = document.getElementById('websites-grid');
    
    if (!addWebsitePlus || !websitesGrid) return;

    // Add website plus icon
    addWebsitePlus.addEventListener('click', () => {
      this.openAddWebsiteModal();
    });

    // Add context menu for editing (right-click)
    websitesGrid.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e);
    });

    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
      this.hideContextMenu();
    });
  }

  async loadTopWebsites() {
    const websites = await getStoredData('top_websites') || [];
    const websitesGrid = document.getElementById('websites-grid');
    
    if (!websitesGrid) return;

    websitesGrid.innerHTML = websites.map(website => `
      <a href="${website.url}" class="website-item" data-website-id="${website.id}" target="_blank">
        <img src="${website.icon}" alt="${website.title}" class="website-icon" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzM2Mzk0MiIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OqDwvdGV4dD4KPC9zdmc+'">
        <div class="website-title">${website.title}</div>
      </a>
    `).join('');

    // Add hover effects
    websitesGrid.querySelectorAll('.website-item').forEach(item => {
      item.addEventListener('mouseenter', () => {
        item.classList.add('hovered');
      });
      
      item.addEventListener('mouseleave', () => {
        item.classList.remove('hovered');
      });
    });
  }

  openAddWebsiteModal() {
    const content = `
      <div class="website-modal-content">
        <div class="form-group">
          <label for="website-title">Title:</label>
          <input type="text" id="website-title" class="glass-input" placeholder="Enter website title" required>
        </div>
        <div class="form-group">
          <label for="website-url">URL:</label>
          <input type="url" id="website-url" class="glass-input" placeholder="https://example.com" required>
        </div>
        <div class="form-group">
          <label for="website-icon-upload">Icon (optional):</label>
          <div class="icon-upload-section">
            <input type="file" id="website-icon-upload" accept="image/*" style="display: none;">
            <button type="button" id="upload-icon-btn" class="glass-button">📁 Upload Icon</button>
            <div id="icon-preview" class="icon-preview" style="display: none;">
              <img id="preview-image" src="" alt="Icon Preview" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <span id="remove-icon" style="cursor: pointer; margin-left: 8px; color: #ff4444;">✕</span>
            </div>
          </div>
          <small style="color: var(--secondary-text-color); font-size: 12px; margin-top: 4px; display: block;">
            💡 Upload a custom icon or leave empty for auto-generated favicon
          </small>
        </div>
        <div class="form-actions">
          <button class="glass-button" id="save-website-btn">Save Website</button>
          <button class="glass-button" id="cancel-website-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Add Top Website', content, {
      id: 'add-website-popup',
      size: 'small'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const saveBtn = popupBody.querySelector('#save-website-btn');
    const cancelBtn = popupBody.querySelector('#cancel-website-btn');
    const uploadBtn = popupBody.querySelector('#upload-icon-btn');
    const fileInput = popupBody.querySelector('#website-icon-upload');
    const iconPreview = popupBody.querySelector('#icon-preview');
    const previewImage = popupBody.querySelector('#preview-image');
    const removeIcon = popupBody.querySelector('#remove-icon');

    let uploadedIconData = null;

    // File upload handling
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedIconData = e.target.result;
          previewImage.src = uploadedIconData;
          iconPreview.style.display = 'flex';
          iconPreview.style.alignItems = 'center';
          uploadBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    removeIcon.addEventListener('click', () => {
      uploadedIconData = null;
      iconPreview.style.display = 'none';
      uploadBtn.style.display = 'block';
      fileInput.value = '';
    });

    saveBtn.addEventListener('click', async () => {
      const title = popupBody.querySelector('#website-title').value.trim();
      const url = popupBody.querySelector('#website-url').value.trim();
      
      // Validate website data
      const validation = Validator.validateWebsite({ title, url, icon: '' });
      
      if (validation.isValid) {
        const websiteData = {
          ...validation.sanitizedValue,
          icon: uploadedIconData || null // Will be auto-fetched if null
        };
        await this.saveTopWebsite(websiteData);
        popupManager.closePopup(popup);
        await this.loadTopWebsites();
      } else {
        alert(`Please fix the following errors:\n${validation.errors.join('\n')}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  async saveTopWebsite(website) {
    const websites = await getStoredData('top_websites') || [];
    
    if (websites.length >= this.maxWebsites) {
      alert(`You can only add up to ${this.maxWebsites} websites`);
      return;
    }

    // Handle icon - either use uploaded data or fetch favicon
    let icon = website.icon;
    if (!icon) {
      // Auto-generate favicon and store locally
      icon = await this.getFaviconUrl(website.url);
      icon = await this.storeIconLocally(icon, website.url);
    }

    websites.push({ 
      ...website, 
      icon: icon,
      id: Date.now(),
      createdAt: new Date().toISOString()
    });
    
    await setStoredData('top_websites', websites);
  }

  showContextMenu(event) {
    const websiteItem = event.target.closest('.website-item');
    if (!websiteItem) return;

    const websiteId = websiteItem.dataset.websiteId;
    
    // Remove existing context menu
    this.hideContextMenu();

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.innerHTML = `
      <div class="context-menu-item" data-action="edit" data-website-id="${websiteId}">
        <span class="context-menu-icon">✏️</span>
        <span class="context-menu-text">Edit</span>
      </div>
      <div class="context-menu-item" data-action="delete" data-website-id="${websiteId}">
        <span class="context-menu-icon">🗑️</span>
        <span class="context-menu-text">Delete</span>
      </div>
    `;

    // Position context menu
    contextMenu.style.position = 'fixed';
    contextMenu.style.left = event.clientX + 'px';
    contextMenu.style.top = event.clientY + 'px';
    contextMenu.style.zIndex = '10000';

    document.body.appendChild(contextMenu);

    // Add event listeners
    contextMenu.addEventListener('click', (e) => {
      const action = e.target.closest('.context-menu-item')?.dataset.action;
      const id = e.target.closest('.context-menu-item')?.dataset.websiteId;
      
      if (action === 'edit') {
        this.editWebsite(parseInt(id));
      } else if (action === 'delete') {
        this.deleteWebsite(parseInt(id));
      }
      
      this.hideContextMenu();
    });

    // Store reference for cleanup
    this.currentContextMenu = contextMenu;
  }

  hideContextMenu() {
    if (this.currentContextMenu) {
      this.currentContextMenu.remove();
      this.currentContextMenu = null;
    }
  }

  async editWebsite(websiteId) {
    const websites = await getStoredData('top_websites') || [];
    const website = websites.find(w => w.id === websiteId);
    
    if (!website) return;

    const content = `
      <div class="website-modal-content">
        <div class="form-group">
          <label for="website-title">Title:</label>
          <input type="text" id="website-title" class="glass-input" value="${website.title}" required>
        </div>
        <div class="form-group">
          <label for="website-url">URL:</label>
          <input type="url" id="website-url" class="glass-input" value="${website.url}" required>
        </div>
        <div class="form-group">
          <label for="website-icon-upload">Icon (optional):</label>
          <div class="icon-upload-section">
            <input type="file" id="website-icon-upload" accept="image/*" style="display: none;">
            <button type="button" id="upload-icon-btn" class="glass-button">📁 Upload Icon</button>
            <div id="icon-preview" class="icon-preview">
              <img id="preview-image" src="${website.icon}" alt="Current Icon" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
              <span id="remove-icon" style="cursor: pointer; margin-left: 8px; color: #ff4444;">✕</span>
            </div>
          </div>
          <small style="color: var(--secondary-text-color); font-size: 12px; margin-top: 4px; display: block;">
            💡 Upload a custom icon or keep current icon
          </small>
        </div>
        <div class="form-actions">
          <button class="glass-button" id="update-website-btn">Update Website</button>
          <button class="glass-button" id="cancel-website-btn">Cancel</button>
        </div>
      </div>
    `;

    const popup = popupManager.createPopup('Edit Website', content, {
      id: 'edit-website-popup',
      size: 'small'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const updateBtn = popupBody.querySelector('#update-website-btn');
    const cancelBtn = popupBody.querySelector('#cancel-website-btn');
    const uploadBtn = popupBody.querySelector('#upload-icon-btn');
    const fileInput = popupBody.querySelector('#website-icon-upload');
    const iconPreview = popupBody.querySelector('#icon-preview');
    const previewImage = popupBody.querySelector('#preview-image');
    const removeIcon = popupBody.querySelector('#remove-icon');

    let uploadedIconData = null;
    let hasIconChanged = false;

    // File upload handling
    uploadBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedIconData = e.target.result;
          previewImage.src = uploadedIconData;
          hasIconChanged = true;
          uploadBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);
      }
    });

    removeIcon.addEventListener('click', () => {
      uploadedIconData = null;
      hasIconChanged = true;
      // Hide preview and show upload button
      iconPreview.style.display = 'none';
      uploadBtn.style.display = 'block';
      fileInput.value = '';
    });

    updateBtn.addEventListener('click', async () => {
      const title = popupBody.querySelector('#website-title').value.trim();
      const url = popupBody.querySelector('#website-url').value.trim();
      
      // Validate website data
      const validation = Validator.validateWebsite({ title, url, icon: '' });
      
      if (validation.isValid) {
        const websiteData = {
          ...validation.sanitizedValue,
          icon: uploadedIconData || (hasIconChanged ? null : website.icon)
        };
        await this.updateWebsite(websiteId, websiteData);
        popupManager.closePopup(popup);
        await this.loadTopWebsites();
      } else {
        alert(`Please fix the following errors:\n${validation.errors.join('\n')}`);
      }
    });

    cancelBtn.addEventListener('click', () => {
      popupManager.closePopup(popup);
    });
  }

  async updateWebsite(websiteId, updatedWebsite) {
    const websites = await getStoredData('top_websites') || [];
    const index = websites.findIndex(w => w.id === websiteId);
    
    if (index !== -1) {
      // Handle icon updates
      let icon = updatedWebsite.icon;
      
      // If icon is null (removed) or URL changed, fetch new favicon
      if (!icon || (updatedWebsite.url && updatedWebsite.url !== websites[index].url)) {
        icon = await this.getFaviconUrl(updatedWebsite.url || websites[index].url);
        icon = await this.storeIconLocally(icon, updatedWebsite.url || websites[index].url);
      }
      
      websites[index] = { 
        ...websites[index], 
        ...updatedWebsite,
        icon: icon,
        updatedAt: new Date().toISOString()
      };
      await setStoredData('top_websites', websites);
    }
  }

  async getFaviconUrl(url) {
    try {
      // Parse the URL to get the domain
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      const domain = urlObj.hostname;
      
      // Try multiple favicon sources in order of preference
      const faviconSources = [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        `https://favicons.githubusercontent.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://${domain}/favicon.ico`,
        `https://www.${domain}/favicon.ico`
      ];
      
      // Test each source to find a working favicon
      for (const faviconUrl of faviconSources) {
        try {
          const response = await fetch(faviconUrl, { 
            method: 'HEAD',
            mode: 'cors'
          });
          if (response.ok) {
            return faviconUrl;
          }
        } catch (error) {
          // Continue to next source
          continue;
        }
      }
      
      // Fallback to Google's favicon service
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
      
    } catch (error) {
      console.warn('Failed to get favicon for URL:', url, error);
      // Return a default icon
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzM2Mzk0MiIvPgo8dGV4dCB4PSIxNiIgeT0iMjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+8J+OqDwvdGV4dD4KPC9zdmc+';
    }
  }

  async storeIconLocally(iconUrl, websiteUrl) {
    try {
      // If it's already a data URL (base64), return as is
      if (iconUrl.startsWith('data:')) {
        return iconUrl;
      }

      // Fetch the icon and convert to base64
      const response = await fetch(iconUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch icon');
      }

      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => {
          console.warn('Failed to convert icon to base64, using original URL');
          resolve(iconUrl);
        };
        reader.readAsDataURL(blob);
      });

    } catch (error) {
      console.warn('Failed to store icon locally:', error);
      // Return original URL as fallback
      return iconUrl;
    }
  }

  async deleteWebsite(websiteId) {
    if (confirm('Are you sure you want to delete this website?')) {
      const websites = await getStoredData('top_websites') || [];
      const filteredWebsites = websites.filter(w => w.id !== websiteId);
      await setStoredData('top_websites', filteredWebsites);
      await this.loadTopWebsites();
    }
  }

  cleanup() {
    this.hideContextMenu();
  }
}

// Initialize and export
export async function initTopWebsite() {
  const topWebsite = new TopWebsite();
  await topWebsite.init();
  return topWebsite;
}
