import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Link } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: '#fff',
    padding: '14px 100px',
    [theme.breakpoints.down('sm')]: { padding: '14px 16px' },
  },
  stanfordTitle: { fontSize: '1.5rem', marginTop: -2 },
  stanfordSubTitle: { fontSize: '0.875rem', marginTop: -10 },
  contactLabel: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: '0.625rem',
  },
  contactName: { fontSize: '0.75rem' },
  contactEmail: { fontSize: '0.75rem' },
  contactEmailLink: {
    color: '#8c1515',
    '&:hover': { cursor: 'pointer' },
  },
}));

const SecondaryFooter = () => {
  const classes = useStyles();

  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      className={classes.container}>
      <Grid item>
        <Typography className={classes.stanfordTitle}>
          Stanford
        </Typography>
        <Typography className={classes.stanfordSubTitle}>
          Department of Linguistics
        </Typography>
      </Grid>
      <Grid item>
        <Typography className={classes.contactLabel}>
          Contact Us
        </Typography>
        <Typography className={classes.contactName}>
          Arto Antilla
        </Typography>
        <Link
          href="mailto:anttila@stanford.edu"
          target="_blank"
          rel="noopener noreferrer"
          className={classes.contactEmailLink}>
          <Typography className={classes.contactEmail}>
            anttila@stanford.edu
          </Typography>
        </Link>
      </Grid>
    </Grid>
  );
};

export default SecondaryFooter;
