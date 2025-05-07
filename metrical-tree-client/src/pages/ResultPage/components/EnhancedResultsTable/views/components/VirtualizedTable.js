import React, { useRef, useMemo, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { DEFAULT_CONTAINER_HEIGHT, VIRTUALIZATION_BUFFER } from '../../constants';

const HEADER_HEIGHT = 40; // 5 * theme.spacing unit

const useStyles = makeStyles((theme) => ({
  tableContainer: {
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    height: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden', // Prevent scrolling at container level
    '&:focus': {
      outline: 'none',
    },
  },
  scrollContainer: {
    width: '100%',
    height: '100%',
    overflow: 'auto',
    position: 'relative',
    overscrollBehavior: 'none',
    backgroundColor: 'transparent', // Ensure transparency to let row backgrounds show through
    '&::-webkit-scrollbar': {
      height: 10,
      width: 10,
    },
    '&::-webkit-scrollbar-thumb': {
      background: theme.palette.divider,
      borderRadius: 4,
    },
  },
  contentWrapper: {
    position: 'relative',
    display: 'inline-block',
    minWidth: '100%',
    maxWidth: 'fit-content',
    overflow: 'visible',
    // Removed backgroundColor to allow row backgrounds to show through
  },
  headerContainer: {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `2px solid ${theme.palette.divider}`,
    height: HEADER_HEIGHT,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    position: 'sticky',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    width: 'fit-content',
    willChange: 'transform', // Optimize performance
    backfaceVisibility: 'hidden', // Prevent flickering
    transform: 'translateZ(0)', // Force GPU acceleration
  },
  headerCell: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontWeight: 'bold',
    borderRight: `1px solid ${theme.palette.divider}`,
    '&:last-child': {
      borderRight: 'none',
    },
  },
  rowsContainer: {
    position: 'relative',
    width: '100%',
    willChange: 'transform', // Optimize for animations
    backgroundColor: 'transparent', // Ensure transparency to let row backgrounds show through
  },
  rowWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    willChange: 'transform', // Optimize for animations
    backgroundColor: 'transparent', // Ensure transparency to let row backgrounds show through
    width: '100%', // Ensure the wrapper spans the full width
    overflow: 'visible', // Allow content to overflow for full-width background
  },
  noDataMessage: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}), { name: 'VirtualizedTable' });

const VirtualizedTable = ({
  data = [],
  rowHeight,
  headerContent,
  renderRow,
  keyExtractor = (item, index) => `${index}-${item?.widx || ''}`,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  showHeader = true,
  buffer = VIRTUALIZATION_BUFFER,
}) => {
  const classes = useStyles();
  const scrollContainerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate exact content width
  const exactWidth = useMemo(() => {
    if (!headerContent) return 0;
    
    const columns = React.Children.toArray(headerContent);
    const columnCount = columns.length;
    
    // Calculate widths including borders
    const calculatedWidth = columns.reduce((total, child, index) => {
      const width = child.props.style?.width || 0;
      const flexGrow = child.props.style?.flexGrow || 0;
      const flexWidth = flexGrow ? 200 : 0;
      const borderWidth = index < columnCount - 1 ? 1 : 0; // 1px border between columns
      return total + width + flexWidth + borderWidth;
    }, 0);
    
    // Add a small buffer (20px) to ensure full coverage of all columns
    return calculatedWidth + 20;
  }, [headerContent]);

  // Calculate total height
  const totalHeight = useMemo(() => {
    if (!data.length) return 0;
    // Add header height and a small buffer to prevent any rounding issues
    return (data.length * rowHeight) + HEADER_HEIGHT + 2;
  }, [data.length, rowHeight]);

  // Handle scroll
  const handleScroll = useCallback((event) => {
    setScrollTop(event.target.scrollTop);
  }, []);

  // Process header cells to ensure proper width handling
  const processedHeaderContent = useMemo(() => {
    if (!headerContent) return null;
    return React.Children.map(headerContent, child => {
      const width = child.props.style?.width || 0;
      const flexGrow = child.props.style?.flexGrow || 0;
      
      return React.cloneElement(child, {
        className: classes.headerCell,
        style: {
          ...child.props.style,
          width: flexGrow ? `${width + 200}px` : `${width}px`, // Add space for flex columns
          minWidth: `${width}px`,
        },
      });
    });
  }, [headerContent, classes.headerCell]);

  // Calculate visible rows
  const visibleRows = useMemo(() => {
    // Early validation of required props
    if (!data || !Array.isArray(data)) return [];
    if (!containerHeight || typeof containerHeight !== 'number') return [];
    if (typeof rowHeight !== 'number' || rowHeight <= 0) {
      console.error("VirtualizedTable requires a valid 'rowHeight' prop (positive number).");
      return [];
    }

    // Adjust scroll position to account for header height
    const effectiveScrollTop = Math.max(0, scrollTop);
    
    // Calculate the visible area start index
    const startIndex = Math.max(0, Math.floor(effectiveScrollTop / rowHeight));
    const visibleRowCount = Math.ceil(containerHeight / rowHeight);
    const endIndex = startIndex + visibleRowCount;

    // Calculate buffer indices
    const bufferStartIndex = Math.max(0, startIndex - buffer);
    const bufferEndIndex = Math.min(endIndex + buffer, data.length);

    // Get buffered rows with their positions
    return data.slice(bufferStartIndex, bufferEndIndex).map((item, index) => ({
      item,
      index: bufferStartIndex + index,
      top: (bufferStartIndex + index) * rowHeight,
    }));
  }, [data, scrollTop, containerHeight, rowHeight, buffer]);

  // Validate required props after all hooks
  const isValid = useMemo(() => {
    if (typeof rowHeight !== 'number' || rowHeight <= 0) {
      console.error("VirtualizedTable requires a valid 'rowHeight' prop (positive number).");
      return false;
    }
    if (!data || !Array.isArray(data)) {
      console.error("VirtualizedTable requires a valid 'data' prop (array).");
      return false;
    }
    if (!containerHeight || typeof containerHeight !== 'number') {
      console.error("VirtualizedTable requires a valid 'containerHeight' prop (number).");
      return false;
    }
    return true;
  }, [rowHeight, data, containerHeight]);

  // Return error state if validation fails
  if (!isValid) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        Error: Invalid props provided to VirtualizedTable.
      </div>
    );
  }

  return (
    <div className={classes.tableContainer} style={{ height: containerHeight }}>
      <div 
        ref={scrollContainerRef}
        className={classes.scrollContainer}
        onScroll={handleScroll}
        style={{ flex: 1 }}
      >
        {/* Header */}
        {showHeader && (
          <div className={classes.headerContainer}>
            {processedHeaderContent}
          </div>
        )}
        {/* Content wrapper with exact width */}
        <div className={classes.contentWrapper} style={{ width: exactWidth }}>
          
          {/* Body */}
          {data.length > 0 ? (
            <div className={classes.rowsContainer} style={{ 
              height: totalHeight,
              paddingTop: HEADER_HEIGHT // Add padding to push content below header
            }}>
              {visibleRows.map(({ item, index, top }) => (
                <div 
                  key={keyExtractor(item, index)} 
                  className={classes.rowWrapper}
                  style={{ 
                    transform: `translateY(${top}px)`,
                    width: `${exactWidth}px` // Explicitly set width to match full content width
                  }}
                >
                  {renderRow(item, index, exactWidth)}
                </div>
              ))}
            </div>
          ) : (
            <Box className={classes.noDataMessage}>
              <Typography variant="body1">No data available</Typography>
            </Box>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(VirtualizedTable);
