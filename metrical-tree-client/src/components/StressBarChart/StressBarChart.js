import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useMediaQuery } from '@material-ui/core';
import { barChartConfig } from '../MetricalTreeBackground/config';
import useAvailableHeight from '../../hooks/useAvailableHeight';

/**
 * Style definitions for StressBarChart
 */
const useStyles = makeStyles((theme) => ({
  root: {
    overflowX: 'hidden', // Always prevent horizontal scrolling
    marginBottom: theme.spacing(2), // Default margin
    // Make overflow conditional based on screen height
    [`@media (min-height: 700px)`]: {
      overflowY: 'visible', // Regular screens don't need scroll
    },
    [`@media (max-height: 700px)`]: {
      overflowY: 'auto', // Only enable scrolling on shorter screens
      marginBottom: theme.spacing(4),
      maxHeight: 'calc(100vh - 200px)'
    }
  },
  chartContainer: {
    minHeight: '180px', // Slightly reduced minimum height
    position: 'relative',
    paddingBottom: theme.spacing(1), // Less padding by default
    [`@media (max-height: 700px)`]: {
      paddingBottom: theme.spacing(3) // More padding only on short screens
    }
  },
  svg: {
    display: 'block' // Ensure proper display behavior
  }
}));

/**
 * StressBarChart - Standalone component for displaying the stress bar chart
 */
