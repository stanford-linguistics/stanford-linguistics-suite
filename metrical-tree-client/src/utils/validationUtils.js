/**
 * Validation utilities for Metrical Tree input
 * 
 * This module provides functions to validate user input before sending it to the backend.
 * Client-side validation improves user experience by providing immediate feedback
 * and reduces server load by catching common errors early.
 */

// Compatibility shims for existing code
/**
 * Format validation results into an array of message objects for display
 * 
 * @param {ValidationResult} validationResult The validation result to format
 * @returns {Array} Array of message objects with type, message and suggestion
 */
export const formatValidationMessages = (validationResult) => {
  if (!validationResult || !validationResult.messages) {
    return [];
  }
  
  return validationResult.messages.map(message => ({
    type: message.severity || 'error',
    message: message.message,
    suggestion: message.suggestion
  }));
};

/**
 * Validate raw text input (compatibility shim for existing code)
 * 
 * @param {string} text The text to validate
 * @param {boolean} override Whether to override warnings
 * @returns {ValidationResult} Validation result
 */
export const validateRawText = (text, override = false) => {
  const error = validateMetricalTreeText(text);
  
  // Format to match the expected structure in ComputeDialog.js
  return {
    isValid: !error || override,
    messages: error ? [
      {
        severity: 'error',
        message: error.message,
        suggestion: error.suggestion
      }
    ] : []
  };
};

/**
 * Validate metrical tree parameters (compatibility shim for existing code)
 * 
 * @param {Object} params The parameters to validate
 * @returns {ValidationResult} Validation result
 */
export const validateMetricalTreeParams = (params) => {
  const error = validateMetricalTreeOptions(params);
  
  // Format to match the expected structure in ComputeDialog.js
  return {
    isValid: !error,
    messages: error ? [
      {
        severity: 'error',
        message: error.message,
        suggestion: error.suggestion
      }
    ] : []
  };
};

/**
 * Error response format to match the server-side error structure
 */
class ValidationError {
  constructor(message, errorCode, suggestion, details = {}) {
    this.message = message;
    this.error_code = errorCode;
    this.category = 'input_validation';
    this.category_description = 'Input Validation Error';
    this.severity = 'error';
    this.suggestion = suggestion;
    this.details = details;
  }
  
  toErrorObject() {
    return {
      errorMessage: this.message,
      errorDetails: {
        message: this.message,
        error_code: this.error_code,
        category: this.category,
        category_description: this.category_description,
        severity: this.severity,
        suggestion: this.suggestion,
        details: this.details
      }
    };
  }
}

/**
 * Validate text input for metrical tree analysis
 * 
 * @param {string} text The text to validate
 * @returns {Object|null} ValidationError if validation fails, null if validation passes
 */
export const validateMetricalTreeText = (text) => {
  // Check if text is empty or only whitespace
  if (!text || text.trim().length === 0) {
    return new ValidationError(
      'Empty input text',
      'empty_input',
      'Please provide non-empty text for analysis'
    );
  }
  
  // Check if text is too short for meaningful analysis
  if (text.trim().length < 5) {
    return new ValidationError(
      'Input text too short',
      'invalid_value',
      'Please provide longer text for meaningful analysis (at least 5 characters)',
      { text_length: text.trim().length }
    );
  }
  
  // Check if text is too long for efficient processing
  // Assuming a reasonable limit, for example 100,000 characters
  if (text.length > 100000) {
    return new ValidationError(
      'Input text is too large',
      'input_too_large',
      'Please provide a shorter text (less than 100,000 characters) for optimal analysis',
      { text_length: text.length, max_length: 100000 }
    );
  }
  
  // Check for non-UTF8 characters that might cause processing issues
  // eslint-disable-next-line no-control-regex
  const nonTextRegex = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g;
  const nonTextMatches = text.match(nonTextRegex);
  if (nonTextMatches && nonTextMatches.length > 0) {
    return new ValidationError(
      'Input contains invalid characters',
      'invalid_format',
      'Please remove control characters and ensure text is properly encoded',
      { invalid_character_count: nonTextMatches.length }
    );
  }
  
  // All validation checks passed
  return null;
};

/**
 * Validate metrical tree configuration options
 * 
 * @param {Object} options Configuration options for metrical tree
 * @returns {Object|null} ValidationError if validation fails, null if validation passes
 */
