import React from 'react';
import { useHistory } from 'react-router-dom';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Card, Link, Button } from '@material-ui/core';

import IdentityBar from 'components/IdentityBar';
import PrimaryFooter from 'components/PrimaryFooter';
import SecondaryFooter from 'components/SecondaryFooter';
import Appbar from 'components/Appbar';
import MetricalTreeBackground from 'components/MetricalTreeBackground/MetricalTreeBackgroundAdapter';
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    overflow: 'hidden', // Prevent scrollbars
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 'calc(100vh - 316px)',
    zIndex: 0,
    overflow: 'hidden', // Prevent scrollbars
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 402px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 421px)',
    },
  },
  container: {
    position: 'relative',
    height: 'calc(100vh - 316px)',
    zIndex: 1,
    overflow: 'hidden', // Prevent scrollbars
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 402px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 421px)',
    },
  },
  card: {
    padding: 32,
    borderRadius: 0,
    margin: theme.spacing(4, 2),
    backgroundColor: '#f2f2f2',
    [theme.breakpoints.down('xs')]: {
      padding: 16,
    },
  },
  subtitle: {
    fontWeight: 'bold',
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.875rem',
    },
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1.75rem',
    marginBottom: 16,
    marginTop: -8,
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.25rem',
    },
  },
  link: {
    color: '#6a3f3f',
    '&:hover': {
      cursor: 'pointer',
      color: '#553333', // Darker shade of #6a3f3f for hover
    },
  },
  linkLabel: {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: '0.875rem',
  },
  homeButton: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: '#6a3f3f',
    '&:hover': {
      backgroundColor: '#553333', // Darker shade of #6a3f3f for hover
      color: '#ffffff',
    },
  },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    color: '#ffffff',
  },
}));

const Home = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <>
      <IdentityBar />
      <Appbar />
      <div className={classes.root}>
        <div className={classes.backgroundContainer}>
          <MetricalTreeBackground 
            showControls={false}
            animation={{
              autoRegenerate: true,
              active: true,
            }}
            tree={{
              maxDepth: 5,
              pulseEnabled: true,
              pulseMinOpacity: 0.7,
              pulseMaxOpacity: 0.9,
              pulseDuration: 5000,
            }}
            particles={{
              count: 20,
            }}
          />
        </div>
        <Grid
          container
          justifyContent="flex-start"
          alignContent="center"
          className={classes.container}>
        <Grid item xs={1} sm={1} md={1} lg={2}></Grid>
        <Grid item xs={10} sm={10} md={6} lg={4}>
          <Card className={classes.card}>
            <Typography className={classes.subtitle}>
              Metrical Tree
            </Typography>
            <Typography className={classes.title}>
              Analyze Sentence Prosody
            </Typography>
            <Typography>
              Metrical Tree generates a normal stress contour for
              English sentences. You can type in your own text from
              the keyboard or upload a text file.
            </Typography>
            <Link
              className={classes.link}
              onClick={() => history.push('/about')}>
              <Grid container>
                <Grid item>
                  <Typography className={classes.linkLabel}>
                    Learn More
                  </Typography>
                </Grid>
                <Grid item>
                  <KeyboardArrowRightIcon />
                </Grid>
              </Grid>
            </Link>
            <Grid container justifyContent="flex-end">
              <Button
                className={classes.homeButton}
                onClick={() => history.push('/compute')}>
                <Typography className={classes.buttonLabel}>Compute</Typography>
              </Button>
            </Grid>
          </Card>
        </Grid>
        </Grid>
      </div>
      <SecondaryFooter />
      <PrimaryFooter />
    </>
  );
};

export default Home;
