import React from 'react';
import { Typography, makeStyles } from '@material-ui/core';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import TrendingFlatIcon from '@material-ui/icons/TrendingFlat';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import TimelineIcon from '@material-ui/icons/Timeline';

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  patternName: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1),
  },
  icon: {
    marginLeft: theme.spacing(1),
    color: theme.palette.primary.main,
    fontSize: '1.5rem',
  },
}));

const ContourPatternIndicator = ({ pattern }) => {
  const classes = useStyles();
  
  const renderPatternIcon = () => {
    switch (pattern) {
      case 'Rising':
        return <TrendingUpIcon className={classes.icon} />;
      case 'Falling':
        return <TrendingDownIcon className={classes.icon} />;
      case 'Level':
        return <TrendingFlatIcon className={classes.icon} />;
      case 'Peak':
        return <ShowChartIcon className={classes.icon} />;
      case 'Valley':
        return <ShowChartIcon className={classes.icon} style={{ transform: 'rotate(180deg)' }} />;
      case 'Complex':
      default:
        return <TimelineIcon className={classes.icon} />;
    }
  };
  
  return (
    <div className={classes.container}>
      <Typography variant="subtitle1" className={classes.patternName}>
        Contour Pattern:
      </Typography>
      <Typography variant="subtitle1">
        {pattern || 'N/A'}
      </Typography>
      {renderPatternIcon()}
    </div>
  );
};

export default ContourPatternIndicator;
