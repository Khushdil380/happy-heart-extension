// newtab/script.js

// Import utility functions
import { getStoredData, setStoredData } from '../src/utils/storage.js';
// import { fetchWeatherData, fetchExchangeRates } from '../src/utils/api.js'; // Will be uncommented later

// Import individual part scripts (we'll create these as we go)
// import { initFavicons } from '../src/parts/part1-favicons.js';
// import { initSearchBox } from '../src/parts/part2-searchbox.js';
// import { initBookmarks } from '../src/parts/part3-bookmarks.js';
// import { initSocialLinks } from '../src/parts/part4-social.js';
import { initCustomization } from '../src/parts/part5-customize.js'; // Starting with customization early
import { initClock } from '../src/parts/part6-clock.js';             // Starting with clock as per plan
import { initWeather } from '../src/parts/part7-weather.js';
// import { initNotes } from '../src/parts/part8-notes.js';
// import { initSidebar } from '../src/parts/part9-sidebar.js';
// import { initTimer } from '../src/parts/part10-timer.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('Happy Heart Theme - New Tab Loaded!');

    // Initialize core features
    initCustomization(); // Call customization first to apply background if saved
    initClock();         // Call clock
    
    // Initialize other parts as we build them
    // initFavicons();
    // initSearchBox();
    // initBookmarks();
    // initSocialLinks();
    initWeather();
    // initNotes();
    // initSidebar();
    // initTimer();

    // Example of using storage (you'll use this a lot!)
    getStoredData('exampleKey', 'defaultValue').then(value => {
        console.log('Example stored value:', value);
    });
    setStoredData('exampleKey', 'Hello from Happy Heart!').then(() => {
        console.log('Example value stored.');
    });
});