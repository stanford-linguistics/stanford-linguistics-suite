import { useMemo, useCallback } from 'react';
import { 
  extractDataFromModel, 
  buildSentenceFromData,
  formatChartData 
} from '../utils/dataProcessing';
import { POS_COLORS, STRESS_COLORS, VERY_LONG_INPUT_THRESHOLD } from '../constants/chartConfig';

/**
 * Custom hook for extracting and preparing chart data
 * 
 * @param {Object} model - The data model
 * @param {Object} filteringState - Current filtering state
 * @param {Object} paginationState - Current pagination state
 * @returns {Object} Chart data and related information
 */
export const useChartData = (model, filteringState, paginationState) => {
  const { 
    colorScheme 
  } = filteringState || {};
  
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
    if (colorScheme === 'pos') {
      return item.pos ? (POS_COLORS[item.pos] || POS_COLORS.default) : POS_COLORS.default;
    } else if (colorScheme === 'stress') {
      return item.lexstress ? (STRESS_COLORS[item.lexstress] || STRESS_COLORS.default) : STRESS_COLORS.default;
    }
    return undefined; // Default chart colors
  }, [colorScheme]);
  
  // Format data for react-charts
  const chartData = useMemo(() => {
    if (!model || !currentChunkData) return [];
    
    return formatChartData(
      model,
      currentChunkData,
      currentPage,
      chunkSize,
      needsChunking,
      getItemColor
    );
  }, [model, currentChunkData, currentPage, chunkSize, needsChunking, getItemColor]);
  
  return {
    extractedData,
    isVeryLongInput,
    fullSentence,
    chartData,
    getItemColor
  };
};

export default useChartData;
