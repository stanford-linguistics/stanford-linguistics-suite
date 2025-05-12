import React, { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import Button from '@material-ui/core/Button';
import RefreshIcon from '@material-ui/icons/Refresh';
import PauseIcon from '@material-ui/icons/Pause';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import { useStyles } from './styles';
import { DEFAULT_CONFIG } from './constants';
import { Branch, calculateScaleFactor, isInVisibleArea, debounce, updateContainerDimensions } from './utils';

/**
 * MetricalTreeBackground - A dynamic, animated tree visualization
 * that represents stress patterns in metrical trees for linguistics.
 */
const MetricalTreeBackground = forwardRef((props, ref) => {
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

  // Combine default config with props
  const config = useMemo(() => {
    return {
      ...DEFAULT_CONFIG,
      tree: { ...DEFAULT_CONFIG.tree, ...tree },
      grid: { ...DEFAULT_CONFIG.grid, ...grid },
      animation: { ...DEFAULT_CONFIG.animation, ...animation },
      particles: { ...DEFAULT_CONFIG.particles, ...particles },
      responsive: { ...DEFAULT_CONFIG.responsive, ...responsive },
    };
  }, [tree, grid, animation, particles, responsive]);

  // Apply custom color scheme if provided
  useEffect(() => {
    if (colorScheme.unstressedColor) {
      config.tree.stressColors[0] = colorScheme.unstressedColor;
    }
    if (colorScheme.normalColor) {
      config.tree.stressColors[1] = colorScheme.normalColor;
    }
    if (colorScheme.stressedColor) {
      config.tree.stressColors[2] = colorScheme.stressedColor;
    }
    if (colorScheme.gridMajorLine) {
      config.grid.majorLine = colorScheme.gridMajorLine;
    }
    if (colorScheme.gridMinorLine) {
      config.grid.minorLine = colorScheme.gridMinorLine;
    }
    if (colorScheme.particleColors && Array.isArray(colorScheme.particleColors)) {
      config.particles.colors = colorScheme.particleColors;
    }
  }, [colorScheme, config]);

  // Component state
  const [isAnimationActive, setIsAnimationActive] = useState(config.animation.active);
  const [isMobile, setIsMobile] = useState(false);

  // Create refs for SVG elements
  const gridSvgRef = useRef(null);
  const treeSvgRef = useRef(null);
  const mobileTreeSvgRef = useRef(null);
  const particlesSvgRef = useRef(null);

  // Animation and tree state references
  const animationFrameIdRef = useRef(null);
  const regenerationTimerRef = useRef(null);
  const pendingBranchCreationsRef = useRef(0);
  const allBranchesRef = useRef([]);
  const allNodesAndLabelsRef = useRef([]);
  const particlesRef = useRef([]);

  // CSS classes
  const styleProps = { backgroundColor: colorScheme.backgroundColor };
  const classes = useStyles(styleProps);

  /**
   * Create grid lines in the SVG
   */
  const createGrid = useCallback(() => {
    if (!gridSvgRef.current) return;

    // Clear the SVG
    while (gridSvgRef.current.firstChild) {
      gridSvgRef.current.removeChild(gridSvgRef.current.firstChild);
    }

    // Use container dimensions for grid instead of window dimensions
    const containerWidth = gridSvgRef.current.clientWidth;
    const containerHeight = gridSvgRef.current.clientHeight;
    
    const scaleFactor = calculateScaleFactor(config);
    const majorSpacing = config.grid.majorSpacing * scaleFactor;
    const minorSpacing = config.grid.minorSpacing * scaleFactor;
    
    const ns = 'http://www.w3.org/2000/svg';

    // Create major grid lines
    for (let x = 0; x < containerWidth; x += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', containerHeight);
      line.setAttribute('stroke', config.grid.majorLine);
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    for (let y = 0; y < containerHeight; y += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', containerWidth);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', config.grid.majorLine);
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    // Create minor grid lines (fewer on mobile)
    const minorLineSkip = isMobile ? 3 : 1; // Skip more lines on mobile
    
    for (let x = 0; x < containerWidth; x += minorSpacing * minorLineSkip) {
      if (x % majorSpacing !== 0) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', x);
        line.setAttribute('y2', containerHeight);
        line.setAttribute('stroke', config.grid.minorLine);
        line.setAttribute('stroke-width', 0.5);
        gridSvgRef.current.appendChild(line);
      }
    }
    
    for (let y = 0; y < containerHeight; y += minorSpacing * minorLineSkip) {
      if (y % majorSpacing !== 0) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', y);
        line.setAttribute('x2', containerWidth);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', config.grid.minorLine);
        line.setAttribute('stroke-width', 0.5);
        gridSvgRef.current.appendChild(line);
      }
    }
  }, [config, isMobile]);

  /**
   * Create particles in the SVG
   */
  const createParticles = useCallback(() => {
    if (!particlesSvgRef.current || !config.particles.enabled) return;

    // Clear the SVG
    while (particlesSvgRef.current.firstChild) {
      particlesSvgRef.current.removeChild(particlesSvgRef.current.firstChild);
    }

    // Clear the particles array
    particlesRef.current = [];
    
    // Adjust particle count based on device
    const particleCount = isMobile ? 
      config.responsive.mobileParticleCount : 
      config.particles.count;
    
    const ns = 'http://www.w3.org/2000/svg';

    // Use container dimensions for particles
    const containerWidth = particlesSvgRef.current.clientWidth;
    const containerHeight = particlesSvgRef.current.clientHeight;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = {
        x: Math.random() * containerWidth,
        y: Math.random() * containerHeight,
        size: Math.random() * (config.particles.maxSize - config.particles.minSize) + config.particles.minSize,
        speedX: (Math.random() - 0.5) * config.particles.speed,
        speedY: (Math.random() - 0.5) * config.particles.speed,
        color: config.particles.colors[Math.floor(Math.random() * config.particles.colors.length)],
        opacity: Math.random() * (config.particles.opacityMax - config.particles.opacityMin) + config.particles.opacityMin,
        element: document.createElementNS(ns, 'circle'),
        containerWidth,
        containerHeight
      };
      
      // Create SVG element
      particle.element.setAttribute('cx', particle.x);
      particle.element.setAttribute('cy', particle.y);
      particle.element.setAttribute('r', particle.size);
      particle.element.setAttribute('fill', particle.color);
      particle.element.setAttribute('opacity', particle.opacity);
      
      particlesSvgRef.current.appendChild(particle.element);
      particlesRef.current.push(particle);
    }
  }, [config, isMobile]);

  /**
   * Update particles position in animation frame
   */
  const updateParticles = useCallback(() => {
    if (!config.particles.enabled || !particlesRef.current.length) return;
    
    particlesRef.current.forEach(particle => {
      // Update position
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // Bounce off edges using the container dimensions
      if (particle.x < 0 || particle.x > particle.containerWidth) {
        particle.speedX *= -1;
      }
      
      if (particle.y < 0 || particle.y > particle.containerHeight) {
        particle.speedY *= -1;
      }
      
      // Update element position
      particle.element.setAttribute('cx', particle.x);
      particle.element.setAttribute('cy', particle.y);
    });
  }, [config.particles.enabled]);

  /**
   * Create a new branch and add it to the tree
   * @param {Object} branchParams - Parameters for the new branch
   * @returns {Object} The created branch
   */
  const createBranch = useCallback((branchParams) => {
    const targetSvg = isMobile ? mobileTreeSvgRef.current : treeSvgRef.current;
    
    const branch = new Branch({
      ...branchParams,
      svg: branchParams.svg || targetSvg,
      config
    });
    
    allBranchesRef.current.push(branch);
    return branch;
  }, [config, isMobile]);

  /**
   * Create child branches for a branch that has finished growing
   * @param {Object} branch - The parent branch
   */
  const createChildBranches = useCallback((branch) => {
    if (!config.animation.active) return;
  
    // Calculate scaling factor
    const scaleFactor = calculateScaleFactor(config);
    
    // Get branching points from the branch
    const branchingPoints = branch.calculateBranchingPoints(isMobile);
    
    // Create all branches with calculated properties
    for (const point of branchingPoints) {
      // Calculate width - thinner at higher depths
      const width = branch.width * config.tree.widthReductionFactor * scaleFactor;
      
      // Check if endpoint would be in visible area
      const potentialEndX = branch.endX + Math.cos(point.angle) * point.length;
      const potentialEndY = branch.endY + Math.sin(point.angle) * point.length;
      
      // Only create branches that will be visible
      if (!config.animation.boundaryCheck || isInVisibleArea(potentialEndX, potentialEndY)) {
        // Create child branch
        const childBranch = createBranch({
          startX: branch.endX,
          startY: branch.endY,
          length: Math.max(config.tree.minLength * scaleFactor, point.length),
          angle: point.angle,
          width: Math.max(1, width), // Ensure minimum width of 1
          depth: branch.depth + 1,
          stress: point.stress,
          parentId: branch.id,
        });
        
        branch.childBranches.push(childBranch);
      }
    }
  }, [config, createBranch, isMobile]);

  /**
   * Plan the creation of child branches with appropriate delay
   * @param {Object} branch - The parent branch
   */
  const planChildBranches = useCallback((branch) => {
    // Adjust max depth based on device
    const maxDepth = isMobile ? 
      config.responsive.mobileMaxDepth : 
      config.tree.maxDepth;
      
    if (branch.depth >= maxDepth) return;
    
    // Check if branch endpoint is in visible area before creating children
    if (!isInVisibleArea(branch.endX, branch.endY)) return;
    
    pendingBranchCreationsRef.current++;
    
    // Delay branch creation for animation effect
    setTimeout(() => {
      createChildBranches(branch);
      pendingBranchCreationsRef.current--;
    }, config.animation.growthDelay * (branch.depth + 1));
  }, [config, createChildBranches, isMobile]);

  /**
   * Animation function that advances the tree growth
   */
  const animate = useCallback(() => {
    if (!config.animation.active) {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      return;
    }
    
    let stillGrowing = false;
    
    // Grow all branches
    for (let i = 0; i < allBranchesRef.current.length; i++) {
      const branch = allBranchesRef.current[i];
      if (branch.grow()) {
        stillGrowing = true;
      } else if (branch.growing === false && !branch.childrenPlanned) {
        // If the branch just finished growing, plan child branches
        planChildBranches(branch);
        branch.childrenPlanned = true;
        
        // Start pulse animation for branches that are fully grown
        if (config.tree.pulseEnabled && branch.stress >= 1 && !branch.pulseAnimation) {
          branch.startPulseAnimation(requestAnimationFrame);
        }
      }
    }
    
    // Update particles
    updateParticles();
    
    // Continue animation if still growing or waiting for branches to be created
    if (stillGrowing || pendingBranchCreationsRef.current > 0) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    } else {
      // Double check if any branch is still growing or pending
      let anyGrowing = allBranchesRef.current.some(branch => branch.growing);
      
      if (anyGrowing || pendingBranchCreationsRef.current > 0) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure all eligible branches have pulse animations started
        if (config.tree.pulseEnabled) {
          allBranchesRef.current.forEach(branch => {
            if (branch.stress >= 1 && !branch.pulseAnimation) {
              branch.startPulseAnimation(requestAnimationFrame);
            }
          });
        }
        
        // Keep animation frame for particles or pulsing branches
        if (config.particles.enabled || config.tree.pulseEnabled) {
          animationFrameIdRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameIdRef.current = null;
        }
        
        // Call onTreeGenerated callback if provided when the tree is fully grown
        if (onTreeGenerated) {
          onTreeGenerated();
        }
      }
    }
  }, [config, updateParticles, planChildBranches, onTreeGenerated]);

  // Declare function variables to resolve circular dependency
  let createTreeFn;
  let setupAutoRegenerationFn;

  // We intentionally exclude createTreeFn from dependencies to avoid a circular dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  setupAutoRegenerationFn = useCallback(() => {
    // Clear any existing timer
    if (regenerationTimerRef.current) {
      clearTimeout(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }
    
    // Set up new timer
    regenerationTimerRef.current = setTimeout(() => {
      if (config.animation.active && config.animation.autoRegenerate) {
        createTreeFn();
      }
    }, config.animation.regenerateTime);
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  createTreeFn = useCallback(() => {
    // Cancel any existing animation
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    
    // Clear the SVGs
    if (treeSvgRef.current) {
      while (treeSvgRef.current.firstChild) {
        treeSvgRef.current.removeChild(treeSvgRef.current.firstChild);
      }
    }
    
    if (mobileTreeSvgRef.current) {
      while (mobileTreeSvgRef.current.firstChild) {
        mobileTreeSvgRef.current.removeChild(mobileTreeSvgRef.current.firstChild);
      }
    }
    
    // Reset variables
    allBranchesRef.current = [];
    allNodesAndLabelsRef.current = [];
    pendingBranchCreationsRef.current = 0;
    
    // Check if device is mobile
    setIsMobile(window.innerWidth <= config.responsive.mobileThreshold);
    
    // Calculate scaling factor based on screen size
    const scaleFactor = calculateScaleFactor(config);
    config.responsive.scaleFactor = scaleFactor;
    
    // Get container dimensions instead of window dimensions
    // This ensures we're positioning relative to the actual container, not the whole window
    const containerRef = isMobile ? mobileTreeSvgRef.current : treeSvgRef.current;
    const containerWidth = containerRef ? containerRef.clientWidth : window.innerWidth;
    const containerHeight = containerRef ? containerRef.clientHeight : window.innerHeight;
    
    // Update stored container dimensions for boundary checking
    updateContainerDimensions(containerWidth, containerHeight);
    
    // Start position - position very close to bottom of container with guaranteed visibility
    // Position the tree more to the right to avoid the text modal
    const startX = containerWidth * 0.65; // Moved from center (0.5) to right side (0.65)
    const startY = containerHeight * 0.98; // Position much lower - 98% from top (very close to bottom)
    
    // Scale trunk dimensions based on screen size
    const trunkLength = config.tree.maxInitialLength * scaleFactor;
    const trunkWidth = config.tree.minInitialWidth * scaleFactor;
    
    // Ensure minimum trunk size regardless of screen size
    const minTrunkLength = config.tree.guaranteedTrunkLength;
    const minTrunkWidth = config.tree.guaranteedTrunkWidth;
    
    // Use the larger of the calculated or minimum values
    const finalTrunkLength = Math.max(trunkLength, minTrunkLength);
    const finalTrunkWidth = Math.max(trunkWidth, minTrunkWidth);
    
    // Choose SVG based on device
    const targetSvg = isMobile ? mobileTreeSvgRef.current : treeSvgRef.current;
    
    // Create trunk with guaranteed minimum dimensions
    // Force the initial angle to be exactly straight up
    const trunk = createBranch({
      startX,
      startY,
      length: finalTrunkLength,
      angle: -Math.PI / 2, // Exactly straight up
      width: finalTrunkWidth,
      depth: 0,
      stress: 1,
      svg: targetSvg,
    });
    
    // Plan child branches for the trunk to start the growth sequence
    planChildBranches(trunk);
    
    // Mark as planned to prevent duplicate branch planning in the animation loop
    trunk.childrenPlanned = true;
    
    // Create particles
    if (config.particles.enabled) {
      createParticles();
    }
    
    // Start animation
    if (config.animation.active) {
      animationFrameIdRef.current = requestAnimationFrame(animate);
    }
    
    // Clear any existing regeneration timer
    if (regenerationTimerRef.current) {
      clearTimeout(regenerationTimerRef.current);
      regenerationTimerRef.current = null;
    }
    
    // Set up auto-regeneration if enabled
    if (config.animation.autoRegenerate) {
      setupAutoRegenerationFn();
    }
  }, [config, animate, createBranch, createParticles, isMobile, planChildBranches, setupAutoRegenerationFn]);

  // Assign the function to a const variable for consistency with the rest of the code
  const createTree = createTreeFn;

  /**
   * Toggle animation state
   */
  const toggleAnimation = useCallback(() => {
    const newActive = !isAnimationActive;
    setIsAnimationActive(newActive);
    config.animation.active = newActive;
    
    if (newActive) {
      // Check if there are still growing branches
      const stillGrowing = allBranchesRef.current.some(branch => branch.growing);
      
      // Restart animation if necessary
      if ((stillGrowing || pendingBranchCreationsRef.current > 0 || config.particles.enabled) && !animationFrameIdRef.current) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      }
      
      // Restart pulse animations
      allBranchesRef.current.forEach(branch => {
        if (branch.pulseAnimation === null && config.tree.pulseEnabled && branch.stress >= 1) {
          branch.startPulseAnimation(requestAnimationFrame);
        }
      });
      
      // Reset auto-regeneration
      if (config.animation.autoRegenerate) {
        setupAutoRegenerationFn();
      }
    } else {
      // Stop pulse animations
      allBranchesRef.current.forEach(branch => {
        branch.stopPulseAnimation(cancelAnimationFrame);
      });
      
      // Stop auto-regeneration
      if (regenerationTimerRef.current) {
        clearTimeout(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
    }
  }, [isAnimationActive, config, animate, setupAutoRegenerationFn]);

  /**
   * Handle window resize event
   */
  const handleResize = useCallback(() => {
    // Update mobile status
    const wasMobile = isMobile;
    const newIsMobile = window.innerWidth <= config.responsive.mobileThreshold;
    
    // Update state
    setIsMobile(newIsMobile);
    
    // Only rebuild everything if crossing the mobile threshold
    if (wasMobile !== newIsMobile) {
      createGrid();
      createTreeFn();
    } else {
      // Just update particles on minor resize
      if (config.particles.enabled) {
        createParticles();
      }
    }
  }, [isMobile, config, createGrid, createTreeFn, createParticles]);

  // Expose methods to parent component via ref
  useImperativeHandle(ref, () => ({
    regenerateTree: () => {
      createTreeFn();
    },
    pauseAnimation: () => {
      if (isAnimationActive) {
        toggleAnimation();
      }
    },
    resumeAnimation: () => {
      if (!isAnimationActive) {
        toggleAnimation();
      }
    },
    setConfig: (newConfig) => {
      Object.keys(newConfig).forEach(key => {
        if (config[key]) {
          config[key] = { ...config[key], ...newConfig[key] };
        }
      });
      
      // Apply changes immediately if needed
      createTreeFn();
    }
  }));

  // Initialize component
  useEffect(() => {
    // Check if device is mobile
    setIsMobile(window.innerWidth <= config.responsive.mobileThreshold);
    
    // Create grid
    createGrid();
    
    // Create tree
    createTreeFn();
    
    // Add resize handler
    const debouncedResize = debounce(handleResize, 250);
    window.addEventListener('resize', debouncedResize);
    
    // Call onReady callback if provided
    if (onReady) {
      onReady();
    }
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', debouncedResize);
      
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      
      if (regenerationTimerRef.current) {
        clearTimeout(regenerationTimerRef.current);
        regenerationTimerRef.current = null;
      }
      
      // Clear all timeouts from pendingBranchCreations
      allBranchesRef.current.forEach(branch => {
        if (branch.pulseAnimation) {
          cancelAnimationFrame(branch.pulseAnimation);
        }
      });
    };
  }, [config.responsive.mobileThreshold, createGrid, createTreeFn, handleResize, onReady]);

  return (
    <div className={`${classes.root} ${className}`}>
      <div className={classes.container}>
        {/* Subtle linguistic pattern background */}
        <div className={classes.linguisticPattern} />
        
        {/* Grid */}
        <svg 
          className={classes.gridSvg} 
          ref={gridSvgRef} 
          xmlns="http://www.w3.org/2000/svg"
        />
        
        {/* Particles */}
        <svg 
          className={classes.particlesSvg} 
          ref={particlesSvgRef} 
          xmlns="http://www.w3.org/2000/svg"
        />
        
        {/* Desktop tree */}
        <svg 
          className={classes.treeSvg} 
          ref={treeSvgRef} 
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: isMobile ? 'none' : 'block' }}
        />
        
        {/* Mobile tree */}
        <svg 
          className={classes.mobileTreeSvg} 
          ref={mobileTreeSvgRef} 
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: isMobile ? 'block' : 'none' }}
        />
        
        {/* Controls */}
        {showControls && (
          <div className={classes.controls}>
            <Button
              className={classes.controlButton}
              variant="contained"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={createTree}
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
    </div>
  );
});

MetricalTreeBackground.propTypes = {
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

export default MetricalTreeBackground;
