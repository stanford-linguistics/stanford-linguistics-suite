import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  AppBar,
  Typography,
  Toolbar,
  Grid,
  Link,
  Hidden,
} from '@material-ui/core';

import MainNav from '../MainNav';
import Settings from '../Settings';

const useStyles = makeStyles((theme) => ({
  appbar: {
    marginTop: 30,
    paddingLeft: 76,
    backgroundColor: '#158c8c',
    [theme.breakpoints.down('sm')]: { padding: 0 },
  },
  toolbar: { [theme.breakpoints.down('sm')]: { paddingLeft: 2 } },
  link: {
    color: 'white',
    '&:hover': { cursor: 'pointer' },
  },
  linkLabel: { paddingRight: 24, verticalAlign: 'bottom' },
  icon: { color: 'white' },
}));

const Appbar = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <AppBar className={classes.appbar}>
      <Toolbar className={classes.toolbar}>
        <Grid container justify="space-between" alignItems="center">
          <Grid item>
            <Grid container direction="row" alignItems="center">
              <Hidden only={['md', 'lg', 'xl']}>
                <Grid item>
                  <MainNav />
                </Grid>
              </Hidden>
              <Grid item>
                <Link
                  className={classes.link}
                  onClick={() => history.push('/')}>
                  <Typography
                    className={classes.linkLabel}
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}>
                    Metrical Tree
                  </Typography>
                </Link>
              </Grid>
              <Hidden only={['xs', 'sm']}>
                <>
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
                  <Grid item>
                    <Link
                      className={classes.link}
                      onClick={() => history.push('/my-results')}>
                      <Typography className={classes.linkLabel}>
                        My Results
                      </Typography>
                    </Link>
                  </Grid>
                </>
              </Hidden>
            </Grid>
          </Grid>
          <Grid item>
            <Settings />
          </Grid>
        </Grid>
      </Toolbar>
    </AppBar>
  );
};

export default Appbar;
