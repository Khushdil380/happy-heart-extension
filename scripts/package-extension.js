// scripts/package-extension.js - Package extension for Chrome Web Store

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function packageExtension() {
    console.log('📦 Packaging Happy Heart Extension for Chrome Web Store...');
    
    // First, build the extension
    console.log('🔨 Building extension...');
    execSync('node scripts/simple-build.js', { stdio: 'inherit' });
    
    // Create zip file
    const distPath = path.resolve('dist');
    const zipName = `happy-heart-extension-${Date.now()}.zip`;
    
    try {
        // Use PowerShell on Windows, zip on other systems
        if (process.platform === 'win32') {
            execSync(`powershell Compress-Archive -Path "${distPath}\\*" -DestinationPath "${zipName}"`, { stdio: 'inherit' });
        } else {
            execSync(`cd dist && zip -r ../${zipName} .`, { stdio: 'inherit' });
        }
        
        console.log('✅ Extension packaged successfully!');
        console.log(`📦 Package: ${zipName}`);
        console.log('🌐 Ready for Chrome Web Store upload!');
        console.log('');
        console.log('📋 Next steps:');
        console.log('1. Go to Chrome Web Store Developer Dashboard');
        console.log('2. Click "Add new item"');
        console.log('3. Upload the zip file');
        console.log('4. Fill in store listing details');
        console.log('5. Submit for review');
        
    } catch (error) {
        console.error('❌ Error creating zip file:', error.message);
        console.log('💡 Manual packaging:');
        console.log('1. Select all files in the "dist" folder');
        console.log('2. Right-click and "Send to" > "Compressed folder"');
        console.log('3. Rename the zip file to "happy-heart-extension.zip"');
    }
}

packageExtension();
