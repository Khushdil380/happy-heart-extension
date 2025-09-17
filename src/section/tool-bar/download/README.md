# Download Tool

A comprehensive download tool for the Happy Heart Theme extension that provides modular download capabilities for various social media platforms and websites.

## Features

### 🖼️ Website Image Downloader
- **Extract images from any webpage** by pasting a URL
- **Automatic image detection** from `<img>` tags and CSS background images
- **Preview and download** individual images or all at once
- **Image filtering** to exclude small icons and sprites
- **CORS proxy support** for cross-origin image access
- **Error handling** with fallback images for broken links

### 📺 YouTube Downloader
- **Video information extraction** from YouTube URLs
- **Thumbnail preview** with play button overlay
- **Download suggestions** for various online tools and desktop software
- **URL copying** for easy sharing
- **Support for videos, shorts, and playlists**

### 📷 Instagram Downloader
- **Post information extraction** from Instagram URLs
- **Content type detection** (Posts, Reels, IGTV)
- **Download suggestions** for online tools, desktop software, and mobile apps
- **URL copying** for easy sharing
- **Legal compliance** notices

### 💼 LinkedIn Downloader
- **Content information extraction** from LinkedIn URLs
- **Professional content saving** suggestions
- **Manual saving methods** (PDF, screenshots, copy-paste)
- **Browser extension recommendations**
- **Legal notices** for content usage

## Architecture

### Modular Design
The download tool follows a modular architecture with separate components:

```
download/
├── download.js              # Main download tool controller
├── download.css             # Shared styles for all modules
├── modules/
│   ├── website-image/
│   │   └── website-image-downloader.js
│   ├── youtube/
│   │   └── youtube-downloader.js
│   ├── instagram/
│   │   └── instagram-downloader.js
│   └── linkedin/
│       └── linkedin-downloader.js
└── README.md
```

### Unified Popup System
- **Large popup** (900x700px) with sidebar navigation
- **Consistent styling** using the design system
- **RGB border effects** matching the extension theme
- **Responsive design** for different screen sizes

## Usage

### Accessing the Tool
1. Click the **📥 Download** icon in the toolbar
2. Select a download option from the left sidebar
3. Follow the instructions for each module

### Website Image Downloader
1. Paste a website URL in the input field
2. Click "Extract Images" to scan the webpage
3. Preview images in the grid
4. Download individual images or all at once

### Social Media Downloaders
1. Paste a social media URL (YouTube, Instagram, LinkedIn)
2. Click "Get [Content] Info" to fetch information
3. View content details and download suggestions
4. Use the provided tools and methods to download content

## Technical Implementation

### CORS Handling
- Uses `allorigins.win` proxy for cross-origin requests
- Fallback mechanisms for failed requests
- Error handling with user-friendly messages

### Image Processing
- HTML parsing with DOMParser
- Image size filtering (excludes images smaller than 50x50px)
- Base64 fallback images for broken links
- File size estimation and display

### Security Considerations
- **No direct downloads** for social media content (due to API restrictions)
- **Legal compliance** notices for content usage
- **Respect for terms of service** of platforms
- **User education** about proper content usage

## Browser Compatibility

- **Chrome/Chromium** browsers
- **Firefox** (with minor adjustments)
- **Edge** browsers
- **Safari** (with WebKit support)

## Limitations

### Social Media Platforms
- **No direct downloads** due to API restrictions and terms of service
- **Information extraction only** with download suggestions
- **User must use external tools** for actual downloads

### Website Images
- **CORS limitations** may affect some websites
- **Proxy dependency** for cross-origin requests
- **Rate limiting** may apply to proxy services

## Future Enhancements

### Planned Features
- **TikTok downloader** module
- **Twitter/X downloader** module
- **Pinterest downloader** module
- **Batch URL processing** for multiple links
- **Download history** and favorites
- **Custom download preferences**

### Technical Improvements
- **Local proxy server** for better CORS handling
- **Image compression** options
- **Metadata extraction** (EXIF data, etc.)
- **Download progress** indicators
- **Offline mode** support

## Contributing

When adding new download modules:

1. Create a new folder in `modules/`
2. Implement the module class with required methods:
   - `getContent()` - Returns HTML content
   - `setupEventListeners(popupBody)` - Sets up event handlers
   - `cleanup()` - Cleanup method
3. Add the module to the main `download.js` file
4. Update the sidebar options in `createDownloadContent()`
5. Add appropriate CSS styles if needed

## Legal Notice

This tool is designed for educational and personal use only. Users must:
- Respect the terms of service of all platforms
- Only download content they have permission to use
- Give proper attribution when sharing downloaded content
- Use downloaded content responsibly and legally

The tool provides suggestions and information only - actual downloads must be done through legitimate means and in compliance with applicable laws and platform policies.
