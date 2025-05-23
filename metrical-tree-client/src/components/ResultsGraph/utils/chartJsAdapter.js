import { getYAxisID } from './modelNameUtils';
import { NORMALIZED_MODEL_COLORS, SERIES_COLORS } from '../constants/chartConfig';
import { Chart } from 'chart.js';

/**
 * Helper to darken a color for borders
 * @param {string} color - The hex color to darken
 * @returns {string} The darkened color
 */
const darkenColor = (color) => {
  try {
    // Simple darkening by reducing brightness by 20%
    return color ? color.replace(/#/, '#0') : '#3d8b40';
  } catch (e) {
    return '#3d8b40'; // Fallback to default darker color
  }
};

/**
 * Gets the appropriate color for a series based on its label
 * @param {string} label - The series label
 * @returns {string} The color to use for the series
 */
const getSeriesColor = (label) => {
  console.log('DEBUG - getSeriesColor called with label:', label);
  if (!label) return SERIES_COLORS[0]; // Default to first color
  
  // Convert label to lowercase for case-insensitive matching
  const lowerLabel = label.toLowerCase();
  
  // More precise matching with exact pattern checks
  if (lowerLabel === 'm1' || lowerLabel === 'norm_m1') return SERIES_COLORS[0]; // Blue for m1
  if (lowerLabel === 'm2a' || lowerLabel === 'norm_m2a') return SERIES_COLORS[1]; // Red for m2a
  if (lowerLabel === 'm2b' || lowerLabel === 'norm_m2b') return SERIES_COLORS[2]; // Yellow for m2b
  if (lowerLabel === 'mean' || lowerLabel === 'norm_mean') return SERIES_COLORS[3]; // Green for mean
  
  // Fallback to index-based color selection
  const seriesIndex = parseInt(label.match(/\d+/)?.[0] || '0', 10);
  return SERIES_COLORS[seriesIndex % SERIES_COLORS.length];
};


/**
 * Converts SPE stress numbers to grid values
 * In SPE, smaller numbers mean louder stress (1 is loudest)
 * In grids, taller bars represent louder stress
 * 
 * Implementation based on Joan Bresnan's R function:
 * spe_to_grid = function(x){          
 *   y = max(x)        
 *   return(abs(x-y)+1)
 * }
 * 
 * @param {Array} values - Array of SPE stress values
 * @returns {Array} - Transformed values for grid display
 */
const speToGrid = (values) => {
  
  // Filter out null values before finding max
  const validValues = values.filter(v => v !== null && v !== "" && !isNaN(v));
  if (validValues.length === 0) return values;
  
  const max = Math.max(...validValues);
  const min = Math.min(...validValues);
  
  // DIAGNOSTIC: Log if this appears to be normalized data
  if (min >= 0 && max <= 1.1) { // Allow slight margin for floating point
    console.warn('WARNING: speToGrid may have been called on normalized values:', {
      min, max, sampleValues: validValues.slice(0, 5)
    });
  }
  
  // Explicitly preserve null, empty string, and NaN values
  const result = values.map((v, idx) => {
    
    if (v === null || v === "" || isNaN(v)) {
      return null;
    }
    
    // Transform SPE stress numbers to grid values
    // In SPE notation, smaller numbers = louder stress (1 is loudest)
    // For grid display, we want taller bars = louder stress
    // So we reverse the scale: abs(value - max) + 1
    const transformed = Math.abs(v - max) + 1;
    return transformed;
  });
  
  return result;
};

/**
 * Adapts data from our format to Chart.js format
 * @param {Array} chartData - Data in react-charts format
 * @param {boolean} showContourLine - Whether to show the contour line
 * @param {boolean} isNormalized - Whether the model is normalized
 * @param {string} colorScheme - The color scheme to use (pos, stress, default)
 * @param {boolean} isSeriesModel - Whether this is a series model (multiple datasets)
 * @returns {Object} Data in Chart.js format
 */
export const adaptDataForChartJS = (chartData, showContourLine = true, isNormalized = false, colorScheme = 'default', isSeriesModel = false) => {
  console.log('DEBUG - adaptDataForChartJS called with:', {
    chartDataLength: chartData?.length,
    showContourLine,
    isNormalized,
    colorScheme,
    isSeriesModel,
    seriesLabels: chartData?.map(s => ({ label: s.label, elementType: s.elementType }))
  });
  
  // Create a fresh deep copy of chartData to prevent mutations affecting original state
  const processedChartData = JSON.parse(JSON.stringify(chartData));
  
  // CRITICAL FIX: For series models, always force default color scheme
  const effectiveColorScheme = isSeriesModel ? 'default' : colorScheme;
  
  // Explicit color property cleanup for all data items when using default color scheme
  if (effectiveColorScheme === 'default' || isSeriesModel) {
    processedChartData.forEach(series => {
      if (series.data && Array.isArray(series.data)) {
        series.data.forEach(item => {
          // Explicitly delete color property for clean state
          if (item) delete item.color;
        });
      }
    });
  }
  
  if (!processedChartData || !processedChartData.length || !processedChartData[0]?.data?.length) {
    return { labels: [], datasets: [], yMin: 0, yMax: 1 };
  }
  // Extract labels from the first series
  const labels = chartData[0].data.map(item => item.primary || item.word || '');
  
  // Create datasets - including both bar and line charts
  const datasets = [];
  // For dynamic y-axis scaling
  let barValues = [];
  
  // Process each series
  chartData.forEach(series => {
    // CRITICAL: Check both elementType and label for line identification
    // Make this check more inclusive to catch all stress contour lines
    const isLine = series.elementType === 'line' || 
                   series.label === 'Mean Contour' || 
                   series.label?.toLowerCase().includes('mean contour');
    
    // Log all series for debugging
    console.log('DEBUG - Processing series:', {
      label: series.label,
      elementType: series.elementType,
      isLine
    });


    // Skip contour line if hidden
    if (isLine && !showContourLine) {
      return;
    }
    
  // Extract values from data - preserving null values for spanGaps
  const values = series.data.map((item, idx) => {
    // For normalized models, only use norm_mean for CONTOUR LINES
    // Bar charts should always use their specific metric value from secondary
    const useNormMean = isNormalized && isLine && item.norm_mean !== undefined && item.norm_mean !== null;
    
    // If the value is null OR empty string, keep it as null
    // Empty strings are used for punctuation marks in the linguistic data
    if (item.secondary === null || item.secondary === "" || 
        (useNormMean ? item.norm_mean === null || item.norm_mean === "" : 
                       item.mean === null || item.mean === "")) {
      return null;
    }
    
    // For normalized contour lines: use norm_mean
    // For everything else: use secondary (specific metric) or mean
    // CRITICAL: Use !== undefined to allow 0 as a valid value
    const rawValue = useNormMean ? item.norm_mean : 
                     (item.secondary !== undefined && item.secondary !== null && item.secondary !== "" ? 
                      item.secondary : item.mean);
    
    // Debug log to check values for normalized model data
    if (isNormalized) {
      console.log(`DEBUG - ${isLine ? 'CONTOUR' : 'BAR'} value for ${series.label} at index ${idx}:`, {
        isLine,
        useNormMean,
        norm_mean: item.norm_mean,
        secondary: item.secondary,
        mean: item.mean,
        rawValue,
        word: item.word || item.primary
      });
    }
    
    // Only use parseFloat for non-empty values
    const value = rawValue !== undefined && rawValue !== "" ? parseFloat(rawValue) : null;
    
    if (value === null || isNaN(value)) {
      return null;
    }
    
    return value;
  });
    

    // Apply SPE to grid transformation for:
    // 1. Raw models (not normalized) and bar charts - reverses the sense of numbers so smaller SPE numbers (louder stress) become taller bars
    // 2. Stress contour lines (regardless of model) - ensures consistent visual interpretation with bar charts
    
    // Check if this is a raw model (not normalized) that needs transformation
    // CRITICAL: Never apply transformation to any series with 'norm_' in the label
    const hasNormInLabel = series.label?.toLowerCase().includes('norm');
    const isRawModel = !isNormalized && !isLine && !hasNormInLabel &&
                      (series.label?.toLowerCase().includes('raw') || 
                       // Check for raw model API keys directly (without norm_ prefix)
                       series.label === 'm1' || 
                       series.label === 'm2a' || 
                       series.label === 'm2b' || 
                       series.label === 'mean');
                       
    // Check if this is a mean contour line - broaden the check to handle all variations
    const isStressContourLine = isLine && (
      series.label === 'Mean Contour' || 
      series.label?.toLowerCase().includes('mean contour')
    );
    
    // For normalized models with contour lines, the values are already normalized from the API
    // Only apply speToGrid to contour lines for non-normalized models
    const shouldApplySpeToGridToContour = isStressContourLine && !isNormalized;
    
    console.log(`DEBUG - Series: ${series.label}, isNormalized: ${isNormalized}, isLine: ${isLine}, hasNormInLabel: ${hasNormInLabel}, isRawModel: ${isRawModel}, isStressContourLine: ${isStressContourLine}, shouldApplySpeToGridToContour: ${shouldApplySpeToGridToContour}`);
    
    // Apply transformation for:
    // 1. Raw models - convert SPE values to grid values
    // 2. Non-normalized contour lines - convert SPE values to grid values
    // For normalized models, the values are already normalized in the API
    let displayValues;
    if (isRawModel || shouldApplySpeToGridToContour) {
      console.log(`DEBUG - Applying speToGrid to ${series.label}, sample values:`, values.slice(0, 5));
      displayValues = speToGrid(values);
      console.log(`DEBUG - After speToGrid transformation:`, displayValues.slice(0, 5));
    } else {
      displayValues = values;
      console.log(`DEBUG - Using raw values for ${series.label}, sample values:`, values.slice(0, 5));
      if (isNormalized && isLine) {
        console.log(`DEBUG - Full normalized contour values:`, displayValues);
      }
    }
    
    // For raw models and stress contour lines, store both original and transformed values
    if (isRawModel || isStressContourLine) {
      // Add the original values to each data item for tooltip display
      series.data.forEach((item, idx) => {
        if (values[idx] !== null) {
          // Store the original SPE value and transformed value directly on the item
          item.originalSPEValue = values[idx];
          item.transformedValue = displayValues[idx];
          
          // Also store the specific metric value (m1, m2a, m2b, mean) that's being displayed
          // This ensures we can access it in the tooltip
          if (item.m1 !== undefined) {
            item.m1_original = values[idx];
            item.m1_transformed = displayValues[idx];
          } 
          
          if (item.m2a !== undefined) {
            item.m2a_original = values[idx];
            item.m2a_transformed = displayValues[idx];
          } 
          
          if (item.m2b !== undefined) {
            item.m2b_original = values[idx];
            item.m2b_transformed = displayValues[idx];
          } 
          
          if (item.mean !== undefined) {
            item.mean_original = values[idx];
            item.mean_transformed = displayValues[idx];
          }
        }
      });
    }
    
    
    if (isLine) {
      // Line chart data - for Bar component with mixed chart types
      const lineDataset = {
        type: 'line',
        // Use different label based on whether it's a normalized model
        label: 'Mean Contour',
        data: displayValues, // Use displayValues which will be the same as values for line charts
        // Debug info about dataset
        _debug: {
          isNormalized,
          isStressContourLine,
          valuesLength: values.length,
          displayValuesLength: displayValues.length,
          sampleValues: values.slice(0, 3)
        },
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: NORMALIZED_MODEL_COLORS.contourLine, // Consistent color for all models
        borderWidth: 3, // Use thicker line for all models
        tension: 0.35,
        fill: false,
        pointRadius: 4, // Larger points for all models
        pointBackgroundColor: NORMALIZED_MODEL_COLORS.contourPoint,
        pointBorderColor: NORMALIZED_MODEL_COLORS.contourPointBorder,
        pointBorderWidth: 1,
        order: 0, // Ensure line is drawn on top of bars (lower order appears on top)
        // Enable spanning gaps for null values
        spanGaps: true,
        // Store original data for tooltips
        originalData: series.data,
        // Use appropriate y-axis based on whether this is a normalized model
        yAxisID: getYAxisID('line', isNormalized)
      };
      
      datasets.push(lineDataset);
    } else {
      // Bar chart data
      const barDataset = {
        type: 'bar',
        label: `${series.label || ''}`,
        data: displayValues, // Use transformed values for raw bar charts
        // Determine background color based on strict hierarchy of rules:
        // 1. Series models always use series colors
        // 2. Normalized non-series with default scheme always use blue 
        // 3. Default color scheme always uses fixed colors regardless of stored colors
        // 4. POS/Stress color schemes use mapped colors
        backgroundColor: isSeriesModel 
          ? getSeriesColor(series.label) // Series model colors always take precedence
          : (colorScheme === 'default')
              ? (isNormalized 
                  ? NORMALIZED_MODEL_COLORS.bar // Force blue for normalized
                  : '#4CAF50') // Force green for non-normalized
              : series.data.map(item => item.color || '#4CAF50'), // Use mapped colors for non-default schemes
              
        // Border color follows same rules as background color
        borderColor: isSeriesModel
          ? getSeriesColor(series.label) // Series model colors always take precedence
          : (colorScheme === 'default')
              ? (isNormalized 
                  ? NORMALIZED_MODEL_COLORS.barBorder // Force blue border for normalized
                  : '#3d8b40') // Force darker green for non-normalized
              : series.data.map(item => {
                  // Create a slightly darker border color for better definition
                  if (!item.color) return '#3d8b40'; // Darker version of the default color
                  return darkenColor(item.color); // Darken color for border
                }),
        borderWidth: 2, // Use thicker border for all models
        order: 1, // Draw bars behind lines (higher order appears below)
        // Store original data for tooltips
        originalData: series.data,
        // Use appropriate y-axis based on whether this is a normalized model
        yAxisID: getYAxisID('bar', isNormalized),
        // Add custom property to control legend display
        hideColorBox: !isSeriesModel && colorScheme !== 'default'
      };
      
      datasets.push(barDataset);

      // Collect bar values for dynamic y-axis scaling
      displayValues.forEach(v => {
        if (v !== null && v !== undefined && !isNaN(v)) {
          barValues.push(v);
        }
      });
    }
  });
  
  // Compute min/max for y-axis scaling
  let yMin = 0;
  let yMax = 1;
  if (barValues.length > 0) {
    yMin = Math.min(0, ...barValues); // Always start at 0 or below lowest value
    yMax = Math.max(...barValues);
    // Add a margin for visual clarity
    const margin = (yMax - yMin) * 0.1 || 0.1;
    yMax += margin;
    // For normalized models, don't exceed 1.2
    if (isNormalized) {
      yMax = Math.min(yMax, 1.2);
    }
    // For non-normalized, don't exceed 5.5 unless data is higher
    else {
      yMax = Math.max(yMax, 1);
    }
    // Round for whole number axis
    yMin = Math.floor(yMin);
    yMax = Math.ceil(yMax);
  }

  console.log('DEBUG - adaptDataForChartJS returning:', {
    labelsLength: labels.length,
    datasetsCount: datasets.length,
    datasetDetails: datasets.map(ds => ({
      type: ds.type,
      label: ds.label,
      dataLength: ds.data?.length,
      sampleData: ds.data?.slice(0, 3)
    })),
    yMin,
    yMax
  });
  
  return { labels, datasets, yMin, yMax };
};

/**
 * Creates Chart.js options configuration
 * @param {Function} handleTooltip - Function to handle tooltip display
 * @param {Function} closeTooltip - Function to close tooltip
 * @param {boolean} isNormalized - Whether the model is normalized
 * @param {string} colorScheme - The color scheme to use (pos, stress, default)
 * @param {boolean} isSeriesModel - Whether this is a series model (multiple datasets)
 * @returns {Object} Chart.js options
 */
export const createChartOptions = (
  handleTooltip,
  closeTooltip,
  isNormalized = false,
  colorScheme = 'default',
  isSeriesModel = false,
  yMin = 0,
  yMax = 1
) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1, // Ensure proper rendering on high DPI screens
    animation: {
      duration: 0 // Disable animations for sharper initial render
    },
    interaction: {
      mode: 'point',
      intersect: true, // Only show tooltip when directly over a point/bar
      axis: 'x'
    },
    elements: {
      line: {
        borderWidth: 3,
        tension: 0.35,
        capBezierPoints: true,
      },
      point: {
        radius: 4,
        hitRadius: 8,
        hoverRadius: 6,
      },
      bar: {
        borderWidth: 2,
      }
    },
    // Enable mixed chart types
    plugins: {
      tooltip: {
        enabled: true, // Enable tooltips to show values on hover
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'white',
        borderWidth: 1,
        titleFont: {
          size: 13,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        padding: 8,
        displayColors: false, // Hide the color box
        callbacks: {
          title: (tooltipItems) => {
            // Return the label (word) as title
            return tooltipItems[0].label || '';
          },
          label: (context) => {
            // Format the value display
            const dataset = context.dataset;
            const value = context.parsed.y;
            const label = dataset.label || '';
            
            // Format value to 3 decimal places for precision
            const formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
            
            // Return formatted string
            return `${label}: ${formattedValue}`;
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12 // Smaller font on mobile
          },
          boxWidth: window.innerWidth < 576 ? 12 : 16, // Smaller color boxes on mobile
          padding: window.innerWidth < 576 ? 8 : 10, // Adjust padding for better mobile display
          
          // Custom legend label generation to conditionally hide color boxes
          generateLabels: function(chart) {
            // Get default legend labels
            const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
            
            // Process each label to conditionally hide color boxes
            return originalLabels.map(label => {
              const dataset = chart.data.datasets[label.datasetIndex];
              
              // Check the dataset's hideColorBox property first (highest priority)
              // or use the isSeriesModel and colorScheme conditions
              if (dataset.hideColorBox || 
                 (!isSeriesModel && colorScheme !== 'default' && dataset.type === 'bar')) {
                // Make the color box completely transparent
                label.lineWidth = 0;
                label.strokeStyle = 'transparent';
                label.fillStyle = 'transparent';
                // Adjust boxWidth to zero to completely remove the space
                label.boxWidth = 0;
              }
              
              return label;
            });
          }
        },
        // Add hover effects to indicate clickability - only for legend items
        onHover: function(e, legendItem, legend) {
          // Only apply hover effects if we have a valid legendItem 
          if (legendItem && legendItem.datasetIndex !== undefined) {
            if (e && e.native && e.native.target) {
              // Get the actual legend item element or its container
              const target = e.native.target;
              
              // Apply hover effects to the target
              target.style.cursor = 'pointer';
              
              // Log what we're hovering for debugging
              console.log('Hovering legend item:', {
                element: target,
                legendItem: legendItem
              });
            }
          }
        },
        onLeave: function(e, legendItem, legend) {
          // Only handle leave events if we have a valid legendItem
          if (legendItem && legendItem.datasetIndex !== undefined) {
            if (e && e.native && e.native.target) {
              // Get the element we're leaving
              const target = e.native.target;
              
              // Reset the cursor style to default
              target.style.cursor = 'default';
            }
          }
        },
        // Improve touch interactions on mobile
        onClick: function(e, legendItem, legend) {
          // Get the index of the clicked dataset
          const index = legendItem.datasetIndex;
          const meta = this.chart.getDatasetMeta(index);
          
          // Toggle the visibility with a slightly larger touch area
          meta.hidden = meta.hidden === null ? !this.chart.data.datasets[index].hidden : null;
          
          // Update the chart
          this.chart.update();
        }
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)' // Light grid for x-axis
        },
        ticks: {
          padding: 8,
          font: {
            weight: 'bold',
            size: window.innerWidth < 768 ? 10 : 12 // Smaller font on mobile
          },
          maxRotation: window.innerWidth < 576 ? 45 : 0, // Rotate labels on very small screens
          autoSkip: true, // Skip labels that don't fit
          autoSkipPadding: window.innerWidth < 768 ? 15 : 10 // More padding on mobile for readability
        }
      },
      y: {
        stacked: false,
        grid: {
          display: true,
          color: 'rgba(0, 0, 255, 0.1)' // Light blue grid for all models
        },
        min: yMin,
        // Set max range appropriate for both bars and contour line
        max: yMax,
        ticks: {
          padding: 8,
          callback: isNormalized
            ? value => value.toFixed(1)
            : value => Number.isInteger(value) ? value : '',
          stepSize: isNormalized ? 0.1 : 1,
          font: {
            weight: 500, // Semi-bold
            size: window.innerWidth < 768 ? 10 : 12 // Smaller font on mobile
          },
          maxTicksLimit: window.innerWidth < 576 ? 5 : 8 // Fewer ticks on small screens
        },
        // This is important for mixed chart types
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Predicted Normal Stress ',
          color: isNormalized ? 
            (isSeriesModel ? getSeriesColor('m1') : NORMALIZED_MODEL_COLORS.bar) : 
            '#4CAF50', // Match color to bars
          font: {
            weight: 'bold',
            size: 12
          }
        }
      }
    }
  };
};
