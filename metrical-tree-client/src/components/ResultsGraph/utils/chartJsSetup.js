import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,  // Add Filler plugin for area charts
} from 'chart.js';

// Register all needed Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Set global defaults for Chart.js to improve rendering clarity
ChartJS.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
ChartJS.defaults.font.weight = '500'; // Slightly bolder fonts render better
ChartJS.defaults.responsive = true;
ChartJS.defaults.maintainAspectRatio = false;

// Improve high-DPI rendering
ChartJS.defaults.devicePixelRatio = Math.max(window.devicePixelRatio || 1, 2);

// Ensure crisp line rendering
ChartJS.defaults.elements.line.borderWidth = 2;
ChartJS.defaults.elements.line.tension = 0.35; // Add curve to lines
ChartJS.defaults.elements.point.radius = 4;
ChartJS.defaults.elements.point.borderWidth = 2;
ChartJS.defaults.elements.bar.borderWidth = 1;

// Disable animations for sharper initial render
ChartJS.defaults.animation = false;

// Improve rendering performance
ChartJS.defaults.plugins.tooltip.enabled = false; // We use custom tooltips
ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
ChartJS.defaults.plugins.legend.labels.boxWidth = 6;

// Log registration for debugging
console.log('[chartJsSetup] Chart.js components registered with enhanced rendering settings');

// Export the Chart instance if needed elsewhere
export const Chart = ChartJS;

// No need to wrap in a function if we're registering immediately
export default ChartJS;
