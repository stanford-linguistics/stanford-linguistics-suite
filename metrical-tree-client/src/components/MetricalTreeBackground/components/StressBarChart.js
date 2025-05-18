import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { barChartConfig } from '../config';
import { backgroundConfig } from '../config';

/**
 * StressBarChart - Component that visualizes stress patterns with animated bar graph
 */
const StressBarChart = ({ onAnimationComplete, isMobile }) => {
  const [highlightedWord, setHighlightedWord] = useState(null);
  const [renderTrigger, setRenderTrigger] = useState(0);
  const [showAttribution, setShowAttribution] = useState(false);
  const barAnimationRef = useRef(null);
  
  // For responsive positioning
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  
  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      setContainerDimensions({ width: vw, height: vh });
    };
    
    // Initial calculation
    updateDimensions();
    
    // Add resize listener
    window.addEventListener('resize', updateDimensions);
    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);
  
  // Sample linguistic data
  const phrase = useMemo(() => barChartConfig.phrase, []);
  const words = useMemo(() => phrase.split(" "), [phrase]);
  const stressValues = useMemo(() => barChartConfig.stressValues, []);
  const bubbleValues = useMemo(() => barChartConfig.bubbleValues, []);
  
  // Generate bar chart data
  const barData = useMemo(() => {
    return words.map((word, index) => ({
      name: word,
      value: stressValues[index] || 0,
      fullValue: stressValues[index] || 0,
      color: barChartConfig.getWordStressColor(stressValues[index] || 0)
    }));
  }, [words, stressValues]);
  
  // Use a ref for currentBarData to avoid re-render cycles
  const currentBarDataRef = useRef(barData.map(item => ({...item, value: 0})));
  
  // Get natural speech timing based on stress level
  const getSpeechTiming = useCallback((stressLevel) => {
    // Higher stress words get slightly more time for emphasis
    // Base time: 300ms, with 50ms additional per stress level
    return 300 + (stressLevel * 50);
  }, []);
  
  // Enhanced word highlighting function with animations
  const highlightWord = useCallback((word) => {
    // Reset all words to normal appearance
    words.forEach(w => {
      const el = document.getElementById(`word-${w}`);
      if (el) {
        el.setAttribute('font-size', '14');
        el.setAttribute('font-weight', 'bold');
        el.removeAttribute('filter');
        // Remove any highlight effects
        el.style.textShadow = 'none';
        // Reset animation effects
        el.style.animation = '';
        el.style.transition = '';
        // Keep consistent black color
        el.setAttribute('fill', 'black');
      }
      
      // Hide stress indicator for non-highlighted words
      const stressIndicator = document.getElementById(`stress-indicator-${w}`);
      if (stressIndicator) {
        stressIndicator.style.opacity = "0.4";
        stressIndicator.style.transform = "translateY(0)";
      }
    });
    
    // Apply enhanced highlighting with animation to the current word
    const wordElement = document.getElementById(`word-${word}`);
    if (wordElement) {
      // Adaptive size animation based on word length
      const baseFontSize = 14;
      const maxFontSize = 16;
      const wordLength = word.length;
      
      // Calculate font size: longer words get smaller increases
      let newFontSize;
      if (wordLength <= 4) {
        // Short words get full size increase
        newFontSize = maxFontSize;
      } else if (wordLength <= 8) {
        // Medium words get moderate increase
        newFontSize = baseFontSize + 1.5; // 15.5px
      } else {
        // Long words get minimal increase
        newFontSize = baseFontSize + 1; // 15px
      }
      
      wordElement.setAttribute('font-size', newFontSize);
      wordElement.setAttribute('font-weight', 'bolder');
      
      // Add glow effect
      wordElement.setAttribute('filter', 'url(#glow)');
      
      // Text shadow for emphasis
      wordElement.style.textShadow = '0px 0px 8px rgba(255, 255, 255, 0.8)';
      
      // Apply smooth transition for font size change
      wordElement.style.transition = 'all 0.3s ease-in-out';
      
      // Show and animate stress indicator
      const stressIndicator = document.getElementById(`stress-indicator-${word}`);
      if (stressIndicator) {
        stressIndicator.style.opacity = "1";
        stressIndicator.style.animation = 'stressIndicatorFadeIn 0.4s ease-out forwards';
      }
    }
  }, [words, barData]);

  // Reset all word highlights
  const resetWordHighlights = useCallback(() => {
    words.forEach(word => {
      const el = document.getElementById(`word-${word}`);
      if (el) {
        el.setAttribute('font-size', '14');
        el.setAttribute('font-weight', 'bold');
        el.removeAttribute('filter');
        el.style.textShadow = 'none';
        el.setAttribute('fill', 'black'); // Use consistent black color for all words
      }
    });
  }, [words]);
  
  // Animate bars sequentially (one at a time) as if being read
  const animateBars = useCallback(() => {
    let currentBarIndex = 0;
    
    const animateBar = (index) => {
      // Highlight the current word 
      setHighlightedWord(words[index]);
      highlightWord(words[index]);
      
      // For zero-stress words, we handle them differently
      if (barData[index].fullValue === 0) {
        // Set a minimal value for visual representation
        const newBarData = [...currentBarDataRef.current];
        newBarData[index] = {
          ...newBarData[index],
          value: 0.05 // Minimal value to create a visible indicator
        };
        
        currentBarDataRef.current = newBarData;
        
        // Trigger render update
        setRenderTrigger(prev => prev + 1);
        
        // Wait briefly, then move to next word
        setTimeout(() => {
          currentBarIndex++;
          if (currentBarIndex < barData.length) {
            // Move to next word
            animateBar(currentBarIndex);
          } else {
            // All bars complete
            barAnimationRef.current = null;
            resetWordHighlights();
            
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }
        }, barChartConfig.animation.wordSpacing);
      } else {
        // Animate only the current bar with normal stress
        const animateStep = () => {
          const current = currentBarDataRef.current[index].value || 0;
          const target = barData[index].fullValue;
          
          if (current < target) {
            // Update just this bar's height
            const newBarData = [...currentBarDataRef.current];
            newBarData[index] = {
              ...newBarData[index],
              value: Math.min(current + barChartConfig.animation.barGrowSpeed, target)
            };
            
            currentBarDataRef.current = newBarData;
            
            // Trigger render update
            setRenderTrigger(prev => prev + 1);
            
            // Continue animating this bar
            barAnimationRef.current = requestAnimationFrame(animateStep);
          } else {
            // This bar is complete, move to the next
            currentBarIndex++;
            if (currentBarIndex < barData.length) {
              // Variable delay based on stress level for natural speech rhythm
              const delay = getSpeechTiming(barData[index].fullValue);
              setTimeout(() => animateBar(currentBarIndex), delay);
            } else {
              // All bars complete
              barAnimationRef.current = null;
              resetWordHighlights();
              
              // Animation complete - show attribution and notify parent
              setShowAttribution(true);
              if (onAnimationComplete) {
                onAnimationComplete();
              }
            }
          }
        };
        
        // Start animating this bar
        barAnimationRef.current = requestAnimationFrame(animateStep);
      }
    };
    
    // Start with the first bar
    if (barData.length > 0) {
      animateBar(0);
    }
  }, [
    barData, 
    words, 
    onAnimationComplete, 
    highlightWord, 
    resetWordHighlights, 
    getSpeechTiming
  ]);

  // Start animating bars on mount
  useEffect(() => {
    // Reset animation state
    currentBarDataRef.current = barData.map(item => ({...item, value: 0}));
    setRenderTrigger(prev => prev + 1);
    
    // Start animation after a brief delay
    const timer = setTimeout(() => {
      animateBars();
    }, barChartConfig.animation.initialDelay);
    
    return () => {
      clearTimeout(timer);
      if (barAnimationRef.current) {
        cancelAnimationFrame(barAnimationRef.current);
        barAnimationRef.current = null;
      }
    };
  }, [animateBars, barData]);

  // Force re-render when renderTrigger changes
  const [_, forceUpdate] = useState({});
  useEffect(() => {
    forceUpdate({});
  }, [renderTrigger]);

  // Calculate responsive dimensions for bar chart at bottom of screen
  const getChartPosition = useMemo(() => {
    const isShortScreen = containerDimensions.height < 600;
    const isNarrowScreen = containerDimensions.width < 600;
    const isTinyScreen = containerDimensions.width < 400;
    const totalHeight = containerDimensions.height || 800; // Fallback if height is 0
    const isVeryTallScreen = containerDimensions.height > 900;
    
    // For better visibility on mobile, increase chart size
    const barChartHeightPercentage = isTinyScreen 
      ? 0.35 // Larger percentage on tiny screens
      : isShortScreen 
        ? 0.32 // Slightly larger on short screens
        : (isMobile 
          ? 0.28 // Larger on mobile
          : (isVeryTallScreen ? 0.22 : 0.25)); // Adjusted for taller screens
    
    // Ensure minimum height is larger on small screens for better visibility
    const minHeight = isTinyScreen ? 180 : (isNarrowScreen ? 170 : 150);
    
    // Set a maximum height to prevent excessive scaling on very tall screens
    const maxHeight = isTinyScreen ? 220 : (isNarrowScreen ? 250 : 300);
    
    // Calculate height with constraints
    const calculatedHeight = Math.floor(totalHeight * barChartHeightPercentage);
    const barHeight = `${Math.min(maxHeight, Math.max(minHeight, calculatedHeight))}px`;
    
    // Adjust bottom position to account for footer
    const footerHeight = 150; // Approximate height of the footer
    const bottomMargin = Math.max(footerHeight + 20, isShortScreen ? 170 : 180);
    
    return {
      bottom: bottomMargin, // Increased to ensure chart is above the fixed footer
      left: isTinyScreen ? 0 : (isNarrowScreen ? 5 : 10),
      width: isTinyScreen ? '100%' : `calc(100% - ${isNarrowScreen ? 10 : 20}px)`,
      height: barHeight,
      zIndex: 5, // Increased to ensure visibility
      maxWidth: '1200px',
      margin: '0 auto',
      overflowX: 'auto', // Allow horizontal scrolling for many words
      overflowY: 'visible' // Keep labels visible
    };
  }, [containerDimensions, isMobile]);
  
  // Calculate attribution position to avoid overlaps with bar chart
  const getAttributionPosition = useMemo(() => {
    const isShortScreen = containerDimensions.height < 600;
    const footerHeight = 150; // Approximate height of the footer
    
    return {
      bottom: footerHeight + 10, // Position just above the footer
      zIndex: 25, // Increased to ensure it's always visible
      opacity: 0.95, // More opaque for better readability
    };
  }, [containerDimensions]);

  return (
    <div style={{ 
      position: 'relative',
      width: '100%', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Attribution */}
      {showAttribution && backgroundConfig.attribution.enabled && (
        <div style={{
          position: 'absolute',
          bottom: getAttributionPosition.bottom,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '11px',
          color: 'white',
          backgroundColor: 'rgba(0,0,0,0.7)', // Slightly darker for better visibility
          padding: '3px 10px',
          borderRadius: '4px',
          fontStyle: 'italic',
          zIndex: getAttributionPosition.zIndex,
          opacity: getAttributionPosition.opacity,
          animation: 'fadeIn 1s ease-in-out',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)' // Add subtle shadow for better visibility
        }}>
          {backgroundConfig.attribution.text}
        </div>
      )}
      
      <div style={{ 
        position: 'absolute', 
        bottom: getChartPosition.bottom, 
        left: getChartPosition.left, 
        width: getChartPosition.width, 
        height: getChartPosition.height,
        maxWidth: getChartPosition.maxWidth,
        margin: getChartPosition.margin,
        zIndex: getChartPosition.zIndex, 
        opacity: barChartConfig.style.barOpacity,
        minHeight: '120px', // Ensure minimum height for tiny screens
        overflowX: 'auto', // Enable horizontal scrolling if needed
        overflowY: 'visible', // Keep vertical content visible without scrolling
        WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS devices
        textAlign: 'center', // Center the SVG content
      }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 900 200" 
        preserveAspectRatio="xMidYMid meet"
        style={{ 
          overflow: 'visible',
          // Calculate a more appropriate minWidth based on number of words and screen size
          minWidth: (() => {
            const wordCount = currentBarDataRef.current.length;
            const baseMinWidth = containerDimensions.width < 400 ? 400 : 600;
            // Add more width for more words
            const wordAdjustment = Math.max(0, (wordCount - 5) * 25);
            return `${baseMinWidth + wordAdjustment}px`;
          })(),
          margin: '0 auto', // Center the SVG
          display: 'block' // Ensure SVG is block element for margin auto to work
        }}
      >
        {/* Filters for effects */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Grid lines */}
        <g>
          {[0, 1, 2, 3, 4].map((line) => (
            <line 
              key={`grid-${line}`}
              x1="40" 
              y1={200 - (line * 40) - 40} 
              x2="880" 
              y2={200 - (line * 40) - 40} 
              stroke="#e0e0e0" 
              strokeDasharray="3 3" 
              strokeWidth="1" 
              opacity="0.3" 
            />
          ))}
        </g>

        {/* Bars and annotations */}
        <g className="bar-chart-container">
          <style>
            {`
              @media (max-width: 600px) {
                .bar-label { font-size: 12px !important; }
                .stress-indicator { transform: scale(0.9); }
              }
              @media (max-width: 400px) {
                .bar-label { font-size: 11px !important; }
                .stress-indicator { transform: scale(0.8); }
              }
            `}
          </style>
          {(() => {
            // Calculate responsive bar width and spacing based on screen size
            const isNarrowScreen = containerDimensions.width < 600;
            const isTinyScreen = containerDimensions.width < 400;
            const wordCount = currentBarDataRef.current.length;
            const containerWidth = containerDimensions.width;
            
            // Calculate available width for the entire chart
            // Account for padding on both sides - use the SVG viewport width (900)
            const svgViewportWidth = 900;
            const availableWidth = Math.min(svgViewportWidth * 0.85, 1200); // 85% of SVG viewport width, max 1200px
            
            // Calculate space needed for words with minimum spacing
            // Start position (left padding) + width needed for all bars/spaces + end padding
            const minBarWidth = isTinyScreen ? 18 : (isNarrowScreen ? 22 : 25);
            const minSpacing = isTinyScreen ? 15 : (isNarrowScreen ? 20 : 25);
            
            // Dynamic calculation for optimal bar width and spacing based on available space
            let calculatedBarWidth, calculatedSpacing;
            
            // If we have very few words, we can make bars wider
            if (wordCount <= 4) {
              // For few words, prioritize larger bars
              calculatedBarWidth = Math.min(70, availableWidth / (wordCount * 2));
              calculatedSpacing = Math.max(minSpacing, calculatedBarWidth * 0.8); // Spacing relative to bar width
            } else if (wordCount <= 7) {
              // For medium number of words, balanced approach
              calculatedBarWidth = Math.min(50, availableWidth / (wordCount * 1.8));
              calculatedSpacing = Math.max(minSpacing, calculatedBarWidth * 0.7);
            } else {
              // For many words, prioritize fitting them all with minimum widths
              calculatedBarWidth = Math.max(minBarWidth, availableWidth / (wordCount * 1.7));
              calculatedSpacing = Math.max(minSpacing, availableWidth * 0.03); // At least 3% of available width
            }
            
            // Distribute bars evenly across the available width
            // Total width used by all bars and spaces
            const totalUsedWidth = (calculatedBarWidth * wordCount) + (calculatedSpacing * (wordCount - 1));
            
            // If we're not using all available width and have enough words, increase spacing
            if (totalUsedWidth < availableWidth * 0.9 && wordCount > 2) {
              // Adjust spacing to distribute bars more evenly
              calculatedSpacing = (availableWidth * 0.9 - (calculatedBarWidth * wordCount)) / (wordCount - 1);
            }
            
            // Calculate starting position to center the chart within the SVG viewport
            // We need to center within the SVG's 900 width, not the container width
            // The margins in the SVG are roughly 40px on each side (40 to 880 in the grid)
            const leftMargin = 40;
            const rightMargin = 40; 
            const svgUsableWidth = svgViewportWidth - leftMargin - rightMargin;
            
            // Center the chart within the usable area of the SVG viewport
            const startPosition = leftMargin + ((svgUsableWidth - totalUsedWidth) / 2);
            
            // Map through items to render them with calculated dimensions
            return currentBarDataRef.current.map((item, index) => {
              const startX = startPosition + (index * (calculatedBarWidth + calculatedSpacing));
              
              // Minimum height for zero-stress words to make them visible
              const minHeight = item.fullValue === 0 ? 2 : 0;
              const barHeight = (item.value * barChartConfig.layout.baseHeight) + (item.value > 0 ? 0 : minHeight);
            
              return (
              <g key={`bar-group-${index}`}>
                {/* Bar */}
                <rect 
                  x={startX} 
                  y={200 - barHeight - barChartConfig.layout.baseHeight} 
                  width={calculatedBarWidth} 
                  height={barHeight > 0 ? barHeight : 1}
                  fill={barChartConfig.getWordStressColor(item.fullValue)}
                  opacity={item.fullValue === 0 ? 0.4 : 1}
                  rx={2} // Slightly rounded corners
                />
                
                {/* Stress value indicator */}
                <g 
                  id={`stress-indicator-${item.name}`}
                  className="stress-indicator"
                  opacity="0.4"
                  transform={`translate(0,0)`}
                  style={{ transition: 'all 0.3s ease' }}
                >
                  {/* Background pill - adjust size for screen size */}
                  <rect
                    x={startX + (calculatedBarWidth / 2) - (barChartConfig.style.indicatorSize.width * (isNarrowScreen ? 0.8 : 1) / 2)}
                    y={200 - barHeight - 60}
                    width={barChartConfig.style.indicatorSize.width * (isNarrowScreen ? 0.8 : 1)}
                    height={barChartConfig.style.indicatorSize.height * (isNarrowScreen ? 0.8 : 1)}
                    rx={9 * (isNarrowScreen ? 0.8 : 1)}
                    ry={9 * (isNarrowScreen ? 0.8 : 1)}
                    fill={barChartConfig.getWordStressColor(item.fullValue)}
                    stroke="#ffffff"
                    strokeWidth="1"
                    opacity="0.9"
                  />
                  
                  {/* Stress value text */}
                  <text
                    x={startX + (calculatedBarWidth / 2)}
                    y={200 - barHeight - 48}
                    textAnchor="middle"
                    fontSize={isNarrowScreen ? "10" : "12"}
                    fontWeight="bold"
                    fill="white"
                  >
                    {bubbleValues[index]}
                  </text>
                </g>
                
                {/* Word label */}
                <text 
                  id={`word-${item.name}`}
                  className="bar-label"
                  x={startX + (calculatedBarWidth / 2)} 
                  y="180" 
                  fill="black" // Use consistent black color for all words
                  fontSize={isNarrowScreen ? "12" : "14"}
                  fontFamily="Arial, sans-serif" 
                  fontWeight="bold"
                  textAnchor="middle"
                  style={{
                    textShadow: '0px 0px 3px rgba(255, 255, 255, 0.7)'
                  }}
                >
                  {item.name}
                </text>
              </g>
            );
            });
          })()}
        </g>
      </svg>
      </div>
    </div>
  );
};

StressBarChart.propTypes = {
  onAnimationComplete: PropTypes.func,
  isMobile: PropTypes.bool
};

StressBarChart.defaultProps = {
  onAnimationComplete: () => {},
  isMobile: false
};

export default StressBarChart;
