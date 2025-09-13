/**
 * BACKGROUND IMAGE TOOL
 * Handles background customization with the new unified system
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';
import { getStoredData, setStoredData, removeStoredData } from '../../../utils/storage.js';

// Configuration
const STORAGE_KEY = 'background_settings';
const DEFAULT_IMAGES = ['../assets/images/default-bg/1.gif',
  '../assets/images/default-bg/2.gif',
  '../assets/images/default-bg/3.gif',
  '../assets/images/default-bg/4.gif',
  
  
];
const BROWSER_IMAGES = [
  '../assets/images/imageBrowser/1.jpg',
  '../assets/images/imageBrowser/2.jpg',
  '../assets/images/imageBrowser/3.jpg',
  '../assets/images/imageBrowser/4.jpg',
  '../assets/images/imageBrowser/5.jpg',
];

const SOLID_COLORS = [
  '#000814', '#1c1d1d', '#dc143c', '#ff002e', '#05ffee',
  '#0ea5e9', '#22c55e', '#ef4444', '#eab308', '#a855f7'
];

const GRADIENTS = [
  'linear-gradient(135deg, #000814 0%, #1c1d1d 100%)',
  'linear-gradient(135deg, #dc143c 0%, #ff002e 100%)',
  'linear-gradient(135deg, #05ffee 0%, #0ea5e9 100%)',
  'linear-gradient(135deg, #22c55e 0%, #a855f7 100%)'
];

class BackgroundImageTool {
  constructor() {
    this.popup = null;
    this.currentChoice = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Create popup
      this.createPopup();
      
      // Wire up event listeners
      this.wireEventListeners();
      
      // Load saved settings
      await this.loadSettings();
      
      this.isInitialized = true;
      console.log('✅ Background Image Tool initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize Background Image Tool:', error);
    }
  }

  createPopup() {
    const content = `
      <div class="background-popup-content">
        <div class="background-options">
          <div class="option-item active" data-option="color">
            <div class="option-icon">🎨</div>
            <div class="option-label">Solid Color</div>
          </div>
          <div class="option-item" data-option="gradient">
            <div class="option-icon">🌈</div>
            <div class="option-label">Gradient</div>
          </div>
          <div class="option-item" data-option="image">
            <div class="option-icon">🖼️</div>
            <div class="option-label">Image</div>
          </div>
        </div>
        
        <div class="background-preview">
          <div class="preview-grid" id="preview-grid">
            <!-- Dynamic content -->
          </div>
          
          <div class="background-actions">
            <button class="glass-button" id="reset-btn">Reset to Default</button>
            <button class="glass-button" id="save-btn">Save</button>
            <input type="file" accept="image/*" id="file-input" style="display: none;">
          </div>
        </div>
      </div>
    `;

    this.popup = popupManager.createPopup('Customize Background', content, {
      id: 'background-popup',
      size: 'large'
    });
  }

  wireEventListeners() {
    const toolButton = document.getElementById('background-tool');
    if (!toolButton) return;

    // Tool button click
    toolButton.addEventListener('click', () => {
      this.openPopup();
    });

    // Popup event listeners
    if (this.popup) {
      const popupBody = this.popup.body;
      
      // Option selection
      const options = popupBody.querySelectorAll('.option-item');
      options.forEach(option => {
        option.addEventListener('click', () => {
          this.selectOption(option.dataset.option);
        });
      });

      // Reset button
      const resetBtn = popupBody.querySelector('#reset-btn');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.resetToDefault();
        });
      }

      // Save button
      const saveBtn = popupBody.querySelector('#save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          this.saveSettings();
        });
      }

      // File input
      const fileInput = popupBody.querySelector('#file-input');
      if (fileInput) {
        fileInput.addEventListener('change', (e) => {
          this.handleFileUpload(e);
        });
      }
    }
  }

  openPopup() {
    if (!this.popup) return;
    
    popupManager.openPopup(this.popup);
    this.renderPreview('color');
  }

  selectOption(option) {
    // Update active option
    const popupBody = this.popup.body;
    const options = popupBody.querySelectorAll('.option-item');
    options.forEach(opt => opt.classList.remove('active'));
    popupBody.querySelector(`[data-option="${option}"]`).classList.add('active');
    
    // Render preview
    this.renderPreview(option);
  }

  renderPreview(type) {
    const popupBody = this.popup.body;
    const grid = popupBody.querySelector('#preview-grid');
    if (!grid) return;

    grid.innerHTML = '';

    if (type === 'color') {
      SOLID_COLORS.forEach(color => {
        const item = document.createElement('div');
        item.className = 'preview-item color-item';
        item.style.backgroundColor = color;
        item.addEventListener('click', () => {
          this.selectColor(color);
        });
        grid.appendChild(item);
      });
    } else if (type === 'gradient') {
      GRADIENTS.forEach(gradient => {
        const item = document.createElement('div');
        item.className = 'preview-item gradient-item';
        item.style.background = gradient;
        item.addEventListener('click', () => {
          this.selectGradient(gradient);
        });
        grid.appendChild(item);
      });
    } else if (type === 'image') {
      BROWSER_IMAGES.forEach(imagePath => {
        const item = document.createElement('div');
        item.className = 'preview-item image-item';
        item.style.backgroundImage = `url(${imagePath})`;
        item.style.backgroundSize = 'cover';
        item.style.backgroundPosition = 'center';
        item.addEventListener('click', () => {
          this.selectImage(imagePath);
        });
        grid.appendChild(item);
      });
      
      // Add upload option
      const uploadItem = document.createElement('div');
      uploadItem.className = 'preview-item upload-item';
      uploadItem.innerHTML = '<div class="upload-icon">📁</div><div class="upload-text">Upload</div>';
      uploadItem.addEventListener('click', () => {
        const fileInput = popupBody.querySelector('#file-input');
        fileInput.click();
      });
      grid.appendChild(uploadItem);
    }
  }

  selectColor(color) {
    this.currentChoice = { type: 'color', value: color };
    this.applyBackground();
  }

  selectGradient(gradient) {
    this.currentChoice = { type: 'gradient', value: gradient };
    this.applyBackground();
  }

  selectImage(imagePath) {
    this.currentChoice = { type: 'image', value: imagePath };
    this.applyBackground();
  }

  handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.currentChoice = { type: 'image', value: e.target.result };
      this.applyBackground();
    };
    reader.readAsDataURL(file);
  }

  applyBackground() {
    if (!this.currentChoice) return;

    const container = document.getElementById('background-container');
    if (!container) return;

    if (this.currentChoice.type === 'color') {
      container.style.background = this.currentChoice.value;
    } else if (this.currentChoice.type === 'gradient') {
      container.style.background = this.currentChoice.value;
    } else if (this.currentChoice.type === 'image') {
      container.style.background = `url(${this.currentChoice.value})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.backgroundRepeat = 'no-repeat';
    }
  }

  async saveSettings() {
    if (this.currentChoice) {
      await setStoredData(STORAGE_KEY, this.currentChoice);
      popupManager.closePopup(this.popup);
    }
  }

  async resetToDefault() {
    this.currentChoice = null;
    await removeStoredData(STORAGE_KEY);
    this.startDefaultBackground();
    popupManager.closePopup(this.popup);
  }

  startDefaultBackground() {
    const container = document.getElementById('background-container');
    if (!container || DEFAULT_IMAGES.length === 0) return;

    let currentIndex = 0;
    const cycleBackground = () => {
      container.style.background = `url(${DEFAULT_IMAGES[currentIndex]})`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.backgroundRepeat = 'no-repeat';
      currentIndex = (currentIndex + 1) % DEFAULT_IMAGES.length;
    };

    cycleBackground();
    setInterval(cycleBackground, 10000);
  }

  async loadSettings() {
    const saved = await getStoredData(STORAGE_KEY);
    if (saved) {
      this.currentChoice = saved;
      this.applyBackground();
    } else {
      this.startDefaultBackground();
    }
  }

  cleanup() {
    // Cleanup if needed
  }
}

// Initialize and export
export async function initBackgroundTool() {
  const tool = new BackgroundImageTool();
  await tool.init();
  return tool;
}
