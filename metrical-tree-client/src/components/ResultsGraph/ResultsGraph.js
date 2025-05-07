import React, { forwardRef, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Popper, makeStyles } from '@material-ui/core';
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

import { DEFAULT_CHUNK_SIZE } from './constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  resultsGraph: {
    padding: theme.spacing(2),
    position: 'relative',
    '& > * + *': {
      marginTop: theme.spacing(3),
    },
  },
  chartOuterContainer: {
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4, 2),
    boxShadow: theme.shadows[1],
    marginTop: theme.spacing(3),
    '& > div': {
      width: '100%',
      maxWidth: '100%',
    },
  },
  chartContainer: {
    height: '100%',
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
    '& > div': {
      height: '100%',
      width: '100% !important', // Force full width
      minWidth: '100%',
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
  },
  tooltip: {
    zIndex: 1500,
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
    chartJsData
  } = chartDataState;
  

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
  
  // Use a ref to prevent setState during render
  const tooltipRef = useRef({ data: null, element: null, needsUpdate: false });
  
  // Tooltip handler that updates a ref instead of state directly
  const handleTooltip = useCallback((data, e) => {
    tooltipRef.current = { 
      data: data || null, 
      element: data ? e.target : null,
      needsUpdate: true
    };
  }, []);
  
  // Update tooltip state outside of render phase
  useEffect(() => {
    if (tooltipRef.current.needsUpdate) {
      setTooltipData(tooltipRef.current.data);
      setTooltipAnchorEl(tooltipRef.current.element);
      tooltipRef.current.needsUpdate = false;
    }
  }, []);
  
  const closeTooltip = useCallback(() => {
    setTooltipData(null);
    setTooltipAnchorEl(null);
  }, []);
  
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
    return createChartOptions(handleTooltip, closeTooltip);
  }, [handleTooltip, closeTooltip]);
  
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
    
  console.log('[DEBUG-CONTOUR] Chart.js data before rendering:', {
    chartJsData,
    hasChartData: !!chartJsData,
    datasetCount: chartJsData?.datasets?.length || 0,
    hasLineDataset: chartJsData?.datasets?.some(d => d.type === 'line'),
    showContourLine
  });
  
  return (
    <>
      <ResizableBox 
        width="100%" 
        height={400}
        style={{
          width: '100%',
          minWidth: '100%'
        }}
      >
          <div
            className={classes.chartContainer}
            ref={chartRef}
            onMouseLeave={closeTooltip}
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
        
        <Popper
          open={Boolean(tooltipData)}
          anchorEl={tooltipAnchorEl}
          placement="top"
          className={classes.popper}
          modifiers={{
            offset: {
              enabled: true,
              offset: '0, 10',
            },
          }}
        >
          <div className={classes.tooltip}>
            <DataTooltip data={tooltipData} />
          </div>
        </Popper>
      </>
    );
  };
  
  return (
    <div className={classes.resultsGraph} ref={ref}>
      <div ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
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
        <SentencePreview
          fullSentence={fullSentence}
          needsChunking={needsChunking}
          isVeryLongInput={isVeryLongInput}
          currentPage={currentPage}
          chunkSize={chunkSize}
          totalWords={extractedData.length}
        />

        {needsChunking && (
          <div style={{ marginTop: '1rem', marginBottom: '2rem' }}>
            <NavigationControls
              {...paginationState}
              isVeryLongInput={isVeryLongInput}
            />
          </div>
        )}

        <div className={classes.chartOuterContainer}>
          {renderChart()}
        </div>

        <ChartDisplayOptions
          colorScheme={chartDisplayState.colorScheme}
          handleColorSchemeChange={chartDisplayState.handleColorSchemeChange}
          colorOptions={chartDisplayState.colorOptions}
          colorLegendData={colorLegendData}
          showContourLine={showContourLine}
          handleContourLineToggle={chartDisplayState.handleContourLineToggle}
        />
      </div>
    </div>
  );
});

export default ResultsGraph;
