/**
 * Adapts data from our format to Chart.js format
 * @param {Array} chartData - Data in react-charts format
 * @param {boolean} showContourLine - Whether to show the contour line
 * @returns {Object} Data in Chart.js format
 */
export const adaptDataForChartJS = (chartData, showContourLine = true) => {
  if (!chartData || !chartData.length || !chartData[0]?.data?.length) {
    return { labels: [], datasets: [] };
  }
  
  // Debug logging
  console.log('[adaptDataForChartJS] chartData:', chartData);
  console.log('[adaptDataForChartJS] showContourLine:', showContourLine);
  
  // Detailed debug of chart data structure
  console.log('[DEBUG-CONTOUR] chartData structure:', 
    chartData.map(series => ({
      label: series.label,
      type: series.elementType,
      dataCount: series.data?.length || 0,
      hasData: !!series.data?.length
    }))
  );
  
  // Check if we have contour data - log each series structure for debugging
  console.log('[adaptDataForChartJS] Checking chart data for contour series:', 
    chartData.map(series => ({
      label: series.label, 
      type: series.elementType,
      isLine: series.elementType === 'line' || series.label === 'Stress Contour'
    }))
  );
  
  const hasContourData = chartData.some(series => 
    series.elementType === 'line' || series.label === 'Stress Contour'
  );
  console.log('[adaptDataForChartJS] hasContourData:', hasContourData);
  
  // More detailed logging for contour series
  if (hasContourData) {
    const contourSeries = chartData.find(series => 
      series.elementType === 'line' || series.label === 'Stress Contour'
    );
    console.log('[adaptDataForChartJS] Contour series found:', contourSeries?.label);
    console.log('[adaptDataForChartJS] Contour series data points:', contourSeries?.data?.length || 0);
    console.log('[adaptDataForChartJS] Contour series data sample:', contourSeries?.data?.[0]);
  }
  
  // Extract labels from the first series
  const labels = chartData[0].data.map(item => item.primary || item.word || '');
  
  // Create datasets - including both bar and line charts
  const datasets = [];
  
  // Dump the structure of each series in the chart data for debugging
  console.log('[adaptDataForChartJS] Analyzing chart data series:', 
    chartData.map(series => ({
      label: series.label,
      elementType: series.elementType,
      isLineType: series.elementType === 'line' || series.label === 'Stress Contour',
      dataCount: series.data?.length
    }))
  );
  
  // Process each series
  chartData.forEach(series => {
    // CRITICAL: Check both elementType and label for line identification
    const isLine = series.elementType === 'line' || series.label === 'Stress Contour';
    console.log('[adaptDataForChartJS] Processing series:', series.label, 'elementType:', series.elementType, 'isLine:', isLine);
    
    // Skip contour line if hidden
    if (isLine && !showContourLine) {
      console.log('[adaptDataForChartJS] Skipping contour line because showContourLine is false');
      return;
    }
    
    // Extract values from data
    const values = series.data.map(item => parseFloat(item.secondary || item.mean || 0));
    console.log('[adaptDataForChartJS] Values for', series.label, ':', values.length, 'points');
    
    if (isLine) {
      // Line chart data - for Bar component with mixed chart types
      const lineDataset = {
        type: 'line',
        label: series.label || '',
        data: values,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        borderColor: '#FF1493',
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        pointRadius: 3,
        pointBackgroundColor: '#FF1493',
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 1,
        order: 0, // Ensure line is drawn on top of bars (lower order appears on top)
        // Store original data for tooltips
        originalData: series.data
      };
      
      console.log('[adaptDataForChartJS] Created line dataset for:', series.label, 'with', values.length, 'points');
      datasets.push(lineDataset);
    } else {
      // Bar chart data
      const barDataset = {
        type: 'bar',
        label: series.label || '',
        data: values,
        backgroundColor: series.data.map(item => item.color || '#4CAF50'),
        borderWidth: 1,
        order: 1, // Draw bars behind lines (higher order appears below)
        // Store original data for tooltips
        originalData: series.data
      };
      
      console.log('[adaptDataForChartJS] Created bar dataset for:', series.label, 'with', values.length, 'points');
      datasets.push(barDataset);
    }
  });
  
  // Final datasets check
  console.log('[adaptDataForChartJS] Final datasets:', 
    datasets.map(dataset => ({
      type: dataset.type,
      label: dataset.label,
      dataPoints: dataset.data.length
    }))
  );
  
  return { labels, datasets };
};

/**
 * Creates Chart.js options configuration
 * @param {Function} handleTooltip - Function to handle tooltip display
 * @param {Function} closeTooltip - Function to close tooltip
 * @returns {Object} Chart.js options
 */
export const createChartOptions = (handleTooltip, closeTooltip) => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    // Enable mixed chart types
    plugins: {
      tooltip: {
        enabled: false,
        external: (context) => {
          // Custom tooltip implementation
          const { chart, tooltip } = context;
          if (tooltip.opacity === 0) {
            closeTooltip();
            return;
          }
          
          const datasetIndex = tooltip.dataPoints[0].datasetIndex;
          const index = tooltip.dataPoints[0].dataIndex;
          const dataset = context.chart.data.datasets[datasetIndex];
          const originalData = dataset.originalData?.[index];
          
          if (originalData) {
            handleTooltip(originalData, { target: chart.canvas });
          }
        }
      },
      legend: {
        position: 'top',
      }
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          display: true
        },
        ticks: {
          padding: 8
        }
      },
      y: {
        stacked: false,
        grid: {
          display: true
        },
        min: 0,
        ticks: {
          padding: 8,
          callback: value => Number(value).toFixed(1)
        },
        // This is important for mixed chart types
        type: 'linear',
        position: 'left'
      }
    }
  };
};
