import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Card,
  Grid,
  Typography,
  alpha,
} from '@material-ui/core';
import TableChartIcon from '@material-ui/icons/TableChart';

const RawDataView = React.lazy(() => import('./views/RawDataView'));

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    overflow: 'visible', // Allow dropdowns to overflow the card
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1.5),
      marginTop: theme.spacing(1.5),
      borderRadius: theme.spacing(0.75),
    },
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#2C3E50',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      fontSize: '1rem',
      marginBottom: theme.spacing(1.5),
    },
  },
  titleIcon: {
    marginRight: theme.spacing(1),
    color: '#3498DB',
  },
  loadingPlaceholder: {
    height: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    borderRadius: theme.shape.borderRadius,
  },
  // Animation for view transitions
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeIn: {
    animation: '$fadeIn 0.3s ease-in-out',
  },
}));

/**
 * Enhanced Results Table component with raw data view
 * 
 * @param {Object} props
 * @param {Object} props.mergedResult - The result data from the API
 * @returns {JSX.Element}
 */
const EnhancedResultsTable = ({ mergedResult }) => {
  const classes = useStyles();
  
  return (
    <Card className={classes.card}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" className={classes.cardTitle}>
            <TableChartIcon className={classes.titleIcon} />
            Detailed Results
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <React.Suspense 
            fallback={
              <div className={classes.loadingPlaceholder}>
                <Typography>Loading view...</Typography>
              </div>
            }
          >    
            <div className={classes.fadeIn}>
              <RawDataView 
                data={mergedResult?.data ?? []} 
              />
            </div>
          </React.Suspense>
        </Grid>
      </Grid>
    </Card>
  );
};

export default EnhancedResultsTable;
