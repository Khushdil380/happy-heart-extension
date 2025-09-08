// src/parts/part5-customize.js
import { getStoredData, setStoredData } from '../utils/storage.js';

const BACKGROUND_KEY = 'customBackground';

export async function initCustomization() {
    const customizeButton = document.getElementById('customize-button');
    const body = document.body;

    // Load saved background
    const savedBackground = await getStoredData(BACKGROUND_KEY);
    if (savedBackground) {
        applyBackground(savedBackground);
    } else {
        // Apply a default if no custom background is saved
        body.style.backgroundImage = `url("../assets/images/default-bg.gif")`;
        body.style.backgroundColor = '#333'; // Fallback
    }

    customizeButton.addEventListener('click', () => {
        // For now, just a placeholder. Later this will open a popup or modal.
        alert('Customization options coming soon!');
        // Example: change background on click (for testing)
        // const newColor = '#' + Math.floor(Math.random()*16777215).toString(16);
        // applyBackground({ type: 'color', value: newColor });
        // setStoredData(BACKGROUND_KEY, { type: 'color', value: newColor });
    });
}

function applyBackground(background) {
    const body = document.body;
    if (background.type === 'color') {
        body.style.backgroundImage = 'none';
        body.style.backgroundColor = background.value;
    } else if (background.type === 'image') {
        body.style.backgroundColor = ''; // Clear color
        body.style.backgroundImage = `url(${background.value})`;
    }
    // Add logic for 'gradient' or 'gif' later
}

// You can add more functions here for handling image uploads, color picker, etc.