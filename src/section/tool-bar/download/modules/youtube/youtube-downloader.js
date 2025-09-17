import { ExternalServices } from './utils/external-services.js';

export class YouTubeDownloader {
  constructor() {
    this.videoInfo = null;
    this.isLoading = false;
  }

  getContent() {
    return `
      <div class="module-header">
        <h2 class="module-title">YouTube Downloader</h2>
        <p class="module-description">Download YouTube videos via external services</p>
      </div>

      <div class="module-form">
        <div class="form-group">
          <label for="youtube-url">YouTube URL</label>
          <input 
            type="url" 
            id="youtube-url" 
            placeholder="https://www.youtube.com/watch?v=..." 
            required
          >
        </div>
        <div class="form-actions">
          <button class="glass-button primary" id="get-video-info-btn">
            Get Video
          </button>
        </div>
      </div>

      <div class="results-section" id="results-section" style="display: none;">
        <div class="results-header">
          <h3 class="results-title">Download Options</h3>
        </div>
        <div class="video-info" id="video-info">
          <!-- Video info will be loaded here -->
        </div>
      </div>


      <div class="error-message" id="error-message" style="display: none;">
        <!-- Error messages will be shown here -->
      </div>

      <div class="success-message" id="success-message" style="display: none;">
        <!-- Success messages will be shown here -->
      </div>
    `;
  }

  setupEventListeners(popupBody) {
    const getInfoBtn = popupBody.querySelector('#get-video-info-btn');
    const urlInput = popupBody.querySelector('#youtube-url');

    if (getInfoBtn) {
      getInfoBtn.addEventListener('click', () => {
        this.getVideoInfo(popupBody);
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.getVideoInfo(popupBody);
        }
      });
    }

