import React, { useState, useMemo, useCallback, Component, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Box,
  FormControlLabel,
  Switch,
  Tooltip,
  alpha,
} from '@material-ui/core';
import {
  BarChart as BarChartIcon,
  ShowChart as LineChartIcon,
  BubbleChart as ScatterPlotIcon,
  TableChart as TableIcon,
} from '@material-ui/icons';

// No color constants needed in this component
import VirtualizedTable from './components/VirtualizedTable';
import TableRow from './components/TableRow';

// Error boundary for VirtualizedTable
class TableErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("VirtualizedTable error:", error, errorInfo);
  }

  render() {

    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <Paper style={{ padding: '16px', marginBottom: '16px' }}>
          <Typography variant="h6" color="error" gutterBottom>
            Something went wrong with the table display.
          </Typography>
          <Typography variant="body2" paragraph>
            We're unable to display the data table due to a technical issue. 
            Try switching to the Visualization view or refreshing the page.
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Error details: {this.state.error?.message || "Unknown error"}
          </Typography>
        </Paper>
      );
    }

    return this.props.children;
  }
}

const useStyles = makeStyles((theme) => ({
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  metricsSelect: {
    minWidth: 150,
    marginRight: theme.spacing(1),
  },
  chartContainer: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    height: 360,
    position: 'relative',
    overflow: 'hidden',
  },
  chartPlaceholder: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.text.secondary,
    backgroundColor: alpha(theme.palette.background.default, 0.4),
    borderRadius: theme.shape.borderRadius,
  },
  tabs: {
    marginBottom: theme.spacing(2),
  },
  legend: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(1),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    marginRight: theme.spacing(1),
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: '50%',
    marginRight: theme.spacing(0.5),
  },
  tabContent: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
  },
  metricCard: {
    padding: theme.spacing(2),
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  metricValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  statsDivider: {
    margin: theme.spacing(2, 0),
  },
  statsGrid: {
    marginTop: theme.spacing(2),
  },
  statCard: {
    padding: theme.spacing(1.5),
    textAlign: 'center',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: '1.4rem',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  metricDescription: {
    marginTop: 'auto',
    fontSize: '0.8rem',
    color: theme.palette.text.secondary,
    paddingTop: theme.spacing(1),
  },
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderRight: 'none',
    },
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color']),
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
    position: 'relative', // For positioning sort indicators
  },
  sortIndicator: {
    marginLeft: theme.spacing(0.5),
    fontSize: '0.8rem',
    opacity: 0.7,
  },
  activeSortColumn: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
  columnCell: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
  },
  sortIcon: {
    fontSize: '0.9rem',
    marginLeft: theme.spacing(0.5),
    opacity: 0.8,
  },
  sortInfo: {
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
  },
  metricBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    position: 'relative',
    margin: theme.spacing(0.5, 0),
  },
  metricBar: {
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create('width'),
  },
  barLabel: {
    position: 'absolute',
    right: theme.spacing(1),
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: theme.palette.getContrastText(theme.palette.primary.main),
    zIndex: 2,
  },
  metricLabel: {
    fontSize: '0.8rem',
    marginBottom: theme.spacing(0.25),
    display: 'flex',
    justifyContent: 'space-between',
  },
  heatmapContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
    gap: 2,
    maxHeight: 300,
    overflowY: 'auto',
    padding: theme.spacing(1),
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    borderRadius: theme.shape.borderRadius,
  },
  heatmapCell: {
    width: '100%',
    paddingBottom: '100%', // Creates a square
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    cursor: 'pointer',
    transition: theme.transitions.create(['transform', 'box-shadow']),
    '&:hover': {
      transform: 'scale(1.1)',
      zIndex: 2,
      boxShadow: theme.shadows[2],
    },
  },
  distributionBar: {
    display: 'flex',
    width: '100%',
    height: 24,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  distributionSegment: {
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    color: 'white',
    transition: theme.transitions.create('width'),
  },
}));

