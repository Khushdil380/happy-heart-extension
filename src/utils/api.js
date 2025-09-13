// src/utils/api.js

// This file will contain functions for making API requests,
// e.g., for weather data, currency conversion, etc.
// We will add specific functions here when we implement
// Part 7 (Weather) and other features that need external data.

// Example structure (will be implemented later):
/*
export async function fetchWeatherData(city) {
    // Implement API call to a weather service
    // e.g., const response = await fetch(`https://api.weatherapi.com/v1/current.json?key=YOUR_API_KEY&q=${city}`);
    // const data = await response.json();
    // return data;
}
*/


// Configuration for API keys - should be moved to environment variables in production
const API_CONFIG = {
    WEATHER_API_KEY: 'd0402b7da2bb75f2e026a753e4d8e745', // Replace with actual API key from environment
    WEATHER_API_URL: 'https://api.openweathermap.org/data/2.5/weather'
};

/**
 * Fetch weather data from OpenWeatherMap API
 * @param {string} city - City name
 * @param {string} units - Temperature units (metric, imperial, kelvin)
 * @returns {Promise<Object>} Weather data
 */
export async function fetchWeatherData(city, units = 'metric') {
    // Input validation
    if (!city || typeof city !== 'string' || city.trim().length === 0) {
        throw new Error('City name is required and must be a non-empty string');
    }

    // For demo purposes, return mock data if API key is not configured
    if (API_CONFIG.WEATHER_API_KEY === 'demo') {
        console.warn('Using mock weather data - configure API key for real data');
        return getMockWeatherData(city, units);
    }

    try {
        const apiUrl = `${API_CONFIG.WEATHER_API_URL}?q=${encodeURIComponent(city.trim())}&appid=${API_CONFIG.WEATHER_API_KEY}&units=${units}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Invalid API key');
            } else if (response.status === 404) {
                throw new Error('City not found');
            } else if (response.status === 429) {
                throw new Error('API rate limit exceeded');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch weather data:", error);
        throw error;
    }
}

/**
 * Generate mock weather data for demo purposes
 * @param {string} city - City name
 * @param {string} units - Temperature units
 * @returns {Object} Mock weather data
 */
function getMockWeatherData(city, units) {
    const mockTemps = [15, 18, 22, 25, 28, 20, 16, 12, 8, 14];
    const mockDescriptions = ['clear sky', 'few clouds', 'scattered clouds', 'broken clouds', 'shower rain', 'rain', 'thunderstorm', 'snow', 'mist', 'overcast clouds'];
    const mockIcons = ['☀️', '🌤️', '⛅', '☁️', '🌦️', '🌧️', '⛈️', '❄️', '🌫️', '☁️'];

    const tempIndex = Math.floor(Math.random() * mockTemps.length);
    const baseTemp = mockTemps[tempIndex];
    
    return {
        main: {
            temp: baseTemp,
            feels_like: baseTemp + Math.floor(Math.random() * 4) - 2,
            humidity: Math.floor(Math.random() * 40) + 40
        },
        weather: [{
            main: mockDescriptions[tempIndex],
            description: mockDescriptions[tempIndex],
            icon: mockIcons[tempIndex]
        }],
        name: city,
        wind: {
            speed: Math.floor(Math.random() * 15) + 5
        }
    };
}