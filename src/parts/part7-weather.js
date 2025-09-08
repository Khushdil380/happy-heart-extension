
export function initWeather() {
    const weatherContainer = document.getElementById('part7-weather');
    const STORAGE_KEY = 'weatherSettings';
    const DEFAULT_CITY = 'London';
    const DEFAULT_UNITS = 'metric'; // 'metric' for Celsius, 'imperial' for Fahrenheit
    const API_KEY = 'd0402b7da2bb75f2e026a753e4d8e745';

    // Initialize the weather widget
    function init() {
        // Create the initial structure
        weatherContainer.innerHTML = `
            <div class="weather-content">
                <button class="weather-settings-btn" style="display:none;">⚙️</button>
                <div class="weather-body"></div>
            </div>
        `;

        weatherContainer.addEventListener('mouseenter', () => {
            const settingsBtn = weatherContainer.querySelector('.weather-settings-btn');
            settingsBtn.style.display = 'block';
        });

        weatherContainer.addEventListener('mouseleave', () => {
            const settingsBtn = weatherContainer.querySelector('.weather-settings-btn');
            settingsBtn.style.display = 'none';
        });

        // Load weather settings and fetch data
        loadWeatherSettings()
            .then(settings => {
                return settings && settings.city ? settings : saveWeatherSettings({ city: DEFAULT_CITY, units: DEFAULT_UNITS });
            })
            .then(settings => {
                fetchWeatherData(settings.city, settings.units);
            });

        // Add event listener for settings button
        weatherContainer.querySelector('.weather-settings-btn').addEventListener('click', showWeatherSettings);
    }

    // Load weather settings from storage
    function loadWeatherSettings() {
        return new Promise(resolve => {
            chrome.storage.local.get([STORAGE_KEY], result => {
                const settings = result[STORAGE_KEY] || {};
                resolve(settings);
            });
        });
    }

    // Save weather settings to storage
    function saveWeatherSettings(settings) {
        return new Promise(resolve => {
            chrome.storage.local.set({ [STORAGE_KEY]: settings }, () => {
                resolve(settings);
            });
        });
    }

    // Fetch weather data from API
    async function fetchWeatherData(city, units) {
        if (!API_KEY) {
            displayWeatherError('API key not configured. Please add your OpenWeatherMap API key.');
            return;
        }

        const weatherBody = weatherContainer.querySelector('.weather-body');
        weatherBody.innerHTML = `<div class="weather-loading">Loading weather data...</div>`;

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${units}&appid=${API_KEY}`
            );

            if (!response.ok) {
                throw new Error(`Weather API error: ${response.status}`);
            }

            const data = await response.json();
            displayWeatherData(data, units);

            // Save this as the current city
            const settings = await loadWeatherSettings();
            settings.city = city;
            settings.units = units;
            await saveWeatherSettings(settings);
        } catch (error) {
            console.error('Error fetching weather:', error);
            displayWeatherError('Could not load weather data. Please check your city name and try again.');
        }
    }

    // Display weather data in the widget
    function displayWeatherData(data, units) {
        const weatherBody = weatherContainer.querySelector('.weather-body');
        const tempUnit = units === 'metric' ? '°C' : '°F';
        const windUnit = units === 'metric' ? 'm/s' : 'mph';

        const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        weatherBody.innerHTML = `
            <div class="weather-city-container">
                <img src="${iconUrl}" alt="${data.weather[0].description}" class="weather-icon">
                <div class="weather-city">${data.name}, ${data.sys.country}</div>
            </div>
            <div class="weather-temp">${Math.round(data.main.temp)}${tempUnit}</div>
            <div class="weather-description">${data.weather[0].description}</div>
            <div class="weather-details">
                <div>Feels like: ${Math.round(data.main.feels_like)}${tempUnit}</div>
                <div>Humidity: ${data.main.humidity}%</div>
                <div>Wind: ${data.wind.speed} ${windUnit}</div>
            </div>
            <div class="weather-updated">Updated: ${new Date().toLocaleTimeString()}</div>
        `;
    }

    // Display error message
    function displayWeatherError(message) {
        const weatherBody = weatherContainer.querySelector('.weather-body');
        weatherBody.innerHTML = `
            <div class="weather-error">
                <p>${message}</p>
                <button class="retry-weather-btn">Retry</button>
            </div>
        `;

        weatherBody.querySelector('.retry-weather-btn').addEventListener('click', async () => {
            const settings = await loadWeatherSettings();
            fetchWeatherData(settings.city, settings.units);
        });
    }

    // Show weather settings popup
    async function showWeatherSettings() {
        const settings = await loadWeatherSettings();

        const popup = document.createElement('div');
        popup.className = 'popup weather-settings-popup';

        popup.innerHTML = `
            <h3>Weather Settings</h3>
            <div class="settings-group">
                <label for="city-input">City:</label>
                <input type="text" id="city-input" value="${settings.city}" placeholder="Enter city name">
            </div>
            <div class="settings-group">
                <label>Temperature Unit:</label>
                <div class="radio-group">
                    <label>
                        <input type="radio" name="temp-unit" value="metric" ${settings.units === 'metric' ? 'checked' : ''}>
                        Celsius (°C)
                    </label>
                    <label>
                        <input type="radio" name="temp-unit" value="imperial" ${settings.units === 'imperial' ? 'checked' : ''}>
                        Fahrenheit (°F)
                    </label>
                </div>
            </div>
            <div class="popup-buttons">
                <button id="save-weather-settings">Save</button>
                <button id="cancel-weather-settings">Cancel</button>
            </div>
        `;

        document.body.appendChild(popup);

        // Add event listeners
        document.getElementById('save-weather-settings').addEventListener('click', saveSettings);
        document.getElementById('cancel-weather-settings').addEventListener('click', () => popup.remove());

        // Save settings
        async function saveSettings() {
            const cityInput = document.getElementById('city-input');
            const unitInputs = document.querySelectorAll('input[name="temp-unit"]');
            const selectedUnit = Array.from(unitInputs).find(input => input.checked).value;

            const newCity = cityInput.value.trim();

            if (!newCity) {
                alert('Please enter a city name');
                return;
            }

            // Verify city exists by making an API call
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(newCity)}&appid=${API_KEY}`
                );

                if (!response.ok) {
                    throw new Error(`City not found: ${response.status}`);
                }

                const data = await response.json();
                const cityName = data.name; // Use the official name from API

                // Save settings
                const settings = await loadWeatherSettings();
                settings.city = cityName;
                settings.units = selectedUnit;

                await saveWeatherSettings(settings);
                fetchWeatherData(settings.city, settings.units);

                popup.remove();
            } catch (error) {
                console.error('Error verifying city:', error);
                alert('Could not find this city. Please check the spelling and try again.');
            }
        }
    }

    // Set up auto-refresh (every 30 minutes)
    function setupAutoRefresh() {
        setInterval(async () => {
            const settings = await loadWeatherSettings();
            fetchWeatherData(settings.city, settings.units);
        }, 30 * 60 * 1000); // 30 minutes
    }

    // Initialize the widget
    init();
    setupAutoRefresh();
} 


