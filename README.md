# Happy Heart Extension ❤️

A beautiful and customizable Chrome extension that transforms your new tab page into a productivity hub with games, tools, and personalization features.

## ✨ Features

### 🎮 **Games Collection**
- **Snake Game** - Classic snake with smooth controls
- **Tic-Tac-Toe** - Play against AI or friends
- **Flappy Bird** - Multiple difficulty levels
- **Whack-a-Mole** - Time-based mole whacking
- **Memory Game** - Card matching challenge

### 🛠️ **Productivity Tools**
- **File Converter** - PDF, image, video, and archive tools
- **Calculator & Unit Converter** - Comprehensive calculation tools
- **Background Customizer** - Personalize your new tab
- **Weather Widget** - Real-time weather information
- **Notes Manager** - Organize your thoughts and ideas

### 🎨 **Customization**
- **Glassmorphism Design** - Modern, beautiful UI
- **Top Websites** - Quick access to your favorite sites
- **Bookmark Integration** - Chrome bookmarks management
- **Search Engine Selection** - Multiple search providers
- **Responsive Design** - Works on all screen sizes

## 🚀 Quick Start

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/happy-heart-extension.git
   cd happy-heart-extension
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project folder

### Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format

# Build extension
npm run build

# Package for distribution
npm run package
```

## 🏗️ Architecture

### Project Structure

```
happy-heart-extension/
├── 📄 manifest.json                    # Extension configuration
├── 📁 assets/                          # Static assets
│   ├── 📁 icons/                       # Extension icons
│   ├── 📁 images/                      # Background images
│   └── 📁 default/                     # Default theme assets
├── 📁 newtab/                          # Main new tab page
│   ├── 📄 index.html                   # HTML structure
│   ├── 📄 script.js                    # Main initialization
│   └── 📄 style.css                    # Global styles
├── 📁 src/                             # Source code
│   ├── 📁 section/                     # UI sections
│   │   ├── 📁 left-sidebar/            # Left sidebar widgets
│   │   ├── 📁 middle-section/          # Central content
│   │   ├── 📁 tool-bar/                # Bottom toolbar
│   │   └── 📁 vertical-right-bar/      # Right sidebar
│   └── 📁 utils/                       # Utility functions
│       ├── 📄 storage.js               # Storage management
│       ├── 📄 api.js                   # API utilities
│       ├── 📄 performance.js           # Performance monitoring
│       ├── 📄 validation.js            # Input validation
│       └── 📄 error-handler.js         # Error handling
├── 📁 components/                      # Shared components
│   ├── 📁 Popup/                       # Popup system
│   └── 📁 styling/                     # Design system
└── 📁 tests/                           # Test files
```

### Key Components

#### 🎯 **Main Script** (`newtab/script.js`)
- Initializes all components
- Manages component lifecycle
- Handles global events
- Performance monitoring

#### 🎨 **Design System** (`components/styling/design-system.css`)
- CSS custom properties
- Consistent color scheme
- Typography scale
- Spacing system
- Animation definitions

#### 🛠️ **Utilities**
- **Storage Manager** - Chrome storage with caching
- **Performance Monitor** - Memory and performance tracking
- **Validation System** - Input validation and sanitization
- **Error Handler** - Centralized error management
- **API Manager** - External API integration

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# Weather API Configuration
WEATHER_API_KEY=your_openweathermap_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather

# Development Settings
NODE_ENV=development
DEBUG=true
```

### API Keys

1. **Weather API**: Get a free API key from [OpenWeatherMap](https://openweathermap.org/api)
2. **File Conversion**: Currently uses client-side processing (no API key needed)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Structure

- **Unit Tests** - Individual component testing
- **Integration Tests** - Component interaction testing
- **E2E Tests** - Full user flow testing

## 📦 Building & Distribution

### Development Build
```bash
npm run build
```

### Production Package
```bash
npm run package
```

This creates a `dist/` folder with the packaged extension ready for Chrome Web Store submission.

## 🐛 Debugging

### Common Issues

1. **Extension not loading**
   - Check `manifest.json` syntax
   - Verify file paths are correct
   - Check Chrome console for errors

2. **Games not working**
   - Ensure canvas elements are properly initialized
   - Check for JavaScript errors in console
   - Verify event listeners are attached

3. **Storage issues**
   - Check Chrome storage permissions
   - Verify storage quota limits
   - Check for storage API errors

### Debug Tools

- **Chrome DevTools** - Main debugging interface
- **Extension Console** - Extension-specific errors
- **Performance Monitor** - Memory and performance tracking
- **Error Handler** - Centralized error logging

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Run tests and linting**
   ```bash
   npm run validate
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Code Style

- Use ESLint configuration provided
- Follow Prettier formatting
- Write comprehensive tests
- Document new features
- Follow semantic versioning

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap** - Weather data API
- **Chrome Extensions API** - Extension functionality
- **Modern CSS** - Glassmorphism and animations
- **Community** - Feedback and contributions

## 📞 Support

- **Issues** - [GitHub Issues](https://github.com/yourusername/happy-heart-extension/issues)
- **Discussions** - [GitHub Discussions](https://github.com/yourusername/happy-heart-extension/discussions)
- **Email** - support@happyheartextension.com

## 🗺️ Roadmap

### Version 2.0
- [ ] Dark/Light theme toggle
- [ ] More games (Tetris, Pac-Man)
- [ ] Advanced file conversion
- [ ] Cloud sync
- [ ] Mobile companion app

### Version 2.1
- [ ] AI-powered features
- [ ] Voice commands
- [ ] Advanced analytics
- [ ] Plugin system
- [ ] Multi-language support

---

**Made with ❤️ for productivity enthusiasts**

*Happy Heart Extension - Transform your new tab into a productivity paradise!*
