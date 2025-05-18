import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { backgroundConfig } from '../MetricalTreeBackground/config';
import ParticlesAnimation from '../MetricalTreeBackground/components/ParticlesAnimation';

/**
 * Style definitions for GridBackground
 */
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    zIndex: 0,
    backgroundColor: props => props.backgroundColor || 'transparent',
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    minHeight: '100vh',
    zIndex: 1,
  },
}));

/**
 * GridBackground - A background component with grid pattern and optional particles
 */
const GridBackground = (props) => {
  const {
    backgroundColor = 'transparent',
    className = '',
    showParticles = true,
    particleCount
  } = props;

  // Refs for SVG elements
  const gridSvgRef = useRef(null);
  
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
      {/* Grid */}
      <svg 
        className={classes.gridSvg} 
        ref={gridSvgRef} 
        xmlns="http://www.w3.org/2000/svg"
      />
      
      {/* Particles Animation (optional) */}
      {showParticles && (
        <ParticlesAnimation 
          enabled={true}
          count={particleCount || backgroundConfig.particles.count}
          colors={backgroundConfig.particles.colors}
          isMobile={isMobile}
        />
      )}
    </div>
  );
};

GridBackground.propTypes = {
  backgroundColor: PropTypes.string,
  className: PropTypes.string,
  showParticles: PropTypes.bool,
  particleCount: PropTypes.number
};

export default GridBackground;
