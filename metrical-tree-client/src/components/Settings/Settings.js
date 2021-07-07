import React from 'react';
import SettingsIcon from '@material-ui/icons/Settings';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Tooltip,
  IconButton,
  Slide,
  Button,
  Typography,
} from '@material-ui/core';

const useStyles = makeStyles(() => ({
  icon: { color: '#8c1515' },
  settingsButton: { padding: 0, marginRight: 16 },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Settings = () => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          onClick={handleClickOpen}
          className={classes.settingsButton}>
          <SettingsIcon className={classes.icon} size="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleClose}>
        <DialogTitle>
          <Typography>Settings</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>Settings</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleClose} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settings;
