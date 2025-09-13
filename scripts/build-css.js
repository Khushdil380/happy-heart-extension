// scripts/build-css.js - CSS build script

const postcss = require('postcss');
const postcssImport = require('postcss-import');
const postcssPresetEnv = require('postcss-preset-env');
const fs = require('fs');
const path = require('path');

const isProduction = process.argv.includes('--minify');

async function buildCSS() {
    const inputFile = path.join(__dirname, '../newtab/parts.css');
    const outputFile = path.join(__dirname, '../dist/newtab/parts.css');
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputFile);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const css = fs.readFileSync(inputFile, 'utf8');
    
    const plugins = [
        postcssImport(),
        postcssPresetEnv({
            stage: 2,
            features: {
                'custom-properties': true,
                'nesting-rules': true
            }
        })
    ];
    
    if (isProduction) {
        plugins.push(require('cssnano')({
            preset: 'default'
        }));
    }
    
    const result = await postcss(plugins).process(css, {
        from: inputFile,
        to: outputFile,
        map: !isProduction ? { inline: true } : false
    });
    
    fs.writeFileSync(outputFile, result.css);
    
    if (result.map) {
        fs.writeFileSync(outputFile + '.map', result.map.toString());
    }
    
    console.log(`✅ CSS built: ${outputFile}`);
    if (isProduction) {
        console.log(`📦 Minified: ${(result.css.length / 1024).toFixed(2)}KB`);
    }
}

buildCSS().catch(console.error);
