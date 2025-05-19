import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { treeGraphConfig } from '../config';

// Define special effects CSS
const lineGrowthKeyframes = `
@keyframes lineGrowth {
  0% { stroke-width: 2.5px; stroke-opacity: 0.85; }
  70% { stroke-width: 3px; stroke-opacity: 1; }
  100% { stroke-width: 1.5px; stroke-opacity: 1; }
}
`;


/**
 * TreeGraphVisualization - Component that visualizes hierarchical stress patterns as a tree
 * Using a level-based approach for flexible connections with smooth animation
 */
const TreeGraphVisualization = ({ onAnimationComplete, isMobile }) => {
  // Animation progress state - value between 0 and 1
  const [animationProgress, setAnimationProgress] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);
  const svgRef = useRef(null);
  
  // Animation frame reference for cancelation
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Total animation duration in ms
  const ANIMATION_DURATION = useMemo(() => 
    treeGraphConfig.animation.levelDelay * (treeGraphConfig.treeData.levels.length - 1) + 
    treeGraphConfig.animation.initialDelay, 
  []);
  
  // Total levels in the tree
  const totalLevels = useMemo(() => treeGraphConfig.treeData.levels.length, []);
  
  // Calculate node positions based on level and x coordinate
  const calculateNodePositions = useMemo(() => {
    const levelHeight = treeGraphConfig.layout.levelHeight;
    const levelPositions = [];
    
    treeGraphConfig.treeData.levels.forEach((level, levelIndex) => {
      const levelNodes = level.map((node, nodeIndex) => {
        return {
          x: node.x,
          y: levelIndex * levelHeight,
          type: node.type,
          text: node.text,
          id: `node-${levelIndex}-${nodeIndex}`
        };
      });
      
      levelPositions.push(levelNodes);
    });
    
    return levelPositions;
  }, []);
  
  // Process connections between levels
  const processConnections = useMemo(() => {
    const connections = [];
    
    treeGraphConfig.treeData.connections.forEach((connection, index) => {
      const fromLevel = connection.from.level;
      const fromIndex = connection.from.index;
      const toLevel = connection.to.level;
      const toIndex = connection.to.index;
      
      // Get node positions
      const fromNode = calculateNodePositions[fromLevel][fromIndex];
      const toNode = calculateNodePositions[toLevel][toIndex];
      
      connections.push({
        id: `conn-${index}`,
        x1: fromNode.x,
        y1: fromNode.y,
        x2: toNode.x,
        y2: toNode.y,
        fromLevel,
        toLevel
      });
    });
    
    return connections;
  }, [calculateNodePositions]);
  
  // Easing function for natural animation movement
  const easeOutCubic = useCallback((x) => {
    return 1 - Math.pow(1 - x, 3);
  }, []);
  
  // Animate using requestAnimationFrame for smoother animation
  const startAnimation = useCallback(() => {
    startTimeRef.current = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      let progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      
      // Apply easing for more natural animation
      progress = easeOutCubic(progress);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        setAnimationComplete(true);
        if (onAnimationComplete) {
          onAnimationComplete();
        }
      }
    };
    
    // Start the animation after a short delay
    setTimeout(() => {
      animationFrameRef.current = requestAnimationFrame(animate);
    }, treeGraphConfig.animation.initialDelay);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ANIMATION_DURATION, easeOutCubic, onAnimationComplete]);
  
  // Lifecycle hooks
  useEffect(() => {
    const cleanup = startAnimation();
    return cleanup;
  }, [startAnimation]);
  
  // Get node animation timing
  const getNodeVisibility = useCallback((levelIndex) => {
    // Calculate timing for each level, with bottom level appearing first
    const levelsFromBottom = totalLevels - levelIndex - 1;
    
    // Calculate the start and end points for this level's animation
    // We want a slight overlap in the transitions for smoothness
    const levelStartPoint = levelsFromBottom / (totalLevels + 0.5);
    const levelEndPoint = (levelsFromBottom + 1) / (totalLevels + 0.3);
    
    // Calculate node opacity based on current progress (0 to 1)
    const opacity = Math.min(1, Math.max(0, 
      (animationProgress - levelStartPoint) / (levelEndPoint - levelStartPoint)
    ));
    
    // Scale factor for "growing" effect - starts small and grows to full size
    let scale = opacity;
    
    // Use custom ease curve for natural "pop" growth
    if (scale > 0) {
      // Slightly overshoot and settle for more organic movement
      scale = Math.min(1, 1.1 * scale - 0.1 * Math.pow(scale, 2)); 
    }
    
    return { opacity, scale };
  }, [animationProgress, totalLevels]);
  
  // Calculate line path with animation progress (0-1)
  const getLineVisibility = useCallback((conn) => {
    // Identify connections to top level (level 0) - these need special treatment
    const hasTopLevelConnection = conn.fromLevel === 0 || conn.toLevel === 0;
    
    // Determine which node is lower in the tree (higher level index)
    const higherLevelIndex = Math.max(conn.fromLevel, conn.toLevel);
    const lowerLevelIndex = Math.min(conn.fromLevel, conn.toLevel);
    
    // Calculate which animation phase this connection belongs to
    const higherNodeLevelFromBottom = totalLevels - higherLevelIndex - 1;
    const lowerNodeLevelFromBottom = totalLevels - lowerLevelIndex - 1;
    
    // Start times for connections - ensure top-level connections start earlier to complete fully
    let connectionStartPoint;
    if (hasTopLevelConnection) {
      // Top connections start earlier to ensure complete connection
      connectionStartPoint = 0.65; // Start even earlier for top connections
    } else {
      // Normal connections appear when their higher node becomes visible
      connectionStartPoint = (higherNodeLevelFromBottom + 0.5) / (totalLevels + 0.5);
    }
    
    // For all connections, always draw from the lower nodes UPWARD to the higher nodes
    // This ensures consistent bottom-to-top growth animation
    
    // Get position for lower node (the starting point for line growth)
    let lowerNodeLevel, lowerNodeIndex;
    let higherNodeLevel, higherNodeIndex;
    
    // Determine which node is lower in the tree (higher level index = lower in tree)
    if (conn.fromLevel > conn.toLevel) {
      // from is lower in the tree than to
      lowerNodeLevel = conn.fromLevel;
      lowerNodeIndex = conn.fromIndex;
      higherNodeLevel = conn.toLevel;
      higherNodeIndex = conn.toIndex;
    } else {
      // to is lower in the tree than from
      lowerNodeLevel = conn.toLevel;
      lowerNodeIndex = conn.toIndex;
      higherNodeLevel = conn.fromLevel;
      higherNodeIndex = conn.fromIndex;
    }
    
    // Calculate distance between points for distance-based growth rate
    const lineDistance = Math.sqrt(
      Math.pow(conn.x2 - conn.x1, 2) + Math.pow(conn.y2 - conn.y1, 2)
    );
    
    // Use distance-based growth rate for better synchronization
    const baseMultiplier = 2.0;
    // Longer lines get a proportionally faster growth rate
    // Using a more aggressive scaling factor for better synchronization
    const distanceAdjustedMultiplier = baseMultiplier * (1 + (lineDistance / 250));
    
    const lineProgress = Math.max(0, Math.min(1, 
      (animationProgress - connectionStartPoint) * distanceAdjustedMultiplier
    ));
    
    
    // For top-level connections, always use the top center point as the end point
    let x1, y1, x2, y2;
    
    // Always start from lower node (x1,y1)
    if (lowerNodeLevel === conn.fromLevel) {
      x1 = conn.x1;
      y1 = conn.y1;
    } else {
      x1 = conn.x2;
      y1 = conn.y2;
    }
    
    // End point (x2,y2) is either the higher node or top center
    if (higherNodeLevel === 0) {
      // For connections to top level, always use EXACT same center point
      // Using precise values to ensure ALL connections meet at exactly the same point
      x2 = Math.round(treeGraphConfig.layout.width / 2); // Center of layout, rounded for precision
      y2 = 0; // Top position
    } else {
      // For other connections, use the actual higher node position
      if (higherNodeLevel === conn.fromLevel) {
        x2 = conn.x1;
        y2 = conn.y1;
      } else {
        x2 = conn.x2;
        y2 = conn.y2;
      }
    }
    
    // Determine if this is a newly growing line for animation effect
    const isGrowing = lineProgress > 0 && lineProgress < 1;
    
    // Determine if this is one of the final top connections completing
    const isCompletingTopConnection = hasTopLevelConnection && 
                                     lineProgress > 0.5 && 
                                     lineProgress < 1 && 
                                     animationProgress > 0.9;
    
    return { 
      x1, y1, x2, y2, 
      progress: lineProgress,
      opacity: Math.min(1, lineProgress * 1.5), // Lines fade in slightly faster than they grow
      isGrowing,
      isCompletingTopConnection,
      hasTopLevelConnection
    };
  }, [animationProgress, totalLevels]);
  
  // Path generator for animated lines
  const getAnimatedLinePath = useCallback((x1, y1, x2, y2, progress, hasTopLevelConnection) => {
    // For line animation: start from x1,y1 and grow toward x2,y2
    
    // For top connections, use smooth easing for final approach with guaranteed completion
    if (hasTopLevelConnection && progress > 0.85) {
      // Apply a smooth ease-out curve for final approach
      const finalRatio = (progress - 0.85) / 0.15; // normalized 0-1 in final segment
      const smoothedRatio = 1 - Math.pow(1 - finalRatio, 2); // quadratic ease-out
      
      // Ensure we reach exactly x2,y2 when progress nears completion
      const smoothX = progress >= 0.999 ? x2 : x1 + (x2 - x1) * (0.85 + (smoothedRatio * 0.15));
      const smoothY = progress >= 0.999 ? y2 : y1 + (y2 - y1) * (0.85 + (smoothedRatio * 0.15));
      
      return `M ${x1} ${y1} L ${smoothX} ${smoothY}`;
    }
    
    // Force all connections to fully complete at the end of animation
    // Give top connections a lower threshold to ensure they complete
    if (progress > 0.95 || (hasTopLevelConnection && progress > 0.9)) {
      return `M ${x1} ${y1} L ${x2} ${y2}`;
    }
    
    // Regular animation growth logic
    const currentX2 = x1 + (x2 - x1) * progress;
    const currentY2 = y1 + (y2 - y1) * progress;
    
    return `M ${x1} ${y1} L ${currentX2} ${currentY2}`;
  }, []);
  
  // Render the connection lines with growth effect and smooth animation
  const renderConnections = useCallback(() => {
    // Check if we should show completion effect - delay until animation is nearly complete
    // This ensures the pulse only appears after all connections are fully drawn
    const showCompletionEffect = animationProgress > 0.97 && animationProgress < 1;
    
    return (
      <>
        {/* Style element for keyframe animations */}
        <style>
          {lineGrowthKeyframes}
        </style>
        
        {/* Connection lines */}
        {processConnections.map(conn => {
          const { 
            x1, y1, x2, y2, progress, opacity, 
            isGrowing, isCompletingTopConnection, hasTopLevelConnection 
          } = getLineVisibility(conn);
          
          // Don't render if not yet visible
          if (opacity <= 0.01) return null;
          
          return (
            <path
              key={conn.id}
              d={getAnimatedLinePath(x1, y1, x2, y2, progress, hasTopLevelConnection)}
              stroke="#000"
              strokeWidth={isGrowing ? 3 : 2}
              strokeOpacity={opacity}
              fill="none"
              style={isGrowing ? {
                animation: 'lineGrowth 1.2s ease-out',
              } : undefined}
            />
          );
        })}
        
        {/* No center dot - connections meet at a point naturally */}
        
        {/* No pulse effect needed */}
      </>
    );
  }, [processConnections, getLineVisibility, getAnimatedLinePath, animationProgress]);
  
  // Render the nodes with fade-in and scale animations
  const renderNodes = useCallback(() => {
    const nodes = [];
    
    // Process from bottom to top for correct stacking
    for (let levelIndex = totalLevels - 1; levelIndex >= 0; levelIndex--) {
      const level = calculateNodePositions[levelIndex];
      const { opacity, scale } = getNodeVisibility(levelIndex);
      
      // Skip rendering if level is not yet visible at all
      if (opacity <= 0.01) continue;
      
      level.forEach(node => {
        // For syllable nodes (bottom level)
        if (levelIndex === totalLevels - 1) {
          nodes.push(
            <g 
              key={node.id} 
              transform={`translate(${node.x},${node.y}) scale(${scale})`}
              opacity={opacity}
            >
              {/* White background for syllable text */}
              <rect
                x={-16}
                y={-11}
                width={32}
                height={22}
                fill="#fff"
                stroke="none"
              />
              <text
                fill="#733900"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={treeGraphConfig.layout.syllableText.fontSize}
                fontWeight="bold"
              >
                {node.text}
              </text>
            </g>
          );
        } 
          // For S and W nodes
        else if (node.type) {
          nodes.push(
            <g 
              key={node.id} 
              transform={`translate(${node.x},${node.y}) scale(${scale})`}
              opacity={opacity}
            >
              {/* White circle behind text for clear visibility */}
              <circle
                r={12}
                fill="#fff"
                stroke="none"
              />
              <text
                fill="#8B3A3A"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={13}
                fontWeight="bold"
              >
                {node.type}
              </text>
            </g>
          );
        }
        // For branch points without labels - small dot (but not at the top level)
        else if (node.type === null) {
          // Skip rendering the dot for top level (level 0)
          if (levelIndex !== 0) {
            nodes.push(
              <g 
                key={node.id} 
                transform={`translate(${node.x},${node.y}) scale(${scale})`}
                opacity={opacity}
              >
                {/* Very small black dot for branching points */}
                <circle
                  r={3}
                  fill="#8B3A3A"
                />
              </g>
            );
          } else {
            // Add invisible node at top level to maintain connection structure
            nodes.push(
              <g key={node.id} transform={`translate(${node.x},${node.y})`}>
                {/* Invisible point to maintain connection structure */}
                <circle
                  r={0}
                  fill="none"
                  stroke="none"
                />
              </g>
            );
          }
        }
      });
    }
    
    return nodes;
  }, [calculateNodePositions, getNodeVisibility, totalLevels]);
  
  // For responsive positioning based on viewport height
  const [containerHeight, setContainerHeight] = useState(0);
  
  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight;
      setContainerHeight(vh);
    };
    
    // Initial calculation
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Calculate vertical position based on container height with improved responsiveness
  const getVerticalPosition = useMemo(() => {
    const isShortScreen = containerHeight < 600;
    const isTinyScreen = window.innerWidth < 400;
    const isNarrowScreen = window.innerWidth < 600;
    const isVeryTallScreen = containerHeight > 900;
    const totalViewHeight = containerHeight || 800; // Fallback if containerHeight is 0
    const windowAspectRatio = window.innerWidth / containerHeight;
    
    // Adjust for different aspect ratios for better proportional scaling
    // Reserve more space for bar chart at bottom (proportionally)
    const barChartReservedSpace = isShortScreen ? 
      Math.max(180, totalViewHeight * 0.35) : // On small screens: at least 180px or 35% of height
      (isTinyScreen ? 
        Math.max(200, totalViewHeight * 0.32) : // On tiny screens: at least 200px or 32% of height
        Math.max(200, totalViewHeight * 0.28));  // On larger screens: at least 200px or 28% of height
    
    // Calculate available space for the tree (top portion of screen)
    const availableTreeSpace = totalViewHeight - barChartReservedSpace;
    
    // For landscape orientation, use a different scaling approach
    const isLandscape = windowAspectRatio > 1.3;
    
    // Calculate scaling based on both dimensions and aspect ratio
    let scaleValue;
    if (isLandscape) {
      // In landscape mode, height is the limiting factor
      if (isTinyScreen) {
        scaleValue = Math.max(0.65, Math.min(0.85, availableTreeSpace / 450));
      } else if (isNarrowScreen) {
        scaleValue = Math.max(0.7, Math.min(0.9, availableTreeSpace / 480));
      } else {
        scaleValue = Math.max(0.8, Math.min(1.0, availableTreeSpace / 550));
      }
    } else {
      // In portrait mode, width becomes the limiting factor
      if (isTinyScreen) {
        scaleValue = Math.max(0.6, Math.min(0.8, (window.innerWidth * 0.9) / 600));
      } else if (isNarrowScreen) {
        scaleValue = Math.max(0.65, Math.min(0.85, (window.innerWidth * 0.9) / 650));
      } else if (isShortScreen) {
        scaleValue = Math.max(0.7, Math.min(0.9, (window.innerWidth * 0.9) / 700));
      } else {
        // Default for larger screens
        scaleValue = Math.max(0.75, Math.min(1.0, Math.min(
          availableTreeSpace / 600,  // Height constraint
          (window.innerWidth * 0.9) / 800  // Width constraint
        )));
      }
    }
    
    // Adjust top position based on various factors
    let topPosition;
    if (isVeryTallScreen) {
      // More space at top on tall screens
      topPosition = isTinyScreen ? '40px' : (isNarrowScreen ? '50px' : '60px');
    } else if (isShortScreen) {
      // Less space at top on short screens
      topPosition = isTinyScreen ? '15px' : (isNarrowScreen ? '20px' : '25px');
    } else {
      // Standard spacing
      topPosition = isTinyScreen ? '25px' : (isNarrowScreen ? '30px' : '40px');
    }
    
    // Increase height values on smaller screens to ensure visibility
    const treeHeight = isTinyScreen
      ? `${Math.max(availableTreeSpace * 0.75, 220)}px` // Increased proportion on tiny screens
      : (isNarrowScreen
         ? `${Math.max(availableTreeSpace * 0.7, 240)}px` // Slightly larger on narrow screens
         : `${Math.max(availableTreeSpace * 0.65, 260)}px`); // Larger minimum on normal screens
    
    return {
      top: topPosition,
      height: treeHeight,
      transform: `scale(${scaleValue})`,
      transformOrigin: 'center top',
      marginBottom: isTinyScreen ? '30px' : (isShortScreen ? '25px' : '20px'),
      maxWidth: isTinyScreen ? '100%' : (isNarrowScreen ? '98%' : '95%'),
      overflow: 'visible' // Ensure nodes aren't clipped
    };
  }, [containerHeight]);
  
  return (
    <div style={{ 
       position: 'relative',
       top: 0,
       left: 0,
       width: '100%',
       height: '100%',
       display: 'flex',
       justifyContent: 'center',
       alignItems: 'center',
       pointerEvents: 'none',
       zIndex: 1,
       margin: '0 auto',
       padding: '0',
       overflow: 'visible'
    }}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 375 375`}
        style={{
           maxWidth: '100%',
           maxHeight: '100%', // Use full height
          // // No additional scaling here as we're handling it in the container
          transformOrigin: 'center top',
          transition: 'transform 0.3s ease', // Smooth transition for scale changes
        }}
      >
        {/* Connection lines */}
        <g>
          {renderConnections()}
        </g>
        
        {/* Tree Nodes */}
        <g>
          {renderNodes()}
        </g>
      </svg>
    </div>
  );
};

TreeGraphVisualization.propTypes = {
  onAnimationComplete: PropTypes.func,
  isMobile: PropTypes.bool
};

TreeGraphVisualization.defaultProps = {
  onAnimationComplete: () => {},
  isMobile: false
};

export default TreeGraphVisualization;
