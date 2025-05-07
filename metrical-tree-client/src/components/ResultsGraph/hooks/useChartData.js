import { useMemo, useCallback } from 'react';
import { 
  extractDataFromModel, 
  buildSentenceFromData,
  formatChartData 
} from '../utils/dataProcessing';
import { adaptDataForChartJS } from '../utils/chartJsAdapter';
import { POS_COLORS, STRESS_COLORS, VERY_LONG_INPUT_THRESHOLD } from '../constants/chartConfig';

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
  
  // Get color for an item based on the selected color scheme
  const getItemColor = useCallback((item) => {
    if (!item) return undefined;
    
    if (colorScheme === 'pos') {
      return item.pos ? (POS_COLORS[item.pos] || POS_COLORS.default) : POS_COLORS.default;
    } else if (colorScheme === 'stress') {
      return item.lexstress ? (STRESS_COLORS[item.lexstress] || STRESS_COLORS.default) : STRESS_COLORS.default;
    } else if (colorScheme === 'default') {
      return undefined; // Use default chart colors
    }
    return undefined;
  }, [colorScheme]);
  
  // Extract contour data from the full API response
  const contourData = useMemo(() => {
    // Debug full API response structure for contour data
    console.log('[DEBUG-CONTOUR] fullApiResponse exists:', !!fullApiResponse);
    if (fullApiResponse) {
      console.log('[DEBUG-CONTOUR] API response top level keys:', Object.keys(fullApiResponse));
      
      // Check if we have sentences data in the API response
      if (fullApiResponse?.sentences) {
        console.log('[DEBUG-CONTOUR] Sentences object found with keys:', Object.keys(fullApiResponse.sentences));
        
        const sentenceKeys = Object.keys(fullApiResponse.sentences);
        if (sentenceKeys.length > 0) {
          const firstSentKey = sentenceKeys[0];
          const firstSent = fullApiResponse.sentences[firstSentKey];
          console.log(`[DEBUG-CONTOUR] First sentence (${firstSentKey}) keys:`, Object.keys(firstSent));
          console.log(`[DEBUG-CONTOUR] First sentence contourValues exists:`, !!firstSent.contourValues);
          
          if (firstSent.contourValues) {
            console.log(`[DEBUG-CONTOUR] contourValues sample:`, firstSent.contourValues.substring(0, 30));
            return firstSent.contourValues;
          }
        }
      } else {
        console.log('[DEBUG-CONTOUR] No sentences object found in API response!');
      }
    }
    
    return null;
  }, [fullApiResponse]);
  
  // Format data for Chart.js
  const chartData = useMemo(() => {
    if (!model || !currentChunkData) {
      return [];
    }
    
    // Debug model structure
    console.log('[useChartData] model structure:', model);
    
    // Check if there's a series specifically for stress contour
    const hasContourSeries = model?.value?.some(series => 
      series.label === 'Stress Contour' || series.elementType === 'line'
    );
    console.log('[useChartData] Has contour series:', hasContourSeries);
    console.log('[useChartData] Has contour data:', !!contourData);
    
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
      series.elementType === 'line' || series.label === 'Stress Contour'
    );
    
    console.log('[DEBUG-CONTOUR] Formatted data contains contour series:', hasContourInResult);
    console.log('[DEBUG-CONTOUR] Formatted data series types:', 
      formattedData.map(series => ({
        label: series.label,
        type: series.elementType,
        dataPoints: series.data?.length || 0
      }))
    );
    
    // If we have contour data from API but it didn't make it into the result,
    // explicitly add a contour series to ensure it's visible
    if (contourData && !hasContourInResult && currentChunkData.length > 0) {
      console.log('[DEBUG-CONTOUR] Explicitly adding missing contour series');
      
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
        
        // Add to result
        formattedData.push(contourSeries);
        console.log('[DEBUG-CONTOUR] Successfully added explicit contour series with data points:', 
          contourSeries.data.length);
      } catch (err) {
        console.error('[DEBUG-CONTOUR] Error creating explicit contour series:', err);
      }
    }
    
    console.log('[useChartData] Final formatted data:', formattedData);
    return formattedData;
  }, [model, currentChunkData, currentPage, chunkSize, needsChunking, getItemColor, contourData]);
  
  // Transform chart data for Chart.js
  const chartJsData = useMemo(() => {
    console.log('[useChartData] chartData before adapting:', chartData);
    console.log('[useChartData] showContourLine state:', showContourLine);
    const adapted = adaptDataForChartJS(chartData, showContourLine);
    console.log('[useChartData] Adapted chartJsData:', adapted);
    return adapted;
  }, [chartData, showContourLine]);
  
  return {
    extractedData,
    isVeryLongInput,
    fullSentence,
    chartData,
    chartJsData,
    getItemColor
  };
};

export default useChartData;