const StressBarChart = (props) => {
  const {
    height,
    mobileHeight,
    smallMobileHeight,
    className = ''
  } = props;

  // Theme and responsive hooks
  const theme = useTheme();
  const isNarrowScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isTinyScreen = useMediaQuery(theme.breakpoints.down('xs'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  
  // State
  const [barData, setBarData] = useState([]);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const [highlightedWord, setHighlightedWord] = useState(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [showAttribution, setShowAttribution] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false); // Track when animation is complete
  
  // Get available height from custom hook
  const availableHeight = useAvailableHeight();
  
  // Calculate optimal height based on available space
  const optimalHeight = useMemo(() => {
    if (isLargeDesktop) {
      // Large desktop screens - can use more height
      return Math.min(280, availableHeight * 0.3);
    } else if (isDesktop) {
      // Regular desktop - slightly smaller
      return Math.min(260, availableHeight * 0.28);
    } else if (isNarrowScreen && !isTinyScreen) {
      // Tablets and medium screens
      return Math.min(260, availableHeight * 0.45);
    } else {
      // Small mobile screens - increased further for better visibility
      return Math.min(250, availableHeight * 0.5);
    }
  }, [availableHeight, isLargeDesktop, isDesktop, isNarrowScreen, isTinyScreen]);
  
  // Refs
  const containerRef = useRef(null);
  const barAnimationRef = useRef(null);
  const svgRef = useRef(null);
  const currentBarDataRef = useRef(null);
  
  // Constants from config
  const phrase = barChartConfig.phrase;
  const words = phrase.split(" ");
  const stressValues = barChartConfig.stressValues;
  const bubbleValues = barChartConfig.bubbleValues;
  
  // Generate initial bar data
  useEffect(() => {
    const data = words.map((word, index) => ({
      name: word,
      value: 0, // Start with 0 height
      fullValue: stressValues[index] || 0,
      color: barChartConfig.getWordStressColor(stressValues[index] || 0)
    }));
    
    setBarData(data);
    currentBarDataRef.current = [...data];
  }, []);
  
  // Update container dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({
          width: rect.width,
          height: rect.height
        });
      }
    };
    
    // Initial check
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Animate bars
  useEffect(() => {
    if (!currentBarDataRef.current || currentBarDataRef.current.length === 0) return;
    
    let currentBarIndex = 0;
    
    const animateBar = (index) => {
      // Highlight the current word 
      setHighlightedWord(words[index]);
      
      // For zero-stress words, handle differently
      if (currentBarDataRef.current[index].fullValue === 0) {
        // Set a minimal value for visual representation
        const newBarData = [...currentBarDataRef.current];
        newBarData[index] = {
          ...newBarData[index],
          value: 0.2 // Minimal value to create a visible indicator
        };
        
        currentBarDataRef.current = newBarData;
        setBarData(newBarData);
        
        // Wait briefly, then move to next word
        setTimeout(() => {
          currentBarIndex++;
          if (currentBarIndex < currentBarDataRef.current.length) {
            // Move to next word
            animateBar(currentBarIndex);
          } else {
            // All bars complete
            barAnimationRef.current = null;
            setShowAttribution(true);
          }
        }, barChartConfig.animation.wordSpacing);
      } else {
        // Animate the current bar
        const animateStep = () => {
          const current = currentBarDataRef.current[index].value || 0;
          const target = currentBarDataRef.current[index].fullValue;
          
          if (current < target) {
            // Update this bar's height
            const newBarData = [...currentBarDataRef.current];
            newBarData[index] = {
              ...newBarData[index],
              value: Math.min(current + barChartConfig.animation.barGrowSpeed, target)
            };
            
            currentBarDataRef.current = newBarData;
            setBarData(newBarData);
            
            // Continue animating this bar
            barAnimationRef.current = requestAnimationFrame(animateStep);
          } else {
            // This bar is complete, move to the next
            currentBarIndex++;
            if (currentBarIndex < currentBarDataRef.current.length) {
              // Delay based on stress level for natural speech rhythm
              const delay = 300 + (barData[index].fullValue * 50);
              setTimeout(() => animateBar(currentBarIndex), delay);
            } else {
              // All bars complete
              barAnimationRef.current = null;
              setShowAttribution(true);
              setAnimationComplete(true); // Mark animation as complete
            }
          }
        };
        
        // Start animating this bar
        barAnimationRef.current = requestAnimationFrame(animateStep);
      }
    };
    
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      if (currentBarDataRef.current.length > 0) {
        animateBar(0);
      }
    }, barChartConfig.animation.initialDelay);
    
    return () => {
      clearTimeout(timer);
      if (barAnimationRef.current) {
        cancelAnimationFrame(barAnimationRef.current);
        barAnimationRef.current = null;
      }
    };
  }, [renderTrigger]);
  
  // Force render update when needed
  useEffect(() => {
    // Initialize animation after component is fully mounted
    if (barData.length > 0 && renderTrigger === 0) {
      setRenderTrigger(1);
    }
  }, [barData]);
  
  // Styles - use dynamic height from calculations
  const styleProps = { 
    height: `${optimalHeight}px`, 
    mobileHeight: mobileHeight, 
    smallMobileHeight: smallMobileHeight 
  };
  const classes = useStyles(styleProps);
  
  // Calculate appropriate dimensions
  const wordCount = barData.length;
  
  // Responsive bar width and spacing - further adjusted to prevent text overlap 
  const barWidth = isTinyScreen ? 24 : (isNarrowScreen ? 32 : 35);
  const barSpacing = isTinyScreen ? 22 : (isNarrowScreen ? 26 : 28);
  
  // SVG viewBox dimensions - ensure enough width for all bars and add extra height for attribution
  const svgWidth = Math.max(600, (barWidth + barSpacing) * wordCount + 60);
  const svgHeight = isTinyScreen ? 230 : 250; // Increased height to accommodate everything
  
  // Calculate total chart width to ensure all bars are visible
  const totalChartWidth = (barWidth + barSpacing) * wordCount;
  const startX = (svgWidth - totalChartWidth) / 2 + 10;
  
  // Scale factor to ensure tallest bar fits within container
  const maxAllowedBarHeight = 120; // Increased maximum bar height
  const maxStressValue = Math.max(...stressValues);
  const heightScaleFactor = maxStressValue > 0 ? Math.min(1, maxAllowedBarHeight / (maxStressValue * 40)) : 1;
  
  // Fixed bubble position (consistent distance above bars)
  const bubbleYPosition = 40; // Fixed position from top of chart
  
  return (
    <div className={`${classes.root} ${className}`} ref={containerRef}>
      <div className={classes.chartContainer}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          preserveAspectRatio="xMidYMid meet"
          className={classes.svg}
          style={{
            minWidth: isTinyScreen ? '350px' : (isNarrowScreen ? '380px' : '500px'),
            width: '100%', 
            overflow: 'hidden',
            position: 'relative',
            zIndex: 25,
          }}
        >
          {/* Grid lines */}
          <g>
            {[0, 1, 2, 3, 4].map((line) => (
              <line 
                key={`grid-${line}`}
                x1={10} 
                y1={svgHeight - (line * 40) - 60} // Adjusted for extra space at bottom
                x2={svgWidth - 10} 
                y2={svgHeight - (line * 40) - 60} 
                stroke="#e0e0e0" 
                strokeDasharray="3 3" 
                strokeWidth="1" 
                opacity="0.3" 
              />
            ))}
          </g>
          
          {/* Bars and labels */}
          <g>
            {barData.map((item, index) => {
              // Calculate position for current bar
              const barX = startX + (index * (barWidth + barSpacing));
              // Apply scaling factor to ensure tallest bar fits
              const barHeight = (item.value * 40 * heightScaleFactor) || 0;
              // Adjust bar positioning to reduce gap between bars and labels
              const barY = svgHeight - barHeight - (isTinyScreen ? 45 : 55);
              const isHighlighted = highlightedWord === item.name;
              
              return (
                <g key={`bar-group-${index}`}>
                  {/* Bar */}
                  <rect 
                    x={barX} 
                    y={barY} // Use calculated position
                    width={barWidth} 
                    height={barHeight > 0 ? barHeight : 0}
                    fill={item.color}
                    opacity={item.fullValue === 0 ? 0.4 : 1}
                    rx={2}
                  />
                  
                  {/* Word label */}
                  <text 
                    x={barX + (barWidth / 2)} 
                    y={svgHeight - 35} // Moved text closer to bars
                    fill="black"
                    fontSize={isTinyScreen ? 9 : (isNarrowScreen ? 11 : 14)}
                    fontWeight="bold"
                    textAnchor="middle"
                    style={{
                      textShadow: '0px 0px 3px rgba(255, 255, 255, 0.7)'
                    }}
                  >
                    {item.name}
                  </text>
                  
                  {/* Stress indicator with number */}
                  <g opacity={animationComplete ? 1 : (isHighlighted ? 1 : 0.4)}>
                    {/* Only render stress indicator if the bar has a value */}
                    {item.fullValue > 0 && (
                      <>
                        <rect
                          x={barX + (barWidth / 2) - 12}
                          y={barY - 30} // Fixed position relative to bar
                          width={24}
                          height={18}
                          rx={9}
                          ry={9}
                          fill={item.color}
                          stroke="#ffffff"
                          strokeWidth="1"
                          opacity="0.9"
                          style={{ zIndex: 30 }}
                        />
                        
                        <text
                          x={barX + (barWidth / 2)}
                          y={barY - 18} // Fixed position relative to bar
                          textAnchor="middle"
                          fontSize={isNarrowScreen ? 10 : 12}
                          fontWeight="bold"
                          fill="white"
                          style={{ zIndex: 31 }}
                        >
                          {bubbleValues[index]}
                        </text>
                      </>
                    )}
                  </g>
                </g>
              );
            })}
          </g>
          
          {/* Attribution - now part of the SVG for better positioning */}
          {showAttribution && (
            <g style={{ zIndex: 35 }}>
              <rect
                x={(svgWidth / 2) - 140}
                y={svgHeight - 16} // Position closer to bottom
                width={280}
                height={16}
                rx={4}
                fill="rgba(0,0,0,0.7)"
              />
              <text
                x={svgWidth / 2}
                y={svgHeight - 4} // Adjusted slightly for better alignment
                textAnchor="middle"
                fontSize="11"
                fontStyle="italic"
                fill="white"
                opacity="0.95"
              >
                From the Inaugural of George H.W. Bush, January 20, 1989
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

StressBarChart.propTypes = {
  height: PropTypes.string,
  mobileHeight: PropTypes.string,
  smallMobileHeight: PropTypes.string,
  className: PropTypes.string
};

export default StressBarChart;
