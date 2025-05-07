/**
 * Statistics calculation utilities for the ResultsGraph component
 */

/**
 * Calculates comprehensive statistics for a chunk of linguistic data
 * @param {Array} chunkData - The current chunk of linguistic data
 * @returns {Object} Object containing various statistics
 */
export const calculateChunkStats = (chunkData) => {

  if (!chunkData || !chunkData.length) {
    return {
      averageStress: {
        m1: '0.00',
        m2a: '0.00',
        m2b: '0.00',
        mean: '0.00'
      },
      posDistribution: {},
      syllableCounts: {
        '1': 0,
        '2': 0,
        '3+': 0
      },
      stressDistribution: {
        'yes': { count: 0, percentage: 0 },
        'no': { count: 0, percentage: 0 },
        'ambig': { count: 0, percentage: 0 }
      }
    };
  }
  
  // Check if this is ResultPage format with primary/secondary fields
  const isResultPageFormat = chunkData[0]?.primary !== undefined && chunkData[0]?.secondary !== undefined;
  
  // Calculate average stress (m1, m2a, m2b, mean) values
  let m1Sum = 0, m2aSum = 0, m2bSum = 0, meanSum = 0;
  let m1Count = 0, m2aCount = 0, m2bCount = 0, meanCount = 0;
  
  // Track POS distribution
  const posDistribution = {};
  
  // Track syllable counts
  const syllableCounts = {
    '1': 0,
    '2': 0,
    '3+': 0
  };
  
  // Track stress distribution
  const stressDistribution = {
    'yes': 0,
    'no': 0,
    'ambig': 0
  };
  

  // Process each data point
  chunkData.forEach(item => {
    // For direct data format where m1, m2a, etc. are fields in the items
    if (!isResultPageFormat) {
      // Process m1 field - more detailed logging for debugging
      // IMPORTANT: String "0" is falsy in JavaScript, so we need explicit checks
      if (item.m1 !== undefined && item.m1 !== null && item.m1 !== "") {
        const value = parseFloat(item.m1);
        if (!isNaN(value)) {
          m1Sum += value;
          m1Count++;
        }
      }
      
      // Process m2a field with explicit check for empty string
      if (item.m2a !== undefined && item.m2a !== null && item.m2a !== "") {
        const value = parseFloat(item.m2a);
        if (!isNaN(value)) {
          m2aSum += value;
          m2aCount++;
        }
      }
      
      // Process m2b field with explicit check for empty string
      if (item.m2b !== undefined && item.m2b !== null && item.m2b !== "") {
        const value = parseFloat(item.m2b);
        if (!isNaN(value)) {
          m2bSum += value;
          m2bCount++;
        }
      }
      
      // Process mean field with explicit check for empty string
      if (item.mean !== undefined && item.mean !== null && item.mean !== "") {
        const value = parseFloat(item.mean);
        if (!isNaN(value)) {
          meanSum += value;
          meanCount++;
        }
      }
    } 
    // For ResultPage format, where we have primary/secondary fields
    else {
      // Get value from secondary field
      if (item.secondary !== undefined) {
        const value = parseFloat(item.secondary);
        if (!isNaN(value)) {
          // Determine which metric this belongs to based on the label
          if (item.label === 'm1') {
            m1Sum += value;
            m1Count++;
          } else if (item.label === 'm2a') {
            m2aSum += value;
            m2aCount++;
          } else if (item.label === 'm2b') {
            m2bSum += value;
            m2bCount++;
          } else if (item.label === 'mean') {
            meanSum += value;
            meanCount++;
          } else {
            // Default to m1 if no label is specified
            m1Sum += value;
            m1Count++;
          }
        }
      }
    }
    
    // Process POS distribution if available
    if (item.pos !== undefined && item.pos !== null) {
      posDistribution[item.pos] = (posDistribution[item.pos] || 0) + 1;
    }
    
    // Process syllables if available
    if (item.nsyll !== undefined && item.nsyll !== null) {
      const syllCount = parseInt(item.nsyll, 10);
      
      if (syllCount === 1) {
        syllableCounts['1']++;
      } else if (syllCount === 2) {
        syllableCounts['2']++;
      } else if (syllCount >= 3) {
        syllableCounts['3+']++;
      }
    }
    
    // Process stress patterns if available
    if (item.lexstress !== undefined && item.lexstress !== null) {
      stressDistribution[item.lexstress] = (stressDistribution[item.lexstress] || 0) + 1;
    }
  });
  
  // Calculate averages
  const averageM1 = m1Count > 0 ? m1Sum / m1Count : 0;
  const averageM2a = m2aCount > 0 ? m2aSum / m2aCount : 0;
  const averageM2b = m2bCount > 0 ? m2bSum / m2bCount : 0;
  const averageMean = meanCount > 0 ? meanSum / meanCount : 0;
  
  // Convert distributions to percentages
  const totalWords = chunkData.length;
  Object.keys(posDistribution).forEach(key => {
    posDistribution[key] = {
      count: posDistribution[key],
      percentage: Math.round((posDistribution[key] / totalWords) * 100)
    };
  });
  
  Object.keys(stressDistribution).forEach(key => {
    stressDistribution[key] = {
      count: stressDistribution[key],
      percentage: Math.round((stressDistribution[key] / totalWords) * 100)
    };
  });
  
  // Determine contour pattern
  let contourPattern = 'Complex';
  
  // Extract stress values for pattern detection
  const stressValues = [];
  chunkData.forEach(item => {
    let value;
    if (!isResultPageFormat) {
      value = parseFloat(item.m1 || item.mean || 0);
    } else {
      value = parseFloat(item.secondary || 0);
    }
    if (!isNaN(value)) {
      stressValues.push(value);
    }
  });
  
  if (stressValues.length > 0) {
    // Find min and max values
    const min = Math.min(...stressValues);
    const max = Math.max(...stressValues);
    
    // Find positions of min and max
    const minIndex = stressValues.indexOf(min);
    const maxIndex = stressValues.indexOf(max);
    
    // Calculate differences between consecutive values
    const differences = [];
    for (let i = 0; i < stressValues.length - 1; i++) {
      differences.push(stressValues[i+1] - stressValues[i]);
    }
    
    // Count rising and falling segments
    let risingCount = 0;
    let fallingCount = 0;
    
    for (const diff of differences) {
      if (diff > 0) risingCount++;
      if (diff < 0) fallingCount++;
    }
    
    // Determine pattern based on positions and counts
    if (maxIndex === 0 && minIndex === stressValues.length - 1) {
      contourPattern = 'Falling';
    } else if (minIndex === 0 && maxIndex === stressValues.length - 1) {
      contourPattern = 'Rising';
    } else if (maxIndex > 0 && maxIndex < stressValues.length - 1) {
      contourPattern = 'Peak';
    } else if (minIndex > 0 && minIndex < stressValues.length - 1) {
      contourPattern = 'Valley';
    } else if (risingCount > fallingCount * 2) {
      contourPattern = 'Rising';
    } else if (fallingCount > risingCount * 2) {
      contourPattern = 'Falling';
    } else if (Math.abs(max - min) < 1.0) {
      contourPattern = 'Level';
    }
  }
  
  // Return compiled statistics
  return {
    averageStress: {
      m1: averageM1.toFixed(2),
      m2a: averageM2a.toFixed(2),
      m2b: averageM2b.toFixed(2),
      mean: averageMean.toFixed(2)
    },
    posDistribution,
    syllableCounts,
    stressDistribution,
    totalWords,
    contourPattern
  };
};