export const validateMetricalTreeOptions = (options) => {
  const {
    unstressed_words,
    unstressed_tags,
    unstressed_deps,
    ambiguous_words,
    ambiguous_tags,
    ambiguous_deps,
    stressed_words
  } = options;
  
  // Check for valid array format in all array parameters
  if (unstressed_words && !Array.isArray(unstressed_words)) {
    return new ValidationError(
      'Unstressed words must be an array',
      'invalid_format',
      'Please provide unstressed words as an array of strings',
      { provided_type: typeof unstressed_words }
    );
  }
  
  if (unstressed_tags && !Array.isArray(unstressed_tags)) {
    return new ValidationError(
      'Unstressed tags must be an array',
      'invalid_format',
      'Please provide unstressed tags as an array of strings',
      { provided_type: typeof unstressed_tags }
    );
  }
  
  if (unstressed_deps && !Array.isArray(unstressed_deps)) {
    return new ValidationError(
      'Unstressed dependencies must be an array',
      'invalid_format',
      'Please provide unstressed dependencies as an array of strings',
      { provided_type: typeof unstressed_deps }
    );
  }
  
  if (ambiguous_words && !Array.isArray(ambiguous_words)) {
    return new ValidationError(
      'Ambiguous words must be an array',
      'invalid_format',
      'Please provide ambiguous words as an array of strings',
      { provided_type: typeof ambiguous_words }
    );
  }
  
  if (ambiguous_tags && !Array.isArray(ambiguous_tags)) {
    return new ValidationError(
      'Ambiguous tags must be an array',
      'invalid_format',
      'Please provide ambiguous tags as an array of strings',
      { provided_type: typeof ambiguous_tags }
    );
  }
  
  if (ambiguous_deps && !Array.isArray(ambiguous_deps)) {
    return new ValidationError(
      'Ambiguous dependencies must be an array',
      'invalid_format',
      'Please provide ambiguous dependencies as an array of strings',
      { provided_type: typeof ambiguous_deps }
    );
  }
  
  if (stressed_words && !Array.isArray(stressed_words)) {
    return new ValidationError(
      'Stressed words must be an array',
      'invalid_format',
      'Please provide stressed words as an array of strings',
      { provided_type: typeof stressed_words }
    );
  }
  
  // Check for potential problematic values in the arrays
  const allArrays = [
    { name: 'unstressed_words', value: unstressed_words },
    { name: 'unstressed_tags', value: unstressed_tags },
    { name: 'unstressed_deps', value: unstressed_deps },
    { name: 'ambiguous_words', value: ambiguous_words },
    { name: 'ambiguous_tags', value: ambiguous_tags },
    { name: 'ambiguous_deps', value: ambiguous_deps },
    { name: 'stressed_words', value: stressed_words }
  ];
  
  for (const arr of allArrays) {
    if (!arr.value) continue;
    
    // Check for empty strings in arrays
    const emptyStrings = arr.value.filter(item => typeof item === 'string' && item.trim() === '');
    if (emptyStrings.length > 0) {
      return new ValidationError(
        `Empty strings found in ${arr.name}`,
        'invalid_value',
        `Please remove empty strings from ${arr.name}`,
        { array_name: arr.name, empty_count: emptyStrings.length }
      );
    }
    
    // Check for non-string values in arrays
    const nonStrings = arr.value.filter(item => typeof item !== 'string');
    if (nonStrings.length > 0) {
      return new ValidationError(
        `Non-string values found in ${arr.name}`,
        'invalid_value',
        `Please ensure all items in ${arr.name} are strings`,
        { array_name: arr.name, non_string_count: nonStrings.length }
      );
    }
  }
  
  // All validation checks passed
  return null;
};

/**
 * Validate the entire metrical tree input (text and options)
 * 
 * @param {string} text Input text for analysis
 * @param {Object} options Configuration options
 * @returns {Object|null} ValidationError if validation fails, null if validation passes
 */
export const validateMetricalTreeInput = (text, options = {}) => {
  // First validate the text
  const textError = validateMetricalTreeText(text);
  if (textError) {
    return textError;
  }
  
  // Then validate the options
  const optionsError = validateMetricalTreeOptions(options);
  if (optionsError) {
    return optionsError;
  }
  
  // All validation passed
  return null;
};
