import React, { useState, Fragment } from 'react';
import clsx from 'clsx';
import { useHistory } from 'react-router-dom';
import MenuIcon from '@material-ui/icons/Menu';
import HomeIcon from '@material-ui/icons/Home';
import InfoIcon from '@material-ui/icons/Info';
import BarChartIcon from '@material-ui/icons/BarChart';
import AccountTreeIcon from '@material-ui/icons/AccountTree';
import { makeStyles } from '@material-ui/core/styles';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
} from '@material-ui/core';

const useStyles = makeStyles({
  list: { width: 250 },
  fullList: { width: 'auto' },
  menuButton: { padding: 0, marginRight: 16 },
});

const MainNav = () => {
  const classes = useStyles();
  const history = useHistory();
  const [state, setState] = useState({ left: false });

  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const handleClick = (index) => {
    if (index === 0) {
      history.push('/');
    }
    if (index === 1) {
      history.push('/about');
    }
    if (index === 2) {
      history.push('/compute');
    }
    if (index === 3) {
      history.push('/compute');
    }
  };

  const list = (anchor) => (
    <div
      className={clsx(classes.list, {
        [classes.fullList]: anchor === 'top' || anchor === 'bottom',
      })}
      role="presentation"
      onClick={toggleDrawer(anchor, false)}
      onKeyDown={toggleDrawer(anchor, false)}>
      <List>
        {['Home', 'About', 'Compute', 'Results'].map(
          (text, index) => (
            <ListItem
              button
              key={text}
              onClick={() => handleClick(index)}>
              <ListItemIcon>
                {index === 0 && <HomeIcon />}
                {index === 1 && <InfoIcon />}
                {index === 2 && <BarChartIcon />}
                {index === 3 && <AccountTreeIcon />}
              </ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          )
        )}
      </List>
    </div>
  );

  return (
    <Fragment>
      <IconButton
        onClick={toggleDrawer('left', true)}
        className={classes.menuButton}>
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor={'left'}
        open={state.left}
        onClose={toggleDrawer('left', false)}>
        {list('left')}
      </Drawer>
    </Fragment>
  );
};

export default MainNav;
