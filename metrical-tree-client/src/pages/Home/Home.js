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
import Footer from '../../components/Footer';
import Appbar from '../../components/Appbar';
import background from '../../assets/images/homepageBg.jpg';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 64,
    backgroundColor: 'white',
    backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    [theme.breakpoints.down('sm')]: {
      marginTop: 56,
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 56,
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
    [theme.breakpoints.down('xs')]: {
      fontSize: '1.25rem',
    },
  },
  linkContainer: { marginTop: 16 },
  link: {
    color: '#158c8c',
    fontWeight: 'bold',
    '&:hover': { cursor: 'pointer', color: '#158c8c' },
  },
  linkLabel: {
    display: 'inline',
  },
  button: {
    borderRadius: 0,
    display: 'block',
    marginTop: 32,
    backgroundColor: '#8c1515',
    '&:hover': {
      backgroundColor: '#2e2d29',
      textDecoration: 'underline',
      color: 'white',
    },
    [theme.breakpoints.down('xs')]: {
      marginTop: 8,
    },
  },
  buttonLabel: {
    color: 'white',
    textTransform: 'capitalize',
    fontSize: '1.25rem',
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
        justify="center"
        alignContent="center"
        className={classes.container}>
        <Grid item xs={11} sm={10} md={6} lg={4}>
          <Card className={classes.card}>
            <Typography className={classes.subtitle}>
              Lorem Ipsum is simply dummy text of the printing and
              typesetting
            </Typography>
            <Typography className={classes.title}>
              Lorem Ipsum is simply dummy
            </Typography>
            <Typography>
              Lorem Ipsum is simply dummy text of the printing and
              typesetting industry. Lorem Ipsum has been the
              industry's standard dummy text ever since the 1500s,
            </Typography>
            <Link
              className={classes.link}
              onClick={() => history.push('/my-results')}>
              <Grid container className={classes.linkContainer}>
                <Grid item>
                  <Typography className={classes.linkLabel}>
                    My Results
                  </Typography>
                </Grid>
                <Grid item>
                  <KeyboardArrowRightIcon />
                </Grid>
              </Grid>
            </Link>
            <Button
              variant="contained"
              className={classes.button}
              onClick={() => history.push('/compute')}>
              <Typography className={classes.buttonLabel}>
                Compute
              </Typography>
            </Button>
          </Card>
        </Grid>
      </Grid>
      <Footer />
    </>
  );
};

export default Home;