// Descriptions for each metric
const metricDescriptions = {
  m1: "M1 measures the metrical strength of a word based on its position in the syntactic tree. Higher values indicate words that are more metrically prominent.",
  m2a: "M2a calculates metrical prominence considering adjacent word boundaries. It gives insights into rhythmic patterns at the phrasal level.",
  m2b: "M2b focuses on phonological properties of words and their syllabic structure to determine stress patterns.",
  mean: "The mean value represents the average of all metrics, providing a balanced view of a word's overall metrical strength."
};

// Mock visualization of data for demonstration
// In a real application, we would use a charting library like Chart.js, Recharts, or D3
const MetricBarChart = ({ data, metricKey, color }) => {
  const classes = useStyles();
  
  // Sort data by the selected metric in descending order
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => (parseFloat(b[metricKey]) || 0) - (parseFloat(a[metricKey]) || 0))
      .slice(0, 10); // Take top 10 for visualization
  }, [data, metricKey]);
  
  return (
    <div>
      <Typography variant="subtitle2" gutterBottom>
        Top Words by {metricKey.toUpperCase()}
      </Typography>
      {sortedData.map((item, index) => {
        const value = parseFloat(item[metricKey]) || 0;
        const normalizedValue = metricKey.startsWith('norm_') ? value : value * 0.2;
        const width = `${Math.min(normalizedValue * 100, 100)}%`;
        
        return (
          <div key={`${item.widx}-${item.sidx}-${index}`}>
            <div className={classes.metricLabel}>
              <span>
                <strong>{item.word}</strong> <small>({item.pos})</small>
              </span>
              <span>{value.toFixed(3)}</span>
            </div>
            <div className={classes.metricBarContainer}>
              <div 
                className={classes.metricBar} 
                style={{ 
                  width,
                  backgroundColor: color,
                }}
              />
              {/* Only add label for bars that are wide enough */}
              {normalizedValue > 0.3 && (
                <span className={classes.barLabel}>{value.toFixed(3)}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Metric heatmap visualization
const MetricHeatmap = ({ data, metricKey }) => {
  const classes = useStyles();
  
  const sortedData = useMemo(() => {
    return [...data]
      .sort((a, b) => (parseFloat(b[metricKey]) || 0) - (parseFloat(a[metricKey]) || 0))
      .slice(0, 100); // Take top 100 for visualization
  }, [data, metricKey]);
  
  return (
    <div className={classes.heatmapContainer}>
      {sortedData.map((item, index) => {
        const value = parseFloat(item[metricKey]) || 0;
        const normalizedValue = metricKey.startsWith('norm_') ? value : value * 0.2;
        
        // Generate a color from red (low) to green (high)
        const hue = Math.min(normalizedValue * 120, 120); // 0 is red, 120 is green
        const saturation = 80;
        const lightness = 50 - normalizedValue * 20; // Darker for higher values
        
        return (
          <Tooltip 
            key={`${item.widx}-${item.sidx}-${index}`}
            title={
              <div>
                <Typography variant="body2"><strong>{item.word}</strong> ({item.pos})</Typography>
                <Typography variant="caption">{metricKey}: {value.toFixed(3)}</Typography>
              </div>
            }
            placement="top"
          >
            <div 
              className={classes.heatmapCell}
              style={{ 
                backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
              }}
            />
          </Tooltip>
        );
      })}
    </div>
  );
};

// Distribution analysis component
const MetricDistribution = ({ data, metricKey }) => {
  const classes = useStyles();
  
  // Calculate distribution of values
  const distribution = useMemo(() => {
    const ranges = [
      { min: 0, max: 0.2, label: '0-0.2', color: '#e57373' },
      { min: 0.2, max: 0.4, label: '0.2-0.4', color: '#ffb74d' },
      { min: 0.4, max: 0.6, label: '0.4-0.6', color: '#fff176' },
      { min: 0.6, max: 0.8, label: '0.6-0.8', color: '#aed581' },
      { min: 0.8, max: 1.0, label: '0.8-1.0', color: '#81c784' },
    ];
    
    // Initialize counts
    const counts = ranges.map(range => ({
      ...range,
      count: 0,
    }));
    
    // Count items in each range
    data.forEach(item => {
      const value = parseFloat(item[metricKey]) || 0;
      const normalizedValue = metricKey.startsWith('norm_') ? value : Math.min(value * 0.2, 1);
      
      for (const range of counts) {
        if (normalizedValue >= range.min && normalizedValue < range.max) {
          range.count++;
          break;
        }
      }
    });
    
    // Calculate percentages
    const total = data.length;
    return counts.map(range => ({
      ...range,
      percentage: total > 0 ? (range.count / total) * 100 : 0,
    }));
  }, [data, metricKey]);
  
  return (
    <div>
      <Typography variant="subtitle2" gutterBottom>
        Distribution of {metricKey.toUpperCase()} Values
      </Typography>
      
      <div className={classes.distributionBar}>
        {distribution.map((range, index) => (
          <Tooltip 
            key={index}
            title={`${range.label}: ${range.count} words (${range.percentage.toFixed(1)}%)`}
            placement="top"
          >
            <div 
              className={classes.distributionSegment}
              style={{ 
                width: `${range.percentage}%`,
                backgroundColor: range.color,
                // If segment is too narrow, don't show any content
                ...(range.percentage < 5 ? { fontSize: 0 } : {})
              }}
            >
              {range.percentage >= 10 ? `${range.percentage.toFixed(0)}%` : ''}
            </div>
          </Tooltip>
        ))}
      </div>
      
      <Grid container spacing={1}>
        {distribution.map((range, index) => (
          <Grid item xs={4} sm={2} key={index}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div 
                style={{ 
                  width: 12, 
                  height: 12, 
                  backgroundColor: range.color,
                  marginRight: 4,
                  borderRadius: '2px'
                }} 
              />
              <Typography variant="caption">
                {range.label}: {range.count}
              </Typography>
            </div>
          </Grid>
        ))}
      </Grid>
    </div>
  );
};

// Statistical summary component
const MetricStats = ({ data, metricKey }) => {
  const classes = useStyles();
  
  // Calculate basic statistics
  const stats = useMemo(() => {
    const values = data
      .map(item => parseFloat(item[metricKey]) || 0)
      .filter(value => !isNaN(value));
    
    if (values.length === 0) {
      return {
        min: 0,
        max: 0,
        mean: 0,
        median: 0,
        stdDev: 0,
      };
    }
    
    // Sort values for median and percentile calculations
    const sortedValues = [...values].sort((a, b) => a - b);
    
    // Calculate mean
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / values.length;
    
    // Calculate median
    const median = values.length % 2 === 0
      ? (sortedValues[values.length / 2 - 1] + sortedValues[values.length / 2]) / 2
      : sortedValues[Math.floor(values.length / 2)];
    
    // Calculate standard deviation
    const squaredDifferences = values.map(value => Math.pow(value - mean, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      min: sortedValues[0],
      max: sortedValues[sortedValues.length - 1],
      mean,
      median,
      stdDev,
    };
  }, [data, metricKey]);
  
  return (
    <Grid container spacing={2} className={classes.statsGrid}>
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Minimum
          </Typography>
          <Typography className={classes.statValue}>
            {stats.min.toFixed(3)}
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Maximum
          </Typography>
          <Typography className={classes.statValue}>
            {stats.max.toFixed(3)}
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Mean
          </Typography>
          <Typography className={classes.statValue}>
            {stats.mean.toFixed(3)}
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Median
          </Typography>
          <Typography className={classes.statValue}>
            {stats.median.toFixed(3)}
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Std. Deviation
          </Typography>
          <Typography className={classes.statValue}>
            {stats.stdDev.toFixed(3)}
          </Typography>
        </Paper>
      </Grid>
      
      <Grid item xs={6} sm={4} md={2}>
        <Paper className={classes.statCard} elevation={1}>
          <Typography variant="caption" className={classes.statLabel}>
            Count
          </Typography>
          <Typography className={classes.statValue}>
            {data.length}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

/**
 * MetricAnalysisView component for focused analysis of metrics
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination object from useHybridPagination
 * @param {Array} props.data - Full data array (for filtering outside of pagination)
 * @returns {JSX.Element}
 */
const MetricAnalysisView = ({ pagination, data }) => {
  const classes = useStyles();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState('mean');
  const [selectedView, setSelectedView] = useState('visualization');
  const [showNormalized, setShowNormalized] = useState(true);
  
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
  const [localScrollIndex, setLocalScrollIndex] = useState(0);
  const containerHeightRef = useRef(600);
  

  
  // Define the metric options with useMemo to prevent recreating on every render
  const metricOptions = useMemo(() => [
    { value: 'position', label: 'Text Position', color: '#9C27B0' },
    { value: 'mean', label: 'Mean', color: '#4CAF50' },
    { value: 'm1', label: 'M1', color: '#2196F3' },
    { value: 'm2a', label: 'M2a', color: '#FFC107' },
    { value: 'm2b', label: 'M2b', color: '#FF5722' },
  ], []);
  
  // Get the actual metric key to use (normalized or raw)
  const actualMetricKey = useMemo(() => {
    return showNormalized && selectedMetric !== 'combined' 
      ? `norm_${selectedMetric}` 
      : selectedMetric;
  }, [selectedMetric, showNormalized]);
  
  // Get the color for the selected metric
  const selectedMetricColor = useMemo(() => {
    const metricOption = metricOptions.find(option => option.value === selectedMetric);
    return metricOption ? metricOption.color : '#2196F3';
  }, [selectedMetric, metricOptions]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle metric change
  const handleMetricChange = (event) => {
    setSelectedMetric(event.target.value);
  };
  
  // Toggle between raw and normalized values
  const handleNormalizedToggle = () => {
    setShowNormalized(!showNormalized);
  };
  
  // Handle view change
  const handleViewChange = (event, newValue) => {
    setSelectedView(newValue);
  };
  
  // Sort full data based on the selected metric and sort direction
  const sortedFullData = useMemo(() => {
    // Return empty array if data is undefined or empty
    if (!data || data.length === 0) return [];
    
    return [...data].sort((a, b) => {
      // For position sorting, follow the same ordering as WordFocusedView
      if (selectedMetric === 'position') {
        // First compare sentence index
        const sentenceCompare = parseInt(a.sidx, 10) - parseInt(b.sidx, 10);
        if (sentenceCompare !== 0) {
          // Apply sort direction to sentence comparison
          return sortDirection === 'asc' ? sentenceCompare : -sentenceCompare;
        }
        
        // If same sentence, compare word position within sentence
        const positionCompare = parseInt(a.widx, 10) - parseInt(b.widx, 10);
        return sortDirection === 'asc' ? positionCompare : -positionCompare;
      } else {
        // For metric sorting, use the selected metric
        const valueA = parseFloat(a[actualMetricKey]) || 0;
        const valueB = parseFloat(b[actualMetricKey]) || 0;
        
        // Apply sort direction
        return sortDirection === 'asc' 
          ? valueA - valueB  // Ascending: small to large
          : valueB - valueA; // Descending: large to small
      }
    });
  }, [data, actualMetricKey, selectedMetric, sortDirection]);
  
  // Use all data instead of just the current page for the scrollable view
  const currentPageData = useMemo(() => {
    if (!sortedFullData || sortedFullData.length === 0) return [];
    
    // Return all sorted data instead of paginating it
    return sortedFullData;
  }, [sortedFullData]);
  
  // Generate a function to create a compound index string
  const getCompoundIndex = useCallback((item) => {
    return `${item.widx}-${item.sidx}`;
  }, []);
  
  // Generate table columns for the data view
  const tableColumns = useMemo(() => {
    return [
      { 
        id: 'compound_index', 
        label: 'Index', 
        width: 80,
        getValue: (item) => getCompoundIndex(item) 
      },
      { id: 'word', label: 'Word', width: 120 },
      { id: 'pos', label: 'POS', width: 80, type: 'tag' },
      { id: 'lexstress', label: 'Stress', width: 80, type: 'tag' },
      { 
        id: actualMetricKey, 
        label: actualMetricKey.toUpperCase(), 
        width: 100, 
        type: 'metric' 
      },
      { id: 'nsyll', label: 'Syllables', width: 80 },
    ];
  }, [actualMetricKey, getCompoundIndex]);
  
  // Maps column IDs to metric names to ensure consistent sorting
  const mapColumnToMetric = useCallback((columnId) => {
    // First check if it's a position-related column
    if (columnId === 'compound_index' || 
        columnId === 'widx' || 
        columnId === 'position' ||
        columnId === 'norm_position' ||
        columnId.toUpperCase() === 'NORM_POSITION') {
      return 'position';
    }
    
    // Handle normalized metric keys (both lowercase and uppercase versions)
    if (columnId.startsWith('norm_') || columnId.startsWith('NORM_')) {
      return columnId.replace(/^norm_|^NORM_/, '').toLowerCase();
    }
    
    // Common metrics
    if (['mean', 'm1', 'm2a', 'm2b'].includes(columnId.toLowerCase())) {
      return columnId.toLowerCase();
    }
    
    // Special case for other columns - make them non-sortable metrics
    if (['word', 'pos', 'lexstress', 'stress', 'nsyll', 'syllables'].includes(columnId.toLowerCase())) {
      return columnId.toLowerCase();
    }
    
    // Default to the original column ID
    return columnId.toLowerCase();
  }, []);
  
  // Determines if a column is sortable
  const isColumnSortable = useCallback((columnId) => {
    const mappedMetric = mapColumnToMetric(columnId);
    
    // Check if it's one of our known sortable metrics
    return ['position', 'mean', 'm1', 'm2a', 'm2b'].includes(mappedMetric) ||
           // Or if it's a normalized version of a known metric
           metricOptions.some(option => option.value === mappedMetric);
  }, [mapColumnToMetric, metricOptions]);
  
  // Handle column header click for sorting
  const handleSortColumnClick = useCallback((columnId) => {
    // Skip if the column isn't sortable
    if (!isColumnSortable(columnId)) {
      return;
    }
    
    // Map the column ID to a metric
    const mappedMetric = mapColumnToMetric(columnId);
    
    // If clicking the same metric, toggle sort direction
    if (mappedMetric === selectedMetric) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking a different metric, change the selected metric
      // and reset sort direction to descending
      setSelectedMetric(mappedMetric);
      setSortDirection('desc');
    }
  }, [selectedMetric, mapColumnToMetric, isColumnSortable]);
  
  // Table header content with sort indicators
  const headerContent = useMemo(() => {
    return (
      <>
        {tableColumns.map((column) => {
          // Map column ID to metric for consistent comparison
          const columnMetric = mapColumnToMetric(column.id);
          
          // A column is the active sort column if its mapped metric matches the selected metric
          const isActiveSort = columnMetric === selectedMetric;
          
          // Determine if this column is sortable
          const sortable = isColumnSortable(column.id);
          
          return (
            <div
              key={column.id}
              className={classes.columnHeader}
              onClick={() => handleSortColumnClick(column.id)}
              style={{ 
                width: column.width, 
                flexGrow: column.flexGrow || 0,
                flexShrink: column.flexShrink || 0,
                cursor: sortable ? 'pointer' : 'default',
              }}
            >
              <Typography 
                variant="subtitle2" 
                className={`${classes.columnCell} ${isActiveSort ? classes.activeSortColumn : ''}`}
              >
                {column.label}
                {isActiveSort && (
                  <span className={classes.sortIndicator}>
                    {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </Typography>
            </div>
          );
        })}
      </>
    );
  }, [
    tableColumns, 
    classes, 
    selectedMetric, 
    sortDirection, 
    handleSortColumnClick, 
    mapColumnToMetric,
    isColumnSortable
  ]);
  
  // Render row function for the virtualized table
  const renderRow = useCallback((item, index) => {
    return (
      <TableRow
        data={item}
        columns={tableColumns}
        isEven={index % 2 === 0}
      />
    );
  }, [tableColumns]);
  
  return (
    <div>
      {/* Controls */}
      <div className={classes.controlsContainer}>
        <div>
          <FormControl variant="outlined" size="small" className={classes.metricsSelect}>
            <InputLabel id="metric-select-label">Metric</InputLabel>
            <Select
              labelId="metric-select-label"
              id="metric-select"
              value={selectedMetric}
              onChange={handleMetricChange}
              label="Metric"
            >
              {metricOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControlLabel
            control={
              <Switch
                checked={showNormalized}
                onChange={handleNormalizedToggle}
                color="primary"
                size="small"
              />
            }
            label="Normalized"
          />
        </div>
        
        <Tabs
          value={selectedView}
          onChange={handleViewChange}
          indicatorColor="primary"
          textColor="primary"
          variant="standard"
        >
          <Tab 
            value="visualization" 
            label="Visualization" 
            icon={<BarChartIcon fontSize="small" />}
          />
          <Tab 
            value="data" 
            label="Data" 
            icon={<TableIcon fontSize="small" />}
          />
        </Tabs>
      </div>
      
      {selectedView === 'visualization' ? (
        <>
          {/* Metric summary cards */}
          <Grid container spacing={2} style={{ marginBottom: 16 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper className={classes.metricCard}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedMetric.toUpperCase()}
                </Typography>
                
                <Typography className={classes.metricValue}>
                  {selectedMetric}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  {showNormalized ? 'Normalized' : 'Raw'} Values
                </Typography>
                
                <Typography variant="body2" className={classes.metricDescription}>
                  {metricDescriptions[selectedMetric] || 'Analysis of metric patterns across words.'}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6} md={9}>
              <Paper className={classes.metricCard}>
                <MetricStats 
                  data={data} 
                  metricKey={actualMetricKey} 
                />
              </Paper>
            </Grid>
          </Grid>
          
          {/* Tabs for different visualizations */}
          <Paper>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              className={classes.tabs}
            >
              <Tab label="Bar Chart" icon={<BarChartIcon />} />
              <Tab label="Distribution" icon={<LineChartIcon />} />
              <Tab label="Heatmap" icon={<ScatterPlotIcon />} />
            </Tabs>
            
            {/* Tab content */}
            <Box className={classes.tabContent}>
              {activeTab === 0 && (
                <MetricBarChart 
                  data={data}
                  metricKey={actualMetricKey}
                  color={selectedMetricColor}
                />
              )}
              
              {activeTab === 1 && (
                <MetricDistribution 
                  data={data}
                  metricKey={actualMetricKey}
                />
              )}
              
              {activeTab === 2 && (
                <MetricHeatmap 
                  data={data}
                  metricKey={actualMetricKey}
                />
              )}
            </Box>
          </Paper>
        </>
      ) : (
        // Data view (table)
        <>
          {/* Show navigation controls only in Data view */}
          {/* Sort information */}
          <div className={classes.sortInfo}>
            <Typography variant="body2">
              <strong>Sorted by:</strong> {selectedMetric === 'position' 
                ? `Text Position (${sortDirection === 'asc' ? 'ascending' : 'descending'})` 
                : `${actualMetricKey.toUpperCase()} (${sortDirection === 'asc' ? 'ascending' : 'descending'})`}
              &nbsp;•&nbsp;
              <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Click column headers to change sort
              </span>
            </Typography>
          </div>
          
          {/* Navigation controls removed for scrollable view */}
          <TableErrorBoundary>
            <VirtualizedTable
              pagination={{
                // Use simplified pagination for scrollable view with full dataset
                rowHeight: 48,
                currentPageData: currentPageData,
                
                // Calculate visible items for virtualization (for efficient rendering)
                virtualizedData: {
                  startIndex: localScrollIndex,
                  // Only render the items that are currently visible in the viewport
                  // plus a buffer for smooth scrolling
                  items: currentPageData.slice(
                    localScrollIndex, 
                    Math.min(localScrollIndex + Math.ceil(700/48) + 10, currentPageData.length)
                  ),
                  rowHeight: 48,
                  totalHeight: currentPageData.length * 48
                },
                
                // Scroll handler for virtualization
                handleScroll: (e) => {
                  const scrollTop = e.target.scrollTop;
                  const rowHeight = 48;
                  const newStartIndex = Math.floor(scrollTop / rowHeight);
                  
                  // Only update if we've scrolled to a new row to prevent unnecessary rerenders
                  if (newStartIndex !== localScrollIndex) {
                    setLocalScrollIndex(newStartIndex);
                  }
                },
                
                // Container height handler
                setTableContainerHeight: (height) => {
                  containerHeightRef.current = height;
                }
              }}
              headerContent={headerContent}
              renderRow={renderRow}
              containerHeight={700} // Increased height for better viewing
            />
          </TableErrorBoundary>
        </>
      )}
    </div>
  );
};

export default MetricAnalysisView;
