/**
 * PERFORMANCE UTILITIES
 * Collection of performance optimization utilities
 */

/**
 * Debounce function to limit the rate of function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Execute immediately on first call
 * @returns {Function} Debounced function
 */
export function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit the rate of function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * DOM element cache to avoid repeated queries
 */
class DOMCache {
  constructor() {
    this.cache = new Map();
    this.observers = new Map();
  }

  /**
   * Get element with caching
   * @param {string} selector - CSS selector
   * @param {Element} context - Context element (default: document)
   * @returns {Element|null} Cached element
   */
  get(selector, context = document) {
    const key = `${selector}-${context === document ? 'doc' : context.id || 'unknown'}`;
    
    if (this.cache.has(key)) {
      const element = this.cache.get(key);
      // Check if element still exists in DOM
      if (element && document.contains(element)) {
        return element;
      } else {
        this.cache.delete(key);
      }
    }

    const element = context.querySelector(selector);
    if (element) {
      this.cache.set(key, element);
    }
    return element;
  }

  /**
   * Clear cache for specific selector or all
   * @param {string} selector - Optional selector to clear
   */
  clear(selector = null) {
    if (selector) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.startsWith(selector));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  /**
   * Set up mutation observer to auto-clear cache when DOM changes
   * @param {Element} target - Target element to observe
   */
  observe(target = document.body) {
    if (this.observers.has(target)) return;

    const observer = new MutationObserver(() => {
      this.clear();
    });

    observer.observe(target, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id', 'class']
    });

    this.observers.set(target, observer);
  }

  /**
   * Disconnect all observers and clear cache
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.cache.clear();
  }
}

// Global DOM cache instance
export const domCache = new DOMCache();

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }

  /**
   * Mark a performance point
   * @param {string} name - Mark name
   */
  mark(name) {
    if (performance && performance.mark) {
      performance.mark(name);
      this.marks.set(name, performance.now());
    }
  }

  /**
   * Measure performance between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    if (performance && performance.measure) {
      performance.measure(name, startMark, endMark);
      const startTime = this.marks.get(startMark);
      const endTime = this.marks.get(endMark);
      if (startTime && endTime) {
        this.measures.set(name, endTime - startTime);
      }
    }
  }

  /**
   * Get performance measure
   * @param {string} name - Measure name
   * @returns {number} Duration in milliseconds
   */
  getMeasure(name) {
    return this.measures.get(name) || 0;
  }

  /**
   * Clear all marks and measures
   */
  clear() {
    this.marks.clear();
    this.measures.clear();
    if (performance && performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance && performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Memory usage utilities
 */
export class MemoryMonitor {
  /**
   * Get current memory usage
   * @returns {Object} Memory usage information
   */
  static getMemoryUsage() {
    if (performance && performance.memory) {
      return {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  }

  /**
   * Check if memory usage is high
   * @param {number} threshold - Threshold percentage (default: 80)
   * @returns {boolean} True if memory usage is high
   */
  static isMemoryHigh(threshold = 80) {
    const memory = this.getMemoryUsage();
    return memory && memory.percentage > threshold;
  }

  /**
   * Log memory usage
   */
  static logMemoryUsage() {
    const memory = this.getMemoryUsage();
    if (memory) {
      console.log(`Memory Usage: ${(memory.used / 1024 / 1024).toFixed(2)}MB / ${(memory.limit / 1024 / 1024).toFixed(2)}MB (${memory.percentage.toFixed(1)}%)`);
    }
  }
}

/**
 * Event listener manager for proper cleanup
 */
export class EventManager {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Add event listener with automatic cleanup tracking
   * @param {Element} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {Object} options - Event options
   */
  add(element, event, handler, options = {}) {
    const key = `${element.id || 'unknown'}-${event}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push({ element, event, handler, options });
    element.addEventListener(event, handler, options);
  }

  /**
   * Remove specific event listener
   * @param {Element} element - Target element
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   */
  remove(element, event, handler) {
    const key = `${element.id || 'unknown'}-${event}`;
    const listeners = this.listeners.get(key);
    
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index !== -1) {
        const listener = listeners[index];
        element.removeEventListener(event, handler, listener.options);
        listeners.splice(index, 1);
        
        if (listeners.length === 0) {
          this.listeners.delete(key);
        }
      }
    }
  }

  /**
   * Remove all event listeners for an element
   * @param {Element} element - Target element
   */
  removeAll(element) {
    const elementId = element.id || 'unknown';
    
    for (const [key, listeners] of this.listeners.entries()) {
      if (key.startsWith(elementId)) {
        listeners.forEach(listener => {
          listener.element.removeEventListener(listener.event, listener.handler, listener.options);
        });
        this.listeners.delete(key);
      }
    }
  }

  /**
   * Remove all event listeners
   */
  clear() {
    for (const [key, listeners] of this.listeners.entries()) {
      listeners.forEach(listener => {
        listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      });
    }
    this.listeners.clear();
  }
}

// Global event manager instance
export const eventManager = new EventManager();

/**
 * Initialize performance monitoring
 */
export function initPerformanceMonitoring() {
  // Set up DOM cache observer
  domCache.observe();
  
  // Log memory usage periodically
  setInterval(() => {
    if (MemoryMonitor.isMemoryHigh(85)) {
      console.warn('High memory usage detected:', MemoryMonitor.getMemoryUsage());
    }
  }, 30000); // Check every 30 seconds
  
  console.log('🚀 Performance monitoring initialized');
}
