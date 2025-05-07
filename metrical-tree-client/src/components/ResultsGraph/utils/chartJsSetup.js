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

// Log registration for debugging
console.log('[chartJsSetup] Chart.js components registered');

// Export the Chart instance if needed elsewhere
export const Chart = ChartJS;

// No need to wrap in a function if we're registering immediately
export default ChartJS;