/**
 * Finds the most frequent value in a given distribution
 * @param {Object} distribution - Distribution object with counts
 * @returns {string} The most frequent item
 */
export const findMostFrequent = (distribution) => {
  if (!distribution) return null;
  
  let highestCount = 0;
  let mostFrequent = null;
  
  Object.entries(distribution).forEach(([key, value]) => {
    const count = typeof value === 'object' ? value.count : value;
    if (count > highestCount) {
      highestCount = count;
      mostFrequent = key;
    }
  });
  
  return mostFrequent;
};

/**
 * Detects patterns in the stress contour
 * @param {Array} data - The data to analyze
 * @returns {Object} Detected patterns
 */
export const detectPatterns = (data) => {

  
  if (!data || data.length < 4) {
    return {};
  }
  
  // Check if this is ResultPage format with primary/secondary fields
  const isResultPageFormat = data[0]?.primary !== undefined && data[0]?.secondary !== undefined;
  
  let stressValues;
  
  if (isResultPageFormat) {
    // For ResultPage format, we just need to extract the secondary values
    stressValues = data
      .filter(item => item.secondary !== undefined)
      .map(item => parseFloat(item.secondary));
  } else {
    // For other formats, use the existing logic
    stressValues = data
      .filter(item => (
        // Original format - explicit check for empty string
        (item.m1 !== undefined && item.m1 !== null && item.m1 !== "") || 
        // ResultPage format with m1 label
        (item.secondary !== undefined && item.secondary !== null && item.secondary !== "" && item.label === 'm1') ||
        // Use mean as fallback
        (item.mean !== undefined && item.mean !== null && item.mean !== "")
      ))
      .map(item => {
        // Original format
        if ((item.m1 !== undefined) && (item.m1 !== null) && (item.m1 !== "")) {
          const value = parseFloat(item.m1);
          return isNaN(value) ? 0 : value;
        }
        // ResultPage format with m1 label
        if ((item.secondary !== undefined) && (item.secondary !== null) && (item.secondary !== "") && (item.label === 'm1')) {
          const value = parseFloat(item.secondary);
          return isNaN(value) ? 0 : value;
        }
        // Use mean as fallback
        if ((item.mean !== undefined) && (item.mean !== null) && (item.mean !== "")) {
          const value = parseFloat(item.mean);
          return isNaN(value) ? 0 : value;
        }
        // Secondary as absolute fallback 
        if ((item.secondary !== undefined) && (item.secondary !== null) && (item.secondary !== "")) {
          const value = parseFloat(item.secondary);
          return isNaN(value) ? 0 : value;
        }
        return 0;
      });
  }
  
  
  // Analyze for alternating patterns (common in metrical phonology)
  let alternatingCount = 0;
  for (let i = 0; i < stressValues.length - 2; i++) {
    if ((stressValues[i] > stressValues[i+1] && stressValues[i+1] < stressValues[i+2]) ||
        (stressValues[i] < stressValues[i+1] && stressValues[i+1] > stressValues[i+2])) {
      alternatingCount++;
    }
  }
  
  // Calculate percentage of alternating patterns
  const alternatingPercentage = Math.round(
    (alternatingCount / (stressValues.length - 2)) * 100
  );
  
  // Detect rising or falling trend
  let rising = 0;
  let falling = 0;
  
  for (let i = 0; i < stressValues.length - 1; i++) {
    if (stressValues[i] < stressValues[i+1]) rising++;
    if (stressValues[i] > stressValues[i+1]) falling++;
  }
  
  const trend = rising > falling ? 'rising' : falling > rising ? 'falling' : 'neutral';
  
  return {
    alternating: alternatingPercentage > 60, // True if strongly alternating
    alternatingPercentage,
    trend
  };
};
