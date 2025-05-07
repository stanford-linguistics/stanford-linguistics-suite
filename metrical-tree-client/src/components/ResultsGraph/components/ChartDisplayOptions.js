import React from 'react';
import { 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  makeStyles,
  FormControlLabel,
  Switch,
  Divider
} from '@material-ui/core';
import {
  Tune as TuneIcon,
  ColorLens as ColorLensIcon,
  Timeline as TimelineIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginTop: theme.spacing(4),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
      fontSize: '1.25rem',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  optionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(3),
  },
  colorControl: {
    minWidth: 200,
    maxWidth: 300,
    width: '100%',
  },
  legendContainer: {
    marginTop: theme.spacing(3),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.75, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transform: 'translateY(-1px)',
    },
  },
  colorBox: {
    width: 20,
    height: 20,
    marginRight: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: `0 1px 3px ${theme.palette.action.hover}`,
  },
}));

/**
 * Component for chart display options including color scheme selection and legend
 */
const ChartDisplayOptions = ({
  colorScheme,
  handleColorSchemeChange,
  colorOptions,
  colorLegendData,
  showContourLine,
  handleContourLineToggle
}) => {
  const classes = useStyles();

  return (
    <Paper className={classes.container}>
      <div className={classes.header}>
        <TuneIcon fontSize="small" />
        <Typography variant="subtitle2">Chart Display Options</Typography>
      </div>

      <div className={classes.content}>
        <div className={classes.optionsRow}>
          {/* Color Scheme Selector */}
          <FormControl className={classes.colorControl} size="small">
            <InputLabel id="color-scheme-label">
              <ColorLensIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Color By
            </InputLabel>
            <Select
              labelId="color-scheme-label"
              id="color-scheme"
              value={colorScheme}
              onChange={handleColorSchemeChange}
            >
              {colorOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {/* Contour Line Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={showContourLine}
                onChange={(e) => {
                  console.log('[DEBUG-CONTOUR] Switch toggled in component:', e.target.checked);
                  handleContourLineToggle();
                }}
                color="primary"
                size="small"
              />
            }
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon fontSize="small" style={{ marginRight: 4 }} />
                <Typography variant="body2">Show Stress Contour</Typography>
              </div>
            }
          />
        </div>
        
        <Divider style={{ margin: '8px 0' }} />

        {/* Color Legend - Only show if a color scheme is selected */}
        {colorScheme !== 'default' && colorScheme !== 'none' && colorLegendData && colorLegendData.length > 0 && (
          <div className={classes.legendContainer}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Color Legend
            </Typography>
            <div className={classes.legendGrid}>
              {colorLegendData.map((item, index) => (
                <div key={index} className={classes.legendItem}>
                  <div 
                    className={classes.colorBox} 
                    style={{ backgroundColor: item.color }}
                  />
                  <Typography variant="body2">
                    {item.label}
                  </Typography>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Paper>
  );
};

export default ChartDisplayOptions;
