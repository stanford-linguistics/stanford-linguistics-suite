import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography } from '@material-ui/core';

import IdentityBar from '../../components/IdentityBar';
import Footer from '../../components/Footer';
import Appbar from '../../components/Appbar';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 64,
    height: 'calc(100vh - 216px)',
    backgroundColor: 'white',
  },
}));

const MyResultsPage = () => {
  const classes = useStyles();

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justify="center"
        alignContent="center"
        className={classes.container}>
        <Grid item xs={10} sm={10} md={6} lg={4}>
          <Typography>MY RESULTS</Typography>
        </Grid>
      </Grid>
      <Footer />
    </>
  );
};

export default MyResultsPage;
