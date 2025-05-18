import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { backgroundConfig } from './config';
import StressBarChart from './components/StressBarChart';
import ParticlesAnimation from './components/ParticlesAnimation';
import TreeGraphVisualization from './components/TreeGraphVisualization';

/**
 * Style definitions for MetricalTreeBackground
 */
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    minHeight: '100vh', // Full viewport height
    zIndex: 0,
    overflowY: 'auto', // Allow vertical scrolling when needed
    backgroundColor: props => props.backgroundColor || 'transparent',
  },
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100vh', // Full viewport height for better responsiveness
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto', // Allow vertical scrolling when needed
    // Use media queries for better responsiveness
    [theme.breakpoints.down('sm')]: {
      minHeight: '100vh', // Maintain full viewport height on smaller screens
    },
    [theme.breakpoints.down('xs')]: {
      minHeight: '100vh', // Maintain full viewport height on extra small screens
    },
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    minHeight: '100vh', // Full viewport height for grid
    zIndex: 1,
  },
  attribution: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '11px',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontStyle: 'italic',
    zIndex: 20,
    animation: 'fadeIn 1s ease-in-out',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('xs')]: {
      fontSize: '10px',
      padding: '3px 6px',
    },
  },
  '@global': {
    '@keyframes fadeIn': {
      '0%': { opacity: 0, transform: 'translateX(-50%) translateY(5px)' },
      '100%': { opacity: 1, transform: 'translateX(-50%) translateY(0)' }
    },
    '@keyframes wordBounce': {
      '0%': { transform: 'translateY(0)' },
      '30%': { transform: 'translateY(-4px)' },
      '50%': { transform: 'translateY(2px)' },
      '70%': { transform: 'translateY(-2px)' },
      '100%': { transform: 'translateY(0)' }
    },
    '@keyframes stressIndicatorFadeIn': {
      '0%': { opacity: 0, transform: 'translateY(-5px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' }
    }
  }
}));

/**
 * MetricalTreeBackground - A container component for linguistic visualizations
 * This component provides a background with grid, particles, and can host
 * various visualization components such as StressBarChart
 */
const MetricalTreeBackground = React.forwardRef((props, ref) => {
  const {
    backgroundColor = 'transparent',
    className = '',
  } = props;

  // Refs for SVG elements
  const gridSvgRef = useRef(null);
  
  // Props with defaults merged with config
  const particlesConfig = useMemo(() => {
    const userConfig = props.particles || {};
    return {
      enabled: userConfig.hasOwnProperty('enabled') ? userConfig.enabled : backgroundConfig.particles.enabled,
      count: userConfig.count || backgroundConfig.particles.count
    };
  }, [props.particles]);

  // State
  const [isMobile, setIsMobile] = useState(false);
  
  // Styles
  const styleProps = { backgroundColor };
  const classes = useStyles(styleProps);

  /**
   * Create grid lines in the SVG
   */
  const createGrid = useCallback(() => {
    if (!gridSvgRef.current || !backgroundConfig.grid.enabled) return;

    // Clear existing grid
    while (gridSvgRef.current.firstChild) {
      gridSvgRef.current.removeChild(gridSvgRef.current.firstChild);
    }
    
    const containerWidth = gridSvgRef.current.clientWidth;
    const containerHeight = gridSvgRef.current.clientHeight;
    
    const majorSpacing = backgroundConfig.grid.majorSpacing;
    const minorSpacing = backgroundConfig.grid.minorSpacing;
    
    const ns = 'http://www.w3.org/2000/svg';
    
    // Create major grid lines
    for (let x = 0; x < containerWidth; x += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', containerHeight);
      line.setAttribute('stroke', backgroundConfig.colors.gridMajorLine);
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    for (let y = 0; y < containerHeight; y += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', containerWidth);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', backgroundConfig.colors.gridMajorLine);
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    // Create minor grid lines
    for (let x = 0; x < containerWidth; x += minorSpacing) {
      if (x % majorSpacing !== 0) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', x);
        line.setAttribute('y2', containerHeight);
        line.setAttribute('stroke', backgroundConfig.colors.gridMinorLine);
        line.setAttribute('stroke-width', 0.5);
        gridSvgRef.current.appendChild(line);
      }
    }
    
    for (let y = 0; y < containerHeight; y += minorSpacing) {
      if (y % majorSpacing !== 0) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', containerWidth);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', backgroundConfig.colors.gridMinorLine);
        line.setAttribute('stroke-width', 0.5);
        gridSvgRef.current.appendChild(line);
      }
    }
  }, []);



  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= backgroundConfig.responsive.mobileThreshold);
    createGrid();
  }, [createGrid]);

  // Initialize on mount and update on props change
  useEffect(() => {
    // Check if device is mobile
    setIsMobile(window.innerWidth <= backgroundConfig.responsive.mobileThreshold);
    
    // Create grid
    createGrid();
    
    // Set up resize listener
    const handleResizeDebounced = () => {
      setTimeout(handleResize, 250);
    };
    window.addEventListener('resize', handleResizeDebounced);
    
    return () => {
      window.removeEventListener('resize', handleResizeDebounced);
    };
  }, [createGrid, handleResize]);

  return (
    <div className={`${classes.root} ${className}`}>
      <div className={classes.container}>
        {/* Grid */}
        <svg 
          className={classes.gridSvg} 
          ref={gridSvgRef} 
          xmlns="http://www.w3.org/2000/svg"
        />
        
        {/* Particles Animation */}
        <ParticlesAnimation 
          enabled={particlesConfig.enabled}
          count={particlesConfig.count}
          colors={backgroundConfig.particles.colors}
          isMobile={isMobile}
        />
        
        {/* Visualization components */}
        <StressBarChart 
          isMobile={isMobile}
        />
        
        {/* Tree Graph Visualization */}
        <TreeGraphVisualization 
          isMobile={isMobile}
        />
      </div>
    </div>
  );
});

MetricalTreeBackground.propTypes = {
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
  particles: PropTypes.shape({
    enabled: PropTypes.bool,
    count: PropTypes.number
  })
};

export default MetricalTreeBackground;
