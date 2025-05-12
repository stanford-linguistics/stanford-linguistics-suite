import React, { useMemo } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography } from '@material-ui/core';
import CrispTooltip from '../../../../../../components/CrispTooltip';
import { 
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShowChart as ShowChartIcon,
  Remove as RemoveIcon
} from '@material-ui/icons';
import { DEFAULT_ROW_HEIGHT } from '../../constants';

// Analyze contour pattern
const analyzeContourPattern = (data) => {
  const values = data.split(' ')
    .map(n => n === 'nan' ? null : parseFloat(n))
    .filter(n => n !== null);
    
  if (values.length < 2) return { pattern: 'unknown', values };
  
  // Calculate trend
  let rising = 0;
  let falling = 0;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > values[i-1]) rising++;
    else if (values[i] < values[i-1]) falling++;
  }
  
  const total = rising + falling;
  if (total === 0) return { pattern: 'flat', values };
  
  const risingPercent = rising / total;
  const fallingPercent = falling / total;
  
  // Determine pattern
  if (risingPercent > 0.7) return { pattern: 'rising', values };
  if (fallingPercent > 0.7) return { pattern: 'falling', values };
  if (Math.abs(risingPercent - fallingPercent) < 0.3) return { pattern: 'fluctuating', values };
  if (risingPercent > fallingPercent) return { pattern: 'mostly-rising', values };
  return { pattern: 'mostly-falling', values };
};

// Pattern visualization component
const ContourPattern = React.memo(({ data, width = 180, height = 24 }) => {
  const { pattern, values } = useMemo(() => analyzeContourPattern(data), [data]);
  
  // Pattern-specific visualization
  const renderPattern = () => {
    switch (pattern) {
      case 'rising':
        return <TrendingUpIcon style={{ color: '#4caf50' }} />;
      case 'falling':
        return <TrendingDownIcon style={{ color: '#f44336' }} />;
      case 'fluctuating':
        return <ShowChartIcon style={{ color: '#ff9800' }} />;
      case 'mostly-rising':
        return <TrendingUpIcon style={{ color: '#8bc34a' }} />;
      case 'mostly-falling':
        return <TrendingDownIcon style={{ color: '#ff5722' }} />;
      case 'flat':
        return <RemoveIcon style={{ color: '#9e9e9e' }} />;
      default:
        return <RemoveIcon style={{ color: '#9e9e9e' }} />;
    }
  };
  
  if (!data || values.length < 2) {
    return <div style={{ width, height, display: 'flex', alignItems: 'center' }}>-</div>;
  }
  
  return (
    <CrispTooltip 
      title={
        <div>
          <div>Pattern: {pattern.replace('-', ' ')}</div>
          <div>Raw values: {data}</div>
        </div>
      } 
      placement="top"
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {renderPattern()}
        <Typography variant="body2" style={{ marginLeft: 8, textTransform: 'capitalize' }}>
          {pattern.replace('-', ' ')}
        </Typography>
      </div>
    </CrispTooltip>
  );
});

const useStyles = makeStyles((theme) => ({
  contourCell: {
    padding: theme.spacing(0.5, 1),
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  },
  tableRow: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
    transition: theme.transitions.create(['background-color']),
    height: DEFAULT_ROW_HEIGHT,
    alignItems: 'center',
    width: '100%', // Ensure the row spans the full width
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  rowEven: {
    // Keep for hover state and as a fallback
    backgroundColor: theme.palette.background.paper,
  },
  rowOdd: {
    // Keep for hover state and as a fallback
    backgroundColor: theme.palette.background.default,
  },
  rowSelected: {
    backgroundColor: `${theme.palette.primary.light}20`, // 20% opacity
    '&:hover': {
      backgroundColor: `${theme.palette.primary.light}30`, // 30% opacity on hover
    },
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    height: DEFAULT_ROW_HEIGHT,
    borderRight: `1px solid ${theme.palette.divider}`,
    maxWidth: '100%',
    '&:last-child': {
      borderRight: 'none',
    },
  },
  cellEven: {
    backgroundColor: theme.palette.background.paper,
  },
  cellOdd: {
    backgroundColor: theme.palette.background.default,
  },
  cellSelected: {
    backgroundColor: `${theme.palette.primary.light}20`, // 20% opacity
  },
  cellContent: {
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  metricCell: {
    position: 'relative',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['background-color']),
  },
  metricValue: {
    position: 'relative',
    zIndex: 1,
  },
  repeatingIndicator: {
    color: theme.palette.text.secondary,
    fontSize: '0.75em',
    verticalAlign: 'super',
    marginLeft: 1,
  },
}));

