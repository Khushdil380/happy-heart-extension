// scripts/simple-build.js - Simple build script for immediate upload

const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }
    fs.copyFileSync(src, dest);
}

function copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }
    
    const items = fs.readdirSync(src);
    items.forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            copyFile(srcPath, destPath);
        }
    });
}

function buildExtension() {
    console.log('🚀 Building Happy Heart Extension...');
    
    // Clean dist directory
    if (fs.existsSync('dist')) {
        fs.rmSync('dist', { recursive: true });
    }
    fs.mkdirSync('dist');
    
    // Copy main files
    copyFile('manifest.json', 'dist/manifest.json');
    copyFile('newtab/index.html', 'dist/newtab/index.html');
    copyFile('newtab/style.css', 'dist/newtab/style.css');
    copyFile('newtab/parts.css', 'dist/newtab/parts.css');
    copyFile('newtab/script.js', 'dist/newtab/script.js');
    
    // Copy assets
    copyDirectory('assets', 'dist/assets');
    
    // Copy popup and options (if they exist and have content)
    if (fs.existsSync('popup') && fs.readdirSync('popup').length > 0) {
        copyDirectory('popup', 'dist/popup');
    }
    
    if (fs.existsSync('options') && fs.readdirSync('options').length > 0) {
        copyDirectory('options', 'dist/options');
    }
    
    // Copy src directory (all your parts)
    copyDirectory('src', 'dist/src');
    
    console.log('✅ Extension built successfully!');
    console.log('📁 Built files are in the "dist" directory');
    console.log('📦 You can now load the extension from the "dist" folder');
    console.log('🌐 Or zip the "dist" folder for Chrome Web Store upload');
}

buildExtension();
