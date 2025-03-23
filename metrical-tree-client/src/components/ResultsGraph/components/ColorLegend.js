import React from 'react';
import { 
  Paper, 
  Typography, 
  makeStyles,
  Tooltip
} from '@material-ui/core';
import { 
  Palette as PaletteIcon,
  Info as InfoIcon
} from '@material-ui/icons';
import { POS_COLORS, STRESS_COLORS } from '../constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  legendContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    border: `1px solid ${theme.palette.primary.light}`,
    boxShadow: theme.shadows[1],
  },
  legendHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.palette.divider}`,
    paddingBottom: theme.spacing(1),
  },
  legendHeaderIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  legendTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
  },
  legendSubtitle: {
    fontSize: '0.875rem',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.75),
    color: theme.palette.primary.dark,
    display: 'flex',
    alignItems: 'center',
  },
  legendInfoIcon: {
    fontSize: '0.875rem',
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary,
    cursor: 'help',
  },
  legendContent: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
  legendCategory: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  legendCategoryTitle: {
    fontSize: '0.8rem',
    fontWeight: 500,
    marginBottom: theme.spacing(0.5),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '0.75rem',
    marginBottom: theme.spacing(0.5),
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  colorBox: {
    width: 18,
    height: 18,
    marginRight: theme.spacing(1),
    borderRadius: 4,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: `0 1px 2px ${theme.palette.action.selected}`,
  }
}));

/**
 * Component for displaying a color legend for the chart
 * 
 * @param {Object} props - Component props
 * @param {string} props.colorScheme - Current color scheme
 * @returns {JSX.Element} The color legend component
 */
const ColorLegend = ({ colorScheme }) => {
  const classes = useStyles();
  
  // If no special color scheme is selected, don't show a legend
  if (!colorScheme || colorScheme === 'none') {
    return null;
  }
  
  const renderPOSLegend = () => {
    // Group similar parts of speech together for better organization
    const groups = [
      { title: 'Nouns', items: [['NN/NNS', POS_COLORS.NN], ['NNP/NNPS', POS_COLORS.NNP]] },
      { title: 'Verbs', items: [['VB/VBD/VBZ', POS_COLORS.VB], ['VBG/VBN/VBP', POS_COLORS.VBG]] },
      { title: 'Adjectives/Adverbs', items: [['JJ/JJR/JJS', POS_COLORS.JJ], ['RB/RBR/RBS', POS_COLORS.RB]] },
      { title: 'Function Words', items: [
        ['IN (Preposition)', POS_COLORS.IN], 
        ['DT (Determiner)', POS_COLORS.DT],
        ['CC (Conjunction)', POS_COLORS.CC],
        ['PRP (Pronoun)', POS_COLORS.PRP],
        ['MD (Modal)', POS_COLORS.MD]
      ]}
    ];
    
    return (
      <>
        <Typography className={classes.legendSubtitle}>
          Part of Speech Categories
          <Tooltip title="Color-coding based on grammatical function">
            <InfoIcon className={classes.legendInfoIcon} />
          </Tooltip>
        </Typography>
        <div className={classes.legendContent}>
          {groups.map(group => (
            <div key={group.title} className={classes.legendCategory}>
              <Typography variant="caption" className={classes.legendCategoryTitle}>
                {group.title}
              </Typography>
              {group.items.map(([label, color]) => (
                <div key={label} className={classes.legendItem}>
                  <div 
                    className={classes.colorBox} 
                    style={{ backgroundColor: color }} 
                  />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </>
    );
  };
  
  const renderStressLegend = () => {
    const items = [
      ['Stressed', STRESS_COLORS.yes],
      ['Unstressed', STRESS_COLORS.no],
      ['Ambiguous', STRESS_COLORS.ambig],
      ['Unknown', STRESS_COLORS.default]
    ];
    
    return (
      <>
        <Typography className={classes.legendSubtitle}>
          Lexical Stress Patterns
          <Tooltip title="Color-coding based on pronunciation stress patterns">
            <InfoIcon className={classes.legendInfoIcon} />
          </Tooltip>
        </Typography>
        <div className={classes.legendContent}>
          {items.map(([label, color]) => (
            <div key={label} className={classes.legendItem}>
              <div 
                className={classes.colorBox} 
                style={{ backgroundColor: color }} 
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </>
    );
  };
  
  return (
    <Paper className={classes.legendContainer}>
      <div className={classes.legendHeader}>
        <PaletteIcon className={classes.legendHeaderIcon} />
        <Typography className={classes.legendTitle}>
          Color Legend
        </Typography>
        <Tooltip title="This legend explains the color-coding used in the chart to represent linguistic features" placement="top">
          <InfoIcon fontSize="small" style={{ marginLeft: 'auto' }} />
        </Tooltip>
      </div>
      {colorScheme === 'pos' ? renderPOSLegend() : renderStressLegend()}
    </Paper>
  );
};

export default ColorLegend;
