import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Tooltip } from '@material-ui/core';
import { DEFAULT_ROW_HEIGHT } from '../../constants';

const useStyles = makeStyles((theme) => ({
  tableRow: {
    display: 'flex',
    borderBottom: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    transition: theme.transitions.create(['background-color']),
    height: DEFAULT_ROW_HEIGHT,
    alignItems: 'center',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  rowEven: {
    backgroundColor: theme.palette.background.paper,
  },
  rowOdd: {
    backgroundColor: theme.palette.background.default,
  },
  rowSelected: {
    backgroundColor: `${theme.palette.primary.light}20`, // 20% opacity
    '&:hover': {
      backgroundColor: `${theme.palette.primary.light}30`, // 30% opacity on hover
    },
  },
  cell: {
    padding: theme.spacing(0, 1),
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  metricValue: {
    position: 'relative',
    zIndex: 1,
    paddingLeft: theme.spacing(0.5),
  },
}));

/**
 * TableRow component for displaying data in a virtual table
 * 
 * @param {Object} props
 * @param {Object} props.data - The row data
 * @param {Array} props.columns - Column definitions
 * @param {boolean} props.isEven - Whether this is an even row (for alternating colors)
 * @param {boolean} props.isSelected - Whether this row is selected
 * @param {Function} props.onClick - Click handler for the row
 * @param {string} props.className - Additional CSS class
 * @param {Object} props.style - Additional inline styles
 * @returns {JSX.Element}
 */
const TableRow = ({
  data,
  columns,
  isEven = false,
  isSelected = false,
  onClick,
  className = '',
  style = {},
}) => {
  const classes = useStyles();
  
  const rowClassName = `${classes.tableRow} ${
    isEven ? classes.rowEven : classes.rowOdd
  } ${isSelected ? classes.rowSelected : ''} ${className}`;
  
  // Render cell content based on column type and data
  const renderCellContent = (column, value) => {
    // Handle special column types
    if (column.type === 'metric') {
      // For metric values, add visual indicator
      const normalizedValue = Math.min(Math.max(parseFloat(value) || 0, 0), 1);
      const indicatorWidth = `${normalizedValue * 100}%`;
      
      return (
        <div className={classes.metricValueContainer}>
          <div 
            className={classes.metricIndicator}
            style={{ width: indicatorWidth }}
          />
          <span className={classes.metricValue}>{value}</span>
        </div>
      );
    }
    
    if (column.type === 'tag') {
      // For tags like POS or lexical stress, we'd use a Chip or similar
      // This would be implemented with the specific visualization needed
      return value;
    }
    
    if (column.type === 'longText') {
      // For long text like sentences or contours, show abbreviated with tooltip
      const maxLength = column.maxLength || 30;
      if (value && value.length > maxLength) {
        const abbreviated = `${value.substring(0, maxLength)}...`;
        return (
          <Tooltip title={value} placement="top">
            <Typography variant="body2" noWrap>
              {abbreviated}
            </Typography>
          </Tooltip>
        );
      }
    }
    
    // Default rendering for other column types
    return (
      <Typography variant="body2" noWrap>
        {value}
      </Typography>
    );
  };
  
  return (
    <div 
      className={rowClassName}
      onClick={onClick}
      style={style}
    >
      {columns.map((column) => {
        // Get cell value, using getValue function if provided
        const value = column.getValue 
          ? column.getValue(data) 
          : data[column.id];
          
        return (
          <div 
            key={column.id} 
            className={classes.cell}
            style={{ 
              width: column.width, 
              flexGrow: column.flexGrow || 0,
              flexShrink: column.flexShrink || 0,
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
