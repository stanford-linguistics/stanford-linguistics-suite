/**
 * Configuration for StressBarChart component
 */
import { STANFORD_COLORS } from '../constants';

export const barChartConfig = {
  animation: {
    barGrowSpeed: 0.1,
    initialDelay: 300,
    wordSpacing: 600,
  },
  
  layout: {
    barWidth: {
      desktop: 40,
      mobile: 25
    },
    barSpacing: {
      desktop: 15,
      mobile: 8
    },
    startX: 40,
    baseHeight: 40
  },
  
  style: {
    barOpacity: 0.9,
    indicatorSize: {
      width: 24,
      height: 18
    }
  },
  
  // Color scale for bars based on the bubble value (SPE number) using grayscale
  // Lower numbers (1) get darker gray (near black), higher numbers (5) get lighter gray
  getWordStressColor: (value) => {
    if (value === 0) return '#aaa'; // Medium gray for zero-stress words
    
    // Get the SPE value (bubble number) for this index
    const wordIndex = barChartConfig.stressValues.indexOf(value);
    const speValue = wordIndex !== -1 ? barChartConfig.bubbleValues[wordIndex] : 3;
    
    // Pure grayscale uses 0 saturation with varying lightness
    // Calculate lightness percentage - 15% for SPE value 1 (near-black), up to 55% for SPE value 5 (medium gray)
    // This compressed range ensures all values remain clearly visible
    const lightness = 15 + ((speValue - 1) * 10);
    
    // Return a grayscale color with varying lightness
    return `hsl(0, 0%, ${lightness}%)`;
  },
  
  // Sample linguistic data
  phrase: "Our challenges are great but our will is greater",
  stressValues: [1, 3, 2, 4, 3, 2, 4, 3, 5],
  bubbleValues: [5, 3, 4, 2, 3, 4, 2, 3, 1]
};
