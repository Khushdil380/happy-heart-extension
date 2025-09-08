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


const API_KEY = 'd0402b7da2bb75f2e026a753e4d8e745';

export async function fetchWeatherData(city, units = 'metric') {
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=${units}`;
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch weather data:", error);
        throw error; // Re-throw the error so the caller can handle it
    }
}