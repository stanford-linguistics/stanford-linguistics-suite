import React from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Typography, Box, Grid, Paper } from '@material-ui/core';
import CrispTooltip from '../../../../../../components/CrispTooltip';
import { POS_DESCRIPTIONS, STRESS_DESCRIPTIONS } from '../../constants';

const useStyles = makeStyles((theme) => ({
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'help',
    padding: theme.spacing(0.5, 1),
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  colorSwatch: {
    width: 16,
    height: 16,
    marginRight: theme.spacing(1),
    borderRadius: '3px',
    border: `1px solid ${theme.palette.divider}`, // Add border for light colors
    flexShrink: 0,
  },
  keyText: {
    fontSize: '0.8rem',
    whiteSpace: 'nowrap',
  },
  title: {
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: theme.spacing(1),
    width: '100%',
  }
}));

/**
 * Displays a color key legend for a given color map.
 * 
 * @param {Object} props
 * @param {string} props.title - The title for the legend section.
 * @param {Object} props.colorMap - An object mapping keys (e.g., POS tags) to color strings.
 * @returns {JSX.Element}
 */
const ColorKeyLegend = ({ title, colorMap, showMetrics = false }) => {
  const classes = useStyles();
  const theme = useTheme();
  const sortedKeys = Object.keys(colorMap).filter(key => key !== 'default').sort();

  const getDescription = (key) => {
    if (title === 'POS Tags') {
      return POS_DESCRIPTIONS[key] || 'Part of speech tag';
    }
    if (title === 'Metrics') {
      return 'The width of the bar indicates the relative value';
    }
    return STRESS_DESCRIPTIONS[key] || 'Stress pattern';
  };

  // Special rendering for metrics legend
  if (title === 'Metrics') {
    return (
      <Box mb={2}>
        <Typography variant="subtitle2" className={classes.title}>
          {title}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper variant="outlined" elevation={0} className={classes.legendItem}>
              <Box
                component="span"
                className={classes.colorSwatch}
                style={{ backgroundColor: theme.palette.info.light }}
              />
              <Typography variant="body2" className={classes.keyText}>
                Word Frequency
                <Typography variant="caption" color="textSecondary" display="block">
                  Bar width shows relative frequency
                </Typography>
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper variant="outlined" elevation={0} className={classes.legendItem}>
              <Box
                component="span"
                className={classes.colorSwatch}
                style={{ backgroundColor: theme.palette.success.light }}
              />
              <Typography variant="body2" className={classes.keyText}>
                Metric Values
                <Typography variant="caption" color="textSecondary" display="block">
                  Bar width shows relative strength
                </Typography>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box mb={2}>
      <Typography variant="subtitle2" className={classes.title}>
        {title}
      </Typography>
      <div className={classes.gridContainer}>
        {sortedKeys.map((key) => (
          <CrispTooltip key={key} title={getDescription(key)} placement="top">
            <Paper variant="outlined" elevation={0} className={classes.legendItem}>
              <Box
                component="span"
                className={classes.colorSwatch}
                style={{ backgroundColor: colorMap[key] }}
              />
              <Typography variant="body2" className={classes.keyText}>
                {key}
              </Typography>
            </Paper>
          </CrispTooltip>
        ))}
        {/* Optionally add default color if needed */}
        {colorMap.default && (
          <CrispTooltip title="Other/Unknown" placement="top">
            <Paper variant="outlined" elevation={0} className={classes.legendItem}>
              <Box
                component="span"
                className={classes.colorSwatch}
                style={{ backgroundColor: colorMap.default }}
              />
              <Typography variant="body2" className={classes.keyText}>
                Other
              </Typography>
            </Paper>
          </CrispTooltip>
        )}
      </div>
    </Box>
  );
};

export default ColorKeyLegend;
