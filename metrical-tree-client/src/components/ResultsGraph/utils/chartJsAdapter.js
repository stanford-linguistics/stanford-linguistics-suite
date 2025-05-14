import { getYAxisID } from './modelNameUtils';
import { NORMALIZED_MODEL_COLORS } from '../constants/chartConfig';

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
 * @returns {Object} Data in Chart.js format
 */
export const adaptDataForChartJS = (chartData, showContourLine = true, isNormalized = false) => {
  if (!chartData || !chartData.length || !chartData[0]?.data?.length) {
    return { labels: [], datasets: [] };
  }
  // Extract labels from the first series
  const labels = chartData[0].data.map(item => item.primary || item.word || '');
  
  // Create datasets - including both bar and line charts
  const datasets = [];
  
  // Process each series
  chartData.forEach(series => {
    // CRITICAL: Check both elementType and label for line identification
    const isLine = series.elementType === 'line' || series.label === 'Stress Contour';

    
    // Skip contour line if hidden
    if (isLine && !showContourLine) {
      return;
    }
    
  // Extract values from data - preserving null values for spanGaps
  const values = series.data.map((item, idx) => {
    // If the value is null OR empty string, keep it as null
    // Empty strings are used for punctuation marks in the linguistic data
    if (item.secondary === null || item.secondary === "" || 
        item.mean === null || item.mean === "") {
      return null;
    }
    
    // Check for NaN after parsing
    const rawValue = item.secondary || item.mean;
    
    // Only use parseFloat for non-empty values
    const value = rawValue !== undefined && rawValue !== "" ? parseFloat(rawValue) : null;
    
    if (value === null || isNaN(value)) {
      return null;
    }
    
    return value;
  });
    

    // Apply SPE to grid transformation for raw models (not normalized) and bar charts only
    // This reverses the sense of the numbers so that smaller SPE numbers (louder stress) become taller bars
    
    // Check if this is a raw model (not normalized) that needs transformation
    const isRawModel = !isNormalized && !isLine && 
                      (series.label?.toLowerCase().includes('raw') || 
                       // Check for raw model API keys directly
                       series.label === 'm1' || 
                       series.label === 'm2a' || 
                       series.label === 'm2b' || 
                       series.label === 'mean');
    
    console.log(`DEBUG - Series: ${series.label}, isNormalized: ${isNormalized}, isLine: ${isLine}, isRawModel: ${isRawModel}`);
    
    // Only apply transformation for raw models and bar charts
    let displayValues;
    if (isRawModel) {
      console.log(`DEBUG - Applying speToGrid to ${series.label}, sample values:`, values.slice(0, 3));
      displayValues = speToGrid(values);
      console.log(`DEBUG - After speToGrid transformation:`, displayValues.slice(0, 3));
    } else {
      displayValues = values;
    }
    
    // For raw models, store both original and transformed values
    if (isRawModel) {
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
        label: 'Stress Contour (0-5)', // Consistent label for all models
        data: displayValues, // Use displayValues which will be the same as values for line charts
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
        label: isNormalized ? `${series.label || ''} (0-1)` : `${series.label || ''} (SPE to Grid)`,
        data: displayValues, // Use transformed values for raw bar charts
        backgroundColor: isNormalized 
          ? series.data.map(() => NORMALIZED_MODEL_COLORS.bar) 
          : series.data.map(item => item.color || '#4CAF50'),
        // Add a border color that's a slightly darker version of the background color
        borderColor: isNormalized
          ? series.data.map(() => NORMALIZED_MODEL_COLORS.barBorder)
          : series.data.map(item => {
              // Create a slightly darker border color for better definition
              if (!item.color) return '#3d8b40'; // Darker version of the default color
              
              // For existing colors, create a slightly darker border
              try {
                const color = item.color;
                // Return a slightly darker version of the color for border
                return color;
              } catch (e) {
                return '#3d8b40'; // Fallback to default darker color
              }
            }),
        borderWidth: 2, // Use thicker border for all models
        order: 1, // Draw bars behind lines (higher order appears below)
        // Store original data for tooltips
        originalData: series.data,
        // Use appropriate y-axis based on whether this is a normalized model
        yAxisID: getYAxisID('bar', isNormalized)
      };
      
      datasets.push(barDataset);
    }
  });
  
  return { labels, datasets };
};

