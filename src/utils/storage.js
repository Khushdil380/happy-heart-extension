// src/utils/storage.js

/**
 * Retrieves data from Chrome's local storage.
 * @param {string} key The key of the item to retrieve.
 * @param {any} defaultValue The value to return if the key is not found.
 * @returns {Promise<any>} A promise that resolves with the stored value or defaultValue.
 */
export async function getStoredData(key, defaultValue = null) {
    return new Promise((resolve) => {
        chrome.storage.local.get([key], (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error retrieving storage data:", chrome.runtime.lastError.message);
                resolve(defaultValue);
            } else {
                resolve(result[key] !== undefined ? result[key] : defaultValue);
            }
        });
    });
}

/**
 * Saves data to Chrome's local storage.
 * @param {string} key The key under which to store the item.
 * @param {any} value The value to store.
 * @returns {Promise<void>} A promise that resolves when the data is saved.
 */
export async function setStoredData(key, value) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving storage data:", chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

/**
 * Removes data from Chrome's local storage.
 * @param {string | string[]} keys The key(s) of the item(s) to remove.
 * @returns {Promise<void>} A promise that resolves when the data is removed.
 */
export async function removeStoredData(keys) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.remove(keys, () => {
            if (chrome.runtime.lastError) {
                console.error("Error removing storage data:", chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}