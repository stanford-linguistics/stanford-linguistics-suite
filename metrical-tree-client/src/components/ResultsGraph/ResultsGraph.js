import React, { forwardRef, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Popper, makeStyles, alpha } from '@material-ui/core';

import debounce from 'lodash/debounce';
import { Bar } from 'react-chartjs-2';
import ResizableBox from 'components/ResizableBox';
import './utils/chartJsSetup';

import usePagination from './hooks/usePagination';
import useChartDisplay from './hooks/useChartDisplay';
import { createChartOptions } from './utils/chartJsAdapter';
import useChartData from './hooks/useChartData';
import useKeyboardNavigation from './hooks/useKeyboardNavigation';

import { extractDataFromModel } from './utils/dataProcessing';
import { calculateChunkStats, detectPatterns } from './utils/statisticsCalculations';
import { 
  exportAsImage, 
  exportAsCsv, 
  exportState, 
  exportAsPdf,
  exportAllAsImages,
  exportAllAsPdf
} from './utils/exportHelpers';

import SentencePreview from './components/SentencePreview';
import NavigationControls from './components/NavigationControls';
import DataTooltip from './components/DataTooltip';
import ChartDisplayOptions from './components/ChartDisplayOptions';
import ExportControls from './components/ExportControls';
import ContourMinimap from './components/ContourMinimap';

