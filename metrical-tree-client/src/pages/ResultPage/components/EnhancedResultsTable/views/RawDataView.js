import React, { useState, useMemo, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Chip,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  IconButton,
  Paper,
  Grid,
  Box,
  alpha,
} from '@material-ui/core';
import {
  FilterList as FilterListIcon,
  GetApp as GetAppIcon,
  NoteAdd as NoteAddIcon,
} from '@material-ui/icons';

import VirtualizedTable from './components/VirtualizedTable';
import TableRow from './components/TableRow';
import { 
  RAW_DATA_COLUMNS, 
  POS_COLORS, 
  STRESS_COLORS, 
  COLUMN_GROUPS 
} from '../constants';

const useStyles = makeStyles((theme) => ({
  columnHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderRight: 'none',
    },
  },
  columnCell: {
    fontWeight: 'bold',
    fontSize: '0.8rem',
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
    marginRight: theme.spacing(1),
  },
}));

/**
 * RawDataView component showing all data in tabular format with virtualization
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination object from useHybridPagination
 * @param {Array} props.data - Full data array (for filtering outside of pagination)
 * @returns {JSX.Element}
 */
const RawDataView = ({ pagination, data }) => {
  const classes = useStyles();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  
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
              // Handle different scaling for raw vs. normalized metrics
              const isNormalized = col.id.startsWith('norm_');
              const scale = isNormalized ? 1 : 0.2; // Normalized values are already 0-1, raw need scaling
              const normalizedValue = Math.min(Math.max((parseFloat(value) || 0) * scale, 0), 1);
              const indicatorWidth = `${normalizedValue * 100}%`;
              
              return (
                <div className={classes.metricValueContainer}>
                  <div 
                    className={classes.metricIndicator}
                    style={{ width: indicatorWidth }}
                  />
                  <span>{value}</span>
                </div>
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
  
  // Table header content based on visible columns
  const headerContent = useMemo(() => {
    return (
      <>
        {enhancedColumns.map((column) => (
          <div
            key={column.id}
            className={classes.columnHeader}
            style={{ 
              width: column.width, 
              flexGrow: column.flexGrow || 0,
              flexShrink: column.flexShrink || 0 
            }}
          >
            <Typography variant="subtitle2" className={classes.columnCell}>
              {column.label}
            </Typography>
          </div>
        ))}
      </>
    );
  }, [enhancedColumns, classes]);
  
  // Generate a function to create a compound index string
  const getCompoundIndex = useCallback((item) => {
    return `${item.widx}-${item.sidx}`;
  }, []);
  
  // Handle row click
  const handleRowClick = useCallback((row) => {
    const rowKey = getCompoundIndex(row);
    const selectedKey = selectedRow ? getCompoundIndex(selectedRow) : null;
    setSelectedRow(rowKey === selectedKey ? null : row);
  }, [selectedRow, getCompoundIndex]);
  
  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);
  
  // Handle column group selection change
  const handleColumnGroupChange = useCallback((event) => {
    setVisibleColumnGroups(event.target.value);
  }, []);
  
  // Get the sorted and paginated data from the full dataset
  const sortedData = useMemo(() => {
    // Sort by position (sentence index, then word index within sentence)
    return [...data].sort((a, b) => {
      // First compare sentence index
      const sentenceCompare = parseInt(a.sidx, 10) - parseInt(b.sidx, 10);
      if (sentenceCompare !== 0) return sentenceCompare;
      
      // If same sentence, compare word position within sentence
      return parseInt(a.widx, 10) - parseInt(b.widx, 10);
    });
  }, [data]);
  
  // Get current page data from the sorted full dataset
  const currentPageData = useMemo(() => {
    const startIndex = pagination.currentPage * pagination.chunkSize;
    return sortedData.slice(startIndex, startIndex + pagination.chunkSize);
  }, [sortedData, pagination.currentPage, pagination.chunkSize]);
  
  // Render row function for the virtualized table
  const renderRow = useCallback((item, index) => {
    const rowKey = getCompoundIndex(item);
    const selectedKey = selectedRow ? getCompoundIndex(selectedRow) : null;
    
    return (
      <TableRow
        data={item}
        columns={enhancedColumns}
        isEven={index % 2 === 0}
        isSelected={rowKey === selectedKey}
        onClick={() => handleRowClick(item)}
      />
    );
  }, [enhancedColumns, selectedRow, handleRowClick, getCompoundIndex]);
  
  return (
    <div>
      {/* Toolbar with controls */}
      <div className={classes.toolbarContainer}>
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
        
        <div className={classes.toolbarActions}>
          <Tooltip title="Export Data">
            <IconButton size="small" className={classes.exportButton}>
              <GetAppIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Toggle Filters">
            <IconButton 
              size="small" 
              onClick={toggleFilters}
              color={showFilters ? "primary" : "default"}
            >
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Add Note">
            <IconButton size="small">
              <NoteAddIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>
      
      {/* Filters panel */}
      {showFilters && (
        <Paper className={classes.filterPanel} elevation={1}>
          <Typography variant="subtitle2" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} className={classes.filterForm}>
            {/* We'll implement actual filters here in a future iteration */}
            <Grid item>
              <Typography variant="body2" color="textSecondary">
                Filter controls will be implemented here
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Virtualized data table */}
      <VirtualizedTable
        pagination={{
          ...pagination,
          currentPageData: currentPageData
        }}
        headerContent={headerContent}
        renderRow={renderRow}
        keyExtractor={(item) => `row-${item.widx}-${item.word}`}
        containerHeight={600}
      />
      
      {/* Detail view of selected row (if any) */}
      {selectedRow && (
        <Box mt={2}>
          <Paper 
            elevation={2} 
            style={{ 
              padding: '16px',
              backgroundColor: alpha('#f5f5f5', 0.7),
              borderLeft: '4px solid #3498DB'
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              <strong>{selectedRow.word}</strong> Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  <strong>Index:</strong> {selectedRow.widx}
                </Typography>
                <Typography variant="body2">
                  <strong>POS:</strong> {selectedRow.pos}
                </Typography>
                <Typography variant="body2">
                  <strong>Dependency:</strong> {selectedRow.dep}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  <strong>Segmentation:</strong> {selectedRow.seg}
                </Typography>
                <Typography variant="body2">
                  <strong>Lexical Stress:</strong> {selectedRow.lexstress}
                </Typography>
                <Typography variant="body2">
                  <strong>Syllables:</strong> {selectedRow.nsyll}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  <strong>M1:</strong> {selectedRow.m1} ({selectedRow.norm_m1})
                </Typography>
                <Typography variant="body2">
                  <strong>M2a:</strong> {selectedRow.m2a} ({selectedRow.norm_m2a})
                </Typography>
                <Typography variant="body2">
                  <strong>M2b:</strong> {selectedRow.m2b} ({selectedRow.norm_m2b})
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Typography variant="body2">
                  <strong>Mean:</strong> {selectedRow.mean} ({selectedRow.norm_mean})
                </Typography>
                <Typography variant="body2">
                  <strong>Sentence Index:</strong> {selectedRow.sidx}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="body2">
                  <strong>Sentence:</strong> {selectedRow.sent}
                </Typography>
              </Grid>
              
              {selectedRow.contour && (
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>Contour:</strong> {selectedRow.contour}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>
      )}
    </div>
  );
};

export default RawDataView;
