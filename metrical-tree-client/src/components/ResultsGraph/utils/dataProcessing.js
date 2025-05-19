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
 * Formats data for Chart.js based on the current chunk and color scheme
 * @param {Object} model - The complete model
 * @param {Array} currentChunkData - The current chunk of data
 * @param {number} currentPage - Current page index (0-based)
 * @param {number} chunkSize - Number of items per page
 * @param {boolean} needsChunking - Whether chunking is needed
 * @param {Function} getItemColor - Function to get color for an item
 * @param {string} contourData - The contour values string from API response
 * @returns {Array} The formatted chart data
 */
export const formatChartData = (
  model, 
  currentChunkData, 
  currentPage, 
  chunkSize, 
  needsChunking,
  getItemColor,
  contourData
) => {
  if (!model) return [];
  

  // Initialize result array for all cases
  let result = [];
  const hasContourValues = !!contourData;
  
  // For Series data format (multiple lines)
  if (Array.isArray(model.value) && model.value.length > 1) {
    result = model.value.map((series, seriesIndex) => {
      if (!needsChunking) {
        return {
          ...series,
          data: series.data.map((item, idx) => {
            
            return {
              ...item,
              // Explicitly preserve empty string values
              secondary: item.secondary,
              mean: item.mean,
              // Add color based on selected scheme and series index
              color: getItemColor ? getItemColor(item, seriesIndex) : undefined,
            };
          })
        };
      }
      
      const start = currentPage * chunkSize;
      const end = Math.min((currentPage + 1) * chunkSize, series.data.length);
      
      return {
        ...series,
        data: series.data.slice(start, end).map((item, idx) => {
          
          return {
            ...item,
            // Explicitly preserve empty string values
            secondary: item.secondary,
            mean: item.mean,
            // Add color based on selected scheme and series index
            color: getItemColor ? getItemColor(item, seriesIndex) : undefined,
          };
        })
      };
    });
  }
  // Special case for ResultPage.js where data is mapped to primary/secondary fields
  else if (model?.value && Array.isArray(model.value) && model.value[0]?.data) {
    // Apply pagination to ResultPage format
    result = model.value.map((series, seriesIndex) => {
      let seriesData = series.data;
      
      // Apply chunking if needed
      if (needsChunking) {
        const start = currentPage * chunkSize;
        const end = Math.min((currentPage + 1) * chunkSize, seriesData.length);
        seriesData = seriesData.slice(start, end);
      }
      
      // Format data with the proper chunk
      return {
        ...series,
        data: seriesData.map(item => {
          // Create updated item - explicitly remove color property if we're in default color scheme
          const updatedItem = {
            ...item,
            // Map ResultPage.js data fields to correct fields if needed
            word: item.primary || item.word,
            // Explicitly preserve empty string values
            m1: item.secondary === "" ? "" : (item.secondary || item.m1),
            secondary: item.secondary,
            mean: item.mean,
            // Add color based on selected scheme and series index, or remove it entirely
            // Using getItemColor which now returns undefined for default color scheme
          };
          
          // Only add color property if getItemColor returns a valid color
          // This ensures no persistent color remnants from previous selections
          const color = getItemColor ? getItemColor(item, seriesIndex) : undefined;
          if (color) {
            updatedItem.color = color;
          }
          
          return updatedItem;
        })
      };
    });
  }
  
  // For data coming from model.data (new case), wrap it as a single series
  else if (model.data && Array.isArray(model.data)) {
    result = [{
      label: model.label || '',
      elementType: 'bar',
      data: currentChunkData.map(item => {
        // Create updated item - explicitly remove color property if we're in default color scheme
        const updatedItem = {
          ...item,
          // Explicitly preserve empty string values
          secondary: item.secondary,
          mean: item.mean,
        };
        
        // Only add color property if getItemColor returns a valid color
        const color = getItemColor ? getItemColor(item) : undefined;
        if (color) {
          updatedItem.color = color;
        }
        
        return updatedItem;
      })
    }];
  } 
  // Default case - for single series
  else {
    result = [{
      label: model.label || '',
      elementType: 'bar',
      data: currentChunkData.map(item => {
        // Create updated item - explicitly remove color property if we're in default color scheme
        const updatedItem = {
          ...item,
          // Explicitly preserve empty string values
          secondary: item.secondary,
          mean: item.mean,
        };
        
        // Only add color property if getItemColor returns a valid color
        const color = getItemColor ? getItemColor(item) : undefined;
        if (color) {
          updatedItem.color = color;
        }
        
        return updatedItem;
      })
    }];
  }
  
  
  // Add stress contour data if available
  if (hasContourValues) {
    try {
      
      const contourValuesArray = contourData.split(' ').map((v, idx) => {
        
        // Handle 'nan' values in the contour data
        if (v.toLowerCase() === 'nan') {
          return null;
        }
        
        const parsed = parseFloat(v.trim());
        return parsed;
      });
      
      if (contourValuesArray && contourValuesArray.length) {
        
        // Calculate the starting index for pagination
        const startIdx = needsChunking ? currentPage * chunkSize : 0;
        
        // Create a mean contour series
        const contourSeries = {
          label: 'Mean Contour',
          elementType: 'line',  // This is critical for chartJsAdapter to create a line dataset
          data: currentChunkData.map((item, idx) => {
            // Calculate the actual index in the full dataset
            const valueIdx = startIdx + idx;
            
            // Handle index out of range and null values from nan
            // Keep null values as null to allow Chart.js to use spanGaps
            const value = valueIdx < contourValuesArray.length ? 
              contourValuesArray[valueIdx] : null;
            
            
            // For punctuation marks, use null values
            if (item.secondary === "" || item.mean === "") {
              return {
                primary: item.primary || item.word,
                secondary: null,
                mean: null,
                word: item.primary || item.word
              };
            }
            
            // For contour values, use the actual norm_mean values from contourAnalyzer when in normalized mode
            // Need to set norm_mean to 0 for unstressed words that would typically be 5 in SPE values
            // This ensures when a normalized model is selected, the contour line matches the bars
            
            // If contour value is 5, this is typically an unstressed syllable, so norm_mean should be 0
            // If contour value is 1, this is typically fully stressed, so norm_mean should be 1
            // Other values are scaled between 0-1
            
            // Calculate normalized value: (5 - spe_value) / 4
            // This maps SPE value 5 (unstressed) -> 0
            //           SPE value 1 (stressed)  -> 1
            const normalizedValue = value === null || value === "" ? null : (5 - value) / 4;
            
            return {
              primary: item.primary || item.word,
              secondary: value,
              mean: value, 
              // Use properly calculated normalized value
              norm_mean: normalizedValue,
              // Store the raw SPE value for tooltip display
              rawSPEValue: value,
              word: item.primary || item.word
            };
          })
        };
        
        
        // Add the contour series to the result
        result.push(contourSeries);
      }
    } catch (err) {
      console.error('[formatChartData] Error processing contour values:', err);
    }
  }
  
  
  return result;
};