    // Event delegation for download buttons
    popupBody.addEventListener('click', (e) => {
      const button = e.target.closest('.download-btn');
      if (button) {
        e.preventDefault();
        const action = button.getAttribute('data-action');
        const service = button.getAttribute('data-service');
        const videoId = button.getAttribute('data-video-id');
        
        if (action === 'fetch-formats') {
          this.showDownloadOptions(videoId, 'Unknown', 'video', button);
        } else if (service) {
          this.openExternalDownloader(button, service, videoId);
        }
      }
    });
  }

  async getVideoInfo(popupBody) {
    const urlInput = popupBody.querySelector('#youtube-url');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError(popupBody, 'Please enter a YouTube URL');
      return;
    }

    if (!this.isValidYouTubeUrl(url)) {
      this.showError(popupBody, 'Please enter a valid YouTube URL');
      return;
    }

    try {
      const videoId = this.extractVideoId(url);
      
      // Instant display - no API calls or slow fetching
      const videoInfo = {
        id: videoId,
        title: `YouTube Video ${videoId}`,
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: url
      };
      
      this.videoInfo = videoInfo;
      this.displayVideoInfo(popupBody, videoInfo);
      this.showSuccess(popupBody, 'Choose your download method below!');

    } catch (error) {
      console.error('Error processing video:', error);
      this.showError(popupBody, `Invalid YouTube URL: ${error.message}`);
    }
  }

  isValidYouTubeUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  extractVideoId(url) {
    const patterns = [
      /[?&]v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /embed\/([^?]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new Error('Could not extract video ID from URL');
  }

  displayVideoInfo(popupBody, videoInfo) {
    const resultsSection = popupBody.querySelector('#results-section');
    const videoInfoDiv = popupBody.querySelector('#video-info');

    videoInfoDiv.innerHTML = `
      <div class="video-preview">
        <img 
          src="${videoInfo.thumbnail}" 
          alt="${videoInfo.title}"
          class="video-thumbnail"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+WW91VHViZSBUaHVtYm5haWw8L3RleHQ+Cjwvc3ZnPg=='"
        >
      </div>
      
      <div class="video-details">
        <h4 class="video-title">${videoInfo.title}</h4>
      </div>

      <div class="download-options">
        <h4>Download Options</h4>
        
        <!-- Direct Download Section -->
        <div class="built-in-download-section">
          <h5>🚀 Direct Download (Extension)</h5>
          <div class="download-buttons">
            <button class="glass-button primary download-btn" data-action="fetch-formats" data-video-id="${videoInfo.id}">
              <span class="download-icon">📥</span>
              <span class="download-text">Download Options</span>
            </button>
          </div>
        </div>

        <!-- External Services Section -->
        <div class="external-download-section">
          <h5>🌐 External Services</h5>
          <div class="download-buttons">
            <button class="glass-button secondary download-btn" data-service="y2mate" data-video-id="${videoInfo.id}">
              <span class="download-icon">📥</span>
              <span class="download-text">Y2mate</span>
              <div class="download-progress" style="display: none;"></div>
            </button>
            <button class="glass-button secondary download-btn" data-service="savefrom" data-video-id="${videoInfo.id}">
              <span class="download-icon">📥</span>
              <span class="download-text">SaveFrom</span>
              <div class="download-progress" style="display: none;"></div>
            </button>
            <button class="glass-button secondary download-btn" data-service="youtubedl" data-video-id="${videoInfo.id}">
              <span class="download-icon">📥</span>
              <span class="download-text">YT-DLP</span>
              <div class="download-progress" style="display: none;"></div>
            </button>
          </div>
        </div>

        <!-- Formats Display Area -->
        <div class="formats-section" id="formats-section" style="display: none;">
          <h5>📋 Available Formats</h5>
          <div class="formats-list" id="formats-list">
            <!-- Formats will be loaded here -->
          </div>
        </div>
      </div>
    `;

    resultsSection.style.display = 'block';
    this.setupDownloadEventListeners(popupBody);
  }

  setupDownloadEventListeners(popupBody) {
    const downloadButtons = popupBody.querySelectorAll('.download-btn');
    
    downloadButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const action = button.getAttribute('data-action');
        const service = button.getAttribute('data-service');
        const videoId = button.getAttribute('data-video-id');
        
        if (action === 'fetch-formats') {
          this.fetchVideoFormats(popupBody, videoId, button);
        } else if (service) {
          this.openExternalDownloader(button, service, videoId);
        }
      });
    });
  }




  showDownloadOptions(videoId, quality, type, button) {
    const popupBody = document.querySelector('.download-container');
    
    // Create a modal with download options
    const modal = document.createElement('div');
    modal.className = 'download-options-modal';
    modal.innerHTML = `
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>Download Options</h3>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <p>Direct download is not available. Choose an alternative:</p>
            <div class="download-options-list">
              <button class="option-btn primary" data-action="external-y2mate">
                <span class="option-icon">🌐</span>
                <span class="option-text">Use Y2mate (Recommended)</span>
                <span class="option-desc">Popular YouTube downloader</span>
              </button>
              <button class="option-btn secondary" data-action="external-savefrom">
                <span class="option-icon">📥</span>
                <span class="option-text">Use SaveFrom</span>
                <span class="option-desc">Multiple format support</span>
              </button>
              <button class="option-btn secondary" data-action="copy-url">
                <span class="option-icon">📋</span>
                <span class="option-text">Copy Video URL</span>
                <span class="option-desc">Paste in any downloader</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
      this.resetButton(button);
    });
    
    modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) {
        modal.remove();
        this.resetButton(button);
      }
    });
    
    // Handle option clicks
    modal.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.getAttribute('data-action');
        this.handleDownloadOption(action, videoId, quality, type);
        modal.remove();
        this.resetButton(button);
      });
    });
  }

  handleDownloadOption(action, videoId, quality, type) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    switch (action) {
      case 'external-y2mate':
        window.open(`https://www.y2mate.com/en/search/${videoId}`, '_blank');
        this.showSuccess(document.querySelector('.download-container'), 
          'Opened Y2mate downloader');
        break;
      case 'external-savefrom':
        window.open(`https://www.savefrom.net/#url=${encodeURIComponent(videoUrl)}`, '_blank');
        this.showSuccess(document.querySelector('.download-container'), 
          'Opened SaveFrom downloader');
        break;
      case 'copy-url':
        navigator.clipboard.writeText(videoUrl).then(() => {
          this.showSuccess(document.querySelector('.download-container'), 
            'Video URL copied to clipboard');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = videoUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          this.showSuccess(document.querySelector('.download-container'), 
            'Video URL copied to clipboard');
        });
        break;
    }
  }

  resetButton(button) {
    const icon = button.querySelector('.download-icon');
    button.disabled = false;
    icon.textContent = '📥';
    button.textContent = 'Download';
  }

  openExternalDownloader(button, service, videoId) {
    const progress = button.querySelector('.download-progress');
    const icon = button.querySelector('.download-icon');
    const text = button.querySelector('.download-text');
    
    // Show progress
    button.disabled = true;
    progress.style.display = 'block';
    icon.textContent = '⏳';
    text.textContent = 'Opening...';
    
    const serviceUrls = ExternalServices.getServiceUrls(videoId);
    const downloadUrl = serviceUrls[service] || serviceUrls.y2mate;
    
    // Open in new tab with better error handling
    try {
      const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      
      // Check if popup was blocked
      if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        // Popup blocked, try direct navigation
        window.location.href = downloadUrl;
      }
    } catch (error) {
      console.error('Error opening download URL:', error);
      // Fallback to direct navigation
      window.location.href = downloadUrl;
    }
    
    // Reset button after a delay
    setTimeout(() => {
      button.disabled = false;
      progress.style.display = 'none';
      icon.textContent = '📥';
      text.textContent = service.charAt(0).toUpperCase() + service.slice(1);
    }, 2000);
  }


  showError(popupBody, message) {
    const errorDiv = popupBody.querySelector('#error-message');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  hideError(popupBody) {
    const errorDiv = popupBody.querySelector('#error-message');
    if (errorDiv) errorDiv.style.display = 'none';
  }

  showSuccess(popupBody, message) {
    const successDiv = popupBody.querySelector('#success-message');
    if (successDiv) {
      successDiv.textContent = message;
      successDiv.style.display = 'block';
    }
  }

  hideSuccess(popupBody) {
    const successDiv = popupBody.querySelector('#success-message');
    if (successDiv) successDiv.style.display = 'none';
  }

  cleanup() {
    this.videoInfo = null;
    this.isLoading = false;
  }
}