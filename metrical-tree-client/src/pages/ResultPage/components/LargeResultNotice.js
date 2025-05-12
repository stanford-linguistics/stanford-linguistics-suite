import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Card, Typography, Grid, Button } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import GetAppIcon from '@material-ui/icons/GetApp';

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(1),
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(255, 248, 225, 0.5)',
  },
  warningIcon: {
    fontSize: '2.5rem',
    color: '#f39c12',
    marginBottom: theme.spacing(2),
  },
  title: {
    fontWeight: 600,
    marginBottom: theme.spacing(1),
    color: '#2C3E50',
  },
  message: {
    marginBottom: theme.spacing(2),
    color: '#34495e',
  },
  downloadButton: {
    marginTop: theme.spacing(2),
    backgroundColor: '#44AB77',
    color: 'white',
    '&:hover': {
      backgroundColor: '#3a9066',
    },
  },
  downloadIcon: {
    marginRight: theme.spacing(1),
  },
  dataSize: {
    fontStyle: 'italic',
    color: '#7f8c8d',
    marginTop: theme.spacing(1),
  },
}));

const LargeResultNotice = ({ result }) => {
  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <Grid container direction="column" alignItems="center" spacing={1}>
        <Grid item>
          <WarningIcon className={classes.warningIcon} />
        </Grid>
        <Grid item>
          <Typography variant="h5" className={classes.title}>
            Large Result Dataset
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="body1" className={classes.message} align="center">
            This result contains {result.dataSize ? `${result.dataSize.toLocaleString()} rows of` : 'a large amount of'} data that exceeds browser limits.
            The detailed view has been disabled to prevent browser performance issues or crashes.
          </Typography>
          <Typography variant="body2" className={classes.message} align="center">
            For large datasets (over 5,000 rows), browser rendering can cause significant performance issues.
            Please use the download link below to access and analyze the complete results using spreadsheet software.
          </Typography>
          {result.dataSize && (
            <Typography variant="body2" className={classes.dataSize} align="center">
              Dataset size: <strong>{result.dataSize.toLocaleString()}</strong> rows
              {result.dataSize > 10000 && ' (very large)'}
            </Typography>
          )}
        </Grid>
        {result.link && (
          <Grid item>
            <Button
              variant="contained"
              className={classes.downloadButton}
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<GetAppIcon className={classes.downloadIcon} />}
            >
              Download Complete Results
            </Button>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

export default LargeResultNotice;