import { DEFAULT_CHUNK_SIZE } from './constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  resultsGraph: {
    padding: theme.spacing(2),
    position: 'relative',
    width: '100%',
    boxSizing: 'border-box',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0.5),
    },
    '& > * + *': {
      marginTop: theme.spacing(3),
      [theme.breakpoints.down('xs')]: {
        marginTop: theme.spacing(2),
      },
    },
  },
  unifiedContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(0),
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(3),
    overflow: 'hidden',
  },
  headerSection: {
    backgroundColor: theme.palette.background.default,
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(250,250,250,0.4) 100%)',
    borderBottom: `1px solid ${theme.palette.divider}`,
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius,
    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)',
  },
  contentSection: {
    padding: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
    },
  },
  previewSection: {
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  navigationWrapper: {
    padding: theme.spacing(1.5, 2),
    background: `linear-gradient(to bottom, ${alpha(theme.palette.background.default, 0.2)}, transparent)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartSectionContainer: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginTop: theme.spacing(2),
    overflow: 'hidden',
  },
  chartOptionsContainer: {
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1.5),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
    },
  },
  chartOuterContainer: {
    position: 'relative',
    padding: theme.spacing(2),
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0.5),
    },
    '& > div': {
      width: '100%',
      maxWidth: '100%',
      flex: '1 1 auto',
    },
  },
  chartContainer: {
    height: '100%',
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    // Apply crisp-edges rendering to all descendants
    '& *': {
      // Use proper vendor prefixing with combined property value
      imageRendering: '-webkit-optimize-contrast crisp-edges pixelated',
      '-ms-interpolation-mode': 'nearest-neighbor', // For IE
    },
    '& > div': {
      height: '100%',
      width: '100%',
      minWidth: '100%',
      // Force hardware acceleration
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden',
      perspective: 1000,
      // Anti-aliasing for text
      WebkitFontSmoothing: 'subpixel-antialiased',
      MozOsxFontSmoothing: 'auto',
    },
    '& canvas': {
      flex: '1 1 auto',
      // Prevent fractional scaling that causes blurry rendering
      transformOrigin: 'top left',
      // Ensure sharp edges on canvas
      shapeRendering: 'crispEdges',
    },
  },
  emptyData: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    backgroundColor: theme.palette.action.hover,
    borderRadius: theme.shape.borderRadius,
  },
  popper: {
    zIndex: 1500,
    padding: theme.spacing(1),
    filter: 'none', // Prevent filter blur
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  tooltip: {
    zIndex: 1500,
    transform: 'translateZ(0)', // Force GPU acceleration
    backfaceVisibility: 'hidden', // Prevent blurry text during animations
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
}));

export const ResultsGraph = forwardRef(({ model, fullApiResponse }, ref) => {
  const classes = useStyles();
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  
  // Extract raw data from the model for initialization
  const extractedData = useMemo(() => extractDataFromModel(model), [model]);
  
  // Set up chart display state and handlers
  const chartDisplayState = useChartDisplay(extractedData);
  const { showContourLine } = chartDisplayState;
  
  // Set up pagination state and handlers
  const paginationState = usePagination(extractedData, DEFAULT_CHUNK_SIZE);
  const {
    currentPage,
    chunkSize,
    needsChunking,
    totalPages,
    currentChunkData,
  } = paginationState;
  
  // Process chart data from paginated data
  const chartDataState = useChartData(model, chartDisplayState, paginationState, fullApiResponse);
  const {
    isVeryLongInput,
    fullSentence,
    chartData,
    chartJsData,
    isNormalized
  } = chartDataState;
  
  // Extract contour data from the API response or model
  const fullContourData = useMemo(() => {
    // Function to process contour values from a sentence
    const processContourValues = (contourStr) => {
      if (!contourStr) return [];
      return contourStr.split(' ').map(v => {
        // Return null for NaN values instead of 0 to enable spanGaps in chart
        return v.toLowerCase() === 'nan' ? null : parseFloat(v.trim());
      });
    };
    
    // Function to extract and combine contour data from all sentences
    const extractAllSentencesContourData = (sentencesObj) => {
      if (!sentencesObj) return [];
      
      
      // Get all sentence IDs and sort them numerically
      const sentenceIds = Object.keys(sentencesObj).sort((a, b) => parseInt(a) - parseInt(b));
      
      // Combine contour values from all sentences
      let combinedContourData = [];
      for (const sentenceId of sentenceIds) {
        if (sentencesObj[sentenceId]?.contourValues) {
          const sentenceContourData = processContourValues(sentencesObj[sentenceId].contourValues);
          combinedContourData = [...combinedContourData, ...sentenceContourData];
        }
      }
      
      return combinedContourData;
    };
    
    
    // Try to extract from API response first
    if (fullApiResponse?.sentences) {
      const contourData = extractAllSentencesContourData(fullApiResponse.sentences);
      if (contourData.length > 0) {
        return contourData;
      }
    }
    
    // Try to extract from model structure if API response doesn't have it
    if (model?.sentences) {
      const contourData = extractAllSentencesContourData(model.sentences);
      if (contourData.length > 0) {
      }
      return contourData;
    }
    
    return [];
  }, [fullApiResponse, model]);
  
  

  const { colorLegendData } = chartDisplayState;
  
  // Calculate statistics for the current chunk
  const chunkStats = useMemo(() => {
    const stats = calculateChunkStats(currentChunkData);
    return stats;
  }, [currentChunkData]);
  
  // Detect patterns in the current chunk - result is not used
  useMemo(() => {
    return detectPatterns(currentChunkData);
  }, [currentChunkData]);
  
  // Set up keyboard navigation
  useKeyboardNavigation(
    containerRef,
    {
      ...paginationState,
    },
    [totalPages, needsChunking]
  );
  
  // Tooltip state management
  const [tooltipData, setTooltipData] = useState(null);
  const [tooltipAnchorEl, setTooltipAnchorEl] = useState(null);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  // Use a ref to prevent setState during render and track hover state
  const tooltipRef = useRef({ 
    data: null, 
    element: null, 
    isHovering: false,
    hoverTimer: null
  });
  
  // Close tooltip function - defined before other tooltip functions to avoid circular dependency
  const closeTooltip = useCallback(() => {
    if (tooltipRef.current.hoverTimer) {
      clearTimeout(tooltipRef.current.hoverTimer);
      tooltipRef.current.hoverTimer = null;
    }
    
    tooltipRef.current.isHovering = false;
    setTooltipVisible(false);
    
    // Use a short delay before clearing data to prevent flickering
    // when moving between nearby elements
    setTimeout(() => {
      if (!tooltipRef.current.isHovering) {
        setTooltipData(null);
        setTooltipAnchorEl(null);
      }
    }, 100);
  }, []);
  
  // Create a debounced function to update tooltip state
  const debouncedTooltipUpdate = useMemo(() => 
    debounce((data, element) => {
      if (!data) return;
      
      setTooltipData(data);
      setTooltipAnchorEl(element);
      setTooltipVisible(true);
    }, 50), // 50ms debounce delay - shorter for better responsiveness
  []);
  
  // Tooltip handler that uses debouncing to prevent excessive updates
  const handleTooltip = useCallback((data, e) => {
    // Clear any existing hover timer
    if (tooltipRef.current.hoverTimer) {
      clearTimeout(tooltipRef.current.hoverTimer);
      tooltipRef.current.hoverTimer = null;
    }
    
    if (!data) {
      // If no data, prepare to close tooltip after a short delay
      tooltipRef.current.hoverTimer = setTimeout(() => {
        if (!tooltipRef.current.isHovering) {
          closeTooltip();
        }
      }, 100);
      return;
    }
    
    // Check if this is a contour point (from a line dataset)
    const isContourPoint = e.target?.dataset?.datasetIndex !== undefined && 
      chartJsData?.datasets?.[e.target.dataset.datasetIndex]?.type === 'line';
    
    // Get the dataset and index from the event
    const datasetIndex = parseInt(e.dataset?.datasetIndex || "0");
    const index = parseInt(e.dataset?.index || "0");
    
    // Get the original data from the dataset's originalData array
    // This is where our raw values are stored
    const originalDataset = chartJsData?.datasets?.[datasetIndex]?.originalData;
    const originalDataPoint = originalDataset?.[index];
    

    // Enhance data with contour information if available - use a simpler approach
    const enhancedData = { 
      ...data,
      isContourPoint: isContourPoint,
      contourValue: isContourPoint ? (data.mean || data.secondary) : undefined,
      isNormalized: isNormalized
    };
    
    // Copy raw values from the original data point if available
    if (originalDataPoint) {
      
      // Copy all raw values from the original data point
      enhancedData.originalSPEValue = originalDataPoint.originalSPEValue;
      enhancedData.transformedValue = originalDataPoint.transformedValue;
      
      // Copy specific metric values
      if (originalDataPoint.m1_original) {
        enhancedData.m1_original = originalDataPoint.m1_original;
        enhancedData.m1_transformed = originalDataPoint.m1_transformed;
      }
      
      if (originalDataPoint.m2a_original) {
        enhancedData.m2a_original = originalDataPoint.m2a_original;
        enhancedData.m2a_transformed = originalDataPoint.m2a_transformed;
      }
      
      if (originalDataPoint.m2b_original) {
        enhancedData.m2b_original = originalDataPoint.m2b_original;
        enhancedData.m2b_transformed = originalDataPoint.m2b_transformed;
      }
      
      if (originalDataPoint.mean_original) {
        enhancedData.mean_original = originalDataPoint.mean_original;
        enhancedData.mean_transformed = originalDataPoint.mean_transformed;
      }
    } else {
      // Use the values from the data object as fallback
      enhancedData.originalSPEValue = data.originalSPEValue;
      enhancedData.transformedValue = data.transformedValue;
    }
    
    
    // Make sure the specific metric original/transformed values are available
    // This ensures the tooltip can display the raw values properly
    if (data.originalSPEValue !== undefined && !data.m1_original && data.m1 !== undefined) {
      enhancedData.m1_original = data.originalSPEValue;
      enhancedData.m1_transformed = data.transformedValue;
    }
    if (data.originalSPEValue !== undefined && !data.m2a_original && data.m2a !== undefined) {
      enhancedData.m2a_original = data.originalSPEValue;
      enhancedData.m2a_transformed = data.transformedValue;
    }
    if (data.originalSPEValue !== undefined && !data.m2b_original && data.m2b !== undefined) {
      enhancedData.m2b_original = data.originalSPEValue;
      enhancedData.m2b_transformed = data.transformedValue;
    }
    if (data.originalSPEValue !== undefined && !data.mean_original && data.mean !== undefined) {
      enhancedData.mean_original = data.originalSPEValue;
      enhancedData.mean_transformed = data.transformedValue;
    }
    
    // Track that we're hovering
    tooltipRef.current.isHovering = true;
    tooltipRef.current.data = enhancedData;
    tooltipRef.current.element = e.target;
    
    // Use debounced update to prevent excessive re-renders
    debouncedTooltipUpdate(enhancedData, e.target);
  }, [chartJsData, isNormalized, debouncedTooltipUpdate, closeTooltip]);
  
  // Clean up debounced function and timers on unmount
  useEffect(() => {
    // Capture the current ref value to use in cleanup
    const tooltipRefValue = tooltipRef.current;
    
    return () => {
      debouncedTooltipUpdate.cancel();
      if (tooltipRefValue.hoverTimer) {
        clearTimeout(tooltipRefValue.hoverTimer);
      }
    };
  }, [debouncedTooltipUpdate]);
  
  // Export handlers
  const handleExportImage = useCallback(() => {
    exportAsImage(chartRef, colorLegendData);
  }, [colorLegendData]);
  
  const handleExportCsv = useCallback(() => {
    exportAsCsv(extractedData, `linguistic-data-${new Date().toISOString().split('T')[0]}.csv`);
  }, [extractedData]);
  
  const handleExportState = useCallback(() => {
    exportState(
      model,
      {
        colorScheme: chartDisplayState.colorScheme
      },
      currentPage,
      chunkStats
    );
  }, [model, chartDisplayState, currentPage, chunkStats]);
  
  const handleExportPdf = useCallback(() => {
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    exportAsPdf(
      chartRef,
      modelName,
      {
        modelName,
        colorScheme: chartDisplayState.colorScheme,
        currentPage
      },
      colorLegendData
    );
  }, [model, chartRef, chartDisplayState, currentPage, colorLegendData]);
  
  const handleExportAllImages = useCallback(() => {
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    exportAllAsImages(
      chartRef,
      totalPages,
      paginationState.setCurrentPage,
      modelName,
      {
        modelName,
        colorScheme: chartDisplayState.colorScheme,
        currentPage
      },
      colorLegendData
    );
  }, [model, chartRef, totalPages, paginationState.setCurrentPage, chartDisplayState, currentPage, colorLegendData]);
  
  const handleExportAllPdf = useCallback(() => {
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    exportAllAsPdf(
      chartRef,
      totalPages,
      paginationState.setCurrentPage,
      modelName,
      {
        modelName,
        colorScheme: chartDisplayState.colorScheme,
        currentPage
      },
      colorLegendData
    );
  }, [model, chartRef, totalPages, paginationState.setCurrentPage, chartDisplayState, currentPage, colorLegendData]);
  
  const chartOptions = useMemo(() => {
    // Pass empty functions for tooltip handlers since tooltips are disabled
    return createChartOptions(() => {}, () => {}, isNormalized);
  }, [isNormalized]);
  
  const renderChart = () => {
    const isLoading = model && !model?.value?.[0]?.data?.length;
    
    if (isLoading) {
      return (
        <div className={classes.emptyData}>
          <Typography variant="body2" color="textSecondary">
            Loading chart data...
          </Typography>
        </div>
      );
    }
    
    if (!model?.value?.[0]?.data || !chartData || !chartData.length || !chartData[0]?.data?.length) {
      return (
        <div className={classes.emptyData}>
          <Typography variant="body2" color="textSecondary">
            No data to display
          </Typography>
        </div>
      );
    }
    

  
  return (
    <>
      <ResizableBox 
        width="100%" 
        height={400}
        style={{
          width: '100%',
          minWidth: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          overflow: 'hidden',
          display: 'flex', /* Added to ensure proper flex behavior */
          flexDirection: 'column'
        }}
      >
          <div
            className={classes.chartContainer}
            ref={chartRef}
          >
            <Bar
              data={chartJsData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                },
                scales: {
                  ...chartOptions.scales,
                  y: {
                    ...chartOptions.scales?.y,
                    type: 'linear'
                  }
                }
              }}
            />
          </div>
        </ResizableBox>
      </>
    );
  };
  
  return (
    <div className={classes.resultsGraph} ref={ref}>
      <div ref={containerRef} tabIndex={0} style={{ outline: 'none', width: '100%' }}>
        {/* Unified Container for Title, Export Controls, Preview and Minimap */}
        <div className={classes.unifiedContainer}>
          {/* Header Combined with Export Controls */}
          <div className={classes.headerSection}>
            <ExportControls
              handleExportImage={handleExportImage}
              handleExportCsv={handleExportCsv}
              handleExportState={handleExportState}
              handleExportPdf={handleExportPdf}
              handleExportAllImages={needsChunking ? handleExportAllImages : undefined}
              handleExportAllPdf={needsChunking ? handleExportAllPdf : undefined}
              totalPages={totalPages}
              modelName={model?.value?.[0]?.label || "m2a (raw)"}
            />
          </div>
          
          {/* Text Preview and Contour Minimap Section */}
          <div className={`${classes.contentSection} ${classes.previewSection}`}>
            <SentencePreview
              fullSentence={fullSentence}
              needsChunking={needsChunking}
              isVeryLongInput={isVeryLongInput}
              currentPage={currentPage}
              chunkSize={chunkSize}
              totalWords={extractedData.length}
              fullContourData={fullContourData}
              onNavigate={paginationState.setCurrentPage}
            />
            
            {/* 
              Stress Contour Minimap temporarily disabled for now
              
              {fullContourData && fullContourData.length > 0 && extractedData.length > 1 && (
                <ContourMinimap
                  fullContourData={fullContourData}
                  currentPage={currentPage}
                  chunkSize={chunkSize}
                  totalWords={extractedData.length}
                  onNavigate={paginationState.setCurrentPage}
                />
              )}
            */}
          </div>
          
          {/* Navigation Controls Section */}
          {needsChunking && (
            <div className={classes.navigationWrapper}>
              <NavigationControls
                {...paginationState}
                isVeryLongInput={isVeryLongInput}
              />
            </div>
          )}
        </div>

        <div className={classes.chartSectionContainer}>
          <div className={classes.chartOptionsContainer}>
          <ChartDisplayOptions
            colorScheme={chartDisplayState.colorScheme}
            handleColorSchemeChange={chartDisplayState.handleColorSchemeChange}
            colorOptions={chartDisplayState.colorOptions}
            colorLegendData={colorLegendData}
            showContourLine={showContourLine}
            handleContourLineToggle={chartDisplayState.handleContourLineToggle}
            isNormalized={isNormalized}
            isSeriesModel={chartJsData?.datasets?.filter(d => d.type === 'bar').length > 1}
          />
          </div>
          
          <div className={classes.chartOuterContainer}>
            {renderChart()}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ResultsGraph;
