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

const AboutPage = () => {
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
          <Typography>ABOUT</Typography>
          <Typography>
            Lorem Ipsum is simply dummy text of the printing and
            typesetting industry. Lorem Ipsum has been the industry's
            standard dummy text ever since the 1500s, when an unknown
            printer took a galley of type and scrambled it to make a
            type specimen book. It has survived not only five
            centuries, but also the leap into electronic typesetting,
            remaining essentially unchanged. It was popularised in the
            1960s with the release of Letraset sheets containing Lorem
            Ipsum passages, and more recently with desktop publishing
            software like Aldus PageMaker including versions of Lorem
            Ipsum.
          </Typography>
        </Grid>
      </Grid>
      <Footer />
    </>
  );
};

export default AboutPage;
