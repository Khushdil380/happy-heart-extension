/**
 * ERROR HANDLING UTILITIES
 * Centralized error handling and user feedback system
 */

/**
 * Error types enumeration
 */
export const ErrorTypes = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  STORAGE: 'STORAGE',
  API: 'API',
  DOM: 'DOM',
  UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.UNKNOWN, severity = ErrorSeverity.MEDIUM, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.stack = this.stack || new Error().stack;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

/**
 * Error handler class
 */
export class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
    this.listeners = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize error handling
   */
  init() {
    if (this.isInitialized) return;

    // Set up global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    this.isInitialized = true;
    console.log('🛡️ Error handling initialized');
  }

  /**
   * Handle global JavaScript errors
   * @param {ErrorEvent} event - Error event
   */
  handleGlobalError(event) {
    const error = new AppError(
      event.message,
      ErrorTypes.DOM,
      ErrorSeverity.HIGH,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }
    );

    this.logError(error);
    this.notifyListeners('globalError', error);
  }

  /**
   * Handle unhandled promise rejections
   * @param {PromiseRejectionEvent} event - Promise rejection event
   */
  handleUnhandledRejection(event) {
    const error = new AppError(
      event.reason?.message || 'Unhandled promise rejection',
      ErrorTypes.UNKNOWN,
      ErrorSeverity.HIGH,
      {
        reason: event.reason,
        promise: event.promise
      }
    );

    this.logError(error);
    this.notifyListeners('unhandledRejection', error);
  }

  /**
   * Log an error
   * @param {Error|AppError} error - Error to log
   */
  logError(error) {
    const appError = error instanceof AppError ? error : new AppError(
      error.message,
      ErrorTypes.UNKNOWN,
      ErrorSeverity.MEDIUM,
      { originalError: error }
    );

    // Add to error log
    this.errorLog.push(appError);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift();
    }

    // Log to console based on severity
    this.logToConsole(appError);

    // Notify listeners
    this.notifyListeners('error', appError);
  }

  /**
   * Log error to console with appropriate level
   * @param {AppError} error - Error to log
   */
  logToConsole(error) {
    const logMessage = `[${error.type}] ${error.message}`;
    const logData = {
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp
    };

    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info(logMessage, logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn(logMessage, logData);
        break;
      case ErrorSeverity.HIGH:
        console.error(logMessage, logData);
        break;
      case ErrorSeverity.CRITICAL:
        console.error('🚨 CRITICAL ERROR:', logMessage, logData);
        break;
      default:
        console.error(logMessage, logData);
    }
  }

  /**
   * Create and log a network error
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @returns {AppError} Created error
   */
  createNetworkError(message, context = {}) {
    const error = new AppError(message, ErrorTypes.NETWORK, ErrorSeverity.MEDIUM, context);
    this.logError(error);
    return error;
  }

  /**
   * Create and log a validation error
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @returns {AppError} Created error
   */
  createValidationError(message, context = {}) {
    const error = new AppError(message, ErrorTypes.VALIDATION, ErrorSeverity.LOW, context);
    this.logError(error);
    return error;
  }

  /**
   * Create and log a storage error
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @returns {AppError} Created error
   */
  createStorageError(message, context = {}) {
    const error = new AppError(message, ErrorTypes.STORAGE, ErrorSeverity.MEDIUM, context);
    this.logError(error);
    return error;
  }

  /**
   * Create and log an API error
   * @param {string} message - Error message
   * @param {Object} context - Additional context
   * @returns {AppError} Created error
   */
  createAPIError(message, context = {}) {
    const error = new AppError(message, ErrorTypes.API, ErrorSeverity.MEDIUM, context);
    this.logError(error);
    return error;
  }

  /**
   * Add error listener
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove error listener
   * @param {string} event - Event type
   * @param {Function} callback - Callback function
   */
  removeListener(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index !== -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  /**
   * Notify listeners of an error
   * @param {string} event - Event type
   * @param {AppError} error - Error object
   */
  notifyListeners(event, error) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(error);
        } catch (listenerError) {
          console.error('Error in error listener:', listenerError);
        }
      });
    }
  }

  /**
   * Get error log
   * @param {number} limit - Maximum number of errors to return
   * @returns {AppError[]} Array of errors
   */
  getErrorLog(limit = null) {
    return limit ? this.errorLog.slice(-limit) : [...this.errorLog];
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      total: this.errorLog.length,
      byType: {},
      bySeverity: {},
      recent: this.errorLog.slice(-10)
    };

    this.errorLog.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  /**
   * Cleanup error handler
   */
  destroy() {
    window.removeEventListener('error', this.handleGlobalError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    this.listeners.clear();
    this.clearErrorLog();
    this.isInitialized = false;
  }
}

