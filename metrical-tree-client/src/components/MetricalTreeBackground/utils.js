/**
 * Utility functions and classes for the MetricalTreeBackground component
 */

/**
 * Calculate responsive scaling factor based on screen size
 * 
 * @param {Object} config - Configuration object
 * @returns {number} Calculated scale factor
 */
export const calculateScaleFactor = (config) => {
  const baseWidth = 1920;
  const baseHeight = 1080;
  
  const widthRatio = window.innerWidth / baseWidth;
  const heightRatio = window.innerHeight / baseHeight;
  
  // Modified: Use more aggressive scaling for larger screens
  let scaleFactor = Math.min(widthRatio, heightRatio);
  
  // // Adjust the scale factor based on absolute screen size to fill more space on larger screens
  // if (window.innerWidth > 1200 || window.innerHeight > 800) {
  //   scaleFactor *= 1.2; // Increase by 20% on larger screens
  // }
  
  // Keep within configured bounds
  scaleFactor = Math.max(
    config.responsive.minScaleFactor, 
    Math.min(config.responsive.maxScaleFactor, scaleFactor)
  );
  
  return scaleFactor;
};

// Storing container dimensions for boundary checking
let containerDimensions = {
  width: window.innerWidth,
  height: window.innerHeight
};

/**
 * Update stored container dimensions
 * 
 * @param {number} width - Container width
 * @param {number} height - Container height
 */
export const updateContainerDimensions = (width, height) => {
  containerDimensions.width = width;
  containerDimensions.height = height;
};

/**
 * Check if a point is within the visible area with some margin
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} margin - Optional margin in pixels
 * @returns {boolean} Whether the point is in the visible area
 */
export const isInVisibleArea = (x, y, margin = 80) => { // Increased margin from 50 to 80
  return (
    x >= margin && 
    x <= containerDimensions.width - margin && 
    y >= margin && 
    y <= containerDimensions.height - margin
  );
};

/**
 * Create a debounced function to limit how often a function runs
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Branch class for the metrical tree visualization
 * Represents a single branch in the tree with methods for growing and branching
 */
export class Branch {
  /**
   * @param {Object} params - Branch parameters
   * @param {number} params.startX - Starting X coordinate
   * @param {number} params.startY - Starting Y coordinate
   * @param {number} params.length - Branch length
   * @param {number} params.angle - Branch angle
   * @param {number} params.width - Branch width
   * @param {number} params.depth - Branch depth in the tree
   * @param {number} params.stress - Stress level (0=unstressed, 1=normal, 2=stressed)
   * @param {string} params.parentId - ID of parent branch
   * @param {SVGElement} params.svg - SVG element to render to
   * @param {Object} params.config - Configuration object
   */
  constructor({
    startX, 
    startY, 
    length, 
    angle, 
    width, 
    depth, 
    stress = 1, 
    parentId = null, 
    svg, 
    config
  }) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.parentId = parentId;
    this.startX = startX;
    this.startY = startY;
    this.length = length;
    this.angle = angle;
    this.width = width;
    this.depth = depth;
    this.stress = stress;
    this.svg = svg;
    this.config = config;
    
    // If this is the trunk (depth 0), force it to grow straight up first
    if (this.depth === 0) {
      this.angle = -Math.PI / 2; // Exactly straight up
    }
    
    this.endX = this.startX + Math.cos(this.angle) * this.length;
    this.endY = this.startY + Math.sin(this.angle) * this.length;
    
    // Check if branch endpoint is in visible area - if not, adjust length
    if (config.animation.boundaryCheck && !isInVisibleArea(this.endX, this.endY)) {
      // Try reducing length until endpoint is within visible area
      for (let i = 0; i < 5; i++) {
        this.length *= 0.8;
        this.endX = this.startX + Math.cos(this.angle) * this.length;
        this.endY = this.startY + Math.sin(this.angle) * this.length;
        if (isInVisibleArea(this.endX, this.endY)) break;
      }
    }
    
    this.growing = true;
    this.currentLength = 0;
    this.svgElement = null;
    this.childBranches = [];
    this.node = null;
    this.stressLabel = null;
    this.glowEffect = null;
    this.pulseAnimation = null;
    
    // Create SVG element immediately
    this.createSvgElement();
    