/**
 * Creates Chart.js options configuration
 * @param {Function} handleTooltip - Function to handle tooltip display
 * @param {Function} closeTooltip - Function to close tooltip
 * @param {boolean} isNormalized - Whether the model is normalized
 * @returns {Object} Chart.js options
 */
export const createChartOptions = (handleTooltip, closeTooltip, isNormalized = false) => {
  // Track the last tooltip position to prevent excessive updates
  let lastTooltipPosition = { x: 0, y: 0 };
  let lastTooltipTime = 0;
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: window.devicePixelRatio || 1, // Ensure proper rendering on high DPI screens
    animation: {
      duration: 0 // Disable animations for sharper initial render
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
        enabled: false,
        external: (context) => {
          // Custom tooltip implementation
          const { chart, tooltip } = context;
          
          // If tooltip is hidden, close it
          if (tooltip.opacity === 0) {
            closeTooltip();
            return;
          }
          
          // Get current mouse position
          const position = {
            x: tooltip.caretX,
            y: tooltip.caretY
          };
          
          // On mobile, increase the activation area to make touch interactions easier
          const isMobile = window.innerWidth < 768;
          const touchThreshold = isMobile ? 15 : 5; // Larger threshold on mobile devices
          
          // Skip if position hasn't changed significantly and it's been less than 100ms
          const now = Date.now();
          const positionChanged = Math.abs(position.x - lastTooltipPosition.x) > touchThreshold || 
                                 Math.abs(position.y - lastTooltipPosition.y) > touchThreshold;
          const timeElapsed = now - lastTooltipTime > 100;
          
          if (!positionChanged && !timeElapsed) {
            return;
          }
          
          // Update last position and time
          lastTooltipPosition = position;
          lastTooltipTime = now;
          
          // Get data point information
          const datasetIndex = tooltip.dataPoints[0].datasetIndex;
          const index = tooltip.dataPoints[0].dataIndex;
          const dataset = context.chart.data.datasets[datasetIndex];
          const originalData = dataset.originalData?.[index];
          
          if (originalData) {
            handleTooltip(originalData, { 
              target: chart.canvas,
              dataset: {
                datasetIndex: datasetIndex,
                index: index,
                type: dataset.type
              }
            });
          }
        },
        // Increase interaction mode distance for better touch/mobile support
        mode: 'nearest',
        intersect: false,
        axis: 'x'
      },
      legend: {
        position: 'top',
        labels: {
          font: {
            size: window.innerWidth < 768 ? 10 : 12 // Smaller font on mobile
          },
          boxWidth: window.innerWidth < 576 ? 12 : 16, // Smaller color boxes on mobile
          padding: window.innerWidth < 576 ? 8 : 10 // Adjust padding for better mobile display
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
        min: 0,
        ticks: {
          padding: 8,
          callback: value => Number(value).toFixed(1),
          font: {
            weight: 500, // Semi-bold
            size: window.innerWidth < 768 ? 10 : 12 // Smaller font on mobile
          },
          maxTicksLimit: window.innerWidth < 576 ? 5 : 8 // Fewer ticks on small screens
        },
        // This is important for mixed chart types
        type: 'linear',
        position: 'left',
        // For normalized models, set a more appropriate max value
        ...(isNormalized ? { max: 1.2 } : {}),
        title: {
          display: true,
          text: isNormalized ? 'Normalized Value (0-1)' : 'SPE to Grid Value',
          color: isNormalized ? NORMALIZED_MODEL_COLORS.bar : '#4CAF50', // Match color to bars
          font: {
            weight: 'bold',
            size: 12
          }
        }
      },
      // Add a second y-axis for the contour line for all models
      y2: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 5.5, // Typical range for stress contour values
        grid: {
          drawOnChartArea: false, // Only show grid lines for the left axis
          color: 'rgba(255, 20, 147, 0.1)' // Light pink grid for contour
        },
        ticks: {
          padding: 8,
          callback: value => Number(value).toFixed(1),
          color: NORMALIZED_MODEL_COLORS.contourLine, // Match contour line color
          font: {
            weight: 500 // Semi-bold
          }
        },
        title: {
          display: true,
          text: 'Stress Contour (0-5)',
          color: NORMALIZED_MODEL_COLORS.contourLine,
          font: {
            weight: 'bold',
            size: 12
          }
        }
      }
    }
  };
};
