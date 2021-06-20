import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Grid, Link, Typography } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    height: 30,
    backgroundColor: '#8c1515',
    paddingLeft: 100,
    [theme.breakpoints.down('sm')]: { paddingLeft: 16 },
  },
  link: {
    color: 'white',
    '&:hover': { cursor: 'pointer', textDecoration: 'none' },
  },
  title: { fontSize: 20, fontWeight: 400 },
}));

const IdentityBar = () => {
  const classes = useStyles();

  return (
    <Grid container className={classes.container}>
      <Grid item xs={12}>
        <Link
          className={classes.link}
          onClick={() => window.open('https://www.stanford.edu/')}>
          <Typography className={classes.title}>
            Stanford University
          </Typography>
        </Link>
      </Grid>
    </Grid>
  );
};

export default IdentityBar;