    // Add pulse effect for stressed nodes
    if (config.tree.pulseEnabled && this.stress >= 1) {
      this.createPulseEffect();
    }
  }
  
  /**
   * Create the SVG path element for this branch
   */
  createSvgElement() {
    const ns = 'http://www.w3.org/2000/svg';
    this.svgElement = document.createElementNS(ns, 'path');
    this.svgElement.setAttribute('stroke', this.config.tree.stressColors[this.stress]);
    this.svgElement.setAttribute('stroke-width', this.width);
    this.svgElement.setAttribute('fill', 'none');
    this.svgElement.setAttribute('stroke-linecap', 'round');
    this.svg.appendChild(this.svgElement);
  }
  
  /**
   * Create subtle pulsing/glowing effect for the branch
   */
  createPulseEffect() {
    if (this.stress < 1) return; // Only add pulse to normal and stressed branches
    
    const ns = 'http://www.w3.org/2000/svg';
    
    // Create glow filter if needed
    const filterId = `glow-${this.id}`;
    const filter = document.createElementNS(ns, 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-40%');
    filter.setAttribute('y', '-40%');
    filter.setAttribute('width', '180%');
    filter.setAttribute('height', '180%');
    
    const feGaussianBlur = document.createElementNS(ns, 'feGaussianBlur');
    feGaussianBlur.setAttribute('stdDeviation', '2');
    feGaussianBlur.setAttribute('result', 'blur');
    
    const feColorMatrix = document.createElementNS(ns, 'feColorMatrix');
    feColorMatrix.setAttribute('type', 'matrix');
    feColorMatrix.setAttribute('values', '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7');
    feColorMatrix.setAttribute('result', 'glow');
    
    const feMerge = document.createElementNS(ns, 'feMerge');
    
    const feMergeNode1 = document.createElementNS(ns, 'feMergeNode');
    feMergeNode1.setAttribute('in', 'blur');
    
    const feMergeNode2 = document.createElementNS(ns, 'feMergeNode');
    feMergeNode2.setAttribute('in', 'SourceGraphic');
    
    feMerge.appendChild(feMergeNode1);
    feMerge.appendChild(feMergeNode2);
    
    filter.appendChild(feGaussianBlur);
    filter.appendChild(feColorMatrix);
    filter.appendChild(feMerge);
    
    this.svg.appendChild(filter);
    
    // Apply the filter to our path
    this.svgElement.setAttribute('filter', `url(#${filterId})`);
    
    // Set initial opacity
    this.svgElement.setAttribute('opacity', this.config.tree.pulseMinOpacity);
    
    // Store the filter for later reference
    this.glowEffect = filter;
  }
  
  /**
   * Start pulse animation for the branch
   * @param {function} requestAnimationFrame - Reference to requestAnimationFrame function
   * @return {number} Animation frame ID
   */
  startPulseAnimation(requestAnimationFrame) {
    // Return early if we already have an animation running
    if (this.pulseAnimation) {
      return this.pulseAnimation;
    }
    
    // Element and animation state
    const element = this.svgElement;
    let increasing = true;
    let opacity = parseFloat(element.getAttribute('opacity') || this.config.tree.pulseMinOpacity);
    
    // Set up pulse animation
    const pulse = () => {
      if (!this.config.animation.active) {
        // Just pause by stopping updates but keep reference
        this.pulseAnimation = requestAnimationFrame(pulse);
        return;
      }
      
      // Calculate slower pulse factor based on stress level and duration
      // Much slower transitions for a more subtle effect
      const pulseFactor = 0.003 * (this.stress * 0.3 + 0.7);
      
      if (increasing) {
        opacity += pulseFactor;
        if (opacity >= this.config.tree.pulseMaxOpacity) {
          opacity = this.config.tree.pulseMaxOpacity;
          increasing = false;
        }
      } else {
        opacity -= pulseFactor;
        if (opacity <= this.config.tree.pulseMinOpacity) {
          opacity = this.config.tree.pulseMinOpacity;
          increasing = true;
        }
      }
      
      if (element && element.parentNode) {
        element.setAttribute('opacity', opacity);
        // Continue animation
        this.pulseAnimation = requestAnimationFrame(pulse);
      } else {
        // Element no longer in DOM, clear animation
        this.pulseAnimation = null;
      }
    };
    
    // Start animation
    this.pulseAnimation = requestAnimationFrame(pulse);
    return this.pulseAnimation;
  }
  
  /**
   * Stop pulse animation
   * @param {function} cancelAnimationFrame - Reference to cancelAnimationFrame function
   */
  stopPulseAnimation(cancelAnimationFrame) {
    if (this.pulseAnimation) {
      cancelAnimationFrame(this.pulseAnimation);
      this.pulseAnimation = null;
    }
  }
  
  /**
   * Grow the branch by incrementing its current length
   * @returns {boolean} Whether the branch is still growing
   */
  grow() {
    if (!this.growing) return false;
    
    this.currentLength += this.config.tree.growthSpeed;
    
    if (this.currentLength >= this.length) {
      this.currentLength = this.length;
      this.growing = false;
      this.createNode();
      return false;
    }
    
    const currentEndX = this.startX + Math.cos(this.angle) * this.currentLength;
    const currentEndY = this.startY + Math.sin(this.angle) * this.currentLength;
    
    const d = `M ${this.startX} ${this.startY} L ${currentEndX} ${currentEndY}`;
    this.svgElement.setAttribute('d', d);
    return true;
  }
  
  /**
   * Create nodes at branch endpoints
   */
  createNode() {
    // Create nodes at branch endpoints for depth >= 2
    if (this.depth >= 2) {
      const ns = 'http://www.w3.org/2000/svg';
      
      this.node = document.createElementNS(ns, 'circle');
      this.node.setAttribute('cx', this.endX);
      this.node.setAttribute('cy', this.endY);
      
      // Size based on depth and stress
      const nodeSize = Math.max(2, this.width * 0.75);
      this.node.setAttribute('r', nodeSize);
      
      // Color based on stress
      this.node.setAttribute('fill', this.config.tree.stressColors[this.stress]);
      
      // Add glow effect for stressed nodes
      if (this.config.tree.pulseEnabled && this.stress >= 1) {
        const nodeFilterId = `node-glow-${this.id}`;
        const filter = document.createElementNS(ns, 'filter');
        filter.setAttribute('id', nodeFilterId);
        
        const feGaussianBlur = document.createElementNS(ns, 'feGaussianBlur');
        feGaussianBlur.setAttribute('stdDeviation', '1.5');
        feGaussianBlur.setAttribute('result', 'blur');
        
        filter.appendChild(feGaussianBlur);
        this.svg.appendChild(filter);
        
        this.node.setAttribute('filter', `url(#${nodeFilterId})`);
      }
      
      this.svg.appendChild(this.node);
      
      // Add stress indicator only to some nodes to avoid clutter
      if ((this.depth >= 3 && Math.random() > 0.25) || this.depth >= 4) {
        // Changed probability from 0.4 to 0.25, and depth threshold from 5 to 4
        // This will create more stress markers on branches
        const scaleFactor = calculateScaleFactor(this.config);
        
        // Offset based on angle to avoid overlap
        const labelOffset = 8 * scaleFactor;
        const offsetX = Math.cos(this.angle) * labelOffset;
        const offsetY = Math.sin(this.angle) * labelOffset;
        
        this.stressLabel = document.createElementNS(ns, 'text');
        this.stressLabel.setAttribute('x', this.endX + offsetX);
        this.stressLabel.setAttribute('y', this.endY + offsetY);
        this.stressLabel.setAttribute('font-size', Math.max(8, 10 * scaleFactor));
        this.stressLabel.setAttribute('text-anchor', 'middle');
        this.stressLabel.setAttribute('fill', this.config.tree.stressColors[this.stress]);
        
        // Use simple symbols for stress levels
        const stressSymbols = ['○', '•', '●'];
        this.stressLabel.textContent = stressSymbols[this.stress];
        
        this.svg.appendChild(this.stressLabel);
      }
    }
  }
  
  /**
   * Calculate and return branching points for child branches
   * @param {boolean} isMobile - Whether the device is mobile
   * @returns {Array} Array of branching point objects
   */
  calculateBranchingPoints(isMobile) {
    const branchingPoints = [];
    
    // Simplify branching on mobile
    const isMobileSimplified = isMobile && this.depth > 1;
    
    // Make sure the trunk's first branches are substantial
    const isTrunkBranch = this.depth === 0;
    
    // Special treatment for the trunk - delay branching until fully grown
    if (isTrunkBranch) {
      // For the main trunk, create a secondary trunk segment before branching
      
      // Create a much longer, straight continuation of the trunk (secondary trunk segment)
      // This ensures a well-defined single trunk before branching
      branchingPoints.push({
        angle: -Math.PI / 2, // Exactly straight up
        length: this.length * 0.95, // Longer segment for better trunk height
        stress: 1,  // Normal stress
        isSecondaryTrunk: true // Mark as secondary trunk segment
      });
    }
    else if (this.depth === 1 && this.parentId) {
      // This is the secondary trunk segment (the child of the main trunk)
      
      // First, continue the trunk a bit more before branching
      // This creates a longer, well-defined single trunk
      if (this.isSecondaryTrunk) {
        // Create a third trunk segment for an even more defined trunk
        branchingPoints.push({
          angle: -Math.PI / 2, // Continue straight up
          length: this.length * 0.9, // Another trunk segment
          stress: 1,
          isSecondaryTrunk: true // Still part of the trunk
        });
        
        return branchingPoints; // Return early to ensure trunk grows before branching
      }
      
      // Now create the actual tree branches from this tertiary trunk segment
      
      // Left branch (unstressed)
      branchingPoints.push({
        angle: this.config.tree.initialAngle - this.config.tree.initialSpreadAngle, 
        length: this.length * this.config.tree.lengthReductionFactor * 0.9,
        stress: 0
      });
      
      // Create another straighter segment continuing upward (central branch)
      branchingPoints.push({
        angle: this.config.tree.initialAngle - this.config.tree.initialSpreadAngle * 0.2, // Slight angle
        length: this.length * this.config.tree.lengthReductionFactor * 1.1,
        stress: 1
      });
      
      // Right branch (stressed)
      branchingPoints.push({
        angle: this.config.tree.initialAngle + this.config.tree.initialSpreadAngle,
        length: this.length * this.config.tree.lengthReductionFactor * 0.9,
        stress: 2
      });
    } else {
      // Higher-level branches: Create 1-2 child branches with controlled angles
      
      // Determine how many branches to create based on depth
      // More at lower depths, fewer as we go up, and fewer on mobile
      const numBranches = isMobileSimplified ? 1 : 
                         (this.depth < 3) ? 2 : 
                         (this.depth < 5) ? (Math.random() > 0.3 ? 2 : 1) : // Increased probability of 2 branches
                         (Math.random() > 0.6 ? 1 : 2); // Occasionally still allow 2 branches at highest depths
      
      // Calculate length reduction - slightly more length retention for longer branches
      const lengthFactor = this.config.tree.lengthReductionFactor + (0.02 * this.depth);
      
      // Calculate branch angle spread - starts modest, increases with depth
      // The branchSpreadFactor controls how tree-like vs. divergent the structure is
      const spread = this.config.tree.minBranchAngle + 
                    (this.depth * this.config.tree.branchSpreadFactor * this.config.tree.minBranchAngle);
      
      if (numBranches === 1) {
        // Single branch - continue roughly in same direction with small variation
        const angleOffset = (Math.random() - 0.5) * (spread / 2);
        
        branchingPoints.push({
          angle: this.angle + angleOffset,
          length: this.length * lengthFactor * (0.95 + Math.random() * 0.1),
          stress: this.stress
        });
      } else {
        // Two branches with controlled spread
        const maxSpread = Math.min(spread, this.config.tree.maxBranchAngle);
        
        // Left branch
        branchingPoints.push({
          angle: this.angle - maxSpread,
          length: this.length * lengthFactor * (0.9 + Math.random() * 0.1),
          stress: Math.max(0, this.stress - (Math.random() > 0.6 ? 1 : 0))
        });
        
        // Right branch
        branchingPoints.push({
          angle: this.angle + maxSpread,
          length: this.length * lengthFactor * (0.9 + Math.random() * 0.1),
          stress: Math.min(2, this.stress + (Math.random() > 0.6 ? 1 : 0))
        });
      }
    }
    
    return branchingPoints;
  }
}
