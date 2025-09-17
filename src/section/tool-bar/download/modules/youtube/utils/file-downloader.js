export class FileDownloader {
  static async downloadFile(streamUrl, videoId, quality, type) {
    try {
      // Show download progress
      this.showDownloadProgress(0);
      
      // Fetch the video/audio file with progress tracking
      const response = await fetch(streamUrl.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentLength = response.headers.get('content-length');
      const total = parseInt(contentLength, 10);
      let loaded = 0;
      
      // Create a readable stream to track progress
      const reader = response.body.getReader();
      const chunks = [];
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        chunks.push(value);
        loaded += value.length;
        
        // Update progress
        if (total > 0) {
          const progress = Math.round((loaded / total) * 100);
          this.showDownloadProgress(progress);
        }
      }
      
      // Combine chunks into a single blob
      const blob = new Blob(chunks, { type: streamUrl.mimeType });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename based on quality and type
      const extension = type === 'video' ? 'mp4' : 'mp3';
      const filename = `youtube_${videoId}_${quality.replace(/\s+/g, '_')}.${extension}`;
      link.download = filename;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      
      // Hide progress
      this.hideDownloadProgress();
      
    } catch (error) {
      console.error('Error downloading file:', error);
      this.hideDownloadProgress();
      throw error;
    }
  }

  static showDownloadProgress(percentage) {
    let progressBar = document.querySelector('.download-progress-bar');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.className = 'download-progress-bar';
      progressBar.innerHTML = `
        <div class="progress-container">
          <div class="progress-text">Downloading... ${percentage}%</div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${percentage}%"></div>
          </div>
        </div>
      `;
      document.body.appendChild(progressBar);
    } else {
      const progressFill = progressBar.querySelector('.progress-fill');
      const progressText = progressBar.querySelector('.progress-text');
      progressFill.style.width = `${percentage}%`;
      progressText.textContent = `Downloading... ${percentage}%`;
    }
  }

  static hideDownloadProgress() {
    const progressBar = document.querySelector('.download-progress-bar');
    if (progressBar) {
      progressBar.remove();
    }
  }
}
