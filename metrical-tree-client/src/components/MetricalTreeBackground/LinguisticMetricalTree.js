import React, { useRef, useState, useCallback, useMemo, useLayoutEffect } from 'react';
import { STANFORD_COLORS } from './constants';

/**
 * LinguisticMetricalTree - A component that visualizes linguistic metrical trees 
 * and stress patterns with animated bar graph
 */
const LinguisticMetricalTree = React.forwardRef((props, ref) => {
  const {
    colorScheme = {},
    animation = {},
    tree = {},
    grid = {},
    particles = {},
    responsive = {},
    showControls = false,
    className = '',
    onReady,
    onTreeGenerated,
  } = props;

  // Create SVG refs
  const gridSvgRef = useRef(null);
  const treeSvgRef = useRef(null);
  const particlesSvgRef = useRef(null);
  
  // Animation ref
  const barAnimationRef = useRef(null);
  
  // Animation state
  const [isAnimationActive, setIsAnimationActive] = useState(
    animation.active !== undefined ? animation.active : true
  );
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedWord, setHighlightedWord] = useState(null);
  const [treeNodes, setTreeNodes] = useState([]);
  const [treeComplete, setTreeComplete] = useState(false);
  const [showAttribution, setShowAttribution] = useState(true);
  const [animationMode, setAnimationMode] = useState('bars'); // 'bars', 'tree', or 'none'
  const [animationLoopActive, setAnimationLoopActive] = useState(true);
  const animationTimerRef = useRef(null);


  
  // Sample linguistic data
  const phrase = useMemo(() => "Our challenges are great but our will is greater", []);
  const words = useMemo(() => phrase.split(" "), [phrase]);
  
  // Stress values for each word - memoized to prevent re-renders
const stressValues = useMemo(() => [1, 3, 2, 4, 3, 2, 4, 3, 5], []);
const bubbleValues = useMemo(() => [5, 3, 4, 2, 3, 4, 2, 3, 1], []);


  
// Metrical tree data 
// Metrical tree data based on the phrase
const metricTreeData = useMemo(() => {
  /// Base node positions
  const topX = 350;
  const topY = 120;
  
  const level1Y = 180;
  const wNodeX = 280;
  const sNodeX = 420;
  
  const wordY = 270; // Increase this value from 250 to 270 for more space
  const meX = 220;
  const triX = 280;
  const calX = 340;
  const treeX = 420;
  
  return {
    // Root node - no label
    x: topX,
    y: topY,
    children: [
      {
        type: 'w', // Left branch - weak
        x: wNodeX,
        y: level1Y,
        children: [
          {
            type: 's', // Strong
            word: "me",
            x: meX, 
            y: wordY
          },
          {
            type: 'w', // Weak
            word: "tri",
            x: triX,
            y: wordY
          },
          {
            type: 'w', // Weak
            word: "cal",
            x: calX,
            y: wordY
          }
        ]
      },
      {
        type: 's', // Right branch - strong
        x: sNodeX,
        y: level1Y,
        children: [
          {
            type: 's', // Strong
            word: "tree",
            x: treeX,
            y: wordY
          }
        ]
      }
    ]
  };
}, []);




  
  // Generate bar chart data
  const barData = useMemo(() => {
    return words.map((word, index) => ({
      name: word,
      value: stressValues[index] || 0,
      fullValue: stressValues[index] || 0,
      color: getWordStressColor(stressValues[index] || 0)
    }));
  }, [words, stressValues]);
  
  // Use a ref for currentBarData to avoid re-render cycles
  const currentBarDataRef = useRef(barData.map(item => ({...item, value: 0})));
  
  // Render trigger to force re-renders when needed
  // This is referenced in animation functions, but the functions are only using setRenderTrigger
  const [renderTrigger, setRenderTrigger] = useState(0);
  
  // Get color based on stress value
  function getWordStressColor(value) {
    if (value === 0) return '#aaa'; // Light gray for zero-stress words
    if (value === 1) return '#808080'; // Medium grey for low-stress words
    if (value === 2) return STANFORD_COLORS.CLAY;
    if (value === 3) return STANFORD_COLORS.BROWN;
    return STANFORD_COLORS.RED;
  }
  
  // Create grid lines
  const createGrid = useCallback(() => {
    if (!gridSvgRef.current) return;
    
    // Clear existing grid
    while (gridSvgRef.current.firstChild) {
      gridSvgRef.current.removeChild(gridSvgRef.current.firstChild);
    }
    
    const containerWidth = gridSvgRef.current.clientWidth;
    const containerHeight = gridSvgRef.current.clientHeight;
    
    const majorSpacing = 100;
    const minorSpacing = 20;
    
    const ns = 'http://www.w3.org/2000/svg';
    
    // Create grid lines
    for (let x = 0; x < containerWidth; x += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', containerHeight);
      line.setAttribute('stroke', colorScheme.gridMajorLine || '#e2e8f0');
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    for (let y = 0; y < containerHeight; y += majorSpacing) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', containerWidth);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', colorScheme.gridMajorLine || '#e2e8f0');
      line.setAttribute('stroke-width', 1);
      gridSvgRef.current.appendChild(line);
    }
    
    // Minor grid lines
    for (let x = 0; x < containerWidth; x += minorSpacing) {
      if (x % majorSpacing !== 0) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', x);
        line.setAttribute('y2', containerHeight);
        line.setAttribute('stroke', colorScheme.gridMinorLine || '#edf2f7');
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
        line.setAttribute('stroke', colorScheme.gridMinorLine || '#edf2f7');
        line.setAttribute('stroke-width', 0.5);
        gridSvgRef.current.appendChild(line);
      }
    }
  }, [colorScheme]);
  
  // Draw metrical tree nodes recursively
  const drawTreeNode = useCallback((node, parent = null, depth = 0, currentNodes = []) => {
    if (!treeSvgRef.current) return currentNodes;
    
    const ns = 'http://www.w3.org/2000/svg';
    
    // Create a group for this node
    const group = document.createElementNS(ns, 'g');
    treeSvgRef.current.appendChild(group);

    // Add styled node for type label (s/w) except at the top level
    if (depth > 0 && node.type) {
      // Create a circle node for the type
      const nodeRadius = 12;
      const nodeCircle = document.createElementNS(ns, 'circle');
      nodeCircle.setAttribute('cx', node.x);
      nodeCircle.setAttribute('cy', node.y);
      nodeCircle.setAttribute('r', nodeRadius);
      nodeCircle.setAttribute('fill', 'white');
      nodeCircle.setAttribute('stroke', STANFORD_COLORS.RED); // Change to Stanford red
      nodeCircle.setAttribute('stroke-width', '1.5'); // Slightly thicker border
      group.appendChild(nodeCircle);

      nodeCircle.style.animation = 'nodeAppear 1.5s ease-out forwards'; // increased from 0.5s to 1.5s
      nodeCircle.style.transformOrigin = 'center';

      // Add subtle drop shadow for depth
      const circleShadow = document.createElementNS(ns, 'circle');
      circleShadow.setAttribute('cx', node.x + 1);
      circleShadow.setAttribute('cy', node.y + 1);
      circleShadow.setAttribute('r', nodeRadius);
      circleShadow.setAttribute('fill', 'rgba(0,0,0,0.2)');
      circleShadow.setAttribute('filter', 'blur(1px)');
      group.insertBefore(circleShadow, nodeCircle); // Insert shadow behind the main circle
      
      // Add the text label inside the circle
      const typeLabel = document.createElementNS(ns, 'text');
      typeLabel.setAttribute('x', node.x);
      typeLabel.setAttribute('y', node.y + 5); // Center text vertically
      typeLabel.setAttribute('text-anchor', 'middle');
      typeLabel.setAttribute('font-size', '14');
      typeLabel.setAttribute('font-weight', 'bold');
      typeLabel.setAttribute('fill', STANFORD_COLORS.BLACK);
      typeLabel.textContent = node.type.toUpperCase();
      group.appendChild(typeLabel);
    }

    // Add word label if this is a leaf node
    if (node.word) {
      // For leaf nodes with words, add the word label below
      const wordLabel = document.createElementNS(ns, 'text');
      wordLabel.setAttribute('x', node.x);
      wordLabel.setAttribute('y', node.y + 45); // Position below the node
      wordLabel.setAttribute('text-anchor', 'middle');
      wordLabel.setAttribute('font-size', '14');
      wordLabel.setAttribute('font-weight', 'bold');
      wordLabel.setAttribute('fill', STANFORD_COLORS.RED);
      wordLabel.setAttribute('font-size', '16'); // Slightly larger
      wordLabel.style.textShadow = '0px 0px 2px rgba(255,255,255,0.8)'; // Add subtle text shadow for better readability
      wordLabel.textContent = node.word;
      wordLabel.id = `word-${node.word}`;
      group.appendChild(wordLabel);
    }

    // If this is a leaf node with a word, create a vertical line connecting to the word
    if (node.word) {
      const nodeRadius = 12;
      const wordConnectionLine = document.createElementNS(ns, 'line');
      wordConnectionLine.setAttribute('x1', node.x);
      wordConnectionLine.setAttribute('y1', node.y + nodeRadius); // Start from bottom of circle
      wordConnectionLine.setAttribute('x2', node.x);
      wordConnectionLine.setAttribute('y2', node.y + 35); // End just above the word
      wordConnectionLine.setAttribute('stroke', STANFORD_COLORS.BLACK);
      wordConnectionLine.setAttribute('stroke-width', 1.5);
      group.appendChild(wordConnectionLine);
    }



    
    
    // Draw connection line to parent if not the root
    if (parent) {
      // Calculate node positions and sizes
      const nodeRadius = 12;
      
      // Calculate angle between nodes for proper connection points
      const dx = node.x - parent.x;
      const dy = node.y - parent.y;
      const angle = Math.atan2(dy, dx);
      
      // Calculate connection points on the circle boundaries
      let startX, startY, endX, endY;
      
      // Starting point (from parent)
      if (depth === 1) { // From root to level 1
        startX = parent.x;
        startY = parent.y;
      } else { // From internal node, offset by radius in correct direction
        startX = parent.x + Math.cos(angle) * nodeRadius;
        startY = parent.y + Math.sin(angle) * nodeRadius;
      }
      
      // Ending point (to this node) - offset by radius in opposite direction
      endX = node.x - Math.cos(angle) * nodeRadius;
      endY = node.y - Math.sin(angle) * nodeRadius;
      
      // Draw the connection line
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', startX);
      line.setAttribute('y1', startY);
      line.setAttribute('x2', endX);
      line.setAttribute('y2', endY);
      line.setAttribute('stroke', STANFORD_COLORS.BLACK);
      line.setAttribute('stroke-width', 1.5);
      group.appendChild(line);

      line.setAttribute('stroke-dasharray', '100');
      line.setAttribute('stroke-dashoffset', '100');
      line.style.animation = 'lineGrow 2.5s ease-out forwards'; // Make sure 'forwards' is included
      line.style.animationFillMode = 'forwards'; // This explicitly tells the browser to maintain the end state


    }

    
    // Collect this node in our list
    currentNodes.push({
      node,
      element: group,
      parent
    });
    
    // Process children recursively
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        drawTreeNode(child, node, depth + 1, currentNodes);
      }
    }
    
    return currentNodes;
  }, []);
  
  // Create particles effect
  const createParticles = useCallback(() => {
    if (!particlesSvgRef.current || !particles.enabled) return;
    
    // Clear existing particles
    while (particlesSvgRef.current.firstChild) {
      particlesSvgRef.current.removeChild(particlesSvgRef.current.firstChild);
    }
    
    const ns = 'http://www.w3.org/2000/svg';
    const containerWidth = particlesSvgRef.current.clientWidth;
    const containerHeight = particlesSvgRef.current.clientHeight;
    
    const particleCount = isMobile ? 15 : (particles.count || 25);
    
    // Create particle elements
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElementNS(ns, 'circle');
      
      // Random position, size, and opacity
      const x = Math.random() * containerWidth;
      const y = Math.random() * containerHeight;
      const size = Math.random() * 2 + 1;
      const opacity = Math.random() * 0.5 + 0.2;
      
      particle.setAttribute('cx', x);
      particle.setAttribute('cy', y);
      particle.setAttribute('r', size);
      particle.setAttribute('fill', STANFORD_COLORS.GOLD);
      particle.setAttribute('opacity', opacity);
      
      particlesSvgRef.current.appendChild(particle);
    }
  }, [particles, isMobile]);
  
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
        // Return to normal color
        el.setAttribute('fill', getWordStressColor(barData.find(item => item.name === w)?.fullValue || 0));

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
      // Size animation
      wordElement.setAttribute('font-size', '16');
      wordElement.setAttribute('font-weight', 'bolder');
      
      // Add glow effect
      wordElement.setAttribute('filter', 'url(#glow)');
      
      // Text shadow for emphasis
      wordElement.style.textShadow = '0px 0px 8px rgba(255, 255, 255, 0.8)';
      
      // Temporarily brighten the color
      // wordElement.setAttribute('fill', STANFORD_COLORS.RED);
      
      // Apply bounce animation
      wordElement.style.transition = 'all 0.3s ease-in-out';
      wordElement.style.animation = 'wordBounce 0.6s ease-in-out';
      
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
        el.setAttribute('fill', getWordStressColor(barData.find(item => item.name === word)?.fullValue || 0));
      }
    });
  }, [words, barData]);
  
  // Get natural speech timing based on stress level
  const getSpeechTiming = useCallback((stressLevel) => {
    // Higher stress words get slightly more time for emphasis
    // Base time: 300ms, with 50ms additional per stress level
    return 300 + (stressLevel * 50);
  }, []);
  
  // Create ripple effect
  const createRippleEffect = useCallback((startX, startY) => {
    if (!treeSvgRef.current) return;
    
    const ns = 'http://www.w3.org/2000/svg';
    const ripple = document.createElementNS(ns, 'circle');
    
    ripple.setAttribute('cx', startX);
    ripple.setAttribute('cy', startY);
    ripple.setAttribute('r', '10');
    ripple.setAttribute('fill', 'none');
    ripple.setAttribute('stroke', STANFORD_COLORS.GOLD);
    ripple.setAttribute('stroke-width', '1.5');
    ripple.style.animation = 'rippleEffect 1s ease-out forwards';
    
    treeSvgRef.current.appendChild(ripple);
    
    // Store a reference to parent element for safer removal
    const parentElement = treeSvgRef.current;
    
    // Remove ripple after animation completes
    setTimeout(() => {
      try {
        if (parentElement && ripple && parentElement.contains(ripple)) {
          parentElement.removeChild(ripple);
        }
      } catch (err) {
        console.log('Cleanup: Ripple element already removed');
      }
    }, 1000);
  }, []);
  
  // Create reading line effect
  const createReadingLine = useCallback((index, animationDuration) => {
    const barWidth = isMobile ? 50 : 60;
    const spacing = isMobile ? 15 : 20;
    const startX = 40 + (index * (barWidth + spacing));
    
    // Find the proper container element
    const container = document.querySelector('.linguistic-tree-background');
    if (!container) return;
    
    // Create a reading line element
    const readingLineEl = document.createElement('div');
    readingLineEl.className = 'reading-line';
    readingLineEl.style.position = 'absolute';
    readingLineEl.style.height = '100%';
    readingLineEl.style.width = '2px';
    readingLineEl.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
    readingLineEl.style.left = `${startX + (barWidth/2)}px`;
    readingLineEl.style.top = '0';
    readingLineEl.style.zIndex = '5';
    readingLineEl.style.pointerEvents = 'none';
    readingLineEl.style.animation = `readingLine ${animationDuration}ms linear forwards`;
    
    // Store the parent container for later cleanup
    container.appendChild(readingLineEl);
    const parentElement = container;
    
    // Remove reading line after animation completes
    setTimeout(() => {
      try {
        if (parentElement && readingLineEl && parentElement.contains(readingLineEl)) {
          parentElement.removeChild(readingLineEl);
        }
      } catch (err) {
        console.log('Cleanup: Reading line element already removed');
      }
    }, animationDuration + 100);
  }, [isMobile]);
  
  // Highlight ground beneath zero-stress word
  const highlightGround = useCallback((index) => {
    const barWidth = isMobile ? 50 : 60;
    const spacing = isMobile ? 15 : 20;
    const startX = 40 + (index * (barWidth + spacing));
    
    // Add ground highlight effect
    if (treeSvgRef.current) {
      const ns = 'http://www.w3.org/2000/svg';
      const highlight = document.createElementNS(ns, 'rect');
      
      highlight.setAttribute('x', startX - 10);
      highlight.setAttribute('y', 155);
      highlight.setAttribute('width', barWidth + 20);
      highlight.setAttribute('height', 10);
      highlight.setAttribute('fill', STANFORD_COLORS.GOLD);
      highlight.style.animation = 'groundHighlight 1s ease-in-out forwards';
      
      treeSvgRef.current.appendChild(highlight);
      
      // Remove highlight after animation completes
      setTimeout(() => {
        if (treeSvgRef.current && treeSvgRef.current.contains(highlight)) {
          treeSvgRef.current.removeChild(highlight);
        }
      }, 1000);
    }
  }, [isMobile]);
  
  // Animate bars sequentially (one at a time) as if being read
  const animateBars = useCallback(() => {
    let currentBarIndex = 0;
    
    const animateBar = (index) => {
      // Highlight the current word 
      setHighlightedWord(words[index]);
      
      // For zero-stress words, we handle them differently
      if (barData[index].fullValue === 0) {
        // Set a minimal value for visual representation
        const newBarData = [...currentBarDataRef.current];
        newBarData[index] = {
          ...newBarData[index],
          value: 0.05 // Minimal value to create a visible indicator
        };
        
        currentBarDataRef.current = newBarData;
        
        // Removed pulsing animation for "When" as requested
        
        // Trigger render update
        setRenderTrigger(prev => prev + 1);
        
        // Wait briefly, then move to next word
        setTimeout(() => {
          // No need to stop animation since we're not applying it anymore
          
          currentBarIndex++;
          if (currentBarIndex < barData.length && isAnimationActive) {
            // Move to next word
            animateBar(currentBarIndex);
          } else {
            // All bars complete
            barAnimationRef.current = null;
            setTreeComplete(true);
            setRenderTrigger(prev => prev + 1);
            resetWordHighlights();

            // Show attribution after a delay
            setTimeout(() => {
              setShowAttribution(true);
            }, 1000);

            // Call animation completion handler
            handleAnimationComplete();
            
            if (onTreeGenerated) {
              onTreeGenerated();
            }
          }
        }, 600); // Slightly longer pause for zero-stress words
      } else {
        // Create a reading line that moves across
        const stressLevel = barData[index].fullValue;
        const animationTiming = getSpeechTiming(stressLevel);
        createReadingLine(index, animationTiming);
        
        // Animate only the current bar with normal stress
        const animateStep = () => {
          const current = currentBarDataRef.current[index].value || 0;
          const target = barData[index].fullValue;
          
          if (current < target) {
            // Update just this bar's height
            const newBarData = [...currentBarDataRef.current];
            newBarData[index] = {
              ...newBarData[index],
              value: Math.min(current + 0.1, target) // Increased increment for faster animation
            };
            
            currentBarDataRef.current = newBarData;
            
            // Trigger render update
            setRenderTrigger(prev => prev + 1);
            
            // Continue animating this bar
            barAnimationRef.current = requestAnimationFrame(animateStep);
          } else {
            // This bar is complete, move to the next
            currentBarIndex++;
            if (currentBarIndex < barData.length && isAnimationActive) {
              // Variable delay based on stress level for natural speech rhythm
              const delay = getSpeechTiming(barData[index].fullValue);
              setTimeout(() => animateBar(currentBarIndex), delay);
            } else {
              // All bars complete
              barAnimationRef.current = null;
              setTreeComplete(true);
              setRenderTrigger(prev => prev + 1);
              resetWordHighlights();

              // Show attribution after a delay
              setTimeout(() => {
                setShowAttribution(true);
              }, 1000);

              // Call animation completion handler
              handleAnimationComplete();

              
              if (onTreeGenerated) {
                onTreeGenerated();
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
    isAnimationActive, 
    onTreeGenerated, 
    highlightWord, 
    resetWordHighlights, 
    createRippleEffect, 
    highlightGround, 
    getSpeechTiming, 
    createReadingLine,
    isMobile
  ]);
  
  // Generate metrical tree visualization
  const createMetricalTree = useCallback(() => {
    if (!treeSvgRef.current) return;
    
    // Reset animation state
    currentBarDataRef.current = barData.map(item => ({...item, value: 0}));
    setRenderTrigger(0);
    setShowAttribution(false);
    
    // Clear any existing tree
    while (treeSvgRef.current.firstChild) {
      treeSvgRef.current.removeChild(treeSvgRef.current.firstChild);
    }
    
    // Draw the tree recursively
    const nodes = drawTreeNode(metricTreeData);
    setTreeNodes(nodes);
    
    // Start bar animation after tree is drawn
    animateBars();
  }, [drawTreeNode, metricTreeData, barData, animateBars]);
  
  // Handle resize
  const handleResize = useCallback(() => {
    setIsMobile(window.innerWidth <= (responsive.mobileThreshold || 768));
    createGrid();
    createParticles();
  }, [createGrid, createParticles, responsive]);
  
  // Regenerate visualization
  const regenerateTree = useCallback(() => {
    // Reset animation state
    setTreeComplete(false);
    
    // Recreate visualizations
    createMetricalTree();
  }, [createMetricalTree]);
  
  // Toggle animation state
  const toggleAnimation = useCallback(() => {
    const newActive = !isAnimationActive;
    setIsAnimationActive(newActive);
    
    if (newActive && !treeComplete) {
      // Restart bar animation
      animateBars();
    } else if (!newActive && barAnimationRef.current) {
      // Pause animation
      cancelAnimationFrame(barAnimationRef.current);
      barAnimationRef.current = null;
    }
  }, [isAnimationActive, treeComplete, animateBars]);
  
  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    regenerateTree,
    toggleAnimation,
    pauseAnimation: () => {
      if (isAnimationActive) {
        toggleAnimation();
      }
    },
    resumeAnimation: () => {
      if (!isAnimationActive) {
        toggleAnimation();
      }
    }
  }));
  
  useLayoutEffect(() => {
    createGrid();
    createParticles();
    
    // Start with bar animation
    startBarAnimation();
    
    // Set up resize listener
    const handleResizeDebounced = () => {
      setTimeout(handleResize, 250);
    };
    
    window.addEventListener('resize', handleResizeDebounced);
    
    // Call onReady callback
    if (onReady) {
      onReady();
    }
    
    return () => {
      window.removeEventListener('resize', handleResizeDebounced);
      
      if (barAnimationRef.current) {
        cancelAnimationFrame(barAnimationRef.current);
      }
      
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to only run once on mount


  // Function to start the bar chart animation
  const startBarAnimation = useCallback(() => {
    // Reset animation state
    setAnimationMode('bars');
    currentBarDataRef.current = barData.map(item => ({...item, value: 0}));
    setRenderTrigger(prev => prev + 1);
    
    // Start animating bars
    animateBars();
  }, [animateBars, barData]);

  // Function to start the tree animation
  const startTreeAnimation = useCallback(() => {
    // Reset animation state
    setAnimationMode('tree');
    
    // Clear any existing tree
    if (treeSvgRef.current) {
      while (treeSvgRef.current.firstChild) {
        treeSvgRef.current.removeChild(treeSvgRef.current.firstChild);
      }
    }
    
    // Create the filter definition first
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', 'glow');
    filter.setAttribute('x', '-30%');
    filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%');
    filter.setAttribute('height', '160%');
    
    // Add the blur and glow effects
    const blur = document.createElementNS(ns, 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '2');
    blur.setAttribute('result', 'blur');
    filter.appendChild(blur);
    
    const floodGlow = document.createElementNS(ns, 'feFlood');
    floodGlow.setAttribute('floodColor', 'white');
    floodGlow.setAttribute('result', 'glow');
    filter.appendChild(floodGlow);
    
    const composite1 = document.createElementNS(ns, 'feComposite');
    composite1.setAttribute('in', 'glow');
    composite1.setAttribute('in2', 'blur');
    composite1.setAttribute('operator', 'in');
    composite1.setAttribute('result', 'glowBlur');
    filter.appendChild(composite1);
    
    const composite2 = document.createElementNS(ns, 'feComposite');
    composite2.setAttribute('in', 'SourceGraphic');
    composite2.setAttribute('in2', 'glowBlur');
    composite2.setAttribute('operator', 'over');
    filter.appendChild(composite2);
    
    defs.appendChild(filter);
    
    if (treeSvgRef.current) {
      treeSvgRef.current.appendChild(defs);
    }
    
    // Add animation keyframes
    const style = document.createElementNS(ns, 'style');
    style.textContent = `
      @keyframes nodeAppear {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.1); opacity: 0.8; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes lineGrow {
        0% { stroke-dashoffset: var(--length, 100); }
        100% { stroke-dashoffset: 0; }
      }
    `;
    defs.appendChild(style);
    
    // Draw the tree
    const nodes = drawTreeNode(metricTreeData);
    setTreeNodes(nodes);
    
    // Set up timer to switch back to bar animation after tree is done
    // assuming tree animation takes about 3 seconds total
    animationTimerRef.current = setTimeout(() => {
      if (animationLoopActive) {
        startBarAnimation();
      }
    }, 8000); // Give it 8 seconds before switching back
  }, [drawTreeNode, metricTreeData, animationLoopActive]);

  // Function to handle animation completion and loop control
  const handleAnimationComplete = useCallback(() => {
    // When bar animation finishes, start tree animation if loop is active
    if (animationMode === 'bars' && animationLoopActive) {
      animationTimerRef.current = setTimeout(() => {
        startTreeAnimation();
      }, 1000); // Short pause before starting tree animation
    }
  }, [animationMode, animationLoopActive, startTreeAnimation]);

  
  return (
    <div className={`linguistic-tree-background ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Grid background */}
        <svg 
          ref={gridSvgRef} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
        />
        
        {/* Particles */}
        <svg 
          ref={particlesSvgRef} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}
        />
        
        {/* Tree visualization - height adjusted based on device orientation */}
        <svg 
          ref={treeSvgRef} 
          style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '100%', 
            height: isMobile ? '60%' : '70%', // Less height for tree on mobile portrait
            zIndex: 3, 
            pointerEvents: 'none' 
          }}
        >
          {/* Add filter definition for glow effect */}
          <defs>
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="white" result="glow" />
              <feComposite in="glow" in2="blur" operator="in" result="glowBlur" />
              <feComposite in="SourceGraphic" in2="glowBlur" operator="over" />
            </filter>
          </defs>
        </svg>
        
        {/* Bar chart - SVG Implementation - more height on mobile */}
        <div style={{ 
          position: 'absolute', 
          bottom: 10, 
          left: 10, 
          width: 'calc(100% - 20px)', 
          height: isMobile ? '40%' : '30%', // More height for chart on mobile portrait
          zIndex: 3, 
          opacity: 0.9 
        }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 600 200" 
            preserveAspectRatio="xMidYMid meet"
            style={{ overflow: 'visible' }}
          >
            {/* Add CSS animations */}
            <defs>
              <style>
                {`
                @keyframes wordBounce {
                  0% { transform: translateY(0); }
                  30% { transform: translateY(-4px); }
                  50% { transform: translateY(2px); }
                  70% { transform: translateY(-2px); }
                  100% { transform: translateY(0); }
                }
                
                @keyframes stressIndicatorFadeIn {
                  0% { opacity: 0; transform: translateY(-5px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes pulseGlow {
                  0% { filter: drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.3)); }
                  50% { filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.8)); }
                  100% { filter: drop-shadow(0px 0px 2px rgba(255, 255, 255, 0.3)); }
                }
                
                @keyframes rippleEffect {
                  0% { transform: scale(0.8); opacity: 0.8; }
                  50% { transform: scale(1.5); opacity: 0.4; }
                  100% { transform: scale(2); opacity: 0; }
                }
                
                @keyframes readingLine {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(100%); }
                }
                
                @keyframes zeroPulse {
                  0% { opacity: 0.5; }
                  50% { opacity: 0.9; }
                  100% { opacity: 0.5; }
                }
                
                @keyframes groundHighlight {
                  0% { opacity: 0; }
                  50% { opacity: 0.3; }
                  100% { opacity: 0; }
                }

                @keyframes fadeIn {
                  0% { opacity: 0; }
                  100% { opacity: 1; }
                }

                @keyframes nodeAppear {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.1); opacity: 0.8; } // changed from 70% to 50%
                  100% { transform: scale(1); opacity: 1; }
                }

                @keyframes lineGrow {
                  0% { stroke-dashoffset: 100; opacity: 1; }
                  80% { stroke-dashoffset: 20; opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 1; }
                }


                `}
              </style>
            </defs>
            {/* Grid lines */}
            <g>
              {[0, 1, 2, 3, 4].map((line) => (
                <line 
                  key={`grid-${line}`}
                  x1="40" 
                  y1={200 - (line * 40) - 40} 
                  x2="580" 
                  y2={200 - (line * 40) - 40} 
                  stroke="#e0e0e0" 
                  strokeDasharray="3 3" 
                  strokeWidth="1" 
                  opacity="0.3" 
                />
              ))}
            </g>

            {/* Bars and annotations */}
            <g>
              {currentBarDataRef.current.map((item, index) => {
                // Adjust bar width and spacing based on mobile vs desktop
                const barWidth = isMobile ? 40 : 60;
                const spacing = isMobile ? 10 : 20;
                const startX = 40 + (index * (barWidth + spacing));
                
                // Minimum height for zero-stress words to make them visible
                const minHeight = item.fullValue === 0 ? 2 : 0;
                const barHeight = (item.value * 40) + (item.value > 0 ? 0 : minHeight);
                
                return (
                  <g key={`bar-group-${index}`}>
                    {/* All words just use a bar with minimum height for zero-stress words */}
                    <rect 
                      x={startX} 
                      y={200 - barHeight - 40} 
                      width={barWidth} 
                      height={barHeight > 0 ? barHeight : 1}
                      fill={item.color}
                      opacity={item.fullValue === 0 ? 0.4 : 1}
                    />
                    
                    {/* Stress value indicator - visible for all words including zero-stress */}
                    <g 
                      id={`stress-indicator-${item.name}`}
                      opacity="0.4"
                      transform={`translate(0,0)`}
                      style={{ transition: 'all 0.3s ease' }}
                    >
                      {/* Background pill */}
                      <rect
                        x={startX + (barWidth / 2) - 12}
                        y={200 - barHeight - 60}
                        width={24}
                        height={18}
                        rx={9}
                        ry={9}
                        fill={item.color}
                        stroke="white"
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      
                      {/* Stress value text */}
                      <text
                        x={startX + (barWidth / 2)}
                        y={200 - barHeight - 48}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="bold"
                        fill="white"
                      >
                        {bubbleValues[index]}
                      </text>

                    </g>
                    
                    {/* Word label with improved styling for legibility */}
                    <text 
                      id={`word-${item.name}`}
                      x={startX + (barWidth / 2)} 
                      y="180" 
                      fill={getWordStressColor(item.fullValue)}
                      fontSize="14" 
                      fontFamily="Arial, sans-serif" 
                      fontWeight="bold"
                      textAnchor="middle"
                      style={{
                        textShadow: '0px 0px 3px rgba(255, 255, 255, 0.8)'
                      }}
                    >
                      {item.name}
                    </text>



                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Attribution text */}
        {showAttribution && (
          <div style={{
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
            whiteSpace: 'nowrap'
          }}>
            From the Inaugural of George H.W. Bush, January 20, 1989
          </div>
        )}



        
        {/* Controls */}
        {showControls && (
          <div style={{ 
            position: 'absolute', 
            bottom: 15, 
            right: 15, 
            zIndex: 10,
            display: 'flex',
            gap: 10
          }}>
            <button 
              onClick={regenerateTree}
              style={{
                backgroundColor: STANFORD_COLORS.RED,
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              Regenerate
            </button>
            <button 
              onClick={toggleAnimation}
              style={{
                backgroundColor: STANFORD_COLORS.RED,
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {isAnimationActive ? 'Pause' : 'Resume'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default LinguisticMetricalTree;
