import React from 'react';
import { useHistory } from 'react-router-dom';
import KeyboardArrowRightIcon from '@material-ui/icons/KeyboardArrowRight';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Button,
  Typography,
  Card,
  Link,
} from '@material-ui/core';

import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import background from '../../assets/images/homepageBg.jpg';

const useStyles = makeStyles((theme) => ({
  container: {
    height: 'calc(100vh - 236px)',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 322px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 360px)',
    },
  },
  card: {
    padding: 32,
    borderRadius: 0,
    margin: theme.spacing(4, 2),
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
    color: '#44AB77',
    '&:hover': { cursor: 'pointer', color: '#44AB77' },
  },
  linkLabel: {
    display: 'inline',
    fontWeight: 'bold',
    fontSize: '0.875rem',
  },
  button: {
    borderRadius: 32,
    display: 'block',
    marginTop: 32,
    backgroundColor: '#44AB77',
    '&:hover': {
      backgroundColor: '#3C8F65',
      textDecoration: 'underline',
      color: 'white',
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 8,
    },
  },
  buttonLabel: {
    color: 'white',
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
  },
}));

const Home = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <>
      <IdentityBar />
      <Appbar />
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
              Analyze Sentence Structure
            </Typography>
            <Typography>
              Metrical Tree generates a normal stress contour for
              English sentences. You can type in your own text from
              the keyboard or upload a text file.
            </Typography>
            <Link
              className={classes.link}
              onClick={() => history.push('/my-results')}>
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
                size="small"
                variant="contained"
                className={classes.button}
                onClick={() => history.push('/compute')}>
                <Typography className={classes.buttonLabel}>
                  Compute
                </Typography>
              </Button>
            </Grid>
          </Card>
        </Grid>
      </Grid>
      <SecondaryFooter />
      <PrimaryFooter />
    </>
  );
};

export default Home;
