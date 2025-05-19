import { useMemo, useCallback } from 'react';
import { 
  extractDataFromModel, 
  buildSentenceFromData,
  formatChartData 
} from '../utils/dataProcessing';
import { adaptDataForChartJS } from '../utils/chartJsAdapter';
import { isNormalizedModel } from '../utils/modelNameUtils';
import { POS_COLORS, STRESS_COLORS, SERIES_COLORS, VERY_LONG_INPUT_THRESHOLD } from '../constants/chartConfig';

/**
 * Custom hook for extracting and preparing chart data
 * 
 * @param {Object} model - The data model
 * @param {Object} chartDisplayState - Current chart display state (color scheme)
 * @param {Object} paginationState - Current pagination state
 * @param {Object} fullApiResponse - The complete API response with sentences data
 * @returns {Object} Chart data and related information
 */
export const useChartData = (model, chartDisplayState, paginationState, fullApiResponse) => {
  const { 
    colorScheme,
    showContourLine
  } = chartDisplayState || {};
  
  const {
    currentPage,
    chunkSize,
    needsChunking,
    currentChunkData
  } = paginationState || {};
  
  // Extract data from the model
  const extractedData = useMemo(() => {
    return extractDataFromModel(model);
  }, [model]);
  
  // Check if this is a very long input
  const isVeryLongInput = useMemo(() => {
    return extractedData.length > VERY_LONG_INPUT_THRESHOLD;
  }, [extractedData]);
  
  // Build the full sentence from the data
  const fullSentence = useMemo(() => {
    return buildSentenceFromData(extractedData);
  }, [extractedData]);
  
  // Get color for an item based on the selected color scheme and series index
  const getItemColor = useCallback((item, seriesIndex = 0) => {
    if (!item) return undefined;
    
    // Always explicitly remove any previously applied color when in default scheme
    if (colorScheme === 'default') {
      // For default scheme, don't use color from item - will use fixed color in adapter
      // Return undefined to signal default handling in chartJsAdapter
      return undefined;
    } else if (colorScheme === 'pos') {
      return item.pos ? (POS_COLORS[item.pos] || POS_COLORS.default) : POS_COLORS.default;
    } else if (colorScheme === 'stress') {
      return item.lexstress ? (STRESS_COLORS[item.lexstress] || STRESS_COLORS.default) : STRESS_COLORS.default;
    }
    
    return undefined;
  }, [colorScheme]);
  
  // Extract contour data from the full API response
  const contourData = useMemo(() => {
    if (fullApiResponse) {
      
      // Check if we have sentences data in the API response
      if (fullApiResponse?.sentences) {
        
        // Get all sentence keys and sort them numerically
        const sentenceKeys = Object.keys(fullApiResponse.sentences).sort((a, b) => parseInt(a) - parseInt(b));
        
        if (sentenceKeys.length > 0) {
          // Combine contour values from all sentences
          let combinedContourValues = '';
          
          for (const sentKey of sentenceKeys) {
            const sentence = fullApiResponse.sentences[sentKey];
            if (sentence?.contourValues) {
              // Add a space between sentences if this isn't the first one
              if (combinedContourValues) {
                combinedContourValues += ' ';
              }
              combinedContourValues += sentence.contourValues;
            }
          }
          
          if (combinedContourValues) {
            return combinedContourValues;
          }
        }
      }
    }
    
    return null;
  }, [fullApiResponse]);
  
  // Format data for Chart.js
  const chartData = useMemo(() => {
    if (!model || !currentChunkData) {
      return [];
    }
    

    
    
    // Pass the extracted contour data to formatChartData
    let formattedData = formatChartData(
      model,
      currentChunkData,
      currentPage,
      chunkSize,
      needsChunking,
      getItemColor,
      contourData  // Pass contour data from the API response
    );
    
    // Verify if the formatted data contains a contour series
    const hasContourInResult = formattedData.some(series => 
      series.elementType === 'line' || 
      series.label === 'Stress Contour' ||
      series.label?.toLowerCase().includes('stress contour')
    );
    
    
    // If we have contour data from API but it didn't make it into the result,
    // explicitly add a contour series to ensure it's visible
    if (contourData && !hasContourInResult && currentChunkData.length > 0) {
      
      try {
        // Process contour data
        const contourValuesArray = contourData.split(' ').map(v => {
          if (v.toLowerCase() === 'nan') return null;
          return parseFloat(v.trim());
        });
        
        // Calculate the starting index for pagination
        const startIdx = needsChunking ? currentPage * chunkSize : 0;
        
        // Create contour series
        const contourSeries = {
          label: 'Stress Contour',
          elementType: 'line',
          data: currentChunkData.map((item, idx) => {
            const valueIdx = startIdx + idx;
            // Keep null values as null instead of converting to 0
            // This allows Chart.js to use spanGaps to skip these points
            const value = valueIdx < contourValuesArray.length ? contourValuesArray[valueIdx] : null;
            
            // Debug logging
            console.log(`Creating contour point at index ${idx}:`, {
              value,
              primary: item.primary || item.word
            });
            
            // Calculate normalized value for contour line in normalized mode
            // This maps SPE value 5 (unstressed) -> 0
            //           SPE value 1 (stressed)  -> 1
            const normalizedValue = value === null || value === "" ? null : (5 - value) / 4;
            
            return {
              primary: item.primary || item.word,
              secondary: value,
              mean: value,
              // Add properly scaled normalized value
              norm_mean: normalizedValue,
              word: item.primary || item.word
            };
          })
        };
        
        formattedData.push(contourSeries);
      } catch (err) {
        console.error('[DEBUG-CONTOUR] Error creating explicit contour series:', err);
      }
    }
    
    return formattedData;
  }, [model, currentChunkData, currentPage, chunkSize, needsChunking, getItemColor, contourData]);
  
  // Check if this is a normalized model
  const isNormalized = useMemo(() => {
    const normalized = isNormalizedModel(model);
    return normalized;
  }, [model]);
  
  // Transform chart data for Chart.js
  const chartJsData = useMemo(() => {
    // Check if this is a series model (has multiple bar datasets)
    const isSeriesModel = chartData && chartData.filter(series => 
      series.elementType !== 'line' && 
      !series.label?.toLowerCase().includes('contour')
    ).length > 1;
    
    const adapted = adaptDataForChartJS(
      chartData, 
      showContourLine, 
      isNormalized,
      colorScheme,
      isSeriesModel
    );
    return adapted;
  }, [chartData, showContourLine, isNormalized, colorScheme]);
  
  return {
    extractedData,
    isVeryLongInput,
    fullSentence,
    chartData,
    chartJsData,
    getItemColor,
    isNormalized
  };
};

export default useChartData;
