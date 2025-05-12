/**
 * Default configuration values for MetricalTreeBackground component
 */

// Stanford brand colors
export const STANFORD_COLORS = {
  RED: '#8C1515',
  LIGHT_RED: '#B83A4B',
  DARK_RED: '#820000',
  BLACK: '#2E2D29',
  COOL_GREY: '#4D4F53',
  LIGHT_GREY: '#F4F4F4',
  BROWN: '#5E3032',
  CLAY: '#8D3C1E',
  GOLD: '#B6A379',
};

// Default configuration for the component
export const DEFAULT_CONFIG = {
  grid: {
    enabled: true,
    majorLine: '#e2e8f0',
    minorLine: '#edf2f7',
    majorSpacing: 100,
    minorSpacing: 20,
  },
  tree: {
    baseColor: '#4a5568',
    stressColors: [
      STANFORD_COLORS.GOLD, // Unstressed
      STANFORD_COLORS.CLAY, // Normal
      STANFORD_COLORS.RED,  // Stressed
    ],
    maxDepth: 7, // Increased from 6 to allow more branching
    growthSpeed: 3,
    // Branch structure settings
    initialAngle: -Math.PI / 2, // Straight up
    initialSpreadAngle: Math.PI / 5, // Initial angle spread from trunk
    lengthReductionFactor: 0.90, // Increased to make branches longer
    widthReductionFactor: 0.80, // Increased to make branches thicker
    // Size settings
    minLength: 20,
    maxInitialLength: 200, // Increased for more prominent tree
    minInitialWidth: 18,   // Increased trunk width
    // Trunk settings
    guaranteedTrunkLength: 30, // Significantly increased for better visibility
    guaranteedTrunkWidth: 22,   // Increased width for better prominence
    // Branching parameters
    branchSpreadFactor: 0.65, // How much branches fan out
    minBranchAngle: Math.PI / 12, // Minimum angle between branches
    maxBranchAngle: Math.PI / 6,  // Maximum angle between branches
    // Pulsing effect
    pulseEnabled: true,
    pulseMinOpacity: 0.7, // Higher minimum opacity for subtler effect
    pulseMaxOpacity: 0.9, // Lower maximum opacity for less contrast
    pulseDuration: 5000, // milliseconds - much slower pulse
  },
  animation: {
    active: true,
    growthDelay: 80,
    regenerateTime: 40000, // 40 seconds
    boundaryCheck: true,   // Check if branches are within viewport
    autoRegenerate: true,  // Auto regenerate the tree after a period
  },
  particles: {
    enabled: true,
    count: 25,
    maxSize: 3,
    minSize: 1,
    colors: [
      STANFORD_COLORS.GOLD,
      STANFORD_COLORS.CLAY,
      STANFORD_COLORS.RED,
      STANFORD_COLORS.BROWN,
    ],
    speed: 0.5,
    opacityMin: 0.2,
    opacityMax: 0.7,
  },
  responsive: {
    enabled: true,
    scaleFactor: 1.0,
    minScaleFactor: 0.6, // Adjusted from 0.5
    maxScaleFactor: 2.5, // Adjusted from 2.0 to allow larger trees
    mobileThreshold: 768,
    mobileMaxDepth: 4,
    mobileParticleCount: 15,
  },
};
