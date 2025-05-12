import React from 'react';
import { 
  makeStyles, 
  Typography, 
} from '@material-ui/core';
import { 
  ShowChart as ShowChartIcon,
  Info as InfoIcon
} from '@material-ui/icons';
import CrispTooltip from '../../CrispTooltip';

const useStyles = makeStyles((theme) => ({
  outerContainer: {
    width: '100%',
    position: 'relative',
    marginBottom: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.secondary.main,
      fontSize: '1.25rem',
      [theme.breakpoints.down('sm')]: {
        fontSize: '1.1rem',
        marginRight: theme.spacing(0.75),
      },
    },
    fontWeight: 500,
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing(0.5),
    },
  },
  infoIcon: {
    fontSize: '0.8rem',
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    cursor: 'help',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: theme.palette.secondary.main,
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.75rem',
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.7rem',
      marginLeft: theme.spacing(0.25),
    }
  },
  minimapContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    height: 45,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(242,242,242,0.3) 100%)',
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.75),
      height: 40,
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0.5),
      height: 35,
    },
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.05)',
    border: `1px solid ${theme.palette.divider}`,
    overflowX: 'auto',
    overflowY: 'hidden',
    position: 'relative',
    WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
    scrollbarWidth: 'thin',
    '&::-webkit-scrollbar': {
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: theme.palette.grey[200],
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.secondary.light,
      borderRadius: '3px',
    },
  },
  barsContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '100%',
    position: 'relative',
  },
  minimapPoint: {
    width: 6,
    marginRight: 2,
    backgroundColor: theme.palette.grey[400],
    minHeight: 1,
    flexShrink: 0,
    transition: 'height 0.3s ease',
  },
  currentViewPoint: {
    backgroundColor: theme.palette.primary.main,
  },
  viewportIndicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    border: '1px solid rgba(76, 175, 80, 0.3)',
    borderRadius: 4,
    pointerEvents: 'none',
    top: 0,
  },
  emptyMessage: {
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: theme.palette.text.secondary,
  }
}));

