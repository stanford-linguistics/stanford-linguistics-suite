import { useState, useCallback, useMemo, useEffect } from 'react';
import { POS_COLORS, STRESS_COLORS } from '../constants/chartConfig';

/**
 * Custom hook for managing display options in the ResultsGraph
 * 
 * @param {Array} data - The chart data
 * @returns {Object} Display state and methods
 */
export const useChartDisplay = (data) => {
  // Initialize state from localStorage if available
  const [colorScheme, setColorScheme] = useState(() => {
    try {
      const savedScheme = localStorage.getItem('metrical-tree-color-scheme');
      return savedScheme || 'default';
    } catch (e) {
      console.warn('Error reading color scheme from localStorage:', e);
      return 'default';
    }
  });
  
  const [showContourLine, setShowContourLine] = useState(() => {
    try {
      const savedContourLine = localStorage.getItem('metrical-tree-show-contour');
      return savedContourLine !== null ? savedContourLine === 'true' : true;
    } catch (e) {
      console.warn('Error reading contour line preference from localStorage:', e);
      return true;
    }
  });
  
  // Check if contour data is available and log it (for debugging purposes)
  useMemo(() => {
    if (!data || !Array.isArray(data)) return false;
    
    // Check if any items have mean values
    const hasMeanValues = data.some(item => 
      item && 
      item.mean && 
      item.mean !== '' && 
      !isNaN(parseFloat(item.mean)) &&
      item.mean !== 'nan'
    );
    
    console.log('[DEBUG] useChartDisplay: Data has mean values:', hasMeanValues);
    return hasMeanValues;
  }, [data]);
  
  // Store preferences in localStorage
  useEffect(() => {
    try {
      localStorage.setItem('metrical-tree-color-scheme', colorScheme);
    } catch (e) {
      console.warn('Error saving color scheme to localStorage:', e);
    }
  }, [colorScheme]);
  
  useEffect(() => {
    try {
      localStorage.setItem('metrical-tree-show-contour', showContourLine.toString());
    } catch (e) {
      console.warn('Error saving contour line preference to localStorage:', e);
    }
  }, [showContourLine]);
  
  // Handlers for UI controls
  const handleColorSchemeChange = useCallback((e) => {
    setColorScheme(e.target.value);
  }, []);
  
  const handleContourLineToggle = useCallback(() => {
    setShowContourLine(prev => {
      const newValue = !prev;
      console.log('[useChartDisplay] Toggling contour line to:', newValue);
      console.log('[DEBUG-CONTOUR] Toggle state BEFORE change:', prev);
      console.log('[DEBUG-CONTOUR] Toggle state AFTER change:', newValue);
      return newValue;
    });
  }, []);
  
  // Debug contour line state on each render
  useEffect(() => {
    console.log('[useChartDisplay] Current showContourLine state:', showContourLine);
  }, [showContourLine]);
  
  const colorOptions = useMemo(() => [
    { value: 'default', label: 'Default Colors' },
    { value: 'pos', label: 'Color by POS' },
    { value: 'stress', label: 'Color by Stress' }
  ], []);

  // Generate color legend data based on selected scheme
  const colorLegendData = useMemo(() => {
    if (colorScheme === 'pos') {
      return Object.entries(POS_COLORS)
        .filter(([key]) => key !== 'default')
        .map(([key, color]) => ({
          label: key,
          color
        }));
    } else if (colorScheme === 'stress') {
      return Object.entries(STRESS_COLORS)
        .filter(([key]) => key !== 'default')
        .map(([key, color]) => ({
          label: key === 'yes' ? 'Stressed' : key === 'no' ? 'Unstressed' : 'Ambiguous',
          color
        }));
    }
    return [];
  }, [colorScheme]);
  
  // Process data with color scheme
  const processedData = useMemo(() => {
    if (!data) return [];
    return data;
  }, [data]);

  return {
    colorScheme,
    showContourLine,
    colorOptions,
    data: processedData,
    setColorScheme,
    handleColorSchemeChange,
    handleContourLineToggle,
    colorLegendData
  };
};

export default useChartDisplay;