/**
 * User-friendly error messages
 */
export const ErrorMessages = {
  NETWORK: {
    CONNECTION_FAILED: 'Unable to connect to the server. Please check your internet connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    NOT_FOUND: 'The requested resource was not found.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    FORBIDDEN: 'Access to this resource is forbidden.',
    RATE_LIMITED: 'Too many requests. Please wait a moment and try again.'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_URL: 'Please enter a valid URL.',
    INVALID_NUMBER: 'Please enter a valid number.',
    TOO_SHORT: 'This field is too short.',
    TOO_LONG: 'This field is too long.',
    INVALID_FORMAT: 'Please enter the correct format.'
  },
  STORAGE: {
    SAVE_FAILED: 'Failed to save data. Please try again.',
    LOAD_FAILED: 'Failed to load data. Please refresh the page.',
    QUOTA_EXCEEDED: 'Storage quota exceeded. Please free up some space.',
    ACCESS_DENIED: 'Access to storage denied. Please check permissions.'
  },
  API: {
    INVALID_KEY: 'Invalid API key. Please check your configuration.',
    QUOTA_EXCEEDED: 'API quota exceeded. Please try again later.',
    SERVICE_UNAVAILABLE: 'Service is temporarily unavailable.',
    INVALID_RESPONSE: 'Received invalid response from server.'
  },
  DOM: {
    ELEMENT_NOT_FOUND: 'Required element not found on page.',
    INVALID_OPERATION: 'Invalid DOM operation attempted.',
    RENDER_FAILED: 'Failed to render component.'
  },
  UNKNOWN: {
    GENERIC: 'An unexpected error occurred. Please try again.',
    CONTACT_SUPPORT: 'An unexpected error occurred. Please contact support if the problem persists.'
  }
};

/**
 * Get user-friendly error message
 * @param {AppError} error - Error object
 * @returns {string} User-friendly message
 */
export function getUserFriendlyMessage(error) {
  const errorType = error.type || ErrorTypes.UNKNOWN;
  const errorMessages = ErrorMessages[errorType] || ErrorMessages.UNKNOWN;
  
  // Try to match specific error message
  for (const [key, message] of Object.entries(errorMessages)) {
    if (error.message.toLowerCase().includes(key.toLowerCase())) {
      return message;
    }
  }
  
  // Return generic message for the error type
  return errorMessages.GENERIC || errorMessages.CONTACT_SUPPORT;
}

/**
 * Show error notification to user
 * @param {AppError} error - Error object
 * @param {Object} options - Display options
 */
export function showErrorNotification(error, options = {}) {
  const {
    duration = 5000,
    showDetails = false,
    container = document.body
  } = options;

  const message = getUserFriendlyMessage(error);
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'error-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    max-width: 400px;
    font-family: var(--font-family, sans-serif);
    font-size: 14px;
    line-height: 1.4;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
  `;

  notification.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 12px;">
      <div style="font-size: 18px;">⚠️</div>
      <div style="flex: 1;">
        <div style="font-weight: 600; margin-bottom: 4px;">Error</div>
        <div>${message}</div>
        ${showDetails ? `<div style="font-size: 12px; margin-top: 8px; opacity: 0.8;">${error.message}</div>` : ''}
      </div>
      <button style="background: none; border: none; color: white; font-size: 18px; cursor: pointer; padding: 0; line-height: 1;">×</button>
    </div>
  `;

  // Add close functionality
  const closeBtn = notification.querySelector('button');
  closeBtn.addEventListener('click', () => {
    removeNotification();
  });

  // Add to DOM
  container.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(0)';
  });

  // Auto remove
  const autoRemoveTimer = setTimeout(removeNotification, duration);

  function removeNotification() {
    clearTimeout(autoRemoveTimer);
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Initialize error handling
errorHandler.init();

// Export convenience functions
export const handleError = (error, context = {}) => errorHandler.logError(error);
export const createError = (message, type, severity, context) => new AppError(message, type, severity, context);