const ContourMinimap = ({ 
  fullContourData, 
  currentPage, 
  chunkSize, 
  totalWords,
  onNavigate
}) => {
  const classes = useStyles();
  const containerRef = React.useRef(null);
  

  
  // Auto-scroll to keep the current viewport visible
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const totalWidth = container.scrollWidth;
    const viewportWidth = container.clientWidth;
    
    // Calculate the position to scroll to (center the current viewport)
    const startIdx = currentPage * chunkSize;
    const scrollRatio = startIdx / totalWords;
    const scrollPosition = totalWidth * scrollRatio - viewportWidth / 2;
    
    // Scroll to the calculated position
    container.scrollLeft = Math.max(0, scrollPosition);
  }, [currentPage, chunkSize, totalWords]);
  
  // Calculate viewport position and width
  // Using 0-indexed currentPage to be consistent with the SentencePreview component
  const startIdx = currentPage * chunkSize;
  const endIdx = Math.min(startIdx + chunkSize, totalWords);
  
  // Calculate viewport indicator position and width
  // Ensure we don't exceed 100% for the viewport width
  const viewportStartPercent = Math.min((startIdx / totalWords) * 100, 100);
  const viewportWidthPercent = Math.min(((endIdx - startIdx) / totalWords) * 100, 100 - viewportStartPercent);
  
  // Ensure we have an array to work with, create a dummy array if needed
  const contourDataArray = Array.isArray(fullContourData) ? 
    fullContourData : Array(totalWords).fill(2);
  

  
  // Find min/max for scaling - filter out null and NaN values
  const validValues = contourDataArray.filter(val => val !== null && !isNaN(val));
  

  // If no valid values, create default heights
  let min = 0, max = 5, range = 5;
  
  if (validValues.length > 0) {
    // Calculate min/max for scaling, handling edge cases
    min = Math.min(...validValues);
    max = Math.max(...validValues);
    // Prevent division by zero by ensuring min/max are different
    range = max - min || 1; // Use 1 if range is 0
    
  }
  
  // Handle click to navigate
  const handleMinimapClick = (e) => {
    if (!onNavigate) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Get the total scrollable width and the current scroll position
    const scrollableWidth = container.scrollWidth;
    const scrollLeft = container.scrollLeft;
    
    // Calculate the click position relative to the total width, accounting for scroll
    const clickX = e.clientX - rect.left + scrollLeft;
    const clickPercent = clickX / scrollableWidth;
    
    // Calculate max possible page number
    const maxPage = Math.ceil(totalWords / chunkSize) - 1;
    
    // Using 0-indexed page numbers to be consistent with the SentencePreview component
    // Ensure we don't exceed the maximum page number
    const rawTargetPage = Math.floor((clickPercent * totalWords) / chunkSize);
    const targetPage = Math.max(0, Math.min(rawTargetPage, maxPage));
    
    
    onNavigate(targetPage);
  };
  
  // Responsive sizing calculations
  const [containerWidth, setContainerWidth] = React.useState(0);
  
  // Update container width on resize
  React.useEffect(() => {
    if (!containerRef.current) return;
    
    // Get initial width
    setContainerWidth(containerRef.current.clientWidth);
    
    // Create resize observer to update width when container resizes
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    
    // Capture the current ref value to use in cleanup
    const currentContainer = containerRef.current;
    
    resizeObserver.observe(currentContainer);
    
    // Cleanup
    return () => {
      if (currentContainer) {
        resizeObserver.unobserve(currentContainer);
      }
    };
  }, []);
  
  // Determine if we need to use fixed sizing or responsive sizing
  // Calculate responsive bar width based on container width and number of data points
  const MIN_BAR_WIDTH = 4; // Minimum width for each bar
  const MIN_BAR_MARGIN = 1; // Minimum margin between bars
  const MIN_TOTAL_BAR_WIDTH = MIN_BAR_WIDTH + MIN_BAR_MARGIN;
  
  // Calculate the ideal responsive bar width (if we were to fit all bars in the container)
  const availableWidth = Math.max(containerWidth - 12, 100); // Account for padding and ensure minimum
  const totalPoints = fullContourData?.length || totalWords;
  
  // Determine if we need fixed sizing (when there are more bars than can fit) 
  // or responsive sizing (when bars could be wider to fill the container)
  const needsFixedSizing = totalPoints * MIN_TOTAL_BAR_WIDTH > availableWidth;
  
  // Set bar dimensions
  let barWidth, barMargin, totalBarWidth, contentWidth;
  
  if (needsFixedSizing) {
    // Use minimum sizes when there's not enough space
    barWidth = MIN_BAR_WIDTH;
    barMargin = MIN_BAR_MARGIN;
    totalBarWidth = MIN_TOTAL_BAR_WIDTH;
    contentWidth = totalPoints * totalBarWidth;
  } else {
    // Calculate responsive width to fill the container
    // Leave some margin to ensure bars aren't too wide
    const maxBarWidth = 20; // Maximum width for each bar even when space allows
    const calculatedBarWidth = Math.min(maxBarWidth, availableWidth / totalPoints * 0.85);
    
    barWidth = Math.max(calculatedBarWidth, MIN_BAR_WIDTH);
    barMargin = Math.max(calculatedBarWidth * 0.15, MIN_BAR_MARGIN);
    totalBarWidth = barWidth + barMargin;
    contentWidth = '100%'; // Use percentage to fill container when possible
  }
  

  
  return (
    <div className={classes.outerContainer}>
      <div className={classes.header}>
        <ShowChartIcon fontSize="small" style={{ color: '#9c27b0' }} />
        <Typography variant="subtitle2" style={{ fontWeight: 500 }}>
          Stress Contour Minimap
          <CrispTooltip title="This minimap shows the stress contour pattern across the entire text. Click anywhere to navigate to that section. Taller bars indicate higher stress points." arrow>
            <InfoIcon className={classes.infoIcon} />
          </CrispTooltip>
        </Typography>
      </div>
      <div 
        ref={containerRef}
        className={classes.minimapContainer} 
        onClick={handleMinimapClick}
      >
        <div 
          className={classes.barsContainer}
          style={{ 
            minWidth: typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth,
            width: typeof contentWidth === 'number' ? `${contentWidth}px` : contentWidth
          }}
        >
          {fullContourData.map((value, index) => {
            const isInCurrentView = index >= startIdx && index < endIdx;
            
            // Skip rendering points for null/NaN values to create gaps in the visualization
            if (value === null || isNaN(value)) {
              return (
                <div
                  key={index}
                  style={{ 
                    width: `${barWidth}px`,
                    marginRight: `${barMargin}px`,
                    height: '1px', 
                    opacity: 0.3,
                    backgroundColor: '#e0e0e0', // Light grey color
                    flexShrink: 0 // Prevent shrinking
                  }}
                  title={`Word ${index + 1}: No stress data`}
                />
              );
            }
            
            const normalizedHeight = ((value - min) / range) * 30 + 2;
            
            return (
              <div
                key={index}
                style={{ 
                  width: `${barWidth}px`,
                  marginRight: `${barMargin}px`,
                  height: `${normalizedHeight}px`,
                  backgroundColor: isInCurrentView ? '#4caf50' : '#bdbdbd',
                  borderRadius: '1px',
                  boxShadow: isInCurrentView ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                  opacity: isInCurrentView ? 1 : 0.7,
                  transition: 'all 0.3s ease',
                  flexShrink: 0, // Prevent shrinking
                  transform: isInCurrentView ? 'scaleY(1.1)' : 'scaleY(1)',
                  transformOrigin: 'bottom'
                }}
                title={`Word ${index + 1}: ${value}`}
              />
            );
          })}
          
          {/* Viewport indicator - positioned inside the inner container to scroll with the bars */}
          <div 
            className={classes.viewportIndicator}
            style={{
              left: `${viewportStartPercent}%`,
              width: `${viewportWidthPercent}%`,
              position: 'absolute',
              top: 0,
              bottom: 0,
              backgroundColor: 'rgba(76, 175, 80, 0.15)',
              border: '2px solid rgba(76, 175, 80, 0.5)',
              borderRadius: '4px',
              boxShadow: 'inset 0 0 4px rgba(76, 175, 80, 0.2)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContourMinimap;
