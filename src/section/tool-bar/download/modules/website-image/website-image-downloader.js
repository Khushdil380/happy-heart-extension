export class WebsiteImageDownloader {
  constructor() {
    this.images = [];
    this.isLoading = false;
  }

  getContent() {
    return `
      <div class="module-header">
        <h2 class="module-title">Website Image Downloader</h2>
        <p class="module-description">Extract and download images from any webpage</p>
      </div>

      <div class="module-form">
        <div class="form-group">
          <label for="website-url">Website URL</label>
          <input 
            type="url" 
            id="website-url" 
            placeholder="https://example.com" 
            required
          >
        </div>
        <div class="form-actions">
          <button class="glass-button primary" id="extract-images-btn">
            Extract Images
          </button>
        </div>
      </div>

      <div class="results-section" id="results-section" style="display: none;">
        <div class="results-header">
          <h3 class="results-title">Found Images</h3>
          <button class="glass-button" id="download-all-btn">
            Download All
          </button>
        </div>
        <div class="results-grid" id="results-grid">
          <!-- Images will be loaded here -->
        </div>
      </div>

      <div class="loading" id="loading" style="display: none;">
        <div class="loading-spinner"></div>
        <span>Extracting images from website...</span>
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
    const extractBtn = popupBody.querySelector('#extract-images-btn');
    const downloadAllBtn = popupBody.querySelector('#download-all-btn');
    const urlInput = popupBody.querySelector('#website-url');

    if (extractBtn) {
      extractBtn.addEventListener('click', () => {
        this.extractImages(popupBody);
      });
    }

    if (downloadAllBtn) {
      downloadAllBtn.addEventListener('click', () => {
        this.downloadAllImages();
      });
    }

    if (urlInput) {
      urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.extractImages(popupBody);
        }
      });
    }
  }

  async extractImages(popupBody) {
    const urlInput = popupBody.querySelector('#website-url');
    const url = urlInput.value.trim();

    if (!url) {
      this.showError(popupBody, 'Please enter a valid URL');
      return;
    }

    if (!this.isValidUrl(url)) {
      this.showError(popupBody, 'Please enter a valid URL format');
      return;
    }

    this.isLoading = true;
    this.showLoading(popupBody);
    this.hideError(popupBody);
    this.hideSuccess(popupBody);

    try {
      // Use a CORS proxy to fetch the website content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.status}`);
      }

      const data = await response.json();
      const htmlContent = data.contents;
      
      // Parse HTML and extract images
      this.images = this.parseImagesFromHTML(htmlContent, url);
      
      if (this.images.length === 0) {
        this.showError(popupBody, 'No images found on this webpage. Try a different URL or check if the website has images.');
      } else {
        this.displayImages(popupBody);
        this.showSuccess(popupBody, `Found ${this.images.length} images from various sources`);
      }
    } catch (error) {
      console.error('Error extracting images:', error);
      this.showError(popupBody, `Failed to extract images: ${error.message}`);
    } finally {
      this.isLoading = false;
      this.hideLoading(popupBody);
    }
  }

  parseImagesFromHTML(htmlContent, baseUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const images = [];
    const baseUrlObj = new URL(baseUrl);

    // Find all img tags with various attributes
    const imgTags = doc.querySelectorAll('img');
    imgTags.forEach((img, index) => {
      // Check multiple possible src attributes
      const src = img.src || 
                  img.getAttribute('data-src') || 
                  img.getAttribute('data-lazy-src') ||
                  img.getAttribute('data-original') ||
                  img.getAttribute('data-srcset')?.split(',')[0]?.trim().split(' ')[0] ||
                  img.getAttribute('srcset')?.split(',')[0]?.trim().split(' ')[0];

      if (src && src !== 'data:image/svg+xml' && !src.startsWith('data:')) {
        const absoluteUrl = this.resolveUrl(src, baseUrl);
        const alt = img.alt || img.title || `Image ${index + 1}`;
        const width = parseInt(img.width) || parseInt(img.getAttribute('data-width')) || 0;
        const height = parseInt(img.height) || parseInt(img.getAttribute('data-height')) || 0;

        // More lenient filtering - include images that are at least 30x30 or have no size info
        if ((width >= 30 && height >= 30) || (width === 0 && height === 0)) {
          images.push({
            url: absoluteUrl,
            alt: alt,
            width: width,
            height: height,
            size: width > 0 && height > 0 ? this.formatFileSize(width * height * 3) : 'Unknown',
            type: 'img-tag'
          });
        }
      }
    });

    // Find picture elements with source tags
    const pictureTags = doc.querySelectorAll('picture');
    pictureTags.forEach((picture, index) => {
      const sources = picture.querySelectorAll('source');
      sources.forEach(source => {
        const srcset = source.getAttribute('srcset');
        if (srcset) {
          const urls = srcset.split(',').map(item => item.trim().split(' ')[0]);
          urls.forEach(url => {
            if (url && !url.startsWith('data:')) {
              const absoluteUrl = this.resolveUrl(url, baseUrl);
              images.push({
                url: absoluteUrl,
                alt: `Picture source ${index + 1}`,
                width: 0,
                height: 0,
                size: 'Unknown',
                type: 'picture-source'
              });
            }
          });
        }
      });
    });

    // Find background images in inline styles
    const elementsWithBg = doc.querySelectorAll('*[style*="background-image"]');
    elementsWithBg.forEach((element, index) => {
      const style = element.getAttribute('style');
      const bgImageMatch = style.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
      if (bgImageMatch) {
        const absoluteUrl = this.resolveUrl(bgImageMatch[1], baseUrl);
        images.push({
          url: absoluteUrl,
          alt: `Background Image ${index + 1}`,
          width: 0,
          height: 0,
          size: 'Unknown',
          type: 'background-inline'
        });
      }
    });

    // Find background images in CSS
    const styleTags = doc.querySelectorAll('style');
    styleTags.forEach(style => {
      const cssText = style.textContent;
      const bgImageRegex = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi;
      let match;
      
      while ((match = bgImageRegex.exec(cssText)) !== null) {
        const absoluteUrl = this.resolveUrl(match[1], baseUrl);
        images.push({
          url: absoluteUrl,
          alt: 'CSS Background Image',
          width: 0,
          height: 0,
          size: 'Unknown',
          type: 'background-css'
        });
      }
    });

    // Find images in data attributes (common in lazy loading)
    const elementsWithDataImg = doc.querySelectorAll('*[data-img], *[data-image], *[data-photo]');
    elementsWithDataImg.forEach((element, index) => {
      const dataImg = element.getAttribute('data-img') || 
                     element.getAttribute('data-image') || 
                     element.getAttribute('data-photo');
      if (dataImg && !dataImg.startsWith('data:')) {
        const absoluteUrl = this.resolveUrl(dataImg, baseUrl);
        images.push({
          url: absoluteUrl,
          alt: `Data Image ${index + 1}`,
          width: 0,
          height: 0,
          size: 'Unknown',
          type: 'data-attribute'
        });
      }
    });

    // Find images in JSON-LD structured data
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach(script => {
      try {
        const data = JSON.parse(script.textContent);
        this.extractImagesFromJsonLd(data, baseUrl, images);
      } catch (e) {
        // Ignore invalid JSON
      }
    });

    // Find images in meta tags (Open Graph, Twitter Cards)
    const metaImages = doc.querySelectorAll('meta[property*="image"], meta[name*="image"]');
    metaImages.forEach(meta => {
      const content = meta.getAttribute('content');
      if (content && !content.startsWith('data:')) {
        const absoluteUrl = this.resolveUrl(content, baseUrl);
        images.push({
          url: absoluteUrl,
          alt: 'Meta Image',
          width: 0,
          height: 0,
          size: 'Unknown',
          type: 'meta-tag'
        });
      }
    });

    // Remove duplicates and filter out invalid URLs
    const uniqueImages = images.filter((img, index, self) => {
      // Remove duplicates
      const isUnique = index === self.findIndex(i => i.url === img.url);
      
      // Filter out invalid URLs
      const isValidUrl = img.url && 
                        !img.url.includes('data:') && 
                        !img.url.includes('javascript:') &&
                        (img.url.startsWith('http://') || img.url.startsWith('https://'));
      
      return isUnique && isValidUrl;
    });

    console.log(`Found ${uniqueImages.length} unique images:`, uniqueImages);
    return uniqueImages;
  }

  extractImagesFromJsonLd(data, baseUrl, images) {
    if (typeof data === 'object' && data !== null) {
      if (Array.isArray(data)) {
        data.forEach(item => this.extractImagesFromJsonLd(item, baseUrl, images));
      } else {
        Object.keys(data).forEach(key => {
          if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) {
            const value = data[key];
            if (typeof value === 'string' && !value.startsWith('data:')) {
              const absoluteUrl = this.resolveUrl(value, baseUrl);
              images.push({
                url: absoluteUrl,
                alt: 'Structured Data Image',
                width: 0,
                height: 0,
                size: 'Unknown',
                type: 'json-ld'
              });
            } else if (Array.isArray(value)) {
              value.forEach(item => {
                if (typeof item === 'string' && !item.startsWith('data:')) {
                  const absoluteUrl = this.resolveUrl(item, baseUrl);
                  images.push({
                    url: absoluteUrl,
                    alt: 'Structured Data Image',
                    width: 0,
                    height: 0,
                    size: 'Unknown',
                    type: 'json-ld'
                  });
                }
              });
            }
          } else if (typeof value === 'object') {
            this.extractImagesFromJsonLd(value, baseUrl, images);
          }
        });
      }
    }
  }

  resolveUrl(url, baseUrl) {
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch {
      return false;
    }
  }

  displayImages(popupBody) {
    const resultsSection = popupBody.querySelector('#results-section');
    const resultsGrid = popupBody.querySelector('#results-grid');

    resultsGrid.innerHTML = '';

    this.images.forEach((image, index) => {
      const imageItem = document.createElement('div');
      imageItem.className = 'result-item';
      imageItem.innerHTML = `
        <img 
          src="${image.url}" 
          alt="${image.alt}" 
          class="result-preview"
          onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iNjAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+SW1hZ2UgRXJyb3I8L3RleHQ+Cjwvc3ZnPg=='"
        >
        <div class="result-info">
          <div class="result-title">${image.alt}</div>
          <div class="result-size">
            ${image.width}x${image.height} • ${image.size}
            <span class="image-type-badge">${this.getImageTypeLabel(image.type)}</span>
          </div>
        </div>
        <div class="result-actions">
          <button class="result-btn download" data-action="download" data-url="${image.url}" data-filename="${image.alt}">
            Download
          </button>
          <button class="result-btn" data-action="preview" data-url="${image.url}" data-alt="${image.alt}">
            Preview
          </button>
        </div>
      `;
      resultsGrid.appendChild(imageItem);
    });

    resultsSection.style.display = 'block';

    // Add event listeners for download and preview buttons
    resultsGrid.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (!button) return;

      const action = button.dataset.action;
      const url = button.dataset.url;
      const filename = button.dataset.filename;
      const alt = button.dataset.alt;

      if (action === 'download') {
        this.downloadImage(url, filename);
      } else if (action === 'preview') {
        this.previewImage(url, alt);
      }
    });
  }

  async downloadImage(url, filename) {
    try {
      // Try direct fetch first
      let response;
      try {
        response = await fetch(url);
      } catch (corsError) {
        // If CORS fails, try with proxy
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        response = await fetch(proxyUrl);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = this.sanitizeFilename(filename) || 'image';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);

      // Show success message
      this.showSuccessMessage(`Image "${filename}" downloaded successfully!`);
      
    } catch (error) {
      console.error('Error downloading image:', error);
      this.showErrorMessage(`Failed to download image: ${error.message}`);
    }
  }

  async downloadAllImages() {
    if (this.images.length === 0) return;

    for (let i = 0; i < this.images.length; i++) {
      const image = this.images[i];
      try {
        await this.downloadImage(image.url, image.alt);
        // Add small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to download image ${i + 1}:`, error);
      }
    }
  }

  previewImage(url, alt) {
    // Create a modal for image preview
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      cursor: pointer;
      backdrop-filter: blur(10px);
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      position: relative;
      max-width: 90%;
      max-height: 90%;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;

    const img = document.createElement('img');
    img.src = url;
    img.alt = alt;
    img.style.cssText = `
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      border-radius: var(--radius-md);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      background: var(--primary-bg-color);
      padding: var(--spacing-sm);
    `;

    // Add error handling for image
    img.onerror = () => {
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlIFByZXZpZXcgRXJyb3I8L3RleHQ+Cjx0ZXh0IHg9IjIwMCIgeT0iMTgwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkNhbm5vdCBsb2FkIGltYWdlPC90ZXh0Pgo8L3N2Zz4=';
    };

    const title = document.createElement('div');
    title.textContent = alt || 'Image Preview';
    title.style.cssText = `
      color: white;
      font-size: var(--font-size-lg);
      font-weight: 600;
      margin-bottom: var(--spacing-md);
      text-align: center;
      background: rgba(0, 0, 0, 0.7);
      padding: var(--spacing-sm) var(--spacing-md);
      border-radius: var(--radius-md);
      backdrop-filter: blur(10px);
    `;

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: -10px;
      right: -10px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255, 99, 99, 0.9);
      color: white;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 99, 99, 1)';
      closeBtn.style.transform = 'scale(1.1)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 99, 99, 0.9)';
      closeBtn.style.transform = 'scale(1)';
    });

    container.appendChild(title);
    container.appendChild(img);
    container.appendChild(closeBtn);
    modal.appendChild(container);
    document.body.appendChild(modal);

    // Close modal on click
    const closeModal = () => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    };

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    closeBtn.addEventListener('click', closeModal);

    // Close on Escape key
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyPress);
      }
    };
    document.addEventListener('keydown', handleKeyPress);
  }

  sanitizeFilename(filename) {
    return filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  }

  getImageTypeLabel(type) {
    const typeLabels = {
      'img-tag': 'IMG',
      'picture-source': 'PICTURE',
      'background-inline': 'BG-INLINE',
      'background-css': 'BG-CSS',
      'data-attribute': 'DATA',
      'json-ld': 'JSON-LD',
      'meta-tag': 'META'
    };
    return typeLabels[type] || 'UNKNOWN';
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  showSuccessMessage(message) {
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(99, 255, 99, 0.1);
      border: 1px solid rgba(99, 255, 99, 0.3);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      color: #63ff63;
      z-index: 10000;
      backdrop-filter: var(--glass-blur);
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: var(--spacing-xs);">✅ Success</div>
      <div style="font-size: var(--font-size-sm);">${message}</div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }

  showErrorMessage(message) {
    // Create a temporary error notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 99, 99, 0.1);
      border: 1px solid rgba(255, 99, 99, 0.3);
      border-radius: var(--radius-md);
      padding: var(--spacing-md);
      color: #ff6363;
      z-index: 10000;
      backdrop-filter: var(--glass-blur);
      box-shadow: var(--shadow-lg);
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: var(--spacing-xs);">❌ Error</div>
      <div style="font-size: var(--font-size-sm);">${message}</div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }

  cleanup() {
    this.images = [];
    this.isLoading = false;
  }
}
