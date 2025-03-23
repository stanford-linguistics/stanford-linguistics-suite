/**
 * Data extraction and processing utilities for the ResultsGraph component
 */

/**
 * Extracts data points from the nested model structure
 * @param {Object} model - The data model
 * @returns {Array} The extracted data points
 */
export const extractDataFromModel = (model) => {

  // Special case: For the format from ResultPage.js
  // Where model is { label: 'metricName', value: [{ data: [...], label: 'metricName' }] }
  if (model?.value && Array.isArray(model.value) && model.value[0]?.data) {

    // DO NOT transform the data here - it needs to go through the normal pagination/chunking flow
    // Just return the raw data array
    return model.value[0].data;
  }
  
  // Case 0: Check for top-level data array (from your sample structure)
  if (model?.data && Array.isArray(model.data)) {
    return model.data;
  }
  
  if (!model?.value) {
    return [];
  }
  
  if (Array.isArray(model.value)) {
    // Case 1: model.value[0].data exists (like in the example provided)
    if (model.value[0] && Array.isArray(model.value[0].data)) {
      return model.value[0].data;
    }
    // Case 2: model.value is the data array directly

    return model.value;
  }
  
  return [];
};

/**
 * Builds a full sentence from the extracted data
 * @param {Array} extractedData - The extracted data points
 * @returns {string} The full sentence
 */
export const buildSentenceFromData = (extractedData) => {
  if (!extractedData || !extractedData.length) return '';
  
  // Case 1: For data with 'sent' field, use the first occurrence
  if (extractedData[0]?.sent) {
    return extractedData[0].sent;
  }
  
  // Case 2: Otherwise build from word sequence
  const words = extractedData
    .map(item => item.primary || item.word || '')
    .filter(Boolean);
  
  return words.join(' ');
};

/**
 * Gets current chunk of data based on pagination settings
 * @param {Array} data - The full data array
 * @param {number} currentPage - Current page index (0-based)
 * @param {number} chunkSize - Number of items per page
 * @param {boolean} needsChunking - Whether chunking is needed
 * @returns {Array} The current chunk of data
 */
export const getCurrentChunk = (data, currentPage, chunkSize, needsChunking) => {
  if (!needsChunking) {
    return data;
  }
  
  const start = currentPage * chunkSize;
  const end = Math.min((currentPage + 1) * chunkSize, data.length);
  
  return data.slice(start, end);
};

/**
 * Filters extracted data based on linguistic criteria
 * @param {Array} data - The data to filter
 * @param {string} posFilter - Part of speech filter
 * @param {string} stressFilter - Lexical stress filter
 * @param {string} syllableFilter - Syllable count filter
 * @param {Object} posCategories - Categories of POS tags
 * @returns {Array} The filtered data
 */
export const filterData = (data, posFilter, stressFilter, syllableFilter, posCategories) => {
  if (!data || !data.length) return [];
  
  return data.filter(item => {
    // Apply POS filter
    if (posFilter !== 'all') {
      const posCategory = Object.entries(posCategories).find(([_, tags]) => 
        tags.includes(item.pos)
      );
      
      if (posFilter === 'other') {
        // "Other" means POS tags not in any defined category
        if (posCategory) return false;
      } else if (posCategory) {
        if (posCategory[0] !== posFilter) return false;
      } else if (posFilter !== 'other') {
        return false;
      }
    }
    
    // Apply stress filter
    if (stressFilter !== 'all' && item.lexstress !== stressFilter) {
      return false;
    }
    
    // Apply syllable filter
    if (syllableFilter !== 'all') {
      const syllCount = parseInt(item.nsyll || '1', 10);
      
      if (syllableFilter === '1' && syllCount !== 1) return false;
      if (syllableFilter === '2' && syllCount !== 2) return false;
      if (syllableFilter === '3+' && syllCount < 3) return false;
    }
    
    return true;
  });
};

/**
 * Formats data for react-charts based on the current chunk and filters
 * @param {Object} model - The complete model
 * @param {Array} currentChunkData - The current chunk of data
 * @param {number} currentPage - Current page index (0-based)
 * @param {number} chunkSize - Number of items per page
 * @param {boolean} needsChunking - Whether chunking is needed
 * @param {Function} getItemColor - Function to get color for an item
 * @returns {Array} The formatted chart data
 */
export const formatChartData = (
  model, 
  currentChunkData, 
  currentPage, 
  chunkSize, 
  needsChunking,
  getItemColor
) => {
  if (!model) return [];
  
  // For Series data format (multiple lines)
  if (Array.isArray(model.value) && model.value.length > 1) {
    return model.value.map(series => {
      if (!needsChunking) return series;
      
      const start = currentPage * chunkSize;
      const end = Math.min((currentPage + 1) * chunkSize, series.data.length);
      
      return {
        ...series,
        data: series.data.slice(start, end).map(item => ({
          ...item,
          // Add color based on selected scheme
          color: getItemColor ? getItemColor(item) : undefined,
        }))
      };
    });
  }
  
  // Special case for ResultPage.js where data is mapped to primary/secondary fields
  if (model?.value && Array.isArray(model.value) && model.value[0]?.data) {

    // Apply pagination to ResultPage format
    return model.value.map(series => {
      let seriesData = series.data;
      
      // Apply chunking if needed
      if (needsChunking) {
        const start = currentPage * chunkSize;
        const end = Math.min((currentPage + 1) * chunkSize, seriesData.length);
        seriesData = seriesData.slice(start, end);
      }
      
      // Return formatted data with the proper chunk
      return {
        ...series,
        data: seriesData.map(item => ({
          ...item,
          // Map ResultPage.js data fields to correct fields if needed
          word: item.primary || item.word,
          m1: item.secondary || item.m1,
          // Add color based on selected scheme
          color: getItemColor ? getItemColor(item) : undefined,
        }))
      };
    });
  }
  
  // For data coming from model.data (new case), wrap it as a single series
  if (model.data && Array.isArray(model.data)) {
    return [{
      label: model.label || '',
      data: currentChunkData.map(item => ({
        ...item,
        // Add color based on selected scheme
        color: getItemColor ? getItemColor(item) : undefined,
      }))
    }];
  }
  
  // For single series, return the data wrapped as react-charts expects
  return [{
    label: model.label || '',
    data: currentChunkData.map(item => ({
      ...item,
      // Add color based on selected scheme
      color: getItemColor ? getItemColor(item) : undefined,
    }))
  }];
};
