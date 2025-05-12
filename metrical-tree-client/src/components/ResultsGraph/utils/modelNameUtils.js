/**
 * Utility functions for working with model names in the ResultsGraph component
 */

/**
 * Checks if a model is a normalized model based on its name or label
 * @param {Object} model - The model object
 * @returns {boolean} True if the model is normalized
 */
export const isNormalizedModel = (model) => {
  if (!model) return false;
  
  // Check model label
  const modelLabel = model.label || '';
  if (modelLabel.toLowerCase().includes('norm')) {
    return true;
  }
  
  // Check model value label
  if (model.value && Array.isArray(model.value) && model.value.length > 0) {
    const firstSeriesLabel = model.value[0].label || '';
    if (firstSeriesLabel.toLowerCase().includes('norm')) {
      return true;
    }
  }
  
  return false;
};

/**
 * Gets the appropriate y-axis ID for a dataset based on its type
 * @param {string} datasetType - The type of dataset ('bar' or 'line')
 * @param {boolean} isNormalized - Whether the model is normalized
 * @returns {string} The y-axis ID to use
 */
export const getYAxisID = (datasetType, isNormalized) => {
  // For all line charts (contour lines):
  // - Always use the right y-axis (y2) for better visualization
  // - This ensures consistent scaling for stress contour values (0-5.5)
  if (datasetType === 'line') {
    return 'y2';
  }
  
  // Bar charts always use the primary y-axis
  return 'y';
};
