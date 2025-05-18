import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { Grid, Typography, Card, Link, Button, Box, useMediaQuery } from '@material-ui/core';
import useAvailableHeight from '../../hooks/useAvailableHeight';

import IdentityBar from 'components/IdentityBar';
import PrimaryFooter from 'components/PrimaryFooter';
import SecondaryFooter from 'components/SecondaryFooter';
import Appbar from 'components/Appbar';
import GridBackground from 'components/GridBackground/GridBackground';
import TreeGraph from 'components/TreeGraph/TreeGraph';
import StressBarChart from 'components/StressBarChart/StressBarChart';
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    overflow: 'hidden', // Prevent scrollbars
    minHeight: '100vh',
    paddingBottom: 0, // Remove extra padding at the bottom
    paddingTop: 0, // No need for padding with sticky header
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 'calc(100vh - 320px)',
    zIndex: 0,
    overflow: 'hidden',
    marginBottom: '230px', // Account for fixed footers
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 400px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 420px)',
    },
  },
  container: {
    position: 'relative',
    height: 'calc(100vh - 320px)',
    zIndex: 1,
    overflow: 'hidden', // Prevent scrollbars
    marginBottom: '230px', // Account for fixed footers
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 400px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 420px)',
    },
  },
  card: {
    padding: 32,
    borderRadius: 0,
    margin: 0,
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
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const availableHeight = useAvailableHeight();

  return (
    <>
      <div style={{ position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <IdentityBar />
        <Appbar />
      </div>
      <div className={classes.root}>
        {/* Background Grid */}
        <div className={classes.backgroundContainer}>
          <GridBackground 
            showParticles={false}
            backgroundColor="rgba(255,255,255,0.01)"
          />
        </div>
        
        {/* Main Content */}
        <div className={classes.contentWrapper}>
          <Grid
            container
            justifyContent="center"
            alignItems="flex-start"
            className={classes.container}
            spacing={2}>
            
            {/* Responsive layout - desktop vs mobile */}
            {isDesktop ? (
              // Desktop Layout - Side by side for tree and card when space permits
              <Grid container spacing={2}>
                {/* Left side - Tree Graph */}
                <Grid item xs={12} md={6} lg={7} style={{ position: 'relative', zIndex: 15, minHeight: '400px' }}>
                  <Box
                    style={{
                      position: 'relative',
                      height: '100%',
                      width: '100%',
                      overflow: 'visible',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <TreeGraph />
                  </Box>
                </Grid>
                
                {/* Right side - Info Card */}
                <Grid
                  item
                  xs={12}
                  md={6}
                  lg={5}
                  style={{
                    position: 'relative',
                    zIndex: 20,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
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
              
              {/* Bottom Section: Stress Bar Chart */}
              <Grid item xs={12} style={{ position: 'relative', zIndex: 15, minHeight: '220px' }}>
                <Box 
                  mt={2} 
                  style={{ 
                    position: 'relative', 
                    width: '100%',
                    overflow: 'visible'
                  }}
                >
                  <StressBarChart />
                </Box>
              </Grid>
              </Grid>
            ) : (
              // Mobile Layout - Stacked components
              <Grid container spacing={0}>
                {/* Top Section: Tree Graph */}
                <Grid item xs={12} style={{ position: 'relative', zIndex: 15, minHeight: '300px' }}>
                  <Box 
                    mb={3} 
                    style={{ 
                      position: 'relative', 
                      width: '100%',
                      overflow: 'visible'
                    }}
                  >
                    <TreeGraph />
                  </Box>
                </Grid>
                
                {/* Middle Section: Info Card */}
                <Grid 
                  item 
                  xs={12} 
                  sm={10}
                  style={{ 
                    position: 'relative',
                    zIndex: 20, 
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '30px'
                  }}
                >
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
                
                {/* Bottom Section: Stress Bar Chart */}
                <Grid item xs={12} style={{ position: 'relative', zIndex: 15, minHeight: '220px' }}>
                  <Box 
                    mt={2}
                    style={{ 
                      position: 'relative', 
                      width: '100%',
                      overflow: 'visible'
                    }}
                  >
                    <StressBarChart />
                  </Box>
                </Grid>
              </Grid>
            )}
          </Grid>
        </div>
      </div>
      <div style={{ position: 'fixed', bottom: '130px', left: 0, right: 0, zIndex: 1000 }}>
        <SecondaryFooter />
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000 }}>
        <PrimaryFooter />
      </div>
    </>
  );
};

export default Home;
