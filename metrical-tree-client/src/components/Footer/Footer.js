import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Link } from '@material-ui/core';
import footerStanfordLogo from '../../assets/images/footerStanfordLogo.png';

const useStyles = makeStyles((theme) => ({
  container: {
    backgroundColor: '#8c1515',
    paddingLeft: 100,
    paddingTop: 26,
    paddingBottom: 26,
    [theme.breakpoints.down('sm')]: { paddingLeft: 0 },
  },
  logoContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: 24,
    },
  },
  logo: {
    width: 113,
  },
  title: { textAlign: 'center' },
  linkContainer: {
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      justifyContent: 'center',
    },
    [theme.breakpoints.down('xs')]: {
      display: 'flex',
      justifyContent: 'flex-start',
    },
  },
  boldLinkLabel: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: '1.0625rem',
    marginRight: 20,
    lineHeight: 1.75,
    [theme.breakpoints.down('sm')]: {
      frontWeight: 'normal',
      fontSize: '0.9375rem',
    },
    [theme.breakpoints.down('xs')]: {
      lineHeight: 1.25,
    },
  },
  link: { color: 'white', '&:hover': { cursor: 'pointer' } },
  linkLabel: {
    color: 'white',
    marginRight: 20,
    lineHeight: 1.75,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
    },
    [theme.breakpoints.down('xs')]: {
      lineHeight: 1.25,
    },
  },
  copyright: {
    color: 'white',
    fontSize: '0.875rem',
    [theme.breakpoints.down('sm')]: {
      display: 'flex',
      justifyContent: 'center',
      marginTop: 16,
    },
  },
}));

const Footer = () => {
  const classes = useStyles();

  return (
    <Grid container direction="row" className={classes.container}>
      <Grid
        item
        xs={12}
        sm={12}
        md={2}
        lg={2}
        className={classes.logoContainer}>
        <img
          className={classes.logo}
          src={footerStanfordLogo}
          alt="Stanford University Logo"
        />
      </Grid>
      <Grid item xs={12} sm={12} md={10} lg={10}>
        <Grid container justify="center">
          <Grid item xs={5} sm={12} md={12} lg={12}>
            <Grid
              container
              direction="row"
              className={classes.linkContainer}>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open('https://www.stanford.edu/')
                  }>
                  <Typography className={classes.boldLinkLabel}>
                    Stanford Home
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://visit.stanford.edu/basics/index.html'
                    )
                  }>
                  <Typography className={classes.boldLinkLabel}>
                    Maps & Directions
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open('https://www.stanford.edu/search/')
                  }>
                  <Typography className={classes.boldLinkLabel}>
                    Search Stanford
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open('https://emergency.stanford.edu/')
                  }>
                  <Typography className={classes.boldLinkLabel}>
                    Emergency Info
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={5} sm={12} md={12} lg={12}>
            <Grid
              container
              direction="row"
              className={classes.linkContainer}>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://www.stanford.edu/site/terms/'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Terms of Use
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://www.stanford.edu/site/privacy/'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Privacy
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://uit.stanford.edu/security/copyright-infringement'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Copyright
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://adminguide.stanford.edu/chapter-1/subchapter-5/policy-1-5-4'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Trademarks
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://exploredegrees.stanford.edu/nonacademicregulations/nondiscrimination/'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Non-Discrimination
                  </Typography>
                </Link>
              </Grid>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() =>
                    window.open(
                      'https://www.stanford.edu/site/accessibility/'
                    )
                  }>
                  <Typography className={classes.linkLabel}>
                    Accessibility
                  </Typography>
                </Link>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12}>
            <Typography className={classes.copyright}>
              &copy; Stanford University. &nbsp; Stanford, California
              94305.
            </Typography>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default Footer;
