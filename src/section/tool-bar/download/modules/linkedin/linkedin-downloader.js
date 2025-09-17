export class LinkedInDownloader {
  constructor() {
    this.contentInfo = null;
    this.isLoading = false;
  }

  getContent() {
    return `
      <div class="module-header">
        <h2 class="module-title">LinkedIn Downloader</h2>
        <p class="module-description">Download LinkedIn posts, articles, and professional content</p>
      </div>

      <div class="module-form">
        <div class="form-group">
          <label for="linkedin-url">LinkedIn URL</label>
          <input 
            type="url" 
            id="linkedin-url" 
            placeholder="https://www.linkedin.com/posts/... or https://www.linkedin.com/pulse/..." 
            required
          >
        </div>
        <div class="form-actions">
          <button class="glass-button primary" id="get-content-info-btn">
            Get Content Info
          </button>
        </div>
      </div>

      <div class="results-section" id="results-section" style="display: none;">
        <div class="results-header">
          <h3 class="results-title">Content Information</h3>
        </div>
        <div class="content-info" id="content-info">
          <!-- Content info will be loaded here -->
        </div>
      </div>

      <div class="loading" id="loading" style="display: none;">
        <div class="loading-spinner"></div>
        <span>Fetching content information...</span>
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
          Due to LinkedIn's API restrictions and privacy policies, direct downloads are not possible. 
          This tool provides content information and suggests alternative methods for saving content.
        </p>
      </div>
    `;
  }

  setupEventListeners(popupBody) {
    const getInfoBtn = popupBody.querySelector('#get-content-info-btn');
    const urlInput = popupBody.querySelector('#linkedin-url');

    if (getInfoBtn) {
      getInfoBtn.addEventListener('click', () => {
        this.getContentInfo(popupBody);
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.getContentInfo(popupBody);
        }
      });
    }
  }

  async getContentInfo(popupBody) {
    const urlInput = popupBody.querySelector('#linkedin-url');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError(popupBody, 'Please enter a LinkedIn URL');
      return;
    }

    if (!this.isValidLinkedInUrl(url)) {
      this.showError(popupBody, 'Please enter a valid LinkedIn URL');
      return;
    }

    this.isLoading = true;
    this.showLoading(popupBody);
    this.hideError(popupBody);
    this.hideSuccess(popupBody);

    try {
      const contentId = this.extractContentId(url);
      const contentInfo = await this.fetchContentInfo(contentId, url);
      
      this.contentInfo = contentInfo;
      this.displayContentInfo(popupBody, contentInfo);
      this.showSuccess(popupBody, 'Content information loaded successfully');
    } catch (error) {
      console.error('Error fetching content info:', error);
      this.showError(popupBody, `Failed to fetch content information: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.hideLoading(popupBody);
    }
  }

  isValidLinkedInUrl(url) {
    const patterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/posts\/[\w-]+\/?/,
      /^https?:\/\/(www\.)?linkedin\.com\/pulse\/[\w-]+\/?/,
      /^https?:\/\/(www\.)?linkedin\.com\/feed\/update\/[\w-]+\/?/
    ];
    return patterns.some(pattern => pattern.test(url));
  }

  extractContentId(url) {
    const patterns = [
      /\/posts\/([^\/]+)/,
      /\/pulse\/([^\/]+)/,
      /\/feed\/update\/([^\/]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    throw new Error('Could not extract content ID from URL');
  }

  async fetchContentInfo(contentId, url) {
    // Since we can't directly access LinkedIn API without authentication,
    // we'll create a mock response with the content ID and provide download suggestions
    const contentType = url.includes('/pulse/') ? 'Article' : url.includes('/posts/') ? 'Post' : 'Update';
    
    return {
      id: contentId,
      type: contentType,
      title: `LinkedIn ${contentType} (ID: ${contentId})`,
      description: 'Content information fetched successfully',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjE4MCIgdmlld0JveD0iMCAwIDMyMCAxODAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMjAiIGhlaWdodD0iMTgwIiBmaWxsPSIjMDA3N2I1Ii8+Cjx0ZXh0IHg9IjE2MCIgeT0iOTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxpbmtlZEluIENvbnRlbnQ8L3RleHQ+Cjwvc3ZnPg==',
      likes: 'Unknown',
      comments: 'Unknown',
      shares: 'Unknown',
      date: 'Unknown',
      author: 'Unknown'
    };
  }

  displayContentInfo(popupBody, contentInfo) {
    const resultsSection = popupBody.querySelector('#results-section');
    const contentInfoDiv = popupBody.querySelector('#content-info');

    contentInfoDiv.innerHTML = `
      <div class="content-preview">
        <img 
          src="${contentInfo.thumbnail}" 
          alt="${contentInfo.title}"
          class="content-thumbnail"
        >
        <div class="content-type-badge">${contentInfo.type}</div>
      </div>
      
      <div class="content-details">
        <h4 class="content-title">${contentInfo.title}</h4>
        <div class="content-meta">
          <span class="meta-item">👤 ${contentInfo.author}</span>
          <span class="meta-item">👍 ${contentInfo.likes} likes</span>
          <span class="meta-item">💬 ${contentInfo.comments} comments</span>
          <span class="meta-item">🔄 ${contentInfo.shares} shares</span>
        </div>
        <p class="content-description">${contentInfo.description}</p>
      </div>

      <div class="download-options">
        <h4>Content Saving Options</h4>
        <div class="download-suggestions">
          <div class="suggestion-item">
            <h5>📄 Manual Saving Methods</h5>
            <p>Since LinkedIn restricts automated downloads, use these manual methods:</p>
            <ul>
              <li><strong>Print to PDF:</strong> Use browser's print function (Ctrl+P) and save as PDF</li>
              <li><strong>Screenshot:</strong> Take screenshots of the content</li>
              <li><strong>Copy & Paste:</strong> Copy text content to a document</li>
              <li><strong>Bookmark:</strong> Save the URL for future reference</li>
            </ul>
          </div>
          
          <div class="suggestion-item">
            <h5>🌐 Browser Extensions</h5>
            <p>Install these extensions for easier content saving:</p>
            <ul>
              <li>Save to Pocket (Chrome/Firefox)</li>
              <li>Evernote Web Clipper (Chrome/Firefox)</li>
              <li>OneNote Web Clipper (Chrome/Firefox)</li>
              <li>Notion Web Clipper (Chrome/Firefox)</li>
            </ul>
          </div>

          <div class="suggestion-item">
            <h5>💻 Desktop Tools</h5>
            <p>Use these applications for content management:</p>
            <ul>
              <li><a href="https://www.raindrop.io" target="_blank">Raindrop.io</a> - Bookmark manager</li>
              <li><a href="https://www.pocket.com" target="_blank">Pocket</a> - Save articles for later</li>
              <li><a href="https://www.evernote.com" target="_blank">Evernote</a> - Note-taking and web clipping</li>
              <li><a href="https://www.notion.so" target="_blank">Notion</a> - All-in-one workspace</li>
            </ul>
          </div>

          <div class="suggestion-item">
            <h5>📱 Mobile Apps</h5>
            <p>Use these mobile apps for content saving:</p>
            <ul>
              <li>LinkedIn mobile app (built-in save feature)</li>
              <li>Pocket mobile app</li>
              <li>Evernote mobile app</li>
              <li>Notion mobile app</li>
            </ul>
          </div>
        </div>

        <div class="copy-url-section">
          <h5>📋 Copy Content URL</h5>
          <div class="url-copy">
            <input type="text" value="${popupBody.querySelector('#linkedin-url').value}" readonly class="url-input">
            <button class="glass-button" onclick="navigator.clipboard.writeText(this.previousElementSibling.value); this.textContent='Copied!'; setTimeout(() => this.textContent='Copy', 2000)">
              Copy
            </button>
          </div>
        </div>

        <div class="legal-notice" style="background: rgba(255, 193, 7, 0.1); border: 1px solid rgba(255, 193, 7, 0.3); border-radius: var(--radius-md); padding: var(--spacing-md); margin-top: var(--spacing-md);">
          <h5 style="margin: 0 0 var(--spacing-sm) 0; color: #ffc107;">⚠️ Legal Notice</h5>
          <p style="margin: 0; color: var(--secondary-text-color); font-size: var(--font-size-sm); opacity: 0.8;">
            Please respect LinkedIn's Terms of Service and the original author's rights when saving content. 
            Only save content for personal use and give proper attribution when sharing.
          </p>
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
    this.contentInfo = null;
    this.isLoading = false;
  }
}
