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
  
  console.log('[formatChartData] Processing model:', model);
  console.log('[formatChartData] currentChunkData:', currentChunkData);
  
  // DEBUG: Examine sentences structure in detail
  console.log('[DEBUG-CONTOUR] Model has sentences:', !!model?.sentences);
  if (model?.sentences) {
    console.log('[DEBUG-CONTOUR] Sentences keys:', Object.keys(model.sentences));
    // Log the first sentence object
    const firstKey = Object.keys(model.sentences)[0];
    if (firstKey) {
      console.log(`[DEBUG-CONTOUR] First sentence (${firstKey}):`, model.sentences[firstKey]);
      console.log(`[DEBUG-CONTOUR] Has contourValues:`, !!model.sentences[firstKey].contourValues);
      if (model.sentences[firstKey].contourValues) {
        console.log('[DEBUG-CONTOUR] contourValues sample:', model.sentences[firstKey].contourValues.substring(0, 30));
      }
    }
  }
  
  // Initialize result array for all cases
  let result = [];
  
  // Check if we have stress contour data from the API response
  console.log('[formatChartData] contourData from API:', !!contourData);
  const hasContourValues = !!contourData;
  
  // For Series data format (multiple lines)
  if (Array.isArray(model.value) && model.value.length > 1) {
    result = model.value.map(series => {
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
  else if (model?.value && Array.isArray(model.value) && model.value[0]?.data) {
    // Apply pagination to ResultPage format
    result = model.value.map(series => {
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
  else if (model.data && Array.isArray(model.data)) {
    result = [{
      label: model.label || '',
      elementType: 'bar',
      data: currentChunkData.map(item => ({
        ...item,
        // Add color based on selected scheme
        color: getItemColor ? getItemColor(item) : undefined,
      }))
    }];
  } 
  // Default case - for single series
  else {
    result = [{
      label: model.label || '',
      elementType: 'bar',
      data: currentChunkData.map(item => ({
        ...item,
        // Add color based on selected scheme
        color: getItemColor ? getItemColor(item) : undefined,
      }))
    }];
  }
  
  console.log('[DEBUG-CONTOUR] Base data result before adding contour:', 
    result.map(series => ({
      label: series.label,
      type: series.elementType,
      dataPoints: series.data?.length || 0
    }))
  );
  
  // Add stress contour data if available
  if (hasContourValues) {
    console.log('[formatChartData] Processing ContourValues:', contourData);
    try {
      const contourValuesArray = contourData.split(' ').map(v => {
        // Handle 'nan' values in the contour data
        if (v.toLowerCase() === 'nan') {
          return null;
        }
        return parseFloat(v.trim());
      });
      
      if (contourValuesArray && contourValuesArray.length) {
        console.log('[formatChartData] Processed contour values:', contourValuesArray);
        
        // Calculate the starting index for pagination
        const startIdx = needsChunking ? currentPage * chunkSize : 0;
        console.log('[formatChartData] Contour pagination - startIdx:', startIdx, 'chunkSize:', chunkSize, 'currentPage:', currentPage);
        
        // Create a stress contour series
        const contourSeries = {
          label: 'Stress Contour',
          elementType: 'line',  // This is critical for chartJsAdapter to create a line dataset
          data: currentChunkData.map((item, idx) => {
            // Calculate the actual index in the full dataset
            const valueIdx = startIdx + idx;
            console.log(`[formatChartData] Mapping contour value at idx ${idx} (valueIdx ${valueIdx})`);
            
            // Handle index out of range and null values from nan
            const value = valueIdx < contourValuesArray.length ? 
              (contourValuesArray[valueIdx] !== null ? contourValuesArray[valueIdx] : 0) : 0;
            
            return {
              primary: item.primary || item.word,
              secondary: value,
              mean: value,
              word: item.primary || item.word
            };
          })
        };
        
        // Debug the created contour series
        console.log('[DEBUG-CONTOUR] Created contour series with data points:', contourSeries.data.length);
        console.log('[DEBUG-CONTOUR] Sample contour data point:', contourSeries.data[0]);
        console.log('[DEBUG-CONTOUR] Contour series object:', {
          label: contourSeries.label,
          elementType: contourSeries.elementType,
          dataLength: contourSeries.data.length
        });
        
        // Add the contour series to the result
        result.push(contourSeries);
        console.log('[DEBUG-CONTOUR] Result array after adding contour series:', 
          result.map(series => ({
            label: series.label,
            type: series.elementType,
            isLine: series.elementType === 'line',
            dataLength: series.data.length
          }))
        );
      }
    } catch (err) {
      console.error('[formatChartData] Error processing contour values:', err);
    }
  }
  
  console.log('[formatChartData] Final result:', result);
  console.log('[formatChartData] Final result structure:', 
    result.map(series => ({
      label: series.label,
      type: series.elementType,
      isLine: series.elementType === 'line',
      dataPoints: series.data.length
    }))
  );
  
  // IMPORTANT: Make sure we return a non-empty result array with proper structure
  // If the result is empty, create a dummy series to help debug
  if (!result.length) {
    console.error('[formatChartData] WARNING: Returning empty result array!');
  }
  
  return result;
};
