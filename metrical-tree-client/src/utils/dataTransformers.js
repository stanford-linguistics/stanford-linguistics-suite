/**
 * Utility functions for transforming metrical tree data for frontend display
 */

/**
 * Transform word data for display in the enhanced results table
 * @param {Array} words - Array of word objects from the API
 * @returns {Array} Transformed word data ready for display
 */
export const transformWordData = (words = []) => {
  return words.map((word, index) => ({
    ...word,
    // Ensure required properties exist with defaults
    widx: word.widx !== undefined ? word.widx : index,
    word: word.word || `item-${index}`,
    wordFrequency: Number(word.wordFrequency) || 0,
    prevWordFrequency: Number(word.prevWordFrequency) || 0,
    // Add other essential properties with defaults
    sidx: word.sidx !== undefined ? word.sidx : 0,
    pos: word.pos || '',
    lexstress: word.lexstress || '',
  }));
};

/**
 * Transform sentence data for display
 * @param {Object} sentences - Object of sentence data from the API
 * @returns {Array} Array of transformed sentence objects
 */
export const transformSentenceData = (sentences = {}) => {
  return Object.entries(sentences).map(([sidx, sentence]) => ({
    ...sentence,
    sidx: Number(sidx),
    contourMetrics_max: Number(sentence.contourMetrics_max) || 0,
    contourMetrics_min: Number(sentence.contourMetrics_min) || 0,
    contourMetrics_range: Number(sentence.contourMetrics_range) || 0,
    contourMetrics_mean: Number(sentence.contourMetrics_mean) || 0,
    contourMetrics_median: Number(sentence.contourMetrics_median) || 0,
    contourMetrics_stdDev: Number(sentence.contourMetrics_stdDev) || 0,
    // Parse contour values string into array
    contourValues: parseContourValues(sentence.contourValues)
  }));
};

/**
 * Parse contour values string into array
 * @param {string} contourValues - String representation of contour values array
 * @returns {Array} Array of numeric contour values
 */
const parseContourValues = (contourValues) => {
  try {
    if (typeof contourValues === 'string') {
      return JSON.parse(contourValues).map(Number);
    }
    return Array.isArray(contourValues) ? contourValues.map(Number) : [];
  } catch (error) {
    console.error('Error parsing contour values:', error);
    return [];
  }
};

/**
 * Transform analysis data for display
 * @param {Object} analysis - Analysis data from the API
 * @returns {Object} Transformed analysis data
 */
export const transformAnalysisData = (analysis = {}) => {
  const { wordFrequencies = {}, contourPatterns = {} } = analysis;
  
  return {
    wordFrequencies: transformWordFrequencies(wordFrequencies),
    contourPatterns: {
      ...contourPatterns,
      // Convert distribution percentages to numbers
      distribution: Object.entries(contourPatterns.distribution || {}).reduce(
        (acc, [pattern, value]) => ({
          ...acc,
          [pattern]: parsePercentage(value)
        }),
        {}
      ),
      // Ensure patterns object exists
      patterns: contourPatterns.patterns || {},
      // Ensure transitions object exists
      transitions: contourPatterns.transitions || {}
    }
  };
};

/**
 * Transform word frequencies for display
 * @param {Object} frequencies - Word frequency data
 * @returns {Object} Transformed frequency data
 */
const transformWordFrequencies = (frequencies = {}) => {
  return Object.entries(frequencies).reduce(
    (acc, [word, count]) => ({
      ...acc,
      [word]: Number(count) || 0
    }),
    {}
  );
};

/**
 * Parse percentage string to number
 * @param {string} percentage - Percentage string (e.g., "45.2%")
 * @returns {number} Percentage as decimal number
 */
const parsePercentage = (percentage) => {
  if (typeof percentage !== 'string') return 0;
  const match = percentage.match(/^(\d+(\.\d+)?)/);
  return match ? Number(match[1]) / 100 : 0;
};

/**
 * Transform complete metrical tree data
 * @param {Object} data - Complete data object from the API
 * @returns {Object} Transformed data ready for display
 */
export const transformMetricalTreeData = (data = {}) => {
  return {
    words: transformWordData(data.words),
    sentences: transformSentenceData(data.sentences),
    analysis: transformAnalysisData(data.analysis)
  };
};
