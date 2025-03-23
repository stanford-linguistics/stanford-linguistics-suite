import React from 'react';
import { 
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Paper,
  IconButton,
  Tooltip,
  makeStyles
} from '@material-ui/core';
import {
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  ColorLens as ColorLensIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  filtersContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.primary.light}`,
    boxShadow: theme.shadows[1],
  },
  filtersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  filtersTitle: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
    },
  },
  filterToggleButton: {
    padding: theme.spacing(0.75, 1.5),
    borderRadius: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    boxShadow: theme.shadows[2],
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
    },
  },
  filterButtonActive: {
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: theme.palette.error.main,
    },
  },
  filtersContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  filterControl: {
    minWidth: 200,
    marginBottom: theme.spacing(1),
  },
  activeFiltersContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginBottom: theme.spacing(1),
  },
  activeFilterChip: {
    margin: theme.spacing(0.5),
  },
  actionsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
  },
  resetButton: {
    marginLeft: theme.spacing(1),
  }
}));

/**
 * Component for providing linguistic filtering controls
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.showFilters - Whether to show the filters
 * @param {function} props.toggleFilters - Function to toggle filter visibility
 * @param {string} props.posFilter - Current POS filter value
 * @param {function} props.handlePosFilterChange - Handler for POS filter changes
 * @param {string} props.stressFilter - Current stress filter value
 * @param {function} props.handleStressFilterChange - Handler for stress filter changes
 * @param {string} props.syllableFilter - Current syllable filter value
 * @param {function} props.handleSyllableFilterChange - Handler for syllable filter changes
 * @param {string} props.colorScheme - Current color scheme
 * @param {function} props.handleColorSchemeChange - Handler for color scheme changes
 * @param {function} props.resetFilters - Function to reset all filters
 * @param {Object} props.filterOptions - Available filter options
 * @param {boolean} props.hasActiveFilters - Whether there are active filters
 * @returns {JSX.Element} The linguistic filters component
 */
const LinguisticFilters = ({
  showFilters,
  toggleFilters,
  posFilter,
  handlePosFilterChange,
  stressFilter,
  handleStressFilterChange,
  syllableFilter,
  handleSyllableFilterChange,
  colorScheme,
  handleColorSchemeChange,
  resetFilters,
  filterOptions,
  hasActiveFilters
}) => {
  const classes = useStyles();
  
  // Render the filter toggle button
  const renderFilterToggle = () => (
    <Tooltip title={showFilters ? "Hide filters" : "Show filters"}>
      <IconButton 
        onClick={toggleFilters} 
        size="small"
        className={`${classes.filterToggleButton} ${hasActiveFilters ? classes.filterButtonActive : ''}`}
      >
        <FilterListIcon />
      </IconButton>
    </Tooltip>
  );
  
  // Generate the labels for active filters
  const getActiveFiltersLabels = () => {
    const labels = [];
    
    // Add POS filter label
    if (posFilter !== 'all') {
      const posOption = filterOptions.pos.find(opt => opt.value === posFilter);
      if (posOption) {
        labels.push({
          key: 'pos',
          label: `POS: ${posOption.label}`,
          onDelete: () => handlePosFilterChange({ target: { value: 'all' } })
        });
      }
    }
    
    // Add stress filter label
    if (stressFilter !== 'all') {
      const stressOption = filterOptions.stress.find(opt => opt.value === stressFilter);
      if (stressOption) {
        labels.push({
          key: 'stress',
          label: `Stress: ${stressOption.label}`,
          onDelete: () => handleStressFilterChange({ target: { value: 'all' } })
        });
      }
    }
    
    // Add syllable filter label
    if (syllableFilter !== 'all') {
      const syllableOption = filterOptions.syllable.find(opt => opt.value === syllableFilter);
      if (syllableOption) {
        labels.push({
          key: 'syllable',
          label: `Syllables: ${syllableOption.label}`,
          onDelete: () => handleSyllableFilterChange({ target: { value: 'all' } })
        });
      }
    }
    
    return labels;
  };
  
  // Render active filter chips
  const renderActiveFilters = () => {
    const activeFilters = getActiveFiltersLabels();
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className={classes.activeFiltersContainer}>
        <Typography variant="body2">Active filters:</Typography>
        {activeFilters.map(filter => (
          <Chip
            key={filter.key}
            label={filter.label}
            onDelete={filter.onDelete}
            size="small"
            className={classes.activeFilterChip}
          />
        ))}
        <Chip
          label="Clear all"
          onClick={resetFilters}
          size="small"
          className={classes.activeFilterChip}
          deleteIcon={<ClearIcon />}
          onDelete={resetFilters}
        />
      </div>
    );
  };
  
  // If filters are not shown, just render the toggle button and active filter chips
  if (!showFilters) {
    return (
      <Paper 
        className={classes.filtersContainer} 
        style={{ 
          padding: 8, 
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
          '&:hover': {
            backgroundColor: '#f8f8f8',
          }
        }}
        onClick={toggleFilters}
      >
        <div className={classes.filtersHeader} style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0 }}>
          <div className={classes.filtersTitle} style={{ flex: 1 }}>
            <FilterListIcon fontSize="small" />
            <Typography variant="subtitle2">
              Linguistic Filters
              {hasActiveFilters && (
                <Chip 
                  size="small" 
                  label={`${getActiveFiltersLabels().length} active`} 
                  color="primary"
                  style={{ marginLeft: 8, fontWeight: 'bold' }}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </Typography>
            
            <Tooltip title="Click anywhere to expand filters">
              <Button
                variant="outlined"
                color="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilters();
                }}
                style={{ marginLeft: 'auto' }}
              >
                {hasActiveFilters ? "Modify Filters" : "Show Filters"}
              </Button>
            </Tooltip>
          </div>
        </div>
        {hasActiveFilters && (
          <div onClick={(e) => e.stopPropagation()}>
            {renderActiveFilters()}
          </div>
        )}
      </Paper>
    );
  }
  
  return (
    <Paper className={classes.filtersContainer}>
      <div className={classes.filtersHeader}>
        <div className={classes.filtersTitle}>
          <FilterListIcon fontSize="small" />
          <Typography variant="subtitle2">Linguistic Filters</Typography>
        </div>
        {renderFilterToggle()}
      </div>
      
      {hasActiveFilters && renderActiveFilters()}
      
      <div className={classes.filtersContent}>
        {/* POS Filter */}
        <FormControl className={classes.filterControl} size="small">
          <InputLabel id="pos-filter-label">Part of Speech</InputLabel>
          <Select
            labelId="pos-filter-label"
            id="pos-filter"
            value={posFilter}
            onChange={handlePosFilterChange}
          >
            {filterOptions.pos.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Stress Filter */}
        <FormControl className={classes.filterControl} size="small">
          <InputLabel id="stress-filter-label">Stress Pattern</InputLabel>
          <Select
            labelId="stress-filter-label"
            id="stress-filter"
            value={stressFilter}
            onChange={handleStressFilterChange}
          >
            {filterOptions.stress.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Syllable Filter */}
        <FormControl className={classes.filterControl} size="small">
          <InputLabel id="syllable-filter-label">Syllable Count</InputLabel>
          <Select
            labelId="syllable-filter-label"
            id="syllable-filter"
            value={syllableFilter}
            onChange={handleSyllableFilterChange}
          >
            {filterOptions.syllable.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        {/* Color Scheme */}
        <FormControl className={classes.filterControl} size="small">
          <InputLabel id="color-scheme-label">
            <ColorLensIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Color By
          </InputLabel>
          <Select
            labelId="color-scheme-label"
            id="color-scheme"
            value={colorScheme}
            onChange={handleColorSchemeChange}
          >
            {filterOptions.colorScheme.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      
      <div className={classes.actionsContainer}>
        <Button
          variant="contained"
          color="default"
          size="small"
          onClick={resetFilters}
          className={classes.resetButton}
          startIcon={<ClearIcon />}
        >
          Reset Filters
        </Button>
      </div>
    </Paper>
  );
};

export default LinguisticFilters;
