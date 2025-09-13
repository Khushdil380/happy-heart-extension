/**
 * STORAGE UTILITY
 * Handles Chrome extension storage with caching and error handling
 */

class StorageManager {
  constructor() {
    this.cache = new Map();
    this.isAvailable = this.checkAvailability();
  }

  checkAvailability() {
    return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  }

  async get(key, defaultValue = null) {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      return this.cache.get(key) || defaultValue;
    }

    try {
      // Check cache first
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      // Get from Chrome storage
      const result = await chrome.storage.local.get([key]);
      const value = result[key] !== undefined ? result[key] : defaultValue;
      
      // Cache the result
      this.cache.set(key, value);
      
      return value;
    } catch (error) {
      console.error('Error getting from storage:', error);
      return defaultValue;
    }
  }

  async set(key, value) {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      this.cache.set(key, value);
      return;
    }

    try {
      // Update cache
      this.cache.set(key, value);
      
      // Save to Chrome storage
      await chrome.storage.local.set({ [key]: value });
      
      // Emit change event
      this.emit('storage:changed', { key, value });
      
    } catch (error) {
      console.error('Error setting storage:', error);
      throw error;
    }
  }

  async remove(key) {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      this.cache.delete(key);
      return;
    }

    try {
      // Remove from cache
      this.cache.delete(key);
      
      // Remove from Chrome storage
      await chrome.storage.local.remove([key]);
      
      // Emit change event
      this.emit('storage:changed', { key, value: null });
      
    } catch (error) {
      console.error('Error removing from storage:', error);
      throw error;
    }
  }

  async clear() {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      this.cache.clear();
      return;
    }

    try {
      // Clear cache
      this.cache.clear();
      
      // Clear Chrome storage
      await chrome.storage.local.clear();
      
      // Emit change event
      this.emit('storage:changed', { key: null, value: null });
      
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }

  async getAll() {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      return Object.fromEntries(this.cache);
    }

    try {
      const result = await chrome.storage.local.get(null);
      
      // Update cache
      Object.entries(result).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      
      return result;
    } catch (error) {
      console.error('Error getting all from storage:', error);
      return Object.fromEntries(this.cache);
    }
  }

  // Batch operations
  async setMultiple(items) {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      Object.entries(items).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      return;
    }

    try {
      // Update cache
      Object.entries(items).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      
      // Save to Chrome storage
      await chrome.storage.local.set(items);
      
      // Emit change event
      this.emit('storage:changed', { key: null, value: items });
      
    } catch (error) {
      console.error('Error setting multiple items:', error);
      throw error;
    }
  }

  async getMultiple(keys) {
    if (!this.isAvailable) {
      console.warn('Chrome storage not available, using cache');
      const result = {};
      keys.forEach(key => {
        result[key] = this.cache.get(key);
      });
      return result;
    }

    try {
      const result = await chrome.storage.local.get(keys);
      
      // Update cache
      Object.entries(result).forEach(([key, value]) => {
        this.cache.set(key, value);
      });
      
      return result;
    } catch (error) {
      console.error('Error getting multiple items:', error);
      const result = {};
      keys.forEach(key => {
        result[key] = this.cache.get(key);
      });
      return result;
    }
  }

  // Event emitter functionality
  emit(event, data) {
    const customEvent = new CustomEvent(event, { detail: data });
    document.dispatchEvent(customEvent);
  }

  // Storage change listener
  setupChangeListener() {
    if (!this.isAvailable) return;

    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local') {
        Object.entries(changes).forEach(([key, change]) => {
          // Update cache
          if (change.newValue !== undefined) {
            this.cache.set(key, change.newValue);
          } else {
            this.cache.delete(key);
          }
          
          // Emit change event
          this.emit('storage:changed', { 
            key, 
            value: change.newValue,
            oldValue: change.oldValue
          });
        });
      }
    });
  }

  // Utility methods
  has(key) {
    return this.cache.has(key);
  }

  size() {
    return this.cache.size;
  }

  keys() {
    return Array.from(this.cache.keys());
  }

  values() {
    return Array.from(this.cache.values());
  }

  entries() {
    return Array.from(this.cache.entries());
  }
}

// Create global instance
const storageManager = new StorageManager();

// Setup change listener
storageManager.setupChangeListener();

// Export functions for backward compatibility
export const getStoredData = (key, defaultValue = null) => storageManager.get(key, defaultValue);
export const setStoredData = (key, value) => storageManager.set(key, value);
export const removeStoredData = (key) => storageManager.remove(key);

// Export the manager instance
export { storageManager };
export default storageManager;