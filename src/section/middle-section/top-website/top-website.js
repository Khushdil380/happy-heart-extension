/**
 * TOP WEBSITE COMPONENT
 * Manages the top websites section
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';
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
    const addWebsiteBtn = document.getElementById('add-website-btn');
    const websitesGrid = document.getElementById('websites-grid');
    
    if (!addWebsiteBtn || !websitesGrid) return;

    // Add website button
    addWebsiteBtn.addEventListener('click', () => {
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
          <label for="website-icon">Icon URL (optional):</label>
          <input type="url" id="website-icon" class="glass-input" placeholder="Leave empty for auto-generated favicon">
          <small style="color: #888; font-size: 12px; margin-top: 4px; display: block;">
            💡 Leave empty and we'll automatically fetch the website's favicon
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
      size: 'medium'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const saveBtn = popupBody.querySelector('#save-website-btn');
    const cancelBtn = popupBody.querySelector('#cancel-website-btn');

    saveBtn.addEventListener('click', async () => {
      const title = popupBody.querySelector('#website-title').value.trim();
      const url = popupBody.querySelector('#website-url').value.trim();
      const icon = popupBody.querySelector('#website-icon').value.trim() || '../images/default-icon.png';
      
      // Validate website data
      const validation = Validator.validateWebsite({ title, url, icon });
      
      if (validation.isValid) {
        await this.saveTopWebsite(validation.sanitizedValue);
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

    // Auto-generate favicon if not provided
    let icon = website.icon;
    if (!icon || icon === '../images/default-icon.png') {
      icon = await this.getFaviconUrl(website.url);
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
          <label for="website-icon">Icon URL:</label>
          <input type="url" id="website-icon" class="glass-input" value="${website.icon}">
          <small style="color: #888; font-size: 12px; margin-top: 4px; display: block;">
            💡 Leave empty and we'll automatically fetch the website's favicon
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
      size: 'medium'
    });

    popupManager.openPopup(popup);

    // Wire up event listeners
    const popupBody = popup.body;
    const updateBtn = popupBody.querySelector('#update-website-btn');
    const cancelBtn = popupBody.querySelector('#cancel-website-btn');

    updateBtn.addEventListener('click', async () => {
      const title = popupBody.querySelector('#website-title').value.trim();
      const url = popupBody.querySelector('#website-url').value.trim();
      const icon = popupBody.querySelector('#website-icon').value.trim() || '../images/default-icon.png';
      
      // Validate website data
      const validation = Validator.validateWebsite({ title, url, icon });
      
      if (validation.isValid) {
        await this.updateWebsite(websiteId, validation.sanitizedValue);
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
      // Auto-generate favicon if URL changed or icon is default
      let icon = updatedWebsite.icon;
      if ((updatedWebsite.url && updatedWebsite.url !== websites[index].url) || 
          !icon || icon === '../images/default-icon.png') {
        icon = await this.getFaviconUrl(updatedWebsite.url || websites[index].url);
      }
      
      websites[index] = { 
        ...websites[index], 
        ...updatedWebsite,
        icon: icon
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
