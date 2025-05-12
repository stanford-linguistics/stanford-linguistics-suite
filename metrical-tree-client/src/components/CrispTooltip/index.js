import { Tooltip, withStyles } from '@material-ui/core';

/**
 * CrispTooltip component that provides improved rendering for tooltips
 * with GPU acceleration and better font smoothing.
 * 
 * This component addresses the fuzzy tooltip issue by applying specific styles
 * that enhance the rendering quality.
 */
const CrispTooltip = withStyles((theme) => ({
  tooltip: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    fontSize: '0.75rem',
    border: `1px solid ${theme.palette.divider}`,
    padding: theme.spacing(1),
    maxWidth: 300,
    transform: 'translateZ(0)', // Force GPU acceleration
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    borderRadius: theme.shape.borderRadius,
  },
  arrow: {
    color: theme.palette.background.paper,
  },
}))(Tooltip);

export default CrispTooltip;
