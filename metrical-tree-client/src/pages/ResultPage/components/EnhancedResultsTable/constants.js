import { 
  TextFormat as TextFormatIcon,
  BarChart as BarChartIcon,
  FormatQuote as FormatQuoteIcon,
  TableChart as TableChartIcon
} from '@material-ui/icons';

// Available chunk sizes for the table (words per page)
export const TABLE_CHUNK_SIZES = [20, 50, 100, 200];

// Default row height for virtualization in pixels
export const DEFAULT_ROW_HEIGHT = 48;

// Default container height for the virtualized table
export const DEFAULT_CONTAINER_HEIGHT = 600;

// Default number of rows to render in the virtualization window
export const DEFAULT_ROWS_TO_RENDER = 20;

// Buffer rows to render above and below the visible area (to prevent flashing during scroll)
export const VIRTUALIZATION_BUFFER = 5;

// Tab configuration for the enhanced results table
export const TABLE_TABS = [
  {
    id: 'word-focused',
    label: 'Word-Focused',
    icon: FormatQuoteIcon,
    description: 'Focus on individual words and their properties'
  },
  {
    id: 'metric-analysis',
    label: 'Metric Analysis',
    icon: BarChartIcon,
    description: 'Compare and analyze different metrics'
  },
  {
    id: 'sentence-context',
    label: 'Sentence Context',
    icon: TextFormatIcon,
    description: 'View words in their sentence context'
  },
  {
    id: 'raw-data',
    label: 'Raw Data',
    icon: TableChartIcon,
    description: 'View all raw data in tabular format'
  }
];

/**
 * Columns for the raw data view
 */
export const RAW_DATA_COLUMNS = [
  { id: 'widx', label: 'Word Index', width: 90 },
  { id: 'sidx', label: 'Sent Index', width: 90 },
  { id: 'word', label: 'Word', width: 120 },
  { id: 'pos', label: 'POS', width: 80 },
  { id: 'lexstress', label: 'Stress', width: 80 },
  { id: 'seg', label: 'Segmentation', width: 150 },
  { id: 'dep', label: 'Dependency', width: 120 },
  { id: 'nsyll', label: 'Syllables', width: 90 },
  { id: 'nstress', label: 'Stress Count', width: 110 },
  { id: 'm1', label: 'M1', width: 90 },
  { id: 'm2a', label: 'M2a', width: 90 },
  { id: 'm2b', label: 'M2b', width: 90 },
  { id: 'mean', label: 'Mean', width: 90 },
  { id: 'norm_m1', label: 'Norm M1', width: 90 },
  { id: 'norm_m2a', label: 'Norm M2a', width: 90 },
  { id: 'norm_m2b', label: 'Norm M2b', width: 90 },
  { id: 'norm_mean', label: 'Norm Mean', width: 90 },
  { id: 'contour', label: 'Contour', width: 200, flexGrow: 1 },
  { id: 'sent', label: 'Sentence', width: 300, flexGrow: 1 },
];

/**
 * Column groups for the raw data view
 */
export const COLUMN_GROUPS = [
  {
    name: 'Basic Info',
    columns: ['widx', 'sidx', 'word', 'pos', 'lexstress'],
  },
  {
    name: 'Linguistic Properties',
    columns: ['seg', 'dep', 'nsyll', 'nstress'],
  },
  {
    name: 'Raw Metrics',
    columns: ['m1', 'm2a', 'm2b', 'mean'],
  },
  {
    name: 'Normalized Metrics',
    columns: ['norm_m1', 'norm_m2a', 'norm_m2b', 'norm_mean'],
  },
  {
    name: 'Context',
    columns: ['contour', 'sent'],
  },
];

/**
 * Color scheme for different parts of speech
 */
export const POS_COLORS = {
  // Nouns
  NN: '#4CAF50', // Common noun
  NNS: '#4CAF50', // Plural noun
  NNP: '#66BB6A', // Proper noun
  NNPS: '#66BB6A', // Plural proper noun
  
  // Verbs
  VB: '#2196F3', // Base form verb
  VBD: '#2196F3', // Past tense verb
  VBG: '#42A5F5', // Gerund/present participle
  VBN: '#42A5F5', // Past participle
  VBP: '#42A5F5', // Non-3rd person singular present
  VBZ: '#64B5F6', // 3rd person singular present
  
  // Adjectives
  JJ: '#FFC107', // Adjective
  JJR: '#FFC107', // Comparative adjective
  JJS: '#FFD54F', // Superlative adjective
  
  // Adverbs
  RB: '#FF9800', // Adverb
  RBR: '#FF9800', // Comparative adverb
  RBS: '#FFB74D', // Superlative adverb
  
  // Determiners
  DT: '#9E9E9E', // Determiner
  
  // Pronouns
  PRP: '#9C27B0', // Personal pronoun
  PRP$: '#9C27B0', // Possessive pronoun
  WP: '#AB47BC', // Wh-pronoun
  
  // Prepositions
  IN: '#607D8B', // Preposition
  
  // Conjunctions
  CC: '#795548', // Coordinating conjunction
  
  // Particles
  RP: '#FF5722', // Particle
  
  // Others
  CD: '#3F51B5', // Cardinal number
  EX: '#8D6E63', // Existential there
  FW: '#78909C', // Foreign word
  LS: '#90A4AE', // List item marker
  MD: '#673AB7', // Modal
  PDT: '#8BC34A', // Predeterminer
  POS: '#CDDC39', // Possessive ending
  TO: '#009688', // to
  UH: '#FF5252', // Interjection
  WDT: '#BA68C8', // Wh-determiner
  WRB: '#CE93D8', // Wh-adverb
  
  // Default for unknown POS
  default: '#9E9E9E'
};

/**
 * Color scheme for different stress statuses
 */
export const STRESS_COLORS = {
  yes: '#4CAF50', // Green for stressed
  no: '#F44336', // Red for unstressed
  ambig: '#FFC107', // Amber for ambiguous
  default: '#9E9E9E' // Grey for unknown
};

// Define custom export formats
export const EXPORT_FORMATS = [
  { 
    id: 'psycholinguistic', 
    label: 'Psycholinguistic Format',
    description: 'Export data in a format suitable for psycholinguistic research'
  },
  { 
    id: 'tei-xml', 
    label: 'TEI XML',
    description: 'Export as Text Encoding Initiative (TEI) XML format'
  },
  { 
    id: 'prosegen', 
    label: 'ProseGen Format',
    description: 'Export in a format compatible with ProseGen tools'
  },
  { 
    id: 'csv', 
    label: 'CSV',
    description: 'Export as comma-separated values'
  },
  { 
    id: 'json', 
    label: 'JSON',
    description: 'Export as JSON data'
  }
];