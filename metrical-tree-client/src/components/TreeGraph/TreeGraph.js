import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useMediaQuery } from '@material-ui/core';
import TreeGraphVisualization from '../MetricalTreeBackground/components/TreeGraphVisualization';
import useAvailableHeight from '../../hooks/useAvailableHeight';

/**
 * Style definitions for TreeGraph
 */
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    width: '100%',
    height: props => props.height || '350px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    margin: '0 auto',
    overflow: 'visible',
    zIndex: 20, // Add z-index
    [theme.breakpoints.down('sm')]: {
      height: props => props.mobileHeight || '300px',
    },
    [theme.breakpoints.down('xs')]: {
      height: props => props.smallMobileHeight || '250px',
    },
  },
  treeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'visible',
    zIndex: 15, // Add z-index
  }
}));

/**
 * TreeGraph - Standalone component that visualizes the metrical tree structure
 */
const TreeGraph = (props) => {
  const {
    height,
    mobileHeight,
    smallMobileHeight,
    className = '',
  } = props;

  // Get theme and setup responsive hooks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('xs'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const containerRef = useRef(null);
  
  // Get available height from custom hook
  const availableHeight = useAvailableHeight();
  
  // Calculate optimal height based on available space and current layout
  const optimalHeight = useMemo(() => {
    if (isLargeDesktop) {
      // Large desktop screens - can use more height
      return Math.min(450, availableHeight * 0.5);
    } else if (isDesktop) {
      // Regular desktop - slightly smaller
      return Math.min(400, availableHeight * 0.45);
    } else if (isMobile && !isSmallMobile) {
      // Tablets and medium screens
      return Math.min(300, availableHeight * 0.4);
    } else {
      // Small mobile screens
      return Math.min(250, availableHeight * 0.35);
    }
  }, [availableHeight, isLargeDesktop, isDesktop, isMobile, isSmallMobile]);

  // Styles - use dynamic height from calculations
  const styleProps = { 
    height: `${optimalHeight}px`, 
    mobileHeight: mobileHeight, 
    smallMobileHeight: smallMobileHeight 
  };
  const classes = useStyles(styleProps);

  return (
    <div className={`${classes.root} ${className}`} ref={containerRef}>
      <div className={classes.treeContainer}>
        <TreeGraphVisualization 
          isMobile={isMobile}
          onAnimationComplete={() => {}}
        />
      </div>
    </div>
  );
};

TreeGraph.propTypes = {
  height: PropTypes.string,
  mobileHeight: PropTypes.string,
  smallMobileHeight: PropTypes.string,
  className: PropTypes.string,
  isMobile: PropTypes.bool
};

TreeGraph.defaultProps = {
  isMobile: false
};

export default TreeGraph;
