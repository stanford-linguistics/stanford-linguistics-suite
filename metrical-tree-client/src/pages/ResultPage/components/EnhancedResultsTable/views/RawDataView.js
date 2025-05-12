import React, { useState, useMemo, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Chip,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  ListItemIcon,
  OutlinedInput,
  IconButton,
  Paper,
  Grid,
  Box,
  TextField,
  Collapse,
  Card,
  CardHeader,
  CardContent,
  Button,
  ButtonGroup,
  Menu,
  useMediaQuery,
  useTheme,
} from '@material-ui/core';
import CrispTooltip from '../../../../../components/CrispTooltip';
import {
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ExpandMore as ExpandMoreIcon,
  ArrowDropDown as ArrowDropDownIcon,
  CloudDownload as CloudDownloadIcon,
} from '@material-ui/icons';
import clsx from 'clsx';
import { exportAsCsv } from 'components/ResultsGraph/utils/exportHelpers';

// Internal components
import VirtualizedTable from './components/VirtualizedTable';
import TableRow from './components/TableRow';
import ColorKeyLegend from './components/ColorKeyLegend';

// Constants
import { 
  RAW_DATA_COLUMNS, 
  POS_COLORS, 
  STRESS_COLORS, 
  COLUMN_GROUPS,
  DEFAULT_ROW_HEIGHT 
} from '../constants';

// Utility function for formatting numbers with proper decimal places for metrics
const formatNumber = (value, format = 'default') => {
  // Handle non-numeric values
  if (value === null || value === undefined || value === '') return '-';
  if (value === 'nan') return '-';
  
  // Convert to number if string
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(num)) return '-';
  
  // Format based on type
  if (format === 'metric') {
    return num.toFixed(2); // Always 2 decimal places for metrics
  }
  
  // Default truncation behavior for non-metric values
  const str = num.toString();
  return str.length > 8 ? `${str.slice(0, 8)}...` : str;
};

const useStyles = makeStyles((theme) => ({
  summaryCard: {
    marginBottom: theme.spacing(2),
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    cursor: 'pointer',
    userSelect: 'none',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  columnCell: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sortIcon: {
    marginLeft: theme.spacing(0.5),
    fontSize: '1rem',
    opacity: 0.8,
  },
  filterPanel: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  filterForm: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  filterControl: {
    minWidth: 200,
  },
  toolbarContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    gap: theme.spacing(2),
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    flex: 1,
  },
  columnGroupControl: {
    minWidth: 200,
    marginRight: theme.spacing(2),
  },
  toolbarActions: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  posChip: {
    minWidth: 50,
    justifyContent: 'center',
  },
  stressChip: {
    minWidth: 60,
    justifyContent: 'center',
  },
  metricValueContainer: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
  },
  metricIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.primary.light,
    opacity: 0.3,
    zIndex: 0,
    borderRadius: theme.shape.borderRadius,
  },
  exportButton: {
    fontSize: '0.8rem',
    textTransform: 'none',
    fontWeight: 500,
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
  },
  splitButton: {
    marginLeft: -1,
    padding: '4px 8px',
    minWidth: '24px',
    borderLeft: `1px solid ${theme.palette.primary.main}`
  },
  menu: {
    '& .MuiListItemIcon-root': {
      minWidth: '32px',
    }
  },
  menuItem: {
    fontSize: '0.75rem',
    minHeight: '32px',
  },
  menuIcon: {
    fontSize: '1rem',
  },
  mobileExportButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1),
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  mobileExportContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  legendCard: {
    marginBottom: theme.spacing(2),
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.shortest,
    }),
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
}));

/**
 * RawDataView component showing all data in tabular format with virtualization
 * 
 * @param {Object} props
 * @param {Array} props.data - Full data array
 * @returns {JSX.Element}
 */
