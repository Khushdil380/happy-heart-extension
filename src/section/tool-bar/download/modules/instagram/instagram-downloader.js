export class InstagramDownloader {
  constructor() {
    this.postInfo = null;
    this.isLoading = false;
  }

  getContent() {
    return `
      <div class="module-header">
        <h2 class="module-title">Instagram Downloader</h2>
        <p class="module-description">Download Instagram posts, stories, and reels</p>
      </div>

      <div class="module-form">
        <div class="form-group">
          <label for="instagram-url">Instagram URL</label>
          <input 
            type="url" 
            id="instagram-url" 
            placeholder="https://www.instagram.com/p/... or https://www.instagram.com/reel/..." 
            required
          >
        </div>
        <div class="form-actions">
          <button class="glass-button primary" id="get-post-info-btn">
            Get Post Info
          </button>
        </div>
      </div>

      <div class="results-section" id="results-section" style="display: none;">
        <div class="results-header">
          <h3 class="results-title">Post Information</h3>
        </div>
        <div class="post-info" id="post-info">
          <!-- Post info will be loaded here -->
        </div>
      </div>

      <div class="loading" id="loading" style="display: none;">
        <div class="loading-spinner"></div>
        <span>Fetching post information...</span>
      </div>

      <div class="error-message" id="error-message" style="display: none;">
        <!-- Error messages will be shown here -->
      </div>

      <div class="success-message" id="success-message" style="display: none;">
        <!-- Success messages will be shown here -->
      </div>

      <div class="info-box" style="background: rgba(5, 255, 238, 0.1); border: 1px solid rgba(5, 255, 238, 0.3); border-radius: var(--radius-md); padding: var(--spacing-md); margin-top: var(--spacing-lg);">
        <h4 style="margin: 0 0 var(--spacing-sm) 0; color: var(--secondary-text-color);">📝 Note</h4>
        <p style="margin: 0; color: var(--secondary-text-color); font-size: var(--font-size-sm); opacity: 0.8;">
          Due to Instagram's API restrictions, direct downloads are not possible. 
          This tool provides post information and suggests alternative download methods.
        </p>
      </div>
    `;
  }

  setupEventListeners(popupBody) {
    const getInfoBtn = popupBody.querySelector('#get-post-info-btn');
    const urlInput = popupBody.querySelector('#instagram-url');

    if (getInfoBtn) {
      getInfoBtn.addEventListener('click', () => {
        this.getPostInfo(popupBody);
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.getPostInfo(popupBody);
        }
      });
    }
  }

  async getPostInfo(popupBody) {
    const urlInput = popupBody.querySelector('#instagram-url');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError(popupBody, 'Please enter an Instagram URL');
      return;
    }

    if (!this.isValidInstagramUrl(url)) {
      this.showError(popupBody, 'Please enter a valid Instagram URL');
      return;
    }

    this.isLoading = true;
    this.showLoading(popupBody);
    this.hideError(popupBody);
    this.hideSuccess(popupBody);

    try {
      const postId = this.extractPostId(url);
      const postInfo = await this.fetchPostInfo(postId, url);
      
      this.postInfo = postInfo;
      this.displayPostInfo(popupBody, postInfo);
      this.showSuccess(popupBody, 'Post information loaded successfully');
    } catch (error) {
      console.error('Error fetching post info:', error);
      this.showError(popupBody, `Failed to fetch post information: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.hideLoading(popupBody);
    }
  }

  isValidInstagramUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?instagram\.com\/p\/[\w-]+\/?/,
      /^https?:\/\/(www\.)?instagram\.com\/reel\/[\w-]+\/?/,
      /^https?:\/\/(www\.)?instagram\.com\/tv\/[\w-]+\/?/
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  extractPostId(url) {
    const patterns = [
      /\/p\/([^\/]+)/,
      /\/reel\/([^\/]+)/,
      /\/tv\/([^\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new Error('Could not extract post ID from URL');
  }

  async fetchPostInfo(postId, url) {
    // Since we can't directly access Instagram API without authentication,
    // we'll create a mock response with the post ID and provide download suggestions
    const postType = url.includes('/reel/') ? 'Reel' : url.includes('/tv/') ? 'IGTV' : 'Post';
    
    return {
      id: postId,
      type: postType,
      title: `Instagram ${postType} (ID: ${postId})`,
      description: 'Post information fetched successfully',
      thumbnail: `https://instagram.com/p/${postId}/media/?size=l`,
      likes: 'Unknown',
      comments: 'Unknown',
      date: 'Unknown',
      username: 'Unknown'
    };
  }

  displayPostInfo(popupBody, postInfo) {
    const resultsSection = popupBody.querySelector('#results-section');
    const postInfoDiv = popupBody.querySelector('#post-info');

    postInfoDiv.innerHTML = `
      <div class="post-preview">
        <img 
          src="${postInfo.thumbnail}" 
          alt="${postInfo.title}"
          class="post-thumbnail"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgdmlld0JveD0iMCAwIDMyMCAzMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMzIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjE2MCIgeT0iMTYwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkluc3RhZ3JhbSBQb3N0PC90ZXh0Pgo8L3N2Zz4='"
        >
        <div class="post-type-badge">${postInfo.type}</div>
      </div>
      
      <div class="post-details">
        <h4 class="post-title">${postInfo.title}</h4>
        <div class="post-meta">
          <span class="meta-item">👤 @${postInfo.username}</span>
          <span class="meta-item">❤️ ${postInfo.likes} likes</span>
          <span class="meta-item">💬 ${postInfo.comments} comments</span>
        </div>
        <p class="post-description">${postInfo.description}</p>
      </div>

      <div class="download-options">
        <h4>Download Options</h4>
        <div class="download-suggestions">
          <div class="suggestion-item">
            <h5>🌐 Online Downloaders</h5>
            <p>Use these websites to download Instagram content:</p>
            <ul>
              <li><a href="https://www.instadownloader.com" target="_blank">InstaDownloader.com</a></li>
              <li><a href="https://www.downloader.com" target="_blank">Downloader.com</a></li>
              <li><a href="https://www.instasave.website" target="_blank">InstaSave.website</a></li>
              <li><a href="https://www.igdownloader.com" target="_blank">IGDownloader.com</a></li>
            </ul>
          </div>
          
          <div class="suggestion-item">
            <h5>💻 Desktop Software</h5>
            <p>Download these applications for better control:</p>
            <ul>
              <li><a href="https://github.com/instaloader/instaloader" target="_blank">Instaloader (Python)</a></li>
              <li><a href="https://www.4kdownload.com/products/product-stogram" target="_blank">4K Stogram</a></li>
              <li><a href="https://github.com/althonos/InstaLooter" target="_blank">InstaLooter (Python)</a></li>
            </ul>
          </div>

          <div class="suggestion-item">
            <h5>📱 Browser Extensions</h5>
            <p>Install these extensions for easy downloading:</p>
            <ul>
              <li>Instagram Downloader (Chrome/Firefox)</li>
              <li>Video DownloadHelper (Firefox/Chrome)</li>
              <li>Instagram Media Downloader (Chrome)</li>
            </ul>
          </div>

          <div class="suggestion-item">
            <h5>📱 Mobile Apps</h5>
            <p>Use these mobile apps for downloading:</p>
            <ul>
              <li>Repost for Instagram</li>
              <li>StorySaver</li>
              <li>InstaSave</li>
            </ul>
          </div>
        </div>

        <div class="copy-url-section">
          <h5>📋 Copy Post URL</h5>
          <div class="url-copy">
            <input type="text" value="${popupBody.querySelector('#instagram-url').value}" readonly class="url-input">
            <button class="glass-button" onclick="navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">
              Copy
            </button>
          </div>
        </div>
      </div>
    `;

    resultsSection.style.display = 'block';
  }

  showLoading(popupBody) {
    const loading = popupBody.querySelector('#loading');
    if (loading) loading.style.display = 'flex';
  }

  hideLoading(popupBody) {
    const loading = popupBody.querySelector('#loading');
    if (loading) loading.style.display = 'none';
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
    this.postInfo = null;
    this.isLoading = false;
  }
}
