/**
 * INPUT VALIDATION UTILITIES
 * Comprehensive input validation and sanitization
 */

/**
 * Validation result class
 */
class ValidationResult {
  constructor(isValid, errors = [], sanitizedValue = null) {
    this.isValid = isValid;
    this.errors = errors;
    this.sanitizedValue = sanitizedValue;
  }

  addError(error) {
    this.errors.push(error);
    this.isValid = false;
  }

  getFirstError() {
    return this.errors.length > 0 ? this.errors[0] : null;
  }

  getAllErrors() {
    return this.errors;
  }
}

/**
 * Input sanitization utilities
 */
class Sanitizer {
  /**
   * Sanitize HTML content
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  static sanitizeHTML(input) {
    if (typeof input !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Sanitize URL
   * @param {string} url - URL string
   * @returns {string} Sanitized URL
   */
  static sanitizeURL(url) {
    if (typeof url !== 'string') return '';
    
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
        return urlObj.toString();
      }
    } catch (error) {
      // Invalid URL
    }
    
    return '';
  }

  /**
   * Sanitize text input
   * @param {string} input - Input string
   * @param {number} maxLength - Maximum length
   * @returns {string} Sanitized string
   */
  static sanitizeText(input, maxLength = 1000) {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .slice(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }

  /**
   * Sanitize filename
   * @param {string} filename - Filename
   * @returns {string} Sanitized filename
   */
  static sanitizeFilename(filename) {
    if (typeof filename !== 'string') return '';
    
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, '_') // Replace invalid characters
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .slice(0, 255); // Limit length
  }
}

/**
 * Validation utilities
 */
class Validator {
  /**
   * Validate email address
   * @param {string} email - Email address
   * @returns {ValidationResult} Validation result
   */
  static validateEmail(email) {
    const result = new ValidationResult(true);
    
    if (!email || typeof email !== 'string') {
      result.addError('Email is required');
      return result;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      result.addError('Invalid email format');
    }

    if (email.length > 254) {
      result.addError('Email is too long');
    }

    result.sanitizedValue = email.trim().toLowerCase();
    return result;
  }

  /**
   * Validate URL
   * @param {string} url - URL string
   * @param {boolean} requireProtocol - Whether protocol is required
   * @returns {ValidationResult} Validation result
   */
  static validateURL(url, requireProtocol = true) {
    const result = new ValidationResult(true);
    
    if (!url || typeof url !== 'string') {
      result.addError('URL is required');
      return result;
    }

    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length === 0) {
      result.addError('URL cannot be empty');
      return result;
    }

    try {
      let urlToValidate = trimmedUrl;
      
      // Add protocol if missing and not required
      if (!requireProtocol && !trimmedUrl.match(/^https?:\/\//)) {
        urlToValidate = `https://${trimmedUrl}`;
      }
      
      const urlObj = new URL(urlToValidate);
      
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        result.addError('URL must use HTTP or HTTPS protocol');
      }
      
      if (urlObj.hostname.length === 0) {
        result.addError('URL must have a valid hostname');
      }
      
      result.sanitizedValue = urlObj.toString();
    } catch (error) {
      result.addError('Invalid URL format');
    }

