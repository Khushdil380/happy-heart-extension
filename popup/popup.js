class WebsiteColorModePopup {
  constructor() {
    this.currentMode = 'default';
    this.customColors = { background: '#ffffff', text: '#000000' };
    this.isInitialized = false;
    this.isBraveBrowser = navigator.userAgent.includes('Brave') || window.navigator.brave !== undefined;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.loadPreferences();
      this.setupEventListeners();
      this.updateUI();
      if (this.isBraveBrowser) this.showBraveWarning();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize popup:', error);
    }
  }

  showBraveWarning() {
    const braveWarning = document.getElementById('brave-warning');
    if (braveWarning) braveWarning.style.display = 'block';
  }

  async loadPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['colorMode', 'customColors'], (result) => {
        if (result.colorMode) this.currentMode = result.colorMode;
        if (result.customColors) this.customColors = { ...this.customColors, ...result.customColors };
        resolve();
      });
    });
  }

  async savePreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ colorMode: this.currentMode, customColors: this.customColors }, resolve);
    });
  }

  setupEventListeners() {
    // Mode selection
    document.querySelectorAll('.mode-option').forEach(option => {
      option.addEventListener('click', () => this.selectMode(option.dataset.mode));
    });

    // Radio button changes
    document.querySelectorAll('input[name="color-mode"]').forEach(radio => {
      radio.addEventListener('change', (e) => e.target.checked && this.selectMode(e.target.value));
    });

    // Custom color inputs
    const bgColorInput = document.getElementById('bg-color');
    const bgColorText = document.getElementById('bg-color-text');
    const textColorInput = document.getElementById('text-color');
    const textColorText = document.getElementById('text-color-text');

    bgColorInput?.addEventListener('input', (e) => {
      this.customColors.background = e.target.value;
      bgColorText.value = e.target.value;
      this.updateColorPreview();
    });

    bgColorText?.addEventListener('input', (e) => {
      if (this.isValidColor(e.target.value)) {
        this.customColors.background = e.target.value;
        bgColorInput.value = e.target.value;
        this.updateColorPreview();
      }
    });

    textColorInput?.addEventListener('input', (e) => {
      this.customColors.text = e.target.value;
      textColorText.value = e.target.value;
      this.updateColorPreview();
    });

    textColorText?.addEventListener('input', (e) => {
      if (this.isValidColor(e.target.value)) {
        this.customColors.text = e.target.value;
        textColorInput.value = e.target.value;
        this.updateColorPreview();
      }
    });

    // Action buttons
    document.getElementById('apply-btn')?.addEventListener('click', () => this.applyToCurrentTab());
    document.getElementById('apply-all-btn')?.addEventListener('click', () => this.applyToAllTabs());
    document.getElementById('refresh-btn')?.addEventListener('click', () => this.refreshPageAccess());
    document.getElementById('diagnose-btn')?.addEventListener('click', () => this.diagnoseCurrentPage());
    document.getElementById('reset-btn')?.addEventListener('click', () => this.resetSettings());

    // Troubleshoot button
    const troubleshootBtn = document.getElementById('troubleshoot-btn');
    const troubleshootContent = document.getElementById('troubleshoot-content');
    troubleshootBtn?.addEventListener('click', () => {
      troubleshootContent.style.display = troubleshootContent.style.display === 'none' ? 'block' : 'none';
    });
  }

  selectMode(mode) {
    this.currentMode = mode;
    
    // Update radio button
    document.querySelector(`input[name="color-mode"][value="${mode}"]`).checked = true;

    // Show/hide custom colors section
    const customSection = document.getElementById('custom-colors');
    if (customSection) {
      customSection.style.display = mode === 'custom' ? 'block' : 'none';
      if (mode === 'custom') this.updateColorPreview();
    }

    this.savePreferences();
  }

  updateUI() {
    this.selectMode(this.currentMode);

    // Update custom color inputs
    const bgColorInput = document.getElementById('bg-color');
    const bgColorText = document.getElementById('bg-color-text');
    const textColorInput = document.getElementById('text-color');
    const textColorText = document.getElementById('text-color-text');

    if (bgColorInput && bgColorText) {
      bgColorInput.value = bgColorText.value = this.customColors.background;
    }
    if (textColorInput && textColorText) {
      textColorInput.value = textColorText.value = this.customColors.text;
    }

    this.updateColorPreview();
  }

  updateColorPreview() {
    const previewBox = document.getElementById('color-preview');
    if (previewBox) {
      previewBox.style.backgroundColor = this.customColors.background;
      previewBox.style.color = this.customColors.text;
    }
  }

  isValidColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  generateCSS(mode, customColors = null) {
    let css = '';

    switch (mode) {
      case 'light':
        css = `
          * {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          input, textarea, select {
            background-color: #ffffff !important;
            color: #000000 !important;
            border-color: #cccccc !important;
          }
          a {
            color: #0066cc !important;
          }
          a:visited {
            color: #663399 !important;
          }
        `;
        break;

      case 'dark':
        css = `
          * {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
          }
          html, body {
            background-color: #1a1a1a !important;
            color: #ffffff !important;
          }
          input, textarea, select {
            background-color: #2a2a2a !important;
            color: #ffffff !important;
            border-color: #444444 !important;
          }
          a {
            color: #66b3ff !important;
          }
          a:visited {
            color: #b366ff !important;
          }
        `;
        break;

      case 'custom':
        if (customColors) {
          css = `
            * {
              background-color: ${customColors.background} !important;
              color: ${customColors.text} !important;
            }
            html, body {
              background-color: ${customColors.background} !important;
              color: ${customColors.text} !important;
            }
            input, textarea, select {
              background-color: ${customColors.background} !important;
              color: ${customColors.text} !important;
              border-color: ${this.lightenColor(customColors.text, 0.3)} !important;
            }
            a {
              color: ${this.lightenColor(customColors.text, 0.2)} !important;
            }
            a:visited {
              color: ${this.darkenColor(customColors.text, 0.2)} !important;
            }
          `;
        }
        break;

      default:
        css = ''; // No CSS injection for default mode
        break;
    }

    return css;
  }

  lightenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
  }

  darkenColor(color, amount) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * amount * 100);
    const R = (num >> 16) - amt;
    const G = (num >> 8 & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1);
  }

  async applyToCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.showStatus('No active tab found', 'error');
        return;
      }

      // Check if the tab URL is accessible
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('edge://')) {
        this.showStatus('Cannot apply color mode to browser pages', 'error');
        return;
      }

      const css = this.generateCSS(this.currentMode, this.customColors);
      
      // Check if content script is already loaded
      let contentScriptLoaded = false;
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        contentScriptLoaded = response && response.loaded;
      } catch (e) {
        contentScriptLoaded = false;
      }
      
      // If content script is not loaded, inject it
      if (!contentScriptLoaded) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['popup/content-script.js']
          });
          
          // Small delay to ensure script is loaded
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError);
          
          // Try direct CSS injection as last resort
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: this.injectColorModeCSS,
              args: [css, this.currentMode]
            });
            
            this.showStatus('Color mode applied to current tab!', 'success');
            await this.savePreferences();
            return;
            
          } catch (directInjectionError) {
            console.error('Direct injection also failed:', directInjectionError);
            
            // Provide specific error messages based on the error type
            if (directInjectionError.message.includes('Cannot access')) {
              if (this.isBraveBrowser) {
                this.showStatus('Brave browser blocked access. Check extension permissions in brave://settings/extensions', 'error');
              } else {
                this.showStatus('This page has security restrictions. Try a different website.', 'error');
              }
            } else if (directInjectionError.message.includes('Extension context invalidated')) {
              this.showStatus('Extension needs to be reloaded. Please refresh the extension.', 'error');
            } else if (directInjectionError.message.includes('frame')) {
              this.showStatus('Cannot access this page due to frame restrictions. Try the main page.', 'error');
            } else {
              this.showStatus(`Cannot access this page: ${directInjectionError.message}`, 'error');
            }
            return;
          }
        }
      }
      
      // Now try to send the message
      try {
        if (css) {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'applyColorMode',
            css: css,
            mode: this.currentMode
          });
          
          this.showStatus('Color mode applied to current tab!', 'success');
        } else {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'removeColorMode'
          });
          
          this.showStatus('Default colors restored!', 'success');
        }

        // Save preferences
        await this.savePreferences();
        
      } catch (messageError) {
        console.error('Message sending error:', messageError);
        
        // Fallback: inject CSS directly
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: this.injectColorModeCSS,
            args: [css, this.currentMode]
          });
          
          this.showStatus('Color mode applied to current tab!', 'success');
          await this.savePreferences();
          
        } catch (injectionError) {
          console.error('Script injection error:', injectionError);
          this.showStatus('Error: Unable to apply color mode to this page.', 'error');
        }
      }
      
    } catch (error) {
      console.error('Error applying to current tab:', error);
      this.showStatus('Error applying color mode', 'error');
    }
  }

  async applyToAllTabs() {
    try {
      const tabs = await chrome.tabs.query({});
      const css = this.generateCSS(this.currentMode, this.customColors);
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const tab of tabs) {
        try {
          // Skip browser internal pages
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            continue;
          }

          try {
            if (css) {
              await chrome.tabs.sendMessage(tab.id, {
                action: 'applyColorMode',
                css: css,
                mode: this.currentMode
              });
            } else {
              await chrome.tabs.sendMessage(tab.id, {
                action: 'removeColorMode'
              });
            }
            successCount++;
          } catch (messageError) {
            // Try direct injection as fallback
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.injectColorModeCSS,
                args: [css, this.currentMode]
              });
              successCount++;
            } catch (injectionError) {
              errorCount++;
              console.log(`Could not apply to tab ${tab.id}:`, injectionError);
            }
          }
        } catch (error) {
          errorCount++;
          console.log(`Could not access tab ${tab.id}:`, error);
        }
      }
      
      if (errorCount > 0) {
        this.showStatus(`Applied to ${successCount} tabs, ${errorCount} failed`, 'info');
      } else {
        this.showStatus(`Color mode applied to ${successCount} tabs!`, 'success');
      }
      
      // Save preferences
      await this.savePreferences();
      
    } catch (error) {
      console.error('Error applying to all tabs:', error);
      this.showStatus('Error applying color mode to all tabs', 'error');
    }
  }

  async diagnoseCurrentPage() {
    try {
      this.showStatus('Diagnosing page access...', 'info');
      
      const diagnosis = await this.diagnosePageAccess();
      
      if (diagnosis.accessible) {
        this.showStatus(`✅ Page accessible: ${diagnosis.reason}`, 'success');
      } else {
        let errorMessage = `❌ Page not accessible: ${diagnosis.reason}`;
        
        // Add Brave-specific guidance
        if (this.isBraveBrowser && diagnosis.reason.includes('Injection failed')) {
          errorMessage += ' (Brave browser detected - check extension permissions)';
        }
        
        this.showStatus(errorMessage, 'error');
      }
      
      // Also log to console for debugging
      console.log('Page diagnosis:', diagnosis);
      console.log('Brave browser detected:', this.isBraveBrowser);
      
    } catch (error) {
      console.error('Error diagnosing page:', error);
      this.showStatus('Error diagnosing page access', 'error');
    }
  }

  async refreshPageAccess() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        this.showStatus('No active tab found', 'error');
        return;
      }

      // Check if the tab URL is accessible
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('edge://')) {
        this.showStatus('Cannot access browser pages', 'error');
        return;
      }

      // Check if it's a file:// URL
      if (tab.url.startsWith('file://')) {
        this.showStatus('Cannot access local files. Try opening a web page instead.', 'error');
        return;
      }

      // Check if it's a data: URL
      if (tab.url.startsWith('data:')) {
        this.showStatus('Cannot access data URLs. Try opening a web page instead.', 'error');
        return;
      }

      this.showStatus('Refreshing page access...', 'info');

      // Force inject content script
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['popup/content-script.js']
        });
        
        // Wait a bit for script to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test if content script is now responsive
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
        
        if (response && response.loaded) {
          this.showStatus('Page access refreshed successfully!', 'success');
        } else {
          this.showStatus('Page access refreshed, but content script may not be fully loaded', 'info');
        }
        
      } catch (error) {
        console.error('Failed to refresh page access:', error);
        
        // Provide more specific error messages
        if (error.message.includes('Cannot access')) {
          if (this.isBraveBrowser) {
            this.showStatus('Brave browser blocked access. Check extension permissions in brave://settings/extensions', 'error');
          } else {
            this.showStatus('This page has security restrictions. Try a different website.', 'error');
          }
        } else if (error.message.includes('Extension context invalidated')) {
          this.showStatus('Extension needs to be reloaded. Please refresh the extension.', 'error');
        } else if (error.message.includes('frame')) {
          this.showStatus('Cannot access this page due to frame restrictions. Try the main page.', 'error');
        } else {
          this.showStatus(`Page access failed: ${error.message}`, 'error');
        }
      }
      
    } catch (error) {
      console.error('Error refreshing page access:', error);
      this.showStatus('Error refreshing page access', 'error');
    }
  }

  async resetSettings() {
    this.currentMode = 'default';
    this.customColors = {
      background: '#ffffff',
      text: '#000000'
    };
    
    this.updateUI();
    
    // Remove color mode from all tabs
    try {
      const tabs = await chrome.tabs.query({});
      let successCount = 0;
      let errorCount = 0;
      
      for (const tab of tabs) {
        try {
          // Skip browser internal pages
          if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
            continue;
          }

          try {
            await chrome.tabs.sendMessage(tab.id, {
              action: 'removeColorMode'
            });
            successCount++;
          } catch (messageError) {
            // Try direct injection as fallback
            try {
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: this.injectColorModeCSS,
                args: [null, 'default']
              });
              successCount++;
            } catch (injectionError) {
              errorCount++;
              console.log(`Could not reset tab ${tab.id}:`, injectionError);
            }
          }
        } catch (error) {
          errorCount++;
          console.log(`Could not access tab ${tab.id}:`, error);
        }
      }
      
      if (errorCount > 0) {
        this.showStatus(`Reset applied to ${successCount} tabs, ${errorCount} failed`, 'info');
      } else {
        this.showStatus('Settings reset and applied to all tabs!', 'success');
      }
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      this.showStatus('Error resetting settings', 'error');
    }
    
    // Clear saved preferences
    await this.savePreferences();
  }

  // Function to inject CSS directly (fallback method)
  injectColorModeCSS(css, mode) {
    // Remove any existing color mode styles
    const existingStyle = document.getElementById('website-color-mode-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Add new styles
    if (css) {
      const style = document.createElement('style');
      style.id = 'website-color-mode-style';
      style.textContent = css;
      document.head.appendChild(style);
      
      // Store the mode for persistence
      sessionStorage.setItem('website-color-mode', mode);
      sessionStorage.setItem('website-color-mode-css', css);
    } else {
      // Clear stored preferences
      sessionStorage.removeItem('website-color-mode');
      sessionStorage.removeItem('website-color-mode-css');
    }
  }

  async diagnosePageAccess() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        return { accessible: false, reason: 'No active tab found' };
      }

      const url = tab.url;
      
      // Check URL types
      if (url.startsWith('chrome://') || url.startsWith('chrome-extension://') || url.startsWith('moz-extension://') || url.startsWith('edge://')) {
        return { accessible: false, reason: 'Browser internal page' };
      }
      
      if (url.startsWith('file://')) {
        return { accessible: false, reason: 'Local file' };
      }
      
      if (url.startsWith('data:')) {
        return { accessible: false, reason: 'Data URL' };
      }
      
      // Try to get tab info
      try {
        const tabInfo = await chrome.tabs.get(tab.id);
        
        // Check if tab is loading
        if (tabInfo.status === 'loading') {
          return { accessible: false, reason: 'Page is still loading' };
        }
        
        // Try to ping the content script
        try {
          const response = await chrome.tabs.sendMessage(tab.id, { action: 'ping' });
          if (response && response.loaded) {
            return { accessible: true, reason: 'Content script is loaded' };
          } else {
            return { accessible: false, reason: 'Content script not responding' };
          }
        } catch (pingError) {
          // Try to inject content script
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['popup/content-script.js']
            });
            return { accessible: true, reason: 'Content script injected successfully' };
          } catch (injectionError) {
            return { accessible: false, reason: `Injection failed: ${injectionError.message}` };
          }
        }
        
      } catch (tabError) {
        return { accessible: false, reason: `Tab access failed: ${tabError.message}` };
      }
      
    } catch (error) {
      return { accessible: false, reason: `Diagnosis failed: ${error.message}` };
    }
  }

  showStatus(message, type) {
    const statusElement = document.getElementById('status-message');
    if (statusElement) {
      statusElement.textContent = message;
      statusElement.className = `status-message show ${type}`;
      
      setTimeout(() => {
        statusElement.classList.remove('show');
      }, 3000);
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  const popup = new WebsiteColorModePopup();
  await popup.init();
});

