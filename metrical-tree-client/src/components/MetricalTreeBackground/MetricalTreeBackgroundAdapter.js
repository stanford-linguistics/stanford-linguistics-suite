import React, { useRef, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import RefreshIcon from '@material-ui/icons/Refresh';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { STANFORD_COLORS } from './constants';
import LinguisticMetricalTree from './LinguisticMetricalTree';

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    overflow: 'hidden',
    backgroundColor: props => props.backgroundColor || 'transparent',
  },
  controls: {
    position: 'absolute',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 10,
    display: 'flex',
    gap: theme.spacing(1),
  },
  controlButton: {
    backgroundColor: STANFORD_COLORS.RED,
    color: 'white',
    '&:hover': {
      backgroundColor: STANFORD_COLORS.LIGHT_RED,
    },
    minWidth: 'unset',
    padding: theme.spacing(0.5, 1),
  },
}));

/**
 * MetricalTreeBackgroundAdapter - A drop-in replacement adapter for the original MetricalTreeBackground
 * that renders the new LinguisticMetricalTree component while maintaining the same props interface
 */
const MetricalTreeBackgroundAdapter = React.forwardRef((props, ref) => {
  const {
    colorScheme = {},
    animation = {},
    tree = {},
    grid = {},
    particles = {},
    responsive = {},
    showControls = true,
    className = '',
    onReady,
    onTreeGenerated,
  } = props;

  // Create a ref to the underlying LinguisticMetricalTree component
  const linguisticTreeRef = useRef(null);
  
  // Animation state
  const [isAnimationActive, setIsAnimationActive] = useState(
    animation.active !== undefined ? animation.active : true
  );
  
  // CSS classes
  const styleProps = { backgroundColor: colorScheme.backgroundColor };
  const classes = useStyles(styleProps);
  
  // Expose methods to parent component via ref
  React.useImperativeHandle(ref, () => ({
    regenerateTree: () => {
      if (linguisticTreeRef.current && linguisticTreeRef.current.regenerateTree) {
        linguisticTreeRef.current.regenerateTree();
      }
    },
    pauseAnimation: () => {
      if (linguisticTreeRef.current && linguisticTreeRef.current.toggleAnimation) {
        if (isAnimationActive) {
          linguisticTreeRef.current.toggleAnimation();
          setIsAnimationActive(false);
        }
      }
    },
    resumeAnimation: () => {
      if (linguisticTreeRef.current && linguisticTreeRef.current.toggleAnimation) {
        if (!isAnimationActive) {
          linguisticTreeRef.current.toggleAnimation();
          setIsAnimationActive(true);
        }
      }
    },
    setConfig: (newConfig) => {
      // This would need to be implemented to pass updated config to LinguisticMetricalTree
      console.log("setConfig called with", newConfig);
      // Regenerate tree to apply changes
      if (linguisticTreeRef.current && linguisticTreeRef.current.regenerateTree) {
        linguisticTreeRef.current.regenerateTree();
      }
    }
  }));
  
  /**
   * Toggle animation state
   */
  const toggleAnimation = useCallback(() => {
    if (linguisticTreeRef.current && linguisticTreeRef.current.toggleAnimation) {
      linguisticTreeRef.current.toggleAnimation();
      setIsAnimationActive(!isAnimationActive);
    }
  }, [isAnimationActive]);
  
  /**
   * Regenerate the tree
   */
  const regenerateTree = useCallback(() => {
    if (linguisticTreeRef.current && linguisticTreeRef.current.regenerateTree) {
      linguisticTreeRef.current.regenerateTree();
    }
  }, []);
  
  // Map props from old component to new component
  const getMappedProps = () => {
    return {
      ref: linguisticTreeRef,
      colorScheme: {
        ...colorScheme,
      },
      animation: {
        ...animation,
        active: isAnimationActive,
      },
      tree: {
        ...tree,
      },
      particles: {
        ...particles,
      },
      responsive: {
        ...responsive,
      },
      onReady,
      onTreeGenerated,
      showControls: false, // We'll handle controls separately to match the original component
    };
  };
  
  return (
    <div className={`${classes.root} ${className}`}>
      {/* Render the new LinguisticMetricalTree with adapted props */}
      <LinguisticMetricalTree {...getMappedProps()} />
      
      {/* Controls - rendered separately to match the original component's style */}
      {showControls && (
        <div className={classes.controls}>
          <Button
            className={classes.controlButton}
            variant="contained"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={regenerateTree}
          >
            Regenerate
          </Button>
          <Button
            className={classes.controlButton}
            variant="contained"
            size="small"
            startIcon={isAnimationActive ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={toggleAnimation}
          >
            {isAnimationActive ? 'Pause' : 'Resume'}
          </Button>
        </div>
      )}
    </div>
  );
});

MetricalTreeBackgroundAdapter.propTypes = {
  // Colors
  colorScheme: PropTypes.shape({
    unstressedColor: PropTypes.string,
    normalColor: PropTypes.string,
    stressedColor: PropTypes.string,
    backgroundColor: PropTypes.string,
    gridMajorLine: PropTypes.string,
    gridMinorLine: PropTypes.string,
    particleColors: PropTypes.arrayOf(PropTypes.string),
  }),
  
  // Animation
  animation: PropTypes.shape({
    active: PropTypes.bool,
    growthSpeed: PropTypes.number,
    growthDelay: PropTypes.number,
    regenerateTime: PropTypes.number,
    boundaryCheck: PropTypes.bool,
    autoRegenerate: PropTypes.bool,
  }),
  
  // Tree configuration
  tree: PropTypes.shape({
    maxDepth: PropTypes.number,
    growthSpeed: PropTypes.number,
    initialAngle: PropTypes.number,
    initialSpreadAngle: PropTypes.number,
    lengthReductionFactor: PropTypes.number,
    widthReductionFactor: PropTypes.number,
    branchSpreadFactor: PropTypes.number,
    minBranchAngle: PropTypes.number,
    maxBranchAngle: PropTypes.number,
    pulseEnabled: PropTypes.bool,
    pulseMinOpacity: PropTypes.number,
    pulseMaxOpacity: PropTypes.number,
    pulseDuration: PropTypes.number,
  }),
  
  // Grid configuration
  grid: PropTypes.shape({
    enabled: PropTypes.bool,
    majorSpacing: PropTypes.number,
    minorSpacing: PropTypes.number,
  }),
  
  // Particles configuration
  particles: PropTypes.shape({
    enabled: PropTypes.bool,
    count: PropTypes.number,
    maxSize: PropTypes.number,
    minSize: PropTypes.number,
    speed: PropTypes.number,
    opacityMin: PropTypes.number,
    opacityMax: PropTypes.number,
  }),
  
  // Responsive configuration
  responsive: PropTypes.shape({
    enabled: PropTypes.bool,
    minScaleFactor: PropTypes.number,
    maxScaleFactor: PropTypes.number,
    mobileThreshold: PropTypes.number,
    mobileMaxDepth: PropTypes.number,
    mobileParticleCount: PropTypes.number,
  }),
  
  // Display options
  showControls: PropTypes.bool,
  className: PropTypes.string,
  
  // Callbacks
  onReady: PropTypes.func,
  onTreeGenerated: PropTypes.func,
};

export default MetricalTreeBackgroundAdapter;