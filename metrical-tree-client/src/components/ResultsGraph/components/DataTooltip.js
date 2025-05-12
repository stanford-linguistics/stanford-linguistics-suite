import React, { memo } from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Divider, 
  makeStyles,
  Chip,
} from '@material-ui/core';
import {
  TextFields as TextFieldsIcon,
  Brightness7 as StressIcon,
  Code as CodeIcon,
  BarChart as MetricsIcon,
  ShowChart as ContourIcon,
  Info as InfoIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  tooltipPaper: {
    padding: theme.spacing(1.5),
    maxWidth: 300,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Sharper, more defined shadow
    pointerEvents: 'auto',  // Allow interaction with the tooltip
    border: `2px solid ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
    transform: 'translateZ(0)', // Force GPU acceleration
    backfaceVisibility: 'hidden', // Prevent blurry text during animations
    WebkitFontSmoothing: 'antialiased', // Improve text rendering on WebKit browsers
    MozOsxFontSmoothing: 'grayscale', // Improve text rendering on Firefox/macOS
    willChange: 'transform', // Hint to browser for optimization
  },
  tooltipTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
    fontSize: '1rem',
    WebkitFontSmoothing: 'antialiased', // Improve text rendering
    MozOsxFontSmoothing: 'grayscale',
  },
  tooltipTitleIcon: {
    marginRight: theme.spacing(0.5),
    fontSize: '1rem',
  },
  tooltipDivider: {
    margin: theme.spacing(1, 0),
    backgroundColor: theme.palette.primary.light,
  },
  tooltipLabel: {
    fontWeight: 'bold',
    fontSize: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  tooltipValue: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textAlign: 'right',
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
  },
  posChip: {
    height: 20,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
    backgroundColor: theme.palette.info.light,
    color: theme.palette.info.contrastText,
  },
  stressChip: {
    height: 20,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  contourChip: {
    height: 20,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
    backgroundColor: '#FF1493',
    color: '#FFFFFF',
  },
  speValueChip: {
    height: 20,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
    backgroundColor: '#ff9800',  // orange
    color: '#FFFFFF',
  },
  normalizedChip: {
    height: 20,
    fontSize: '0.65rem',
    marginLeft: theme.spacing(0.5),
    backgroundColor: '#2979FF',
    color: '#FFFFFF',
  },
  tooltipValueHighlighted: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textAlign: 'right',
    backgroundColor: 'rgba(255, 193, 7, 0.2)',  // amber highlight
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    fontWeight: 'bold',
    color: '#d32f2f'  // red text for emphasis
  },
  sectionHeading: {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.text.secondary,
  },
  sectionIcon: {
    fontSize: '0.9rem',
    marginRight: theme.spacing(0.5),
    color: theme.palette.primary.main,
  },
  gridRow: {
    marginBottom: theme.spacing(0.5),
  }
}));

// Format value for display - handle nulls and NaN values
const formatValue = (value) => {
  if (value === null || value === undefined || value === 'nan' || value === 'NaN') {
    return '—';
  }
  if (typeof value === 'number' || !isNaN(parseFloat(value))) {
    return parseFloat(value).toFixed(2);
  }
  return value;
};

/**
 * Rich data tooltip component for displaying linguistic information
 * Memoized to prevent unnecessary re-renders
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - The data point to display
 * @returns {JSX.Element} The tooltip component
 */
const DataTooltip = memo(({ data }) => {
  const classes = useStyles();
  
  if (!data) return null;
  
  
  // Extract word or primary value
  const word = data.word || data.primary || '';
  
  // Determine which sections to show based on available data
  const showBasicInfo = !!(data.nsyll || data.nstress || data.dep || data.widx);
  const showPhoneticSegments = !!data.seg;
  const showStressMetrics = !!(data.m1 || data.m2a || data.m2b || data.mean);
  const showNormalizedMetrics = !!(data.norm_m1 || data.norm_m2a || data.norm_m2b || data.norm_mean);
  const showContourValue = !!data.contourValue;
  const showContext = !!data.sent;
  
  return (
    <Paper className={classes.tooltipPaper}>
      {/* Title section - always shown */}
      <Typography variant="subtitle1" className={classes.tooltipTitle} component="div">
        {word}
        {data.pos && <Chip size="small" label={data.pos} className={classes.posChip} />}
        {data.lexstress && (
          <Chip 
            size="small" 
            label={data.lexstress === 'yes' ? 'Stressed' : 
                  data.lexstress === 'no' ? 'Unstressed' : 
                  data.lexstress === 'ambig' ? 'Ambig' : data.lexstress} 
            className={classes.stressChip} 
          />
        )}
      </Typography>
      
      <Divider className={classes.tooltipDivider} />
      
      {/* Basic linguistic information */}
      {showBasicInfo && (
        <Grid container spacing={1}>
          {data.nsyll && (
            <Grid item xs={6} className={classes.gridRow}>
              <Typography variant="caption" className={classes.tooltipLabel}>Syllables:</Typography>
              <Typography variant="caption" className={classes.tooltipValue}>{data.nsyll}</Typography>
            </Grid>
          )}
          
          {data.nstress && (
            <Grid item xs={6} className={classes.gridRow}>
              <Typography variant="caption" className={classes.tooltipLabel}>Stress Count:</Typography>
              <Typography variant="caption" className={classes.tooltipValue}>{data.nstress}</Typography>
            </Grid>
          )}
          
          {data.dep && (
            <Grid item xs={6} className={classes.gridRow}>
              <Typography variant="caption" className={classes.tooltipLabel}>Dependency:</Typography>
              <Typography variant="caption" className={classes.tooltipValue}>{data.dep}</Typography>
            </Grid>
          )}
          
          {data.widx && (
            <Grid item xs={6} className={classes.gridRow}>
              <Typography variant="caption" className={classes.tooltipLabel}>Word Index:</Typography>
              <Typography variant="caption" className={classes.tooltipValue}>{data.widx}</Typography>
            </Grid>
          )}
        </Grid>
      )}
      
      {/* Phonetic segments */}
      {showPhoneticSegments && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <CodeIcon className={classes.sectionIcon} />
            Phonetic Segments
          </Typography>
          <Typography variant="caption" className={classes.tooltipValue} style={{ display: 'block' }}>
            {data.seg}
          </Typography>
        </>
      )}
      
      {/* Raw SPE Values - only shown for raw models and when stress metrics are available */}
      {!data.isNormalized && showStressMetrics && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <InfoIcon className={classes.sectionIcon} />
            Raw SPE Values
            <Chip size="small" label="1 = Loudest" className={classes.speValueChip} style={{ marginLeft: '8px' }} />
          </Typography>
          <Grid container spacing={1}>
            {data.m1 && (
              <Grid item xs={12} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>SPE m1:</Typography>
                {data.m1_original ? (
                  <>
                    <Typography variant="caption" className={classes.tooltipValueHighlighted}>
                      Raw: {formatValue(data.m1_original)} | Grid: {formatValue(data.m1_transformed || data.m1)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" className={classes.tooltipValueHighlighted}>{formatValue(data.m1)}</Typography>
                )}
              </Grid>
            )}
            
            {data.m2a && (
              <Grid item xs={12} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>SPE m2a:</Typography>
                {data.m2a_original ? (
                  <>
                    <Typography variant="caption" className={classes.tooltipValueHighlighted}>
                      Raw: {formatValue(data.m2a_original)} | Grid: {formatValue(data.m2a_transformed || data.m2a)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" className={classes.tooltipValueHighlighted}>{formatValue(data.m2a)}</Typography>
                )}
              </Grid>
            )}
            
            {data.m2b && (
              <Grid item xs={12} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>SPE m2b:</Typography>
                {data.m2b_original ? (
                  <>
                    <Typography variant="caption" className={classes.tooltipValueHighlighted}>
                      Raw: {formatValue(data.m2b_original)} | Grid: {formatValue(data.m2b_transformed || data.m2b)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" className={classes.tooltipValueHighlighted}>{formatValue(data.m2b)}</Typography>
                )}
              </Grid>
            )}
            
            {data.mean && (
              <Grid item xs={12} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>SPE mean:</Typography>
                {data.mean_original ? (
                  <>
                    <Typography variant="caption" className={classes.tooltipValueHighlighted}>
                      Raw: {formatValue(data.mean_original)} | Grid: {formatValue(data.mean_transformed || data.mean)}
                    </Typography>
                  </>
                ) : (
                  <Typography variant="caption" className={classes.tooltipValueHighlighted}>{formatValue(data.mean)}</Typography>
                )}
              </Grid>
            )}
          </Grid>
        </>
      )}
      
      {/* Stress metrics section - only show for normalized models or contour points */}
      {showStressMetrics && (data.isNormalized || data.isContourPoint) && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <MetricsIcon className={classes.sectionIcon} />
            Stress Metrics
            {data.isContourPoint && (
              <Chip size="small" label="Contour" className={classes.contourChip} style={{ marginLeft: 'auto' }} />
            )}
          </Typography>
          <Grid container spacing={1}>
            {data.m1 && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m1:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m1)}</Typography>
              </Grid>
            )}
            
            {data.m2a && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m2a:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m2a)}</Typography>
              </Grid>
            )}
            
            {data.m2b && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m2b:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m2b)}</Typography>
              </Grid>
            )}
            
            {data.mean && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>mean:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.mean)}</Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}
      
      {/* Normalized values */}
      {showNormalizedMetrics && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <StressIcon className={classes.sectionIcon} />
            Normalized Metrics
            <Chip size="small" label="0-1 Scale" className={classes.normalizedChip} style={{ marginLeft: 'auto' }} />
          </Typography>
          <Grid container spacing={1}>
            {data.norm_m1 && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>norm_m1:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.norm_m1)}</Typography>
              </Grid>
            )}
            
            {data.norm_m2a && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>norm_m2a:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.norm_m2a)}</Typography>
              </Grid>
            )}
            
            {data.norm_m2b && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>norm_m2b:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.norm_m2b)}</Typography>
              </Grid>
            )}
            
            {data.norm_mean && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>norm_mean:</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.norm_mean)}</Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}
      
      {/* Contour information - special section for contour data points */}
      {showContourValue && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <ContourIcon className={classes.sectionIcon} />
            Stress Contour
            <Chip size="small" label="0-5 Scale" className={classes.contourChip} style={{ marginLeft: 'auto' }} />
          </Typography>
          <Grid container spacing={1}>
            <Grid item xs={12} className={classes.gridRow}>
              <Typography variant="caption" className={classes.tooltipLabel}>Contour Value:</Typography>
              <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.contourValue)}</Typography>
            </Grid>
          </Grid>
        </>
      )}
      
      {/* Context information - only show if available and not too long */}
      {showContext && data.sent.length < 200 && (
        <>
          <Typography className={classes.sectionHeading} component="div">
            <TextFieldsIcon className={classes.sectionIcon} />
            Context
          </Typography>
          <Typography variant="caption" style={{ fontSize: '0.7rem', display: 'block', fontStyle: 'italic' }}>
            "{data.sent.substring(0, 100)}..."
          </Typography>
        </>
      )}
    </Paper>
  );
});

export default DataTooltip;
