/**
 * WEATHER WIDGET
 * Manages weather data with city selection and local storage
 */

import { popupManager } from '../../../../components/Popup/popup-manager.js';
import { fetchWeatherData } from '../../../../src/utils/api.js';
import { Validator } from '../../../../src/utils/validation.js';

class WeatherWidget {
  constructor() {
    this.currentCity = 'London';
    this.apiKey = null; // Will be set from environment or user input
    this.weatherData = null;
    this.lastUpdate = null;
    this.updateInterval = 10 * 60 * 1000; // 10 minutes
    this.isInitialized = false;
    this.autoRefreshTimer = null; // Store timer reference for cleanup
    this.eventListeners = new Map(); // Track event listeners for cleanup
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      // Load saved city and weather data
      await this.loadStoredData();
      
      // Setup event listeners with a small delay to ensure DOM is ready
      setTimeout(() => {
        this.setupEventListeners();
      }, 100);
      
      // Fetch initial weather data
      await this.fetchWeatherData();
      
      // Set up auto-refresh
      this.setupAutoRefresh();
      
      this.isInitialized = true;
      console.log('✅ Weather Widget initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Weather Widget:', error);
    }
  }

  async loadStoredData() {
    try {
      // Load saved city
      const savedCity = await this.getStoredData('weather_city');
      if (savedCity) {
        this.currentCity = savedCity;
      }

      // Load cached weather data
      const cachedData = await this.getStoredData('weather_data');
      const lastUpdate = await this.getStoredData('weather_last_update');
      
      if (cachedData && lastUpdate) {
        const timeDiff = Date.now() - lastUpdate;
        // Use cached data if it's less than 10 minutes old
        if (timeDiff < this.updateInterval) {
          this.weatherData = cachedData;
          this.lastUpdate = lastUpdate;
          this.updateDisplay();
        }
      }
    } catch (error) {
      console.error('Error loading stored weather data:', error);
    }
  }

  setupEventListeners() {
    const refreshBtn = document.getElementById('weather-refresh-btn');
    const settingsBtn = document.getElementById('weather-settings-btn');
    const weatherWidget = document.getElementById('weather-widget');

    // Use event delegation on the weather widget container
    if (weatherWidget) {
      weatherWidget.addEventListener('click', (e) => {
        if (e.target.id === 'weather-refresh-btn' || e.target.closest('#weather-refresh-btn')) {
          e.preventDefault();
          e.stopPropagation();
          
          // Add visual feedback
          const btn = e.target.id === 'weather-refresh-btn' ? e.target : e.target.closest('#weather-refresh-btn');
          if (btn) {
            btn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
              btn.style.transform = '';
            }, 500);
          }
          
          this.fetchWeatherData();
        }
        
        if (e.target.id === 'weather-settings-btn' || e.target.closest('#weather-settings-btn')) {
          e.preventDefault();
          e.stopPropagation();
          this.showCitySettings();
        }
      });
    }

    // Also add direct listeners as backup
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Add visual feedback
        refreshBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
          refreshBtn.style.transform = '';
        }, 500);
        this.fetchWeatherData();
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showCitySettings();
      });
    }
  }

  setupAutoRefresh() {
    // Clear existing timer if any
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
    }
    
    // Auto-refresh every 10 minutes
    this.autoRefreshTimer = setInterval(() => {
      if (this.isInitialized) {
        this.fetchWeatherData();
      }
    }, this.updateInterval);
  }

  async fetchWeatherData() {
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const location = document.getElementById('location');
    const description = document.getElementById('weather-description');
    const loading = document.getElementById('weather-loading');

    if (!weatherIcon || !temperature || !location || !description || !loading) return;

    try {
      // Show loading state
      this.showLoading(true);

      // Validate city name
      const cityValidation = Validator.validateText(this.currentCity, {
        required: true,
        minLength: 1,
        maxLength: 100
      });

      if (!cityValidation.isValid) {
        throw new Error(cityValidation.getFirstError());
      }

      // Fetch weather data using the new API utility
      const weatherData = await fetchWeatherData(cityValidation.sanitizedValue, 'metric');
      
      // Transform API response to our format
      this.weatherData = {
        temperature: Math.round(weatherData.main.temp),
        description: weatherData.weather[0].description,
        icon: this.getWeatherIcon(weatherData.weather[0].main),
        city: weatherData.name,
        humidity: weatherData.main.humidity,
        windSpeed: weatherData.wind.speed,
        feelsLike: Math.round(weatherData.main.feels_like)
      };
      
      this.lastUpdate = Date.now();

      // Update display
      this.updateDisplay();

      // Save to storage
      await this.setStoredData('weather_data', this.weatherData);
      await this.setStoredData('weather_last_update', this.lastUpdate);

    } catch (error) {
      console.error('Error fetching weather data:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  getMockWeatherData() {
    const mockTemps = [15, 18, 22, 25, 28, 20, 16, 12, 8, 14];
    const mockDescriptions = ['clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'shower rain', 'rain', 'thunderstorm', 'snow', 'mist', 'overcast clouds'];
    const mockIcons = ['☀️', '🌤️', '⛅', '☁️', '🌦️', '🌧️', '⛈️', '❄️', '🌫️', '☁️'];

    const tempIndex = Math.floor(Math.random() * mockTemps.length);
    
    return {
      temperature: mockTemps[tempIndex],
      description: mockDescriptions[tempIndex],
      icon: mockIcons[tempIndex],
      city: this.currentCity,
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 15) + 5,
      feelsLike: mockTemps[tempIndex] + Math.floor(Math.random() * 4) - 2
    };
  }

  updateDisplay() {
    if (!this.weatherData) return;

    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const location = document.getElementById('location');
    const description = document.getElementById('weather-description');

    if (weatherIcon) weatherIcon.textContent = this.weatherData.icon;
    if (temperature) temperature.textContent = `${Math.round(this.weatherData.temperature)}°C`;
    if (location) location.textContent = this.weatherData.city;
    if (description) description.textContent = this.weatherData.description;
  }

  showLoading(show) {
    const loading = document.getElementById('weather-loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  showError(errorMessage = 'Unable to fetch data') {
    const weatherIcon = document.getElementById('weather-icon');
    const temperature = document.getElementById('temperature');
    const location = document.getElementById('location');
    const description = document.getElementById('weather-description');

    if (weatherIcon) weatherIcon.textContent = '❌';
    if (temperature) temperature.textContent = '--°C';
    if (location) location.textContent = 'Error';
    if (description) description.textContent = errorMessage;
  }

  getWeatherIcon(weatherMain) {
    const iconMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️',
      'Fog': '🌫️',
      'Haze': '🌫️'
    };
    return iconMap[weatherMain] || '🌤️';
  }

  showCitySettings() {
    const content = `
      <div class="weather-settings">
        <h3>Weather Settings</h3>
        <div class="form-group">
          <label for="city-input">City Name:</label>
          <input type="text" id="city-input" class="glass-input" 
                 placeholder="Enter city name" value="${this.currentCity}">
        </div>
        <div class="weather-info-display">
          <p><strong>Current City:</strong> ${this.currentCity}</p>
          <p><strong>Last Update:</strong> ${this.lastUpdate ? new Date(this.lastUpdate).toLocaleTimeString() : 'Never'}</p>
          <p><strong>Auto-refresh:</strong> Every 10 minutes</p>
        </div>
        <div class="form-actions">
          <button id="save-city-btn" class="glass-button">Save City</button>
          <button id="cancel-city-btn" class="glass-button secondary">Cancel</button>
        </div>
      </div>
    `;
    
    try {
      if (popupManager && typeof popupManager.openPopup === 'function') {
        popupManager.openPopup('Weather Settings', content, {
          width: 400,
          height: 350
        });

        // Setup event listeners for the popup
        setTimeout(() => {
          this.setupCitySettingsListeners();
        }, 100);
      } else {
        // Fallback: use a simple alert for now
        const newCity = prompt(`Enter new city (current: ${this.currentCity}):`, this.currentCity);
        if (newCity && newCity.trim() && newCity !== this.currentCity) {
          this.currentCity = newCity.trim();
          this.setStoredData('weather_city', this.currentCity);
          this.fetchWeatherData();
        }
      }
    } catch (error) {
      console.error('❌ Error opening popup:', error);
      // Fallback: use a simple alert
      const newCity = prompt(`Enter new city (current: ${this.currentCity}):`, this.currentCity);
      if (newCity && newCity.trim() && newCity !== this.currentCity) {
        this.currentCity = newCity.trim();
        this.setStoredData('weather_city', this.currentCity);
        this.fetchWeatherData();
      }
    }
  }

  setupCitySettingsListeners() {
    const saveBtn = document.getElementById('save-city-btn');
    const cancelBtn = document.getElementById('cancel-city-btn');
    const cityInput = document.getElementById('city-input');

    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const newCity = cityInput.value.trim();
        if (newCity && newCity !== this.currentCity) {
          this.currentCity = newCity;
          await this.setStoredData('weather_city', this.currentCity);
          await this.fetchWeatherData();
        }
        popupManager.closePopup();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        popupManager.closePopup();
      });
    }

    if (cityInput) {
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          saveBtn.click();
        }
      });
    }
  }

  // Storage helper methods
  async getStoredData(key) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] || null);
        });
      } else {
        resolve(localStorage.getItem(key));
      }
    });
  }

  async setStoredData(key, value) {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  }

  // Cleanup method to prevent memory leaks
  cleanup() {
    // Clear auto-refresh timer
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }

    // Remove event listeners
    this.eventListeners.forEach((listener, element) => {
      if (element && typeof element.removeEventListener === 'function') {
        element.removeEventListener(listener.event, listener.handler);
      }
    });
    this.eventListeners.clear();

    this.isInitialized = false;
    console.log('🧹 Weather Widget cleaned up');
  }
}

export { WeatherWidget };
