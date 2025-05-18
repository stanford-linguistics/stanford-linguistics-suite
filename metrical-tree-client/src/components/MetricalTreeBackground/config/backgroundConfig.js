/**
 * Configuration for the MetricalTreeBackground component
 */
import { STANFORD_COLORS } from '../constants';

export const backgroundConfig = {
  // General settings
  colors: {
    backgroundColor: 'transparent',
    gridMajorLine: '#e2e8f0',
    gridMinorLine: '#edf2f7'
  },
  
  // Grid settings
  grid: {
    enabled: true,
    majorSpacing: 100,
    minorSpacing: 20
  },
  
  // Particles effect settings
  particles: {
    enabled: true,
    count: 25,
    mobileCount: 15,
    colors: [STANFORD_COLORS.GOLD],
    maxSize: 3,
    minSize: 1,
    opacityMin: 0.2,
    opacityMax: 0.7
  },
  
  // Responsive settings
  responsive: {
    mobileThreshold: 768
  },
  
  // Animation settings
  animation: {
    active: true,
    animationKeyframes: `
      @keyframes fadeIn {
        0% { opacity: 0; transform: translateY(5px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      
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
    `
  },
  
  // Attribution
  attribution: {
    text: "From the Inaugural of George H.W. Bush, January 20, 1989",
    enabled: true
  }
};
