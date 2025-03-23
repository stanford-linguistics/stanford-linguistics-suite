import React from 'react';
import { 
  Typography, 
  Grid, 
  Paper, 
  Divider, 
  makeStyles,
  Chip
} from '@material-ui/core';
import {
  TextFields as TextFieldsIcon,
  Brightness7 as StressIcon,
  Code as CodeIcon,
  BarChart as MetricsIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  tooltipPaper: {
    padding: theme.spacing(1.5),
    maxWidth: 280,
    boxShadow: theme.shadows[5],
    pointerEvents: 'none',  // Ensure the tooltip doesn't interfere with chart interactions
    border: `2px solid ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
  },
  tooltipTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
    fontSize: '1rem',
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
  },
  tooltipValue: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    textAlign: 'right',
    backgroundColor: theme.palette.action.hover,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
  },
  metricsBadge: {
    marginRight: 'auto',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    fontSize: '0.65rem',
    height: 16,
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

/**
 * Rich data tooltip component for displaying linguistic information
 * 
 * @param {Object} props - Component props
 * @param {Object} props.data - The data point to display
 * @returns {JSX.Element} The tooltip component
 */
const DataTooltip = ({ data }) => {
  const classes = useStyles();
  
  if (!data) return null;
  
  // Extract word or primary value
  const word = data.word || data.primary || '';
  
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
  
  return (
    <Paper className={classes.tooltipPaper}>
      <Typography variant="subtitle1" className={classes.tooltipTitle}>
        <TextFieldsIcon className={classes.tooltipTitleIcon} />
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
      
      {/* Phonetic segments */}
      {data.seg && (
        <>
          <Typography className={classes.sectionHeading}>
            <CodeIcon className={classes.sectionIcon} />
            Phonetic Segments
          </Typography>
          <Typography variant="caption" className={classes.tooltipValue} style={{ display: 'block' }}>
            {data.seg}
          </Typography>
        </>
      )}
      
      {/* Stress metrics section */}
      {(data.m1 || data.m2a || data.m2b || data.mean) && (
        <>
          <Typography className={classes.sectionHeading}>
            <MetricsIcon className={classes.sectionIcon} />
            Stress Metrics
          </Typography>
          <Grid container spacing={1}>
            {/* m1 metric */}
            {data.m1 && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m1 (position):</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m1)}</Typography>
              </Grid>
            )}
            
            {/* m2a metric */}
            {data.m2a && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m2a (prosody):</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m2a)}</Typography>
              </Grid>
            )}
            
            {/* m2b metric */}
            {data.m2b && (
              <Grid item xs={6} className={classes.gridRow}>
                <Typography variant="caption" className={classes.tooltipLabel}>m2b (lexical):</Typography>
                <Typography variant="caption" className={classes.tooltipValue}>{formatValue(data.m2b)}</Typography>
              </Grid>
            )}
            
            {/* mean metric */}
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
      {(data.norm_m1 || data.norm_m2a || data.norm_m2b || data.norm_mean) && (
        <>
          <Typography className={classes.sectionHeading}>
            <StressIcon className={classes.sectionIcon} />
            Normalized Metrics
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
      
      {/* Context information */}
      {data.sent && (
        <>
          <Typography className={classes.sectionHeading}>
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
};

export default DataTooltip;
