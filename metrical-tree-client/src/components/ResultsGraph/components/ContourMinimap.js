import React from 'react';
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  minimapContainer: {
    display: 'flex',
    alignItems: 'flex-end',
    height: 40,
    width: '100%',
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1),
    marginBottom: theme.spacing(2),
    boxShadow: theme.shadows[1],
    overflow: 'hidden',
    position: 'relative',
  },
  minimapPoint: {
    width: 4,
    marginRight: 1,
    backgroundColor: theme.palette.grey[400],
    minHeight: 1,
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
  
  // Calculate viewport position and width
  const startIdx = (currentPage - 1) * chunkSize;
  const endIdx = Math.min(startIdx + chunkSize, totalWords);
  const viewportStartPercent = (startIdx / totalWords) * 100;
  const viewportWidthPercent = ((endIdx - startIdx) / totalWords) * 100;
  
  // Find min/max for scaling
  const validValues = fullContourData.filter(val => !isNaN(val));
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  const range = max - min;
  
  // Handle click to navigate
  const handleMinimapClick = (e) => {
    if (!onNavigate) return;
    
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const targetPage = Math.max(1, Math.ceil((clickPercent * totalWords) / chunkSize));
    
    onNavigate(targetPage);
  };
  
  return (
    <div 
      className={classes.minimapContainer} 
      onClick={handleMinimapClick}
      style={{ cursor: onNavigate ? 'pointer' : 'default' }}
    >
      {fullContourData.map((value, index) => {
        const isInCurrentView = index >= startIdx && index < endIdx;
        const normalizedHeight = isNaN(value) ? 0 : ((value - min) / range) * 30 + 2;
        
        return (
          <div
            key={index}
            className={`${classes.minimapPoint} ${isInCurrentView ? classes.currentViewPoint : ''}`}
            style={{ height: `${normalizedHeight}px` }}
            title={`Word ${index + 1}: ${value}`}
          />
        );
      })}
      
      {/* Viewport indicator */}
      <div 
        className={classes.viewportIndicator}
        style={{
          left: `${viewportStartPercent}%`,
          width: `${viewportWidthPercent}%`
        }}
      />
    </div>
  );
};

export default ContourMinimap;