    return result;
  }

  /**
   * Validate text input
   * @param {string} text - Text input
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateText(text, options = {}) {
    const {
      required = false,
      minLength = 0,
      maxLength = 1000,
      allowEmpty = true,
      pattern = null,
      customValidator = null
    } = options;

    const result = new ValidationResult(true);
    
    if (required && (!text || text.trim().length === 0)) {
      result.addError('This field is required');
      return result;
    }

    if (!text || typeof text !== 'string') {
      if (allowEmpty) {
        result.sanitizedValue = '';
        return result;
      } else {
        result.addError('Invalid input');
        return result;
      }
    }

    const trimmedText = text.trim();
    
    if (trimmedText.length < minLength) {
      result.addError(`Text must be at least ${minLength} characters long`);
    }
    
    if (trimmedText.length > maxLength) {
      result.addError(`Text must be no more than ${maxLength} characters long`);
    }
    
    if (pattern && !pattern.test(trimmedText)) {
      result.addError('Text format is invalid');
    }
    
    if (customValidator && typeof customValidator === 'function') {
      const customResult = customValidator(trimmedText);
      if (customResult !== true) {
        result.addError(customResult || 'Custom validation failed');
      }
    }

    result.sanitizedValue = Sanitizer.sanitizeText(trimmedText, maxLength);
    return result;
  }

  /**
   * Validate number input
   * @param {any} value - Input value
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateNumber(value, options = {}) {
    const {
      required = false,
      min = null,
      max = null,
      integer = false,
      positive = false
    } = options;

    const result = new ValidationResult(true);
    
    if (required && (value === null || value === undefined || value === '')) {
      result.addError('This field is required');
      return result;
    }

    if (value === null || value === undefined || value === '') {
      result.sanitizedValue = null;
      return result;
    }

    const numValue = Number(value);
    
    if (isNaN(numValue)) {
      result.addError('Must be a valid number');
      return result;
    }
    
    if (integer && !Number.isInteger(numValue)) {
      result.addError('Must be an integer');
    }
    
    if (positive && numValue <= 0) {
      result.addError('Must be a positive number');
    }
    
    if (min !== null && numValue < min) {
      result.addError(`Must be at least ${min}`);
    }
    
    if (max !== null && numValue > max) {
      result.addError(`Must be no more than ${max}`);
    }

    result.sanitizedValue = numValue;
    return result;
  }

  /**
   * Validate file input
   * @param {File} file - File object
   * @param {Object} options - Validation options
   * @returns {ValidationResult} Validation result
   */
  static validateFile(file, options = {}) {
    const {
      required = false,
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = [],
      allowedExtensions = []
    } = options;

    const result = new ValidationResult(true);
    
    if (required && !file) {
      result.addError('File is required');
      return result;
    }

    if (!file) {
      result.sanitizedValue = null;
      return result;
    }

    if (file.size > maxSize) {
      result.addError(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
    }
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      result.addError(`File type must be one of: ${allowedTypes.join(', ')}`);
    }
    
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        result.addError(`File extension must be one of: ${allowedExtensions.join(', ')}`);
      }
    }

    result.sanitizedValue = file;
    return result;
  }

  /**
   * Validate website data
   * @param {Object} website - Website object
   * @returns {ValidationResult} Validation result
   */
  static validateWebsite(website) {
    const result = new ValidationResult(true);
    
    if (!website || typeof website !== 'object') {
      result.addError('Website data is required');
      return result;
    }

    // Validate title
    const titleResult = this.validateText(website.title, {
      required: true,
      minLength: 1,
      maxLength: 100
    });
    if (!titleResult.isValid) {
      result.errors.push(...titleResult.errors.map(e => `Title: ${e}`));
    }

    // Validate URL
    const urlResult = this.validateURL(website.url, false);
    if (!urlResult.isValid) {
      result.errors.push(...urlResult.errors.map(e => `URL: ${e}`));
    }

    // Validate icon (optional)
    if (website.icon) {
      const iconResult = this.validateURL(website.icon);
      if (!iconResult.isValid) {
        result.errors.push(...iconResult.errors.map(e => `Icon: ${e}`));
      }
    }

    result.isValid = result.errors.length === 0;
    result.sanitizedValue = {
      title: titleResult.sanitizedValue,
      url: urlResult.sanitizedValue,
      icon: website.icon ? this.validateURL(website.icon).sanitizedValue : null
    };

    return result;
  }
}

/**
 * Form validation helper
 */
class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.rules = new Map();
    this.errors = new Map();
  }

  /**
   * Add validation rule for a field
   * @param {string} fieldName - Field name
   * @param {Function} validator - Validation function
   * @param {string} errorMessage - Error message
   */
  addRule(fieldName, validator, errorMessage) {
    if (!this.rules.has(fieldName)) {
      this.rules.set(fieldName, []);
    }
    this.rules.get(fieldName).push({ validator, errorMessage });
  }

  /**
   * Validate all fields
   * @returns {boolean} True if all fields are valid
   */
  validate() {
    this.errors.clear();
    let isValid = true;

    for (const [fieldName, rules] of this.rules.entries()) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (!field) continue;

      const value = field.value;
      
      for (const rule of rules) {
        if (!rule.validator(value)) {
          this.errors.set(fieldName, rule.errorMessage);
          isValid = false;
          break;
        }
      }
    }

    return isValid;
  }

  /**
   * Get error for specific field
   * @param {string} fieldName - Field name
   * @returns {string|null} Error message
   */
  getError(fieldName) {
    return this.errors.get(fieldName) || null;
  }

  /**
   * Get all errors
   * @returns {Map} All errors
   */
  getAllErrors() {
    return this.errors;
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors.clear();
  }
}

/**
 * Real-time validation helper
 */
class RealTimeValidator {
  constructor(inputElement, validator, options = {}) {
    this.input = inputElement;
    this.validator = validator;
    this.options = {
      debounceDelay: 300,
      showErrors: true,
      errorContainer: null,
      ...options
    };
    
    this.debouncedValidate = debounce(this.validate.bind(this), this.options.debounceDelay);
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.input.addEventListener('input', this.debouncedValidate);
    this.input.addEventListener('blur', this.validate.bind(this));
  }

  validate() {
    const result = this.validator(this.input.value);
    
    if (this.options.showErrors) {
      this.showValidationResult(result);
    }
    
    return result;
  }

  showValidationResult(result) {
    const errorContainer = this.options.errorContainer || 
      this.input.parentNode.querySelector('.error-message') ||
      this.createErrorContainer();
    
    if (result.isValid) {
      errorContainer.textContent = '';
      errorContainer.style.display = 'none';
      this.input.classList.remove('error');
    } else {
      errorContainer.textContent = result.getFirstError();
      errorContainer.style.display = 'block';
      this.input.classList.add('error');
    }
  }

  createErrorContainer() {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#ff6b6b';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    errorDiv.style.display = 'none';
    
    this.input.parentNode.appendChild(errorDiv);
    return errorDiv;
  }

  destroy() {
    this.input.removeEventListener('input', this.debouncedValidate);
    this.input.removeEventListener('blur', this.validate.bind(this));
  }
}

// Import debounce from performance utils
import { debounce } from './performance.js';

export { ValidationResult, Sanitizer, Validator, FormValidator, RealTimeValidator };
