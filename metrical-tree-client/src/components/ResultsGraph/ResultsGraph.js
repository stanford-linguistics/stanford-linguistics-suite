import React, { forwardRef, useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { Typography, Popper, makeStyles, Tooltip, Paper } from '@material-ui/core';
import { Chart } from 'react-charts';
import ResizableBox from 'components/ResizableBox';
import { 
  AssessmentOutlined as AssessmentIcon,
  TuneOutlined as TuneIcon 
} from '@material-ui/icons';

import usePagination from './hooks/usePagination';
import useFiltering from './hooks/useFiltering';
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
import LinguisticFilters from './components/LinguisticFilters';
import StatsPanel from './components/StatsPanel';
import ColorLegend from './components/ColorLegend';
import ExportControls from './components/ExportControls';

import { DEFAULT_CHUNK_SIZE, POS_CATEGORIES } from './constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  resultsGraph: {
    padding: theme.spacing(2),
    position: 'relative',
  },
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  titleIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  chartOuterContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(6),
    position: 'relative',
  },
  modelTitleContainer: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    padding: theme.spacing(0.5, 2),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${theme.palette.primary.light}`,
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      transform: 'translateX(-50%) translateY(-2px)',
    },
  },
  modelTitle: {
    fontWeight: 500,
    fontSize: '1rem',
    color: theme.palette.primary.main,
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
  },
  modelIcon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.75),
    color: theme.palette.primary.main,
  },
  chartContainer: {
    height: '100%',
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[1],
    overflow: 'hidden',
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

/**
 * Enhanced ResultsGraph component with pagination, filtering, tooltips and export
 * 
 * @param {Object} props - Component props
 * @param {Object} props.model - The data model
 * @param {React.Ref} ref - Forwarded ref
 * @returns {JSX.Element} The enhanced ResultsGraph component
 */
export const ResultsGraph = forwardRef(({ model }, ref) => {
  const classes = useStyles();
  const chartRef = useRef(null);
  const containerRef = useRef(null);
  
  // Extract raw data from the model for initialization
  const rawData = useMemo(() => {
    const extractedData = extractDataFromModel(model);
    return extractedData;
  }, [model]);
  
  // Set up filtering state and handlers
  const filteringState = useFiltering(rawData);
  const { 
    filteredData,
    colorScheme
  } = filteringState;
  
  // Set up pagination state and handlers
  const paginationState = usePagination(filteredData, DEFAULT_CHUNK_SIZE);
  const {
    currentPage,
    chunkSize,
    needsChunking,
    totalPages,
    currentChunkData,
    resetPagination
  } = paginationState;
  
  // Process chart data from filtered and paginated data
  const chartDataState = useChartData(model, filteringState, paginationState);
  const {
    extractedData,
    isVeryLongInput,
    fullSentence,
    chartData
  } = chartDataState;
  
  // Calculate statistics for the current chunk
  const chunkStats = useMemo(() => {
    const stats = calculateChunkStats(currentChunkData, POS_CATEGORIES);
    return stats;
  }, [currentChunkData]);
  
  // Detect patterns in the current chunk
  const patterns = useMemo(() => {
    return detectPatterns(currentChunkData);
  }, [currentChunkData]);
  
  // Set up keyboard navigation
  useKeyboardNavigation(
    containerRef,
    {
      ...paginationState,
      toggleFilters: filteringState.toggleFilters
    },
    [totalPages, needsChunking]
  );
  
  // Reset pagination when filters change
  useEffect(() => {
    resetPagination();
  }, [filteringState.posFilter, filteringState.stressFilter, filteringState.syllableFilter, resetPagination]);
  
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
    exportAsImage(chartRef);
  }, []);
  
  const handleExportCsv = useCallback(() => {
    exportAsCsv(rawData, `linguistic-data-${new Date().toISOString().split('T')[0]}.csv`);
  }, [rawData]);
  
  const handleExportState = useCallback(() => {
    exportState(
      model,
      {
        posFilter: filteringState.posFilter,
        stressFilter: filteringState.stressFilter,
        syllableFilter: filteringState.syllableFilter,
        colorScheme: filteringState.colorScheme
      },
      currentPage,
      chunkStats
    );
  }, [model, filteringState, currentPage, chunkStats]);
  
  const handleExportPdf = useCallback(() => {
    // Get the model name if available
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    
    exportAsPdf(
      chartRef,
      chunkStats,
      modelName,
      {
        modelName,
        filters: {
          posFilter: filteringState.posFilter,
          stressFilter: filteringState.stressFilter,
          syllableFilter: filteringState.syllableFilter
        },
        currentPage
      }
    );
  }, [model, chartRef, chunkStats, filteringState, currentPage]);
  
  // Export all pages as images
  const handleExportAllImages = useCallback(() => {
    // Get the model name if available
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    
    exportAllAsImages(
      chartRef,
      totalPages,
      paginationState.setCurrentPage,
      modelName,
      {
        modelName,
        filters: {
          posFilter: filteringState.posFilter,
          stressFilter: filteringState.stressFilter,
          syllableFilter: filteringState.syllableFilter
        },
        currentPage
      }
    );
  }, [model, chartRef, totalPages, paginationState.setCurrentPage, filteringState, currentPage]);
  
  // Export all pages as PDF
  const handleExportAllPdf = useCallback(() => {
    // Get the model name if available
    const modelName = model?.value?.[0]?.label || "Linguistic Analysis";
    
    // Function to calculate stats for current page
    const getCurrentPageStats = () => chunkStats;
    
    exportAllAsPdf(
      chartRef,
      totalPages,
      paginationState.setCurrentPage,
      getCurrentPageStats,
      modelName,
      {
        modelName,
        filters: {
          posFilter: filteringState.posFilter,
          stressFilter: filteringState.stressFilter,
          syllableFilter: filteringState.syllableFilter
        },
        currentPage
      }
    );
  }, [model, chartRef, totalPages, paginationState.setCurrentPage, chunkStats, filteringState, currentPage]);
  
  // Chart configuration
  const primaryAxis = useMemo(
    () => ({
      getValue: (datum) => {
        // Prioritize text labels (primary/word) over numeric indices (widx)
        // This prevents labels from switching to numbers when filters are applied
        return datum.primary || datum.word || datum.widx;
      },
      elementType: 'bar'
    }),
    []
  );
  
  const secondaryAxes = useMemo(
    () => [
      {
        getValue: (datum) => parseFloat(datum.m1 || datum.mean || datum.secondary),
        elementType: 'bar',
        valueFormat: value => Number(value).toFixed(1)
      }
    ],
    []
  );
  
  const renderChart = () => {
    if (!model || !chartData || !chartData.length || !chartData[0].data || !chartData[0].data.length) {
      return (
        <div className={classes.emptyData}>
          <Typography variant="body2" color="textSecondary">
            No data to display
          </Typography>
        </div>
      );
    }
    
    return (
      <div className={classes.chartOuterContainer}>
        {/* Prominent Model Title */}
        {model?.value?.[0]?.label && (
          <div>
            <Tooltip title="Currently selected model">
              <div>
                <Paper className={classes.modelTitleContainer} elevation={3}>
                  <Typography className={classes.modelTitle}>
                    <TuneIcon className={classes.modelIcon} />
                    {model.value[0].label}
                  </Typography>
                </Paper>
              </div>
            </Tooltip>
          </div>
        )}
        
        <ResizableBox 
          width="100%" 
          height={350}
          style={{
            marginLeft: 0,
            marginBottom: 0,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}
        >
          <div
            className={classes.chartContainer}
            ref={chartRef}
            onMouseLeave={closeTooltip}
          >
            <Chart
              options={{
                data: chartData,
                primaryAxis,
                secondaryAxes,
                tooltip: {
                  render: ({ datum }, e) => {
                    handleTooltip(datum, e);
                    return <></>;
                  }
                },
                getSeriesStyle: (series) => {
                  return {
                    color: series?.color,
                  };
                },
                getDatumStyle: (datum) => {
                  return {
                    color: datum.originalDatum?.color,
                  };
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
      </div>
    );
  };
  
  return (
    <div className={classes.resultsGraph} ref={ref}>
      <div ref={containerRef} tabIndex={0} style={{ outline: 'none' }}>
        {/* Graph Title */}
        <div className={classes.titleContainer}>
          <AssessmentIcon className={classes.titleIcon} />
          <Typography variant="h6">{model?.value?.[0]?.label && model.value[0].label}</Typography>
        </div>
        
        {/* Export Controls */}
        <ExportControls
          handleExportImage={handleExportImage}
          handleExportCsv={handleExportCsv}
          handleExportState={handleExportState}
          handleExportPdf={handleExportPdf}
          handleExportAllImages={needsChunking ? handleExportAllImages : undefined}
          handleExportAllPdf={needsChunking ? handleExportAllPdf : undefined}
          totalPages={totalPages}
        />
        
        <LinguisticFilters
          {...filteringState}
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
          <NavigationControls
            {...paginationState}
            isVeryLongInput={isVeryLongInput}
          />
        )}
        
        <ColorLegend colorScheme={colorScheme} />
        
        {renderChart()}
        
        <StatsPanel 
          stats={chunkStats} 
          patterns={patterns}
          totalWords={extractedData.length}
        />
      </div>
    </div>
  );
});

export default ResultsGraph;
