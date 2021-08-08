import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Typography,
  Toolbar,
  Grid,
  Link,
} from '@material-ui/core';

import MainNav from '../MainNav';
import Settings from '../Settings';

const useStyles = makeStyles((theme) => ({
  appbar: {
    paddingLeft: 76,
    backgroundColor: '#fff',
    [theme.breakpoints.down('sm')]: { paddingLeft: 16 },
  },
  toolbar: {
    padding: '8px 0px 8px 2px',
    [theme.breakpoints.down('sm')]: { paddingLeft: 2 },
  },
  appNameLink: {
    '&:hover': { cursor: 'pointer', textDecoration: 'none' },
  },
  link: {
    color: '#000',
    '&:hover': { cursor: 'pointer', color: '#8c1515' },
  },
  appNameLinkLabel: { fontSize: '1.5rem', fontWeight: 'bold' },
  linkLabel: {
    fontSize: '0.875rem',
    paddingRight: 48,
    verticalAlign: 'bottom',
    fontWeight: 'bold',
  },
  icon: {
    color: '#000',
  },
  stanfordTitle: { color: '#8c1515' },
  metricalTreeTitle: { color: '#61615f', fontWeight: 'lighter' },
}));

const Appbar = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <AppBar position="static" className={classes.appbar}>
      <Toolbar className={classes.toolbar}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center">
          <Grid item xs={12}>
            <Grid container direction="row" alignItems="center">
              <Grid item>
                <MainNav />
              </Grid>
              <Grid item>
                <Link
                  className={classes.appNameLink}
                  onClick={() => history.push('/')}>
                  <Typography
                    className={classes.appNameLinkLabel}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}>
                    <span className={classes.stanfordTitle}>
                      Stanford{' '}
                    </span>
                    <span className={classes.metricalTreeTitle}>
                      | Metrical Tree
                    </span>
                  </Typography>
                </Link>
              </Grid>
            </Grid>
            <Grid container direction="row" alignItems="center">
              <Grid item xs={12}>
                <Grid
                  container
                  justifyContent="space-between"
                  alignItems="center">
                  <Grid item>
                    <Grid container>
                      <Grid item>
                        <Link
                          className={classes.link}
                          onClick={() => history.push('/')}>
                          <Typography className={classes.linkLabel}>
                            Home
                          </Typography>
                        </Link>
                      </Grid>
                      <Grid item>
                        <Link
                          className={classes.link}
                          onClick={() => history.push('/about')}>
                          <Typography className={classes.linkLabel}>
                            About
                          </Typography>
                        </Link>
                      </Grid>
                      <Grid item>
                        <Link
                          className={classes.link}
                          onClick={() => history.push('/compute')}>
                          <Typography className={classes.linkLabel}>
                            Compute
                          </Typography>
                        </Link>
                      </Grid>
                    </Grid>
                  </Grid>
                  <Grid item>
                    <Settings />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default Appbar;
