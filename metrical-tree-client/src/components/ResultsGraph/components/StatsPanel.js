import React from 'react';
import { 
  Typography, 
  Paper, 
  Grid,
  Tooltip,
  makeStyles 
} from '@material-ui/core';
import {
  Assessment as AssessmentIcon,
  Info as InfoIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  statsPanelContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.primary.light}`,
    boxShadow: theme.shadows[1],
  },
  statsHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  statsHeaderIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  statsHeaderTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
  },
  chunkBadge: {
    marginLeft: theme.spacing(1),
    padding: theme.spacing(0.25, 0.75),
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.spacing(1),
    fontSize: '0.7rem',
    fontWeight: 'bold',
  },
  statsSection: {
    marginBottom: theme.spacing(1.5),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.spacing(0.75),
  },
  statsSectionTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.75),
    color: theme.palette.primary.dark,
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    padding: theme.spacing(0.5, 0),
    '&:not(:last-child)': {
      borderBottom: `1px dashed ${theme.palette.divider}`,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  statLabel: {
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'monospace',
    fontWeight: 500,
  },
  infoIcon: {
    fontSize: '0.75rem',
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    cursor: 'help',
  },
  highlightedValue: {
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    borderRadius: theme.spacing(0.25),
    padding: theme.spacing(0, 0.5),
    fontWeight: 'bold',
  },
  positive: {
    color: theme.palette.success.main,
  },
  negative: {
    color: theme.palette.error.main,
  },
  neutral: {
    color: theme.palette.text.primary,
  }
}));

/**
 * Component for displaying linguistic statistics for the current chunk
 * 
 * @param {Object} props - Component props
 * @param {Object} props.stats - Statistics for the current chunk
 * @param {Object} props.patterns - Detected patterns in the data
 * @param {number} props.totalWords - Total number of words
 * @returns {JSX.Element} The stats panel component
 */
const StatsPanel = ({ stats, patterns, totalWords }) => {
  const classes = useStyles();
  
  if (!stats) return null;
  
  // Create a default structure for stats if any part is missing
  const { 
    averageStress = { m1: '0.00', m2a: '0.00', m2b: '0.00', mean: '0.00' }, 
    posDistribution = {}, 
    syllableCounts = { '1': 0, '2': 0, '3+': 0 }, 
    stressDistribution = { 'yes': { count: 0, percentage: 0 }, 'no': { count: 0, percentage: 0 }, 'ambig': { count: 0, percentage: 0 } }
  } = stats;

  const renderStressMetrics = () => (
    <div className={classes.statsSection}>
      <div className={classes.statsSectionTitle}>
        Stress Metrics
        <Tooltip title="Average stress values for different algorithms">
          <InfoIcon className={classes.infoIcon} />
        </Tooltip>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>
          m1 (position)
          <Tooltip title="Position-based stress metric: higher values indicate words in prominent positions">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </span>
        <span className={classes.statValue}>{averageStress.m1 || '0.00'}</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>
          m2a (prosody)
          <Tooltip title="Prosody-based stress metric: considers rhythm and phonological properties">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </span>
        <span className={classes.statValue}>{averageStress.m2a || '0.00'}</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>
          m2b (lexical)
          <Tooltip title="Lexical stress metric: based on dictionary-defined stress patterns">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </span>
        <span className={classes.statValue}>{averageStress.m2b || '0.00'}</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>
          mean
          <Tooltip title="Average of all stress metrics: overall stress prominence">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </span>
        <span className={classes.statValue}>{averageStress.mean || '0.00'}</span>
      </div>
    </div>
  );
  
  const renderDistributions = () => {
    // Get distribution items sorted by percentage (descending)
    const posItems = Object.entries(posDistribution)
      .sort((a, b) => b[1].percentage - a[1].percentage);
      
    const stressItems = Object.entries(stressDistribution)
      .sort((a, b) => b[1].percentage - a[1].percentage);
      
    return (
      <>
        <div className={classes.statsSection}>
          <div className={classes.statsSectionTitle}>
            Part of Speech Distribution
          </div>
          {posItems.length === 0 ? (
            <Typography variant="caption">No POS data available</Typography>
          ) : (
            posItems.map(([category, { count, percentage }]) => (
              <div key={category} className={classes.statItem}>
                <span className={classes.statLabel}>{category}</span>
                <span className={classes.statValue}>
                  {percentage}% ({count})
                </span>
              </div>
            ))
          )}
        </div>
        
        <div className={classes.statsSection}>
          <div className={classes.statsSectionTitle}>
            Stress Distribution
          </div>
          {stressItems.length === 0 ? (
            <Typography variant="caption">No stress data available</Typography>
          ) : (
            stressItems.map(([category, { count, percentage }]) => (
              <div key={category} className={classes.statItem}>
                <span className={classes.statLabel}>
                  {category === 'yes' ? 'Stressed' : 
                   category === 'no' ? 'Unstressed' : 
                   category === 'ambig' ? 'Ambiguous' : category}
                </span>
                <span className={classes.statValue}>
                  {percentage}% ({count})
                </span>
              </div>
            ))
          )}
        </div>
      </>
    );
  };
  
  const renderSyllableStats = () => (
    <div className={classes.statsSection}>
      <div className={classes.statsSectionTitle}>
        Syllable Counts
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>Monosyllabic</span>
        <span className={classes.statValue}>{syllableCounts['1']}</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>Disyllabic</span>
        <span className={classes.statValue}>{syllableCounts['2']}</span>
      </div>
      <div className={classes.statItem}>
        <span className={classes.statLabel}>3+ Syllables</span>
        <span className={classes.statValue}>{syllableCounts['3+']}</span>
      </div>
    </div>
  );
  
  const renderPatternDetection = () => (
    patterns && (
      <div className={classes.statsSection}>
        <div className={classes.statsSectionTitle}>
          Pattern Detection
          <Tooltip title="Automatic detection of stress patterns in the current chunk">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </div>
        
        {patterns.alternating !== undefined && (
          <div className={classes.statItem}>
            <span className={classes.statLabel}>Alternating pattern</span>
            <span className={classes.statValue}>
              {patterns.alternatingPercentage}%
              {patterns.alternating && (
                <span className={classes.highlightedValue}> (Strong)</span>
              )}
            </span>
          </div>
        )}
        
        {patterns.trend && (
          <div className={classes.statItem}>
            <span className={classes.statLabel}>Overall trend</span>
            <span className={`${classes.statValue} ${classes.highlightedValue}`}>
              {patterns.trend.charAt(0).toUpperCase() + patterns.trend.slice(1)}
            </span>
          </div>
        )}
      </div>
    )
  );
  
  return (
    <Paper className={classes.statsPanelContainer}>
      <div className={classes.statsHeader}>
        <AssessmentIcon fontSize="small" className={classes.statsHeaderIcon} />
        <Typography variant="subtitle2" className={classes.statsHeaderTitle}>
          Linguistic Statistics
          <span className={classes.chunkBadge}>Current Chunk</span>
        </Typography>
        <Tooltip title="All statistics are based on the current visible chunk of words. Use navigation controls to see statistics for other chunks.">
          <InfoIcon fontSize="small" className={classes.infoIcon} style={{ marginLeft: 'auto' }} />
        </Tooltip>
      </div>
      
      <Grid container spacing={2}>
        <Grid item xs={6}>
          {renderStressMetrics()}
          {renderPatternDetection()}
        </Grid>
        <Grid item xs={6}>
          {renderDistributions()}
          {renderSyllableStats()}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default StatsPanel;