/**
 * TableRow component for displaying data in a virtual table
 * 
 * @param {Object} props
 * @param {Object} props.data - The row data
 * @param {Array} props.columns - Column definitions
 * @param {boolean} props.isEven - Whether this is an even row (for alternating colors)
 * @param {boolean} props.isEven - Whether this is an even row (for alternating colors)
 * @param {string} props.className - Additional CSS class
 * @param {Object} props.style - Additional inline styles
 * @param {number} props.exactWidth - The exact width of the row in pixels
 * @returns {JSX.Element}
 */
const TableRow = ({
  data,
  columns,
  isEven = false,
  className = '',
  style = {},
  exactWidth,
}) => {
  const classes = useStyles();
  const theme = useTheme();
  
  const rowClassName = `${classes.tableRow} ${
    isEven ? classes.rowEven : classes.rowOdd
  } ${className}`;
  
  // Enhanced number formatting
  const formatNumber = (value, column) => {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') return '-';
    if (value === 'nan') return '-';
    
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    
    // Round to 2 decimal places for all metric values
    if (column.type === 'metric' || 
        ['mean', 'norm_mean', 'm1', 'm2a', 'm2b', 'norm_m1', 'norm_m2a', 'norm_m2b'].includes(column.id)) {
      return num.toFixed(2);
    }
    
    // For other numbers (like widx, sidx)
    return num.toString();
  };

  // Render cell content based on column type and data
  const renderCellContent = (column, value) => {
    // Special handling for frequency columns
    if (column.id === 'word_freq' || column.id === 'prev_word_freq') {
      // Handle null, undefined, empty string
      if (value === null || value === undefined || value === '') return '-';
      if (value === 'nan' || value === 0) return '-';
      
      // Parse and validate the value
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue === 0) return '-';
      
      // Get appropriate max frequency from the frequencies object
      const maxFreq = column.id === 'word_freq' 
        ? data.frequencies?.maxWordFreq || 1 
        : data.frequencies?.maxPrevWordFreq || 1;
      
      // Calculate normalized value for background
      const normalizedValue = numValue / maxFreq;
      const barWidth = Math.min(normalizedValue * 100, 100);
      
      // Add gradient for better visualization
      const metricStyle = {
        background: `linear-gradient(90deg, 
          ${theme.palette.info.light} ${barWidth}%, 
          transparent ${barWidth}%)`,
        opacity: 0.3,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '100%',
        borderRadius: theme.shape.borderRadius,
      };

      return (
        <CrispTooltip 
          title={
            <div>
              <Typography variant="body2">Frequency: {numValue}</Typography>
              <Typography variant="caption" color="textSecondary">
                {(normalizedValue * 100).toFixed(1)}% of max {column.id === 'word_freq' ? `(${data.frequencies?.maxWordFreq})` : `(${data.frequencies?.maxPrevWordFreq})`}
              </Typography>
            </div>
          } 
          placement="top"
        >
          <div className={classes.metricCell}>
            <div style={metricStyle} />
            <span className={classes.metricValue}>{numValue}</span>
          </div>
        </CrispTooltip>
      );
    }

    // Special handling for previous word
    if (column.id === 'prev_word') {
      // If the value is empty or a placeholder, show a dash
      if (!value || value === '—' || value === '-') {
        return (
          <Typography variant="body2" noWrap className={classes.cellContent} style={{ color: theme.palette.text.disabled }}>
            —
          </Typography>
        );
      }
      
      return (
        <Typography variant="body2" noWrap className={classes.cellContent}>
          {value}
        </Typography>
      );
    }

    // Special handling for mean and norm_mean columns
    if (column.id === 'mean' || column.id === 'norm_mean') {
      // Handle null, undefined, empty string
      if (value === null || value === undefined || value === '') return '-';
      if (value === 'nan') return '-';
      
      // Parse and validate the value
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return '-';
      
      // Force 2 decimal places
      const formattedValue = numValue.toFixed(2);
      
      // Calculate normalized value for background
      const isNormalized = column.id === 'norm_mean';
      const normalizedValue = isNormalized ? numValue : numValue / 5;
      
      const metricStyle = {
        backgroundColor: theme.palette.success.light,
        opacity: 0.2,
        width: `${Math.min(normalizedValue * 100, 100)}%`,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: theme.shape.borderRadius,
      };

      return (
        <CrispTooltip 
          title={
            <div>
              <Typography variant="body2">Value: {formattedValue}</Typography>
              <Typography variant="caption" color="textSecondary">
                {isNormalized 
                  ? "Normalized value (0-1)" 
                  : `Raw value (0-5)`}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Green bar shows relative strength
              </Typography>
            </div>
          } 
          placement="top"
        >
          <div className={classes.metricCell}>
            <div style={metricStyle} />
            <span className={classes.metricValue}>{formattedValue}</span>
          </div>
        </CrispTooltip>
      );
    }
    
    // Handle other metric columns
    if (column.type === 'metric' || ['m1', 'm2a', 'm2b', 'norm_m1', 'norm_m2a', 'norm_m2b'].includes(column.id)) {
      // Parse and validate the value
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return '-';
      
      // Calculate normalized value for background
      const isNormalized = column.id.startsWith('norm_');
      const normalizedValue = isNormalized 
        ? numValue // Already 0-1 for Norm columns
        : numValue / 5; // Scale raw values by max possible value (5)
      
      // Format the display value with proper rounding
      const displayValue = formatNumber(value, column);
      
      const metricStyle = {
        backgroundColor: theme.palette.success.light,
        opacity: 0.2,
        width: `${Math.min(normalizedValue * 100, 100)}%`,
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        borderRadius: theme.shape.borderRadius,
      };

      return (
        <CrispTooltip 
          title={
            <div>
              <Typography variant="body2">Value: {displayValue}</Typography>
              <Typography variant="caption" color="textSecondary">
                {isNormalized 
                  ? "Normalized value (0-1)" 
                  : `Raw value (0-5)`}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Green bar shows relative strength
              </Typography>
            </div>
          } 
          placement="top"
        >
          <div className={classes.metricCell}>
            <div style={metricStyle} />
            <span className={classes.metricValue}>{displayValue}</span>
          </div>
        </CrispTooltip>
      );
    }
    
    if (column.type === 'tag') {
      // For tags like POS or lexical stress, we'd use a Chip or similar
      // This would be implemented with the specific visualization needed
      return value;
    }
    
    // Special handling for contour
    if (column.id === 'contour') {
      return (
        <div className={classes.contourCell}>
          <ContourPattern data={value || ''} />
        </div>
      );
    }

    // For other long text
    if (column.type === 'longText') {
      const maxLength = column.maxLength || 30;
      if (value && value.length > maxLength) {
        const abbreviated = `${value.substring(0, maxLength)}...`;
        return (
          <CrispTooltip title={value} placement="top">
            <Typography variant="body2" noWrap>
              {abbreviated}
            </Typography>
          </CrispTooltip>
        );
      }
    }
    
    // For numeric columns, use smart formatting
    if (['widx', 'sidx', 'nsyll', 'nstress'].includes(column.id)) {
      return (
        <Typography variant="body2" noWrap className={classes.cellContent}>
          {formatNumber(value, column)}
        </Typography>
      );
    }

    // Default rendering for other column types
    return (
      <Typography variant="body2" noWrap className={classes.cellContent}>
        {value}
      </Typography>
    );
  };
  
  return (
    <div 
      className={rowClassName}
      style={{
        ...style,
        width: exactWidth ? `${exactWidth}px` : '100%',
        minWidth: exactWidth ? `${exactWidth}px` : '100%',
        willChange: 'transform',
        transform: 'translateZ(0)', // Force GPU acceleration for better rendering
      }}
    >
      {columns.map((column) => {
        // Get cell value, using getValue function if provided
        const value = column.getValue 
          ? column.getValue(data) 
          : data[column.id];
          
        // Calculate cell width
        const width = column.width || 0;
        const flexGrow = column.flexGrow || 0;
        const cellWidth = flexGrow ? width + 200 : width; // Match header width calculation
        
        // Determine cell class based on row type
        const cellClassName = `${classes.cell} ${
          isEven ? classes.cellEven : classes.cellOdd
        }`;
        
        return (
          <div 
            key={column.id} 
            className={cellClassName}
            style={{ 
              width: `${cellWidth}px`,
              minWidth: `${width}px`,
              maxWidth: `${cellWidth}px`,
              ...column.cellStyle 
            }}
          >
            {column.renderCell 
              ? column.renderCell(value, data) 
              : renderCellContent(column, value)}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(TableRow);