const RawDataView = ({ data }) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const [showFilters, setShowFilters] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false); // State for legend visibility
  const rowHeight = DEFAULT_ROW_HEIGHT;
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);

  // State for filters
  const [filters, setFilters] = useState({
    word: '',
    pos: [],
    lexstress: [],
  });

  // State for quick filters
  const [quickFilters, setQuickFilters] = useState({
    hidePunctuation: false,
    hideUnknown: false
  });

  // Helper functions for quick filters
  const isPunctuation = useCallback((pos) => {
    // If the POS tag isn't in our defined POS_COLORS (excluding default), 
    // it's considered non-standard
    return !Object.keys(POS_COLORS)
      .filter(key => key !== 'default')
      .includes(pos);
  }, []);

  const isUnknown = useCallback((row) => {
    // Only check stress values
    return !STRESS_COLORS[row.lexstress] || // Stress value doesn't have a defined color
           row.lexstress === '???'; // Stress is explicitly marked as unknown
  }, []);

  // Handle quick filter changes
  const handleQuickFilterChange = useCallback((event) => {
    const { name, checked } = event.target;
    setQuickFilters(prev => ({
      ...prev,
      [name]: checked
    }));
  }, []);

  const [sortConfig, setSortConfig] = useState({ 
    key: 'sidx', // Initial sort key (sentence index)
    direction: 'asc' // Initial direction
  });
  
  // Column visibility state
  const [visibleColumnGroups, setVisibleColumnGroups] = useState(
    COLUMN_GROUPS.map(group => group.name) // Initially show all column groups
  );
  
  // Enhanced columns with visualizations
  const enhancedColumns = useMemo(() => {
    // Filter columns based on selected groups
    const flatVisibleColumns = COLUMN_GROUPS
      .filter(group => visibleColumnGroups.includes(group.name))
      .flatMap(group => group.columns);
      
    // Only include columns that are in the flat list
    return RAW_DATA_COLUMNS
      .filter(col => flatVisibleColumns.includes(col.id))
      .map(col => {
        // Special rendering for POS column
        if (col.id === 'pos') {
          return {
            ...col,
            type: 'tag',
            renderCell: (value) => (
              <Chip
                label={value}
                size="small"
                className={classes.posChip}
                style={{
                  backgroundColor: POS_COLORS[value] || POS_COLORS.default,
                  color: '#fff',
                }}
              />
            ),
          };
        }
        
        // Special rendering for lexical stress
        if (col.id === 'lexstress') {
          return {
            ...col,
            type: 'tag',
            renderCell: (value) => (
              <Chip
                label={value}
                size="small"
                className={classes.stressChip}
                style={{
                  backgroundColor: STRESS_COLORS[value] || STRESS_COLORS.default,
                  color: '#fff',
                }}
              />
            ),
          };
        }
        
        // Special rendering for metric values
        if (['m1', 'm2a', 'm2b', 'mean', 'norm_m1', 'norm_m2a', 'norm_m2b', 'norm_mean'].includes(col.id)) {
          return {
            ...col,
            type: 'metric',
            renderCell: (value) => {
              // Parse and validate the value
              if (value === null || value === undefined || value === '') {
                return <span>-</span>;
              }
              if (value === 'nan') {
                return <span>-</span>;
              }

              const numValue = parseFloat(value);
              if (isNaN(numValue)) {
                return <span>-</span>;
              }

              // Format the number with 2 decimal places
              const formattedValue = formatNumber(numValue, 'metric');
              
              // Handle different scaling for raw vs. normalized metrics
              const isNormalized = col.id.startsWith('norm_');
              const scale = isNormalized ? 1 : 0.2; // Normalized values are already 0-1, raw need scaling
              const normalizedValue = Math.min(Math.max(numValue * scale, 0), 1);
              const indicatorWidth = `${Math.min(normalizedValue * 100, 100)}%`;
              
              return (
                <CrispTooltip title={numValue.toString()} placement="top">
                  <div className={classes.metricValueContainer}>
                    <div 
                      className={classes.metricIndicator}
                      style={{ width: indicatorWidth }}
                    />
                    <span>{formattedValue}</span>
                  </div>
                </CrispTooltip>
              );
            },
          };
        }
        
        // Special rendering for contour (abbreviated with tooltip)
        if (col.id === 'contour') {
          return {
            ...col,
            type: 'longText',
            maxLength: 20,
          };
        }
        
        // Special rendering for sentence
        if (col.id === 'sent') {
          return {
            ...col,
            type: 'longText',
            maxLength: 40,
          };
        }
        
        return col;
      });
  }, [visibleColumnGroups, classes]);

  // Handle sort request when a column header is clicked
  const handleSort = useCallback((columnId) => {
    setSortConfig(currentConfig => {
      let direction = 'asc';
      // If clicking the same column, toggle direction
      if (currentConfig.key === columnId && currentConfig.direction === 'asc') {
        direction = 'desc';
      }
      // Otherwise, set new key and default to ascending
      return { key: columnId, direction };
    });
  }, []); // No dependencies needed due to functional update
  
  // Table header content based on visible columns
  const headerContent = useMemo(() => {
    return enhancedColumns.map((column) => {
      const isActiveSort = sortConfig.key === column.id;
      
      return (
        <div
          key={column.id}
          className={classes.columnHeader}
          style={{ 
            width: column.width,
            ...(column.flexGrow ? { width: column.width + 200 } : {}),
          }}
          onClick={() => handleSort(column.id)}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleSort(column.id)}
        >
          <Typography variant="subtitle2" className={classes.columnCell}>
            {column.label}
            {isActiveSort && (
              sortConfig.direction === 'asc' 
                ? <ArrowUpwardIcon className={classes.sortIcon} />
                : <ArrowDownwardIcon className={classes.sortIcon} />
            )}
          </Typography>
        </div>
      );
    });
  }, [enhancedColumns, classes, handleSort, sortConfig]);
  
  // Export menu handlers
  const openExportMenu = useCallback((event) => setExportMenuAnchor(event.currentTarget), []);
  const closeExportMenu = useCallback(() => setExportMenuAnchor(null), []);


  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Toggle legend visibility
  const handleLegendToggle = useCallback(() => {
    setLegendOpen(prev => !prev);
  }, []);
  
  // Handle column group selection change
  const handleColumnGroupChange = useCallback((event) => {
    setVisibleColumnGroups(event.target.value);
  }, []);

  // Extract unique values for filter dropdowns
  const uniquePosTags = useMemo(() => {
    if (!data) return [];
    const tags = new Set(data.map(item => item.pos).filter(Boolean));
    return Array.from(tags).sort();
  }, [data]);

  const uniqueStressValues = useMemo(() => {
    if (!data) return [];
    const stresses = new Set(data.map(item => item.lexstress).filter(Boolean));
    return Array.from(stresses).sort();
  }, [data]);

  // Handle filter changes
  const handleFilterChange = useCallback((event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  }, []);

 
  // Calculate the maximum frequencies for scaling bar widths
  const maxFrequencies = useMemo(() => {
    if (!data || data.length === 0) {
      return { wordFreq: 1, prevWordFreq: 1 };
    }

    // Find the max values for word_freq and prev_word_freq
    let maxWordFreq = 1;
    let maxPrevWordFreq = 1;

    for (const item of data) {
      const wordFreq = parseInt(item.word_freq, 10) || 0;
      const prevWordFreq = parseInt(item.prev_word_freq, 10) || 0;
      
      if (wordFreq > maxWordFreq) maxWordFreq = wordFreq;
      if (prevWordFreq > maxPrevWordFreq) maxPrevWordFreq = prevWordFreq;
    }

    return { wordFreq: maxWordFreq, prevWordFreq: maxPrevWordFreq };
  }, [data]);

  // Get the filtered and sorted data
  const filteredAndSortedData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const { key, direction } = sortConfig;
    const sortModifier = direction === 'asc' ? 1 : -1;

    // Create a copy of the data and enhance with frequency information
    const dataToSort = data.map(item => ({
      ...item,
      frequencies: {
        maxWordFreq: maxFrequencies.wordFreq,
        maxPrevWordFreq: maxFrequencies.prevWordFreq
      }
    }));

    dataToSort.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      // Handle null/undefined - treat them as lowest value
      const aIsNull = valA === null || typeof valA === 'undefined';
      const bIsNull = valB === null || typeof valB === 'undefined';
      if (aIsNull && bIsNull) return 0; // Both null/undefined
      if (aIsNull) return -1 * sortModifier; // Only a is null/undefined
      if (bIsNull) return 1 * sortModifier;  // Only b is null/undefined

      // Attempt numeric conversion for appropriate columns
      // Add more keys here if they are numeric but stored as strings
      const numericKeys = ['sidx', 'widx', 'nsyll', 'm1', 'm2a', 'm2b', 'mean', 'norm_m1', 'norm_m2a', 'norm_m2b', 'norm_mean', 'word_freq', 'prev_word_freq'];
      if (numericKeys.includes(key)) {
        valA = parseFloat(valA);
        valB = parseFloat(valB);
        
        // Check if parsing failed (NaN) - treat NaN as lowest
        const aIsNaN = isNaN(valA);
        const bIsNaN = isNaN(valB);
        if (aIsNaN && bIsNaN) return 0;
        if (aIsNaN) return -1 * sortModifier;
        if (bIsNaN) return 1 * sortModifier;

        // Numeric comparison
        if (valA < valB) return -1 * sortModifier;
        if (valA > valB) return 1 * sortModifier;

      } else {
        // String comparison (case-insensitive)
        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();
        const comparison = valA.localeCompare(valB);
        if (comparison !== 0) return comparison * sortModifier;
      }

      // Tie-breaking: Always use sentence index then word index as final tie-breaker
      if (key !== 'sidx') {
        const sidxCompare = parseInt(a.sidx, 10) - parseInt(b.sidx, 10);
        if (sidxCompare !== 0) return sidxCompare; // Use original direction for tie-breaker consistency? No, use primary direction.
      }
      if (key !== 'widx') {
         // If primary sort wasn't widx, use it now
         return (parseInt(a.widx, 10) - parseInt(b.widx, 10)); // Let primary direction control tie-breaker
      }

      return 0; // Should only happen if primary key was widx and values were identical
    });

    // --- Filtering Logic ---
    const { word, pos, lexstress } = filters;
    const filteredData = dataToSort.filter(row => {
      // Word filter (case-insensitive substring match)
      if (word && !String(row.word || '').toLowerCase().includes(word.toLowerCase())) {
        return false;
      }
      // POS filter (match any selected tag)
      if (pos.length > 0 && !pos.includes(row.pos)) {
        return false;
      }
      // Lexical Stress filter (match any selected stress value)
      if (lexstress.length > 0 && !lexstress.includes(row.lexstress)) {
        return false;
      }

      // Quick filters
      if (quickFilters.hidePunctuation && isPunctuation(row.pos)) {
        return false;
      }
      if (quickFilters.hideUnknown && isUnknown(row)) {
        return false;
      }

      return true; // Row passes all active filters
    });

    return filteredData;
  }, [
    data, 
    sortConfig, 
    filters, 
    quickFilters, 
    isPunctuation, 
    isUnknown,
    maxFrequencies.prevWordFreq,
    maxFrequencies.wordFreq 
  ]);



  /**
   * Handles export requests for the currently displayed data (filtered/sorted)
   * @param {boolean} useFiltered - Whether to export filtered data or all data
   */
  const handleExport = useCallback((useFiltered = false) => {
    closeExportMenu();

    // Determine which data to export
    const dataToExport = useFiltered ? filteredAndSortedData : data;

    // Generate descriptive filenames
    const timestamp = new Date().toISOString().slice(0, 10);
    const filterSuffix = useFiltered ? '-filtered' : '';
    const csvFilename = `raw-data${filterSuffix}-${timestamp}.csv`;

    // Use the basic exportAsCsv helper
    exportAsCsv(dataToExport, csvFilename);

  }, [data, filteredAndSortedData, closeExportMenu]);

  // Shortcut for exporting all data (now exports unfiltered raw data)
  const handleExportAll = useCallback(() => {
    handleExport(false);
  }, [handleExport]);

  // Render row function for the virtualized table
  const renderRow = useCallback((item, index, exactWidth) => {
    return (
      <TableRow
        data={item}
        columns={enhancedColumns}
        isEven={index % 2 === 0}
        exactWidth={exactWidth}
      />
    );
  }, [enhancedColumns]);
  
  return (
    <div>
      {/* Collapsible Color Legend */}
      <Card className={classes.legendCard} variant="outlined">
        <CardHeader
          title="Color Legend"
          titleTypographyProps={{ variant: 'subtitle2' }}
          action={
            <IconButton
              className={clsx(classes.expand, {
                [classes.expandOpen]: legendOpen,
              })}
              onClick={handleLegendToggle}
              aria-expanded={legendOpen}
              aria-label="show legend"
              size="small"
            >
              <ExpandMoreIcon />
            </IconButton>
          }
          style={{ padding: '8px 16px' }} // Adjust padding
        />
        <Collapse in={legendOpen} timeout="auto" unmountOnExit>
          <CardContent style={{ paddingTop: 0 }}> {/* Remove top padding */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <ColorKeyLegend title="POS Tags" colorMap={POS_COLORS} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ColorKeyLegend title="Lexical Stress" colorMap={STRESS_COLORS} />
              </Grid>
              <Grid item xs={12} md={4}>
                <ColorKeyLegend title="Metrics" colorMap={{}} />
              </Grid>
            </Grid>
          </CardContent>
        </Collapse>
      </Card>

      {/* Toolbar with controls */}
      <div className={classes.toolbarContainer}>
        <div className={classes.toolbarLeft}>
          <FormControl variant="outlined" size="small" className={classes.columnGroupControl}>
          <InputLabel id="column-group-select-label">Column Groups</InputLabel>
          <Select
            labelId="column-group-select-label"
            id="column-group-select"
            multiple
            value={visibleColumnGroups}
            onChange={handleColumnGroupChange}
            input={<OutlinedInput label="Column Groups" />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 300,
                },
              },
            }}
          >
            {COLUMN_GROUPS.map((group) => (
              <MenuItem key={group.name} value={group.name}>
                <Checkbox checked={visibleColumnGroups.includes(group.name)} />
                <ListItemText primary={group.name} />
              </MenuItem>
            ))}
          </Select>
          </FormControl>
          
          {/* Row count display */}
          <Typography variant="body2" color="textSecondary">
            Showing {filteredAndSortedData.length} of {data.length} rows
          </Typography>
        </div>
        
        <div className={classes.toolbarActions}>
          
          <CrispTooltip title="Toggle Filters">
            <IconButton 
              size="small" 
              onClick={toggleFilters}
              color={showFilters ? "primary" : "default"}
            >
              <FilterListIcon />
            </IconButton>
          </CrispTooltip>

          {isMobile ? (
            <div className={classes.mobileExportContainer}>
              <CrispTooltip title="Export Options">
                <IconButton
                  className={classes.mobileExportButton}
                  onClick={openExportMenu}
                  aria-controls="export-menu"
                  aria-haspopup="true"
                  color="primary"
                >
                  <GetAppIcon />
                </IconButton>
              </CrispTooltip>
            </div>
          ) : (
            <ButtonGroup size="small" variant="contained" color="primary">
              <CrispTooltip title="Export data">
                <Button 
                  className={classes.exportButton}
                  onClick={handleExportAll}
                  startIcon={<GetAppIcon />}
                >
                  Export
                </Button>
              </CrispTooltip>
              <Button 
                className={classes.splitButton}
                onClick={openExportMenu}
                aria-controls="export-menu"
                aria-haspopup="true"
              >
                <ArrowDropDownIcon fontSize="small" />
              </Button>
            </ButtonGroup>
          )}

          {/* Export Menu */}
          <Menu
            id="export-menu"
            anchorEl={exportMenuAnchor}
            keepMounted
            open={Boolean(exportMenuAnchor)}
            onClose={closeExportMenu}
            className={classes.menu}
          >
            <MenuItem onClick={() => handleExport(false)} className={classes.menuItem}>
              <ListItemIcon><CloudDownloadIcon className={classes.menuIcon} /></ListItemIcon>
              <ListItemText primary="Export All Data" />
            </MenuItem>
            <MenuItem onClick={() => handleExport(true)} className={classes.menuItem}>
              <ListItemIcon><FilterListIcon className={classes.menuIcon} /></ListItemIcon>
              <ListItemText primary="Export Filtered Data" />
            </MenuItem>
          </Menu>
          
        </div>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <Paper className={classes.filterPanel} elevation={1}>
          <Typography variant="subtitle2" gutterBottom>
            Filters
          </Typography>
          {/* Quick Filters */}
          <Box mb={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Quick Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="hidePunctuation"
                      checked={quickFilters.hidePunctuation}
                      onChange={handleQuickFilterChange}
                      size="small"
                    />
                  }
                  label="Hide Non-Standard POS Tags"
                />
              </Grid>
              <Grid item>
                <FormControlLabel
                  control={
                    <Checkbox
                      name="hideUnknown"
                      checked={quickFilters.hideUnknown}
                      onChange={handleQuickFilterChange}
                      size="small"
                    />
                  }
                  label="Hide Unknown Stress Values"
                />
              </Grid>
            </Grid>
          </Box>
          <Grid container spacing={2} className={classes.filterForm}>
            {/* Word Filter */}
            <Grid item>
              <TextField
                name="word"
                label="Filter by Word"
                variant="outlined"
                size="small"
                value={filters.word}
                onChange={handleFilterChange}
                className={classes.filterControl}
              />
            </Grid>
            {/* POS Filter */}
            <Grid item>
              <FormControl variant="outlined" size="small" className={classes.filterControl}>
                <InputLabel id="pos-filter-label">Filter by POS</InputLabel>
                <Select
                  labelId="pos-filter-label"
                  id="pos-filter"
                  multiple
                  name="pos"
                  value={filters.pos}
                  onChange={handleFilterChange}
                  input={<OutlinedInput label="Filter by POS" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small" 
                          style={{ 
                            backgroundColor: POS_COLORS[value] || POS_COLORS.default, 
                            color: '#fff' 
                          }} 
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: { style: { maxHeight: 300 } },
                  }}
                >
                  {uniquePosTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      <Checkbox checked={filters.pos.includes(tag)} />
                      <Box 
                        component="span" 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          mr: 1, 
                          bgcolor: POS_COLORS[tag] || POS_COLORS.default,
                          borderRadius: '3px',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }} 
                      />
                      <ListItemText primary={tag} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Lexical Stress Filter */}
            <Grid item>
              <FormControl variant="outlined" size="small" className={classes.filterControl}>
                <InputLabel id="stress-filter-label">Filter by Stress</InputLabel>
                <Select
                  labelId="stress-filter-label"
                  id="stress-filter"
                  multiple
                  name="lexstress"
                  value={filters.lexstress}
                  onChange={handleFilterChange}
                  input={<OutlinedInput label="Filter by Stress" />}
                  renderValue={(selected) => (
                     <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip 
                          key={value} 
                          label={value} 
                          size="small" 
                          style={{ 
                            backgroundColor: STRESS_COLORS[value] || STRESS_COLORS.default, 
                            color: '#fff' 
                          }} 
                        />
                      ))}
                    </Box>
                  )}
                  MenuProps={{
                    PaperProps: { style: { maxHeight: 300 } },
                  }}
                >
                  {uniqueStressValues.map((stress) => (
                    <MenuItem key={stress} value={stress}>
                      <Checkbox checked={filters.lexstress.includes(stress)} />
                       <Box 
                        component="span" 
                        sx={{ 
                          width: 16, 
                          height: 16, 
                          mr: 1, 
                          bgcolor: STRESS_COLORS[stress] || STRESS_COLORS.default,
                          borderRadius: '3px',
                          display: 'inline-block',
                          verticalAlign: 'middle',
                        }} 
                      />
                      <ListItemText primary={stress} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Virtualized data table */}
      <VirtualizedTable
        data={filteredAndSortedData} // Pass the filtered and sorted data
        rowHeight={rowHeight} // Pass the defined row height
        headerContent={headerContent}
        renderRow={renderRow}
        keyExtractor={(item, index) => {
          // Always include the index to ensure uniqueness
          if (item.sidx === undefined || item.widx === undefined) {
            return `row-${index}-fallback`;
          }
          return `row-${item.sidx}-${item.widx}-${index}`;
        }}
        containerHeight={600}
      />
    </div>
  );
};

export default RawDataView;
