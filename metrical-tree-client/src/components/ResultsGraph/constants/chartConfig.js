// Default words per chunk/page
export const DEFAULT_CHUNK_SIZE = 8;

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

// Group POS tags into categories for filtering
export const POS_CATEGORIES = {
  'Nouns': ['NN', 'NNS', 'NNP', 'NNPS'],
  'Verbs': ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ'],
  'Adjectives': ['JJ', 'JJR', 'JJS'],
  'Adverbs': ['RB', 'RBR', 'RBS'],
  'Prepositions': ['IN'],
  'Conjunctions': ['CC'],
  'Determiners': ['DT'],
  'Pronouns': ['PRP', 'PRP$', 'WP', 'WP$']
};

// Available chunk sizes
export const CHUNK_SIZES = [5, 8, 12, 20];

// Context window size for very long inputs
export const CONTEXT_WINDOW_SIZE = 10;

// Threshold for considering an input "very long"
export const VERY_LONG_INPUT_THRESHOLD = 100;
