import { popupManager } from '../../../../assets/components/Popup/popup-manager.js';
import { WebsiteImageDownloader } from './modules/website-image/website-image-downloader.js';
import { YouTubeDownloader } from './modules/youtube/youtube-downloader.js';
import { InstagramDownloader } from './modules/instagram/instagram-downloader.js';
import { LinkedInDownloader } from './modules/linkedin/linkedin-downloader.js';

export class DownloadTool {
  constructor() {
    this.popup = null;
    this.currentModule = null;
    this.modules = {
      'website-image': new WebsiteImageDownloader(),
      'youtube': new YouTubeDownloader(),
      'instagram': new InstagramDownloader(),
      'linkedin': new LinkedInDownloader()
    };
  }

  async init() {
    try {
      this.createPopup();
      this.setupEventListeners();
      console.log('✅ Download Tool initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Download Tool:', error);
    }
  }

  createPopup() {
    const content = this.createDownloadContent();
    
    this.popup = popupManager.createPopup('Download Center', content, {
      id: 'download-popup',
      size: 'large'
    });
  }

  setupEventListeners() {
    const downloadTool = document.getElementById('download-tool');
    if (downloadTool) {
      downloadTool.addEventListener('click', () => {
        this.openPopup();
      });
    }
  }

  openPopup() {
    if (!this.popup) return;
    
    popupManager.openPopup(this.popup);
    this.setupDownloadEventListeners();
  }

  createDownloadContent() {
    return `
      <div class="download-container">
        <!-- Sidebar with download options -->
        <div class="download-sidebar">
          <div class="download-header">
            <h3>Download Options</h3>
          </div>
          <div class="download-options">
            <div class="download-option active" data-module="website-image">
              <div class="option-icon">🖼️</div>
              <div class="option-content">
                <div class="option-title">Website Images</div>
                <div class="option-description">Download images from any webpage</div>
              </div>
            </div>
            <div class="download-option" data-module="youtube">
              <div class="option-icon">📺</div>
              <div class="option-content">
                <div class="option-title">YouTube</div>
                <div class="option-description">Download videos and audio</div>
              </div>
            </div>
            <div class="download-option" data-module="instagram">
              <div class="option-icon">📷</div>
              <div class="option-content">
                <div class="option-title">Instagram</div>
                <div class="option-description">Download posts and stories</div>
              </div>
            </div>
            <div class="download-option" data-module="linkedin">
              <div class="option-icon">💼</div>
              <div class="option-content">
                <div class="option-title">LinkedIn</div>
                <div class="option-description">Download professional content</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main content area -->
        <div class="download-content">
          <div class="download-module-content" id="download-module-content">
            <!-- Module content will be loaded here -->
          </div>
        </div>
      </div>
    `;
  }

  setupDownloadEventListeners() {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    // Module selection
    popupBody.querySelectorAll('.download-option').forEach(option => {
      option.addEventListener('click', (e) => {
        const moduleName = e.currentTarget.dataset.module;
        this.switchModule(moduleName);
      });
    });

    // Initialize with first module
    this.switchModule('website-image');
  }

  switchModule(moduleName) {
    if (!this.popup) return;
    const popupBody = this.popup.body;
    
    // Update active option
    popupBody.querySelectorAll('.download-option').forEach(option => {
      option.classList.remove('active');
    });
    popupBody.querySelector(`[data-module="${moduleName}"]`).classList.add('active');

    // Load module content
    const moduleContent = popupBody.querySelector('#download-module-content');
    if (this.modules[moduleName]) {
      this.currentModule = this.modules[moduleName];
      moduleContent.innerHTML = this.currentModule.getContent();
      this.currentModule.setupEventListeners(popupBody);
    }
  }

  cleanup() {
    // Cleanup any active modules
    Object.values(this.modules).forEach(module => {
      if (module.cleanup) {
        module.cleanup();
      }
    });
  }
}

export async function initDownloadTool() {
  const downloadTool = new DownloadTool();
  await downloadTool.init();
  return downloadTool;
}
