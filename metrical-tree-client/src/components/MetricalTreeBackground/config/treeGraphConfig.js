/**
 * Configuration for TreeGraphVisualization component
 */
import { STANFORD_COLORS } from '../constants';

export const treeGraphConfig = {
  // Tree structure using level-based approach for more flexible connections
  treeData: {
    // Each level is an array of nodes
    levels: [
      // Level 0 (top) - branch point without a node
      [{x: 250, type: null}],
      
      // Level 1 - W node connects to left branch and "cal"
      [{x: 170, type: 'W'}],
      
      // Level 2 - S node on left branch only
      [{x: 130, type: 'S'}],
      
      // Level 3 - Bottom S/W nodes (new arrangement)
      [{x: 100, type: 'S'}, {x: 160, type: 'W'}, {x: 220, type: 'W'}, {x: 320, type: 'S'}],
      
      // Level 4 - Syllables (grouped closer together to read as "metrical tree")
      [{x: 100, text: 'me'}, {x: 160, text: 'tri'}, {x: 220, text: 'cal'}, {x: 320, text: 'tree'}]
    ],
    
    // Define connections between nodes at different levels
    connections: [
      // Top branch point to W node
      {from: {level: 0, index: 0}, to: {level: 1, index: 0}},
      
      // Top branch point directly to S node for "tree"
      {from: {level: 0, index: 0}, to: {level: 3, index: 3}},
      
      // W node in level 1 to S node in level 2 (left branch)
      {from: {level: 1, index: 0}, to: {level: 2, index: 0}},
      
      // W node in level 1 directly to W node for "cal"
      {from: {level: 1, index: 0}, to: {level: 3, index: 2}},
      
      // S node in level 2 to bottom S and W nodes (me, tri)
      {from: {level: 2, index: 0}, to: {level: 3, index: 0}},
      {from: {level: 2, index: 0}, to: {level: 3, index: 1}},
      
      // Bottom level connections to syllables (vertical lines)
      {from: {level: 3, index: 0}, to: {level: 4, index: 0}},
      {from: {level: 3, index: 1}, to: {level: 4, index: 1}},
      {from: {level: 3, index: 2}, to: {level: 4, index: 2}},
      {from: {level: 3, index: 3}, to: {level: 4, index: 3}}
    ]
  },
  
  // Animation settings
  animation: {
    // Time between revealing each level of the tree (ms)
    levelDelay: 1000,
    
    // Time to grow a connection line (ms)
    lineGrowDuration: 500,
    
    // Delay before starting animation (ms)
    initialDelay: 500,
    
    // Easing function for animations
    easing: 'cubic-bezier(0.42, 0, 0.58, 1)'
  },
  
  // Layout settings
  layout: {
    // Dimensions of the entire visualization
    width: 600, // Reduced for more compact appearance
    height: 360, // Reduced for more compact appearance
    
    // Spacing between tree levels (vertical)
    levelHeight: 70, // Reduced for tighter spacing
    
    // Spacing for leaf nodes (syllables at bottom)
    leafSpacing: 90, // Reduced for tighter spacing
    
    // Node sizes
    nodeSize: {
      radius: 14, // Reduced to make nodes smaller
      textSize: 11 // Reduced for better proportion
    },
    
    // Bottom text (syllables) style
    syllableText: {
      fontSize: 14 // Reduced for better proportion
    },
    
    // Margins around the visualization
    margin: {
      top: 40,
      right: 20,
      bottom: 40,
      left: 20
    }
  },
  
  // Style settings
  style: {
    // Colors
    colors: {
      strong: '#333333', // S nodes
      weak: '#777777',   // W nodes
      lines: '#555555',  // Connection lines
      text: '#000000',   // Text color
      syllables: '#000000' // Bottom syllables color
    },
    
    // Line styles
    lineStyle: {
      strokeWidth: 2, // Reduced for more subtle appearance
      dashArray: 'none'
    },
    
    // Animation appearance
    animatedLineStyle: {
      strokeDasharray: '5,5'
    }
  }
};
