/**
 * WEBSITE COLOR MODE CONTENT SCRIPT
 * Injects CSS into websites to apply color mode changes
 */

// Signal that the content script is loaded
window.websiteColorModeLoaded = true;

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'applyColorMode') {
    applyColorMode(request.css, request.mode);
    sendResponse({ success: true, loaded: true });
  } else if (request.action === 'removeColorMode') {
    removeColorMode();
    sendResponse({ success: true, loaded: true });
  } else if (request.action === 'ping') {
    // Respond to ping to check if content script is loaded
    sendResponse({ success: true, loaded: true });
  }
  
  return true; // Keep message channel open for async response
});

function applyColorMode(css, mode) {
  // Remove any existing color mode styles
  removeColorMode();
  
  if (css && css.trim()) {
    // Create and inject the style element
    const style = document.createElement('style');
    style.id = 'website-color-mode-style';
    style.type = 'text/css';
    style.textContent = css;
    
    // Add to document head
    document.head.appendChild(style);
    
    // Store the mode for persistence across page loads
    sessionStorage.setItem('website-color-mode', mode);
    sessionStorage.setItem('website-color-mode-css', css);
    
    console.log('Color mode applied:', mode);
  }
}

function removeColorMode() {
  // Remove existing color mode styles
  const existingStyle = document.getElementById('website-color-mode-style');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Clear stored preferences
  sessionStorage.removeItem('website-color-mode');
  sessionStorage.removeItem('website-color-mode-css');
  
  console.log('Color mode removed');
}

// Apply stored color mode on page load
function applyStoredColorMode() {
  const storedMode = sessionStorage.getItem('website-color-mode');
  const storedCSS = sessionStorage.getItem('website-color-mode-css');
  
  if (storedMode && storedCSS) {
    applyColorMode(storedCSS, storedMode);
  }
}

// Apply stored color mode when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyStoredColorMode);
} else {
  applyStoredColorMode();
}

// Also apply when page becomes visible (for SPA navigation)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    applyStoredColorMode();
  }
});
