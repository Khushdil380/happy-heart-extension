/**
 * FILE CONVERTER TOOL
 * Simple file conversion tool with grid view and sub-popups
 */
import { popupManager } from '../../../../components/Popup/popup-manager.js';
class FileConverterTool {
  constructor() {
    this.isInitialized = false;
    this.conversionTypes = {
      PDF: {
        name: 'PDF Tools',
        icon: '📄',
        tools: [
          { id: 'pdf-compress', name: 'PDF Compressor', icon: '🗜️' },
          { id: 'pdf-split', name: 'Split PDF', icon: '✂️' },
          { id: 'pdf-merge', name: 'PDF Merge', icon: '📚' },
          { id: 'pdf-protect', name: 'Protect PDF', icon: '🔒' },
          { id: 'pdf-unprotect', name: 'Remove PDF Protection', icon: '🔓' },
          { id: 'pdf-word', name: 'PDF to Word', icon: '📝' },
          { id: 'pdf-excel', name: 'PDF to Excel', icon: '📊' },
          { id: 'word-pdf', name: 'Word to PDF', icon: '📄' },
          { id: 'excel-pdf', name: 'Excel to PDF', icon: '📄' }
        ]
      },
      IMAGE: {
        name: 'Image Tools',
        icon: '🖼️',
        tools: [
          { id: 'image-resize', name: 'Resize Image', icon: '📏' },
          { id: 'image-compress', name: 'Compress Image', icon: '🗜️' },
          { id: 'image-crop', name: 'Crop Image', icon: '✂️' },
          { id: 'image-pdf', name: 'Image to PDF', icon: '📄' },
          { id: 'image-format', name: 'Image Conversion', icon: '🔄' },
          { id: 'jpg-png', name: 'JPG to PNG', icon: '🖼️' },
          { id: 'png-jpg', name: 'PNG to JPG', icon: '🖼️' },
          { id: 'webp-png', name: 'WebP to PNG', icon: '🖼️' },
          { id: 'bmp-jpg', name: 'BMP to JPG', icon: '🖼️' },
          { id: 'gif-png', name: 'GIF to PNG', icon: '🖼️' }
        ]
      },
      VIDEO: {
        name: 'Video Tools',
        icon: '🎬',
        tools: [
          { id: 'video-format', name: 'Video Format Conversion', icon: '🎬' },
          { id: 'video-compress', name: 'Video Compressor', icon: '🗜️' },
          { id: 'video-gif', name: 'Video to GIF', icon: '🎞️' },
          { id: 'video-audio', name: 'Video to Audio', icon: '🎵' },
          { id: 'mp4-avi', name: 'MP4 to AVI', icon: '🎬' },
          { id: 'avi-mp4', name: 'AVI to MP4', icon: '🎬' },
          { id: 'mkv-mp4', name: 'MKV to MP4', icon: '🎬' },
          { id: 'webm-mp4', name: 'WebM to MP4', icon: '🎬' },
          { id: 'mov-mp4', name: 'MOV to MP4', icon: '🎬' },
          { id: 'wmv-mp4', name: 'WMV to MP4', icon: '🎬' }
        ]
      },
      ARCHIVE: {
        name: 'Archive Tools',
        icon: '📦',
        tools: [
          { id: 'files-zip', name: 'Zip Files', icon: '📦' },
          { id: 'zip-files', name: 'Unzip Files', icon: '📤' },
          { id: 'rar-zip', name: 'RAR to ZIP', icon: '📦' },
          { id: '7z-zip', name: '7Z to ZIP', icon: '📦' },
          { id: 'tar-zip', name: 'TAR to ZIP', icon: '📦' },
          { id: 'gz-zip', name: 'GZ to ZIP', icon: '📦' },
          { id: 'bz2-zip', name: 'BZ2 to ZIP', icon: '📦' },
          { id: 'zip-rar', name: 'ZIP to RAR', icon: '📦' },
          { id: 'zip-7z', name: 'ZIP to 7Z', icon: '📦' },
          { id: 'zip-tar', name: 'ZIP to TAR', icon: '📦' }
        ]
      }
    };
  }
  async init() {
    if (this.isInitialized) return;
    try {
      console.log('✅ File Converter Tool initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize File Converter Tool:', error);
    }
  }
  openPopup() {
    console.log('File Converter: Opening popup...');
    const content = this.createConverterInterface();
    console.log('File Converter: Content created, creating popup...');
    const popup = popupManager.createPopup(
      'File Converter',
      content,
      { size: 'large' }
    );
    console.log('File Converter: Popup created, opening it...');
    popupManager.openPopup(popup);
    console.log('File Converter: Popup opened, setting up event listeners...');
    // Setup event listeners after popup is created
    setTimeout(() => {
      this.setupEventListeners();
      // Default to PDF tools
      this.selectConversionType('PDF');
    }, 100);
    // Store popup reference for cleanup
    this.currentPopup = popup;
  }
  createConverterInterface() {
    return `
      <div class="file-converter-container">
        <div class="converter-sidebar">
          <div class="converter-tabs">
            ${Object.entries(this.conversionTypes).map(([key, type]) => `
              <div class="converter-tab" data-type="${key}">
                <span class="tab-icon">${type.icon}</span>
                <span class="tab-name">${type.name}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="converter-main">
          <div class="converter-content">
            <div class="converter-header">
              <h3 id="converter-title">📄 PDF Tools</h3>
            </div>
            <div class="converter-body" id="converter-body">
              <!-- Tools grid will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;
  }
  setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.converter-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.type;
        this.selectConversionType(type);
      });
    });
  }
  selectConversionType(type) {
    // Update active tab
    document.querySelectorAll('.converter-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-type="${type}"]`).classList.add('active');
    // Update title
    document.getElementById('converter-title').textContent = `${this.conversionTypes[type].icon} ${this.conversionTypes[type].name}`;
    // Show tools grid
    this.showToolsGrid(type);
  }
  showToolsGrid(type) {
    const tools = this.conversionTypes[type].tools;
    document.getElementById('converter-body').innerHTML = `
      <div class="tools-grid" style="display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: repeat(2, 1fr); gap: 15px; padding: 20px;">
        ${tools.map(tool => `
          <div class="tool-item" data-tool="${tool.id}" data-type="${type}" 
               style="display: flex; flex-direction: column; align-items: center; justify-content: center; 
                      padding: 15px; border: 2px solid #dc143c; border-radius: 8px; 
                      background: rgba(220, 20, 60, 0.1); cursor: pointer; transition: all 0.3s ease;
                      min-height: 80px;">
            <div class="tool-icon" style="font-size: 24px; margin-bottom: 8px;">${tool.icon}</div>
            <div class="tool-name" style="font-size: 12px; text-align: center; font-weight: 500; color: #ffffff;">${tool.name}</div>
          </div>
        `).join('')}
      </div>
    `;
    // Setup tool clicks
    document.querySelectorAll('.tool-item').forEach(item => {
      item.addEventListener('click', () => {
        const toolId = item.dataset.tool;
        const type = item.dataset.type;
        this.showToolInContent(toolId, type);
      });
      // Add hover effects
      item.addEventListener('mouseenter', () => {
        item.style.background = 'rgba(220, 20, 60, 0.3)';
        item.style.transform = 'translateY(-2px)';
      });
      item.addEventListener('mouseleave', () => {
        item.style.background = 'rgba(220, 20, 60, 0.1)';
        item.style.transform = 'translateY(0)';
      });
    });
  }
  showToolInContent(toolId, type) {
    const tool = this.conversionTypes[type].tools.find(t => t.id === toolId);
    const toolSettings = this.getToolSettings(toolId);
    document.getElementById('converter-body').innerHTML = `
      <div class="tool-interface" style="padding: 20px;">
        <div class="tool-header" style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #dc143c;">
          <div class="tool-icon" style="font-size: 32px; margin-right: 15px;">${tool.icon}</div>
          <div class="tool-info">
            <h3 style="margin: 0; color: #ffffff; font-size: 20px;">${tool.name}</h3>
            <p style="margin: 5px 0 0 0; color: #05ffee; font-size: 14px;">${toolSettings.description}</p>
          </div>
          <button class="back-btn" style="margin-left: auto; padding: 8px 16px; background: #dc143c; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ← Back to Tools
          </button>
        </div>
        <div class="tool-content">
          <div class="upload-section" style="margin-bottom: 20px;">
            <h4 style="color: #ffffff; margin-bottom: 10px;">Upload File:</h4>
            <input type="file" class="file-input" accept="${toolSettings.accept}" ${toolSettings.multiple ? 'multiple' : ''} 
                   style="padding: 10px; border: 2px solid #dc143c; border-radius: 4px; background: rgba(0,0,0,0.3); color: white; width: 100%;">
            <div class="file-info" style="margin-top: 10px; color: #05ffee; font-size: 14px;"></div>
          </div>
          ${toolSettings.hasOptions ? `
          <div class="options-section" style="margin-bottom: 20px;">
            <h4 style="color: #ffffff; margin-bottom: 15px;">Options:</h4>
            ${toolSettings.optionsHTML}
          </div>
          ` : ''}
          <div class="action-section" style="margin-bottom: 20px;">
            <button class="convert-btn" style="padding: 12px 24px; background: #dc143c; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: 500;">
              <span class="btn-icon">🔄</span>Convert
            </button>
          </div>
          <div class="result-section" style="display: none; margin-top: 20px;">
            <div class="result-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
              <h4 style="color: #ffffff; margin: 0;">Result:</h4>
              <button class="download-btn" style="padding: 8px 16px; background: #05ffee; color: #000814; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                💾 Download
              </button>
            </div>
            <div class="result-content" style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 6px; border: 1px solid #dc143c;">
              <div id="result-text" style="color: #ffffff;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    // Setup back button
    document.querySelector('.back-btn').addEventListener('click', () => {
      this.showToolsGrid(type);
    });
    // Setup tool interface
    setTimeout(() => {
      this.setupToolPopup(toolId, toolSettings);
    }, 100);
  }
  setupToolPopup(toolId, settings) {
    // File input handling
    const fileInput = document.querySelector('.file-input');
    const fileInfo = document.querySelector('.file-info');
    const convertBtn = document.querySelector('.convert-btn');
    const downloadBtn = document.querySelector('.download-btn');
    const resultSection = document.querySelector('.result-section');
    const resultText = document.getElementById('result-text');
    fileInput.addEventListener('change', (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        let info = `${files.length} file(s) selected:`;
        for (let file of files) {
          info += `\n• ${file.name} (${this.formatFileSize(file.size)})`;
        }
        fileInfo.textContent = info;
      }
    });
    // Convert button
    convertBtn.addEventListener('click', async () => {
      const files = fileInput.files;
      if (!files || files.length === 0) {
        alert('Please select a file first');
        return;
      }
      convertBtn.disabled = true;
      convertBtn.innerHTML = '<span class="btn-icon">⏳</span>Converting...';
      try {
        // Simulate conversion
        await new Promise(resolve => setTimeout(resolve, 2000));
        // Collect settings from form
        const formSettings = this.collectFormSettings(toolId);
        const result = await this.performConversion(toolId, files, formSettings);
        resultText.innerHTML = `
          <div style="color: #51cf66;">
            <strong>✅ ${result.message}</strong><br>
            ${result.details}
          </div>
        `;
        // Store result data for download
        resultSection.dataset.resultData = JSON.stringify(result.data);
        resultSection.dataset.resultFilename = result.filename;
        resultSection.style.display = 'block';
      } catch (error) {
        resultText.innerHTML = `<div style="color: #ff6b6b;">Error: ${error.message}</div>`;
        resultSection.style.display = 'block';
      } finally {
        convertBtn.disabled = false;
        convertBtn.innerHTML = '<span class="btn-icon">🔄</span>Convert';
      }
    });
    // Download button
    downloadBtn.addEventListener('click', () => {
      const resultData = resultSection.dataset.resultData;
      const filename = resultSection.dataset.resultFilename;
      if (resultData) {
        try {
          const data = JSON.parse(resultData);
          // Handle different data types
          if (typeof data === 'string') {
            // For ZIP files and other binary data
            const blob = new Blob([data], { type: 'application/zip' });
            this.downloadBlob(blob, filename);
          } else {
            // For other data types
            this.downloadFile(data, filename, 'application/octet-stream');
          }
        } catch (error) {
          console.error('Error parsing result data:', error);
          alert('Error processing download data');
        }
      } else {
        alert('No result available for download');
      }
    });
  }
  getToolSettings(toolId) {
    const settings = {
      'pdf-compress': {
        accept: '.pdf',
        multiple: false,
        hasOptions: true,
        description: 'Reduce PDF file size',
        optionsHTML: `
          <div class="option">
            <label>Compression:</label>
            <input type="range" class="compression-slider" min="1" max="100" value="50">
            <span class="compression-value">50%</span>
          </div>
        `
      },
      'pdf-split': {
        accept: '.pdf',
        multiple: false,
        hasOptions: true,
        description: 'Split PDF into separate pages',
        optionsHTML: `
          <div class="option">
            <label>Page Range:</label>
            <input type="text" class="page-range" placeholder="1-5,10-15">
          </div>
        `
      },
      'pdf-merge': {
        accept: '.pdf',
        multiple: true,
        hasOptions: false,
        description: 'Merge multiple PDFs into one'
      },
      'image-resize': {
        accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        multiple: false,
        hasOptions: true,
        description: 'Resize image dimensions',
        optionsHTML: `
          <div class="option">
            <label>Width:</label>
            <input type="number" class="width-input" placeholder="Width">
          </div>
          <div class="option">
            <label>Height:</label>
            <input type="number" class="height-input" placeholder="Height">
          </div>
        `
      },
      'image-compress': {
        accept: '.jpg,.jpeg,.png,.gif,.bmp,.webp',
        multiple: false,
        hasOptions: true,
        description: 'Compress image file size',
        optionsHTML: `
          <div class="option">
            <label>Quality:</label>
            <input type="range" class="quality-slider" min="1" max="100" value="80">
            <span class="quality-value">80%</span>
          </div>
        `
      },
      'files-zip': {
        accept: '*/*',
        multiple: true,
        hasOptions: false,
        description: 'Create ZIP archive from files'
      },
      'zip-files': {
        accept: '.zip,.rar,.7z',
        multiple: false,
        hasOptions: false,
        description: 'Extract files from archive'
      }
    };
    return settings[toolId] || {
      accept: '*/*',
      multiple: false,
      hasOptions: false,
      description: 'File conversion tool'
    };
  }
  async performConversion(toolId, files, settings) {
    // Simulate conversion based on tool type
    const fileCount = files.length;
    const fileName = files[0].name;
    switch (toolId) {
      case 'pdf-compress':
        return {
          message: 'PDF compressed successfully!',
          details: `Compressed ${fileName}`,
          data: 'Simulated compressed PDF',
          filename: `compressed_${fileName}`
        };
      case 'pdf-split':
        return {
          message: 'PDF split successfully!',
          details: `Split ${fileName} into separate pages`,
          data: 'Simulated split PDFs',
          filename: `split_${Date.now()}.zip`
        };
      case 'pdf-merge':
        return {
          message: 'PDFs merged successfully!',
          details: `Merged ${fileCount} files`,
          data: 'Simulated merged PDF',
          filename: `merged_${Date.now()}.pdf`
        };
      case 'image-resize':
        return {
          message: 'Image resized successfully!',
          details: `Resized ${fileName}`,
          data: 'Simulated resized image',
          filename: `resized_${fileName}`
        };
      case 'image-compress':
        return {
          message: 'Image compressed successfully!',
          details: `Compressed ${fileName}`,
          data: 'Simulated compressed image',
          filename: `compressed_${fileName}`
        };
      case 'files-zip':
        return {
          message: 'Files zipped successfully!',
          details: `Zipped ${fileCount} files`,
          data: 'Simulated ZIP file',
          filename: `archive_${Date.now()}.zip`
        };
      case 'zip-files':
        return {
          message: 'Files extracted successfully!',
          details: `Extracted files from ${fileName}`,
          data: 'Simulated extracted files',
          filename: `extracted_${Date.now()}.zip`
        };
      default:
        return {
          message: 'Conversion completed!',
          details: `Processed ${fileName}`,
          data: 'Simulated result',
          filename: `result_${Date.now()}.bin`
        };
    }
  }
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  collectFormSettings(toolId) {
    const settings = {};
    // Collect format setting
    const formatSelect = document.querySelector('.format-select');
    if (formatSelect) {
      settings.format = formatSelect.value;
    }
    // Collect quality setting
    const qualitySlider = document.querySelector('.quality-slider');
    if (qualitySlider) {
      settings.quality = parseInt(qualitySlider.value);
    }
    // Collect scale setting
    const scaleSelect = document.querySelector('.scale-select');
    if (scaleSelect) {
      settings.scale = parseFloat(scaleSelect.value);
    }
    return settings;
  }
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  cleanup() {
    // Cleanup event listeners and popup references
    if (this.currentPopup) {
      this.currentPopup = null;
    }
  }
}
// Initialize and export
export async function initFileConverterTool() {
  const tool = new FileConverterTool();
  await tool.init();
  // Setup event listeners after popup is created
  setTimeout(() => {
    tool.setupEventListeners();
  }, 100);
  return tool;
}
export { FileConverterTool };
