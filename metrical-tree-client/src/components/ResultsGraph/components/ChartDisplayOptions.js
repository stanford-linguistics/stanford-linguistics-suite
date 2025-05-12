import React, { useState } from 'react';
import { 
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  makeStyles,
  FormControlLabel,
  Switch,
  Box,
  Collapse,
  IconButton
} from '@material-ui/core';
import CrispTooltip from '../../CrispTooltip';
import {
  Tune as TuneIcon,
  ColorLens as ColorLensIcon,
  Timeline as TimelineIcon,
  Info as InfoIcon,
  ShowChart as ShowChartIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@material-ui/icons';
import { NORMALIZED_MODEL_COLORS } from '../constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(0.5, 0),
    },
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
      fontSize: '1.25rem',
      [theme.breakpoints.down('xs')]: {
        fontSize: '1.1rem',
        marginRight: theme.spacing(0.75),
      },
    },
    fontWeight: 500,
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing(1),
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
  optionsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      justifyContent: 'space-between',
      '& > *': {
        marginBottom: theme.spacing(1),
      },
    },
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  colorControl: {
    minWidth: 180,
    maxWidth: 280,
    width: 'auto',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
  },
  legendContainer: {
    marginTop: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    backgroundColor: theme.palette.background.paper,
    backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(245,245,245,0.3) 100%)',
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
    transition: 'all 0.3s ease',
  },
  legendHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
  },
  expandButton: {
    padding: 4,
    transition: 'transform 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.04)',
      transform: 'scale(1.1)',
    },
  },
  axisInfoContainer: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  axisInfoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    '&:last-child': {
      marginBottom: 0
    }
  },
  axisColorIndicator: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    marginRight: theme.spacing(1),
  },
  infoIcon: {
    fontSize: '1rem',
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    cursor: 'help',
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.9rem',
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.8rem',
    },
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
      gap: theme.spacing(1),
    },
    [theme.breakpoints.up('md')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    },
    [theme.breakpoints.up('lg')]: {
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: theme.spacing(1.5),
    },
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 0.75),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    transition: 'all 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    '&:hover': {
      backgroundColor: theme.palette.background.paper,
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    },
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(0.5, 0.75),
    },
  },
  colorBox: {
    width: 16,
    height: 16,
    marginRight: theme.spacing(1),
    borderRadius: '3px',
    boxShadow: `0 1px 3px ${theme.palette.action.hover}`,
    border: '1px solid rgba(0,0,0,0.1)',
    [theme.breakpoints.up('md')]: {
      width: 18,
      height: 18,
      marginRight: theme.spacing(1),
    },
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
  handleContourLineToggle,
  isNormalized
}) => {
  const classes = useStyles();
  const [legendExpanded, setLegendExpanded] = useState(true);
  
  const toggleLegend = () => {
    setLegendExpanded(!legendExpanded);
  };

  return (
    <div className={classes.container}>
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
                  handleContourLineToggle();
                }}
                color="primary"
                size="small"
              />
            }
            label={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon fontSize="small" style={{ marginRight: 4 }} />
                <Typography variant="body2">
                  Show Stress Contour
                  <CrispTooltip title="Displays the stress contour line (0-5 scale) overlaid on the chart">
                    <InfoIcon className={classes.infoIcon} />
                  </CrispTooltip>
                </Typography>
              </div>
            }
          />
        </div>
        

        
        
        {/* Dual Axis Information - Only show for normalized models */}
        {isNormalized && (
          <div className={classes.axisInfoContainer}>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              <ShowChartIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4 }} />
              Dual Axis Chart
              <CrispTooltip title="This chart uses two different scales to display both normalized values and stress contour">
                <InfoIcon className={classes.infoIcon} />
              </CrispTooltip>
            </Typography>
            
            <Box mt={1}>
              <div className={classes.axisInfoRow}>
                <div 
                  className={classes.axisColorIndicator} 
                  style={{ backgroundColor: NORMALIZED_MODEL_COLORS.bar }}
                />
                <Typography variant="body2">
                  Left Axis: Normalized Values (0-1 scale)
                </Typography>
              </div>
              
              <div className={classes.axisInfoRow}>
                <div 
                  className={classes.axisColorIndicator} 
                  style={{ backgroundColor: NORMALIZED_MODEL_COLORS.contourLine }}
                />
                <Typography variant="body2">
                  Right Axis: Stress Contour (0-5 scale)
                </Typography>
              </div>
            </Box>
          </div>
        )}

        {/* Color Legend - Only show if a color scheme is selected */}
        {colorScheme !== 'default' && colorScheme !== 'none' && colorLegendData && colorLegendData.length > 0 && (
          <div className={classes.legendContainer} style={{ maxHeight: legendExpanded ? '1000px' : '42px' }}>
            <div className={classes.legendHeader}>
              <Typography variant="caption" color="textSecondary" style={{ fontWeight: 500 }}>
                <ColorLensIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 4, fontSize: '1rem' }} />
                Color Legend ({colorLegendData.length} items)
              </Typography>
              <CrispTooltip title={legendExpanded ? "Collapse legend" : "Expand legend"}>
                <IconButton 
                  className={classes.expandButton}
                  onClick={toggleLegend}
                  size="small"
                  aria-expanded={legendExpanded}
                  aria-label="toggle color legend"
                >
                  {legendExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </CrispTooltip>
            </div>
            <Collapse in={legendExpanded} timeout="auto" unmountOnExit={false}>
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
            </Collapse>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartDisplayOptions;
