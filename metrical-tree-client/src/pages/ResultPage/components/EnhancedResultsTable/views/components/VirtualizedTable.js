import React, { useRef, useEffect, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import { DEFAULT_CONTAINER_HEIGHT, VIRTUALIZATION_BUFFER } from '../../constants';

const useStyles = makeStyles((theme) => ({
  virtualTableContainer: {
    overflow: 'auto',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    position: 'relative',
    '&:focus': {
      outline: 'none',
    },
  },
  virtualTableWrapper: {
    position: 'relative',
    width: '100%',
  },
  virtualizedRowsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    willChange: 'transform', // Optimize for animation performance
  },
  tableHeader: {
    backgroundColor: theme.palette.background.default,
    borderBottom: `2px solid ${theme.palette.divider}`,
    position: 'sticky',
    top: 0,
    zIndex: 2,
    display: 'flex',
    padding: theme.spacing(1),
    fontWeight: 'bold',
  },
  noDataMessage: {
    padding: theme.spacing(4),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
  // Row styles are defined in TableRow component
}));

/**
 * VirtualizedTable component that efficiently renders only the visible rows
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination object from useHybridPagination
 * @param {React.ReactNode} props.headerContent - Content for the table header
 * @param {Function} props.renderRow - Function to render each row (item, index) => JSX
 * @param {string} props.keyExtractor - Function to extract a unique key for each item
 * @param {number} props.containerHeight - Height of the table container
 * @param {boolean} props.showHeader - Whether to show the header
 * @returns {JSX.Element}
 */
const VirtualizedTable = ({
  pagination,
  headerContent,
  renderRow,
  keyExtractor = (item, index) => `${index}-${item?.widx || ''}`,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
  showHeader = true,
}) => {
  const classes = useStyles();
  const containerRef = useRef(null);
  
  // Extract pagination data
  const {
    virtualizedData,
    currentPageData,
    handleScroll,
    setTableContainerHeight,
  } = pagination;
  
  // Initialize container height
  useEffect(() => {
    if (containerHeight) {
      setTableContainerHeight(containerHeight);
    }
  }, [containerHeight, setTableContainerHeight]);
  
  // Calculate rows to render with buffer for smoother scrolling
  const rowsToRender = useMemo(() => {
    // If we don't have data, return empty array
    if (!currentPageData.length) return [];
    
    const { startIndex, items, rowHeight } = virtualizedData;
    
    // Calculate buffer indices
    const bufferStartIndex = Math.max(0, startIndex - VIRTUALIZATION_BUFFER);
    const bufferEndIndex = Math.min(
      startIndex + items.length + VIRTUALIZATION_BUFFER,
      currentPageData.length
    );
    
    // Get buffered rows
    const bufferedRows = currentPageData.slice(bufferStartIndex, bufferEndIndex);
    
    // Calculate Y position based on buffer start
    const translateY = bufferStartIndex * rowHeight;
    
    return { 
      rows: bufferedRows, 
      translateY,
      startRenderIndex: bufferStartIndex,
    };
  }, [currentPageData, virtualizedData]);
  
  // Render the table with virtualization
  return (
    <div
      ref={containerRef}
      className={classes.virtualTableContainer}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
      tabIndex={0} // Make it focusable for keyboard navigation
    >
      <div
        className={classes.virtualTableWrapper}
        style={{ height: virtualizedData.totalHeight }}
      >
        {/* Header (stays fixed) */}
        {showHeader && (
          <div className={classes.tableHeader}>
            {headerContent}
          </div>
        )}
        
        {/* Virtualized rows */}
        {currentPageData.length > 0 ? (
          <div
            className={classes.virtualizedRowsContainer}
            style={{
              transform: `translateY(${rowsToRender.translateY}px)`,
            }}
          >
            {rowsToRender.rows.map((item, localIndex) => {
              const actualIndex = rowsToRender.startRenderIndex + localIndex;
              return (
                <React.Fragment key={keyExtractor(item, actualIndex)}>
                  {renderRow(item, actualIndex)}
                </React.Fragment>
              );
            })}
          </div>
        ) : (
          <Box className={classes.noDataMessage}>
            <Typography variant="body1">No data available</Typography>
          </Box>
        )}
      </div>
    </div>
  );
};

export default React.memo(VirtualizedTable);
