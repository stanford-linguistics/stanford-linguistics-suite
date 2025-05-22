
import React from 'react';
import { useHistory } from 'react-router-dom';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Card, Link, Button, Box } from '@material-ui/core';
import IdentityBar from 'components/IdentityBar';
import PrimaryFooter from 'components/PrimaryFooter';
import SecondaryFooter from 'components/SecondaryFooter';
import Appbar from 'components/Appbar';

import TreeGraph from 'components/TreeGraph/TreeGraph';
import StressBarChart from 'components/StressBarChart/StressBarChart';

// import GridBackground from 'components/GridBackground/GridBackground';
{/* <div className={classes.backgroundContainer}>
//           <GridBackground 
//             showParticles={false}
//             backgroundColor="rgba(255,255,255,0.01)"
//           />
//         </div> */}
const useStyles = makeStyles((theme) => ({
   root: {
     backgroundColor: '#f2f2f2',
     minHeight: '100vh',
     position: 'relative',
     overflow: 'auto',
     paddingBottom: '10px',
     display: 'flex', // Enable flexbox for vertical centering
     flexDirection: 'column', // Stack children vertically
   },
   topBars: {position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000},
   contentWrapper: {
     flex: 1, // Take up available space
     display: 'flex',
     flexDirection: 'column',
     justifyContent: 'center', // Center content vertically
   },
   container: {
    padding: 20,
     [theme.breakpoints.down('sm')]: {
      marginTop: 0,
     },
   },
  card: {
     paddingRight: 80,
       [theme.breakpoints.down('sm')]: {
        padding: 20,
        paddingRight: 40
      },
  },
  title: {
    fontWeight: 'bold',
    fontSize: '2.25rem',
    marginBottom: 16,
    marginTop: -8,
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.25rem',
    },
  },
  text: {lineHeight: 2},
  link: {
    color: '#6a3f3f',
    '&:hover': {
      cursor: 'pointer',
      color: '#553333', 
    },
  },
  linkLabel: {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: '0.875rem',
  },
  homeButton: {
    marginTop: 8,
    padding: '8px 16px',
    borderRadius: 32,
    backgroundColor: '#8c1515',
    '&:hover': {
      backgroundColor: '#553333', 
      color: '#ffffff',
    },
  },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stressBarContainer: {
    position: 'relative', 
    zIndex: 15, 
    minHeight: '200px',
    paddingBottom: 20,
    
    [theme.breakpoints.down('xs')]: {
      paddingBottom: 15,
      minHeight: '180px',
    },
  },
  divider: {
    [theme.breakpoints.up('md')]: { 
      marginLeft: 80
  },
[theme.breakpoints.down('sm')]: { 
      marginLeft: 20,
      marginTop: 40
  }
},
  solid: {borderTop: '3px solid #bbb'},
  secondaryFooter: {
    position: 'static',
    marginTop: '5px',
    backgroundColor: '#f2f2f2',
  },
  primaryFooter: {
    position: 'static',
    backgroundColor: '#8c1515',
    marginTop: 0, 
  },
}));

const Home = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <>
      <div className={classes.topBars}>
        <IdentityBar />
        <Appbar />
      </div>
      <div className={classes.root}>
        <div className={classes.contentWrapper}>
          <Grid
            container
            justifyContent="center"
            className={classes.container}
            >
                <Grid item xs={12} lg={6}>
                  <Card className={classes.card}>
                    <Grid container alignItems="center" justifyContent="center">
                      <Grid item xs={12} sm={5} md={4}>
                        <TreeGraph  />
                      </Grid>
                      <Grid item xs={12} sm={7} md={8} >
                  <Typography className={classes.title}>
                    Analyze Sentence Prosody
                  </Typography>
                  <Typography className={classes.text}>
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
                      </Grid>
                    </Grid>
                    <Grid container alignContent='center' justifyContent='center'>
                      <Grid item xs={12} className={classes.divider}>
                        <hr class="solid" />
                        </Grid>
                    </Grid>
                  <Grid container>
                <Grid item xs={12} className={classes.stressBarContainer}>
                <Box mt={2}>
                  <StressBarChart />
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>
    </div>
    </div>
      <div className={classes.secondaryFooter}>
         <SecondaryFooter />
       </div>
       <div className={classes.primaryFooter}>
         <PrimaryFooter />
       </div> 

    </>
  );
};

export default Home;
