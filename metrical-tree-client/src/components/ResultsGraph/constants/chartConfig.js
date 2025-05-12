// Default words per chunk/page
export const DEFAULT_CHUNK_SIZE = 8;

// Colors for different series/models
export const SERIES_COLORS = [
  '#4285F4', // Blue
  '#EA4335', // Red
  '#FBBC05', // Yellow
  '#34A853', // Green
  '#8E24AA', // Purple
  '#F06292', // Pink
  '#FF9800', // Orange
  '#00ACC1', // Teal
  '#7CB342', // Light Green
  '#5E35B1', // Deep Purple
  '#FF5722', // Deep Orange
  '#00897B', // Teal
  '#C0CA33', // Lime
  '#FFA000', // Amber
  '#455A64'  // Blue Gray
];

// Enhanced colors for normalized models
export const NORMALIZED_MODEL_COLORS = {
  bar: '#2979FF', // Brighter blue for bars
  barBorder: '#1565C0', // Darker blue for bar borders
  contourLine: '#FF1493', // Vibrant pink for contour line
  contourPoint: '#FF1493', // Matching pink for points
  contourPointBorder: '#FFFFFF' // White border for points
};

// Color schemes for part of speech (POS) tags
export const POS_COLORS = {
  // Nouns - blue family
  'NN': '#4285F4',
  'NNS': '#4285F4',
  'NNP': '#4285F4',
  'NNPS': '#4285F4',
  
  // Verbs - red family
  'VB': '#EA4335',
  'VBD': '#EA4335',
  'VBG': '#EA4335',
  'VBN': '#EA4335',
  'VBP': '#EA4335',
  'VBZ': '#EA4335',
  
  // Adjectives - yellow/gold
  'JJ': '#FBBC05',
  'JJR': '#FBBC05',
  'JJS': '#FBBC05',
  
  // Adverbs - green
  'RB': '#34A853',
  'RBR': '#34A853',
  'RBS': '#34A853',
  
  // Prepositions - purple
  'IN': '#9C27B0',
  
  // Conjunctions - orange
  'CC': '#FF9800',
  
  // Determiners - brown
  'DT': '#795548',
  
  // Pronouns - cyan
  'PRP': '#00BCD4',
  'PRP$': '#00BCD4',
  'WP': '#00BCD4',
  'WP$': '#00BCD4',
  
  // Modal verbs - blue-gray
  'MD': '#607D8B',
  'TO': '#607D8B',
  
  // Default for uncategorized
  'default': '#9E9E9E'
};

// Color schemes for lexical stress
export const STRESS_COLORS = {
  'yes': '#4CAF50',    // Stressed - green
  'no': '#F44336',     // Unstressed - red
  'ambig': '#FF9800',  // Ambiguous - orange
  'default': '#9E9E9E' // Default gray
};

// Available chunk sizes
export const CHUNK_SIZES = [5, 8, 12, 20];

// Context window size for very long inputs
export const CONTEXT_WINDOW_SIZE = 10;

// Threshold for considering an input "very long"
export const VERY_LONG_INPUT_THRESHOLD = 100;
