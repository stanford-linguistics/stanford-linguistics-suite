import React from 'react';
import CloseIcon from '@material-ui/icons/Close';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  IconButton,
} from '@material-ui/core';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';

const useStyles = makeStyles((theme) => ({
  dialogTitle: { padding: '8px 8px 0 16px' },
  dialogTitleText: { fontWeight: 'bold' },
  dialogContent: { padding: '0 16px', height: 'auto' },
  dialogActions: { padding: 16, maxHeight: 40 },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 8,
    '&:hover': {
      backgroundColor: 'rgba(0,0,0,0)',
      textDecoration: 'underline',
    },
  },
}));

const DeleteConfirmationDialog = ({
  isOpen,
  setIsOpen,
  title,
  content,
  handleSubmit,
}) => {
  const classes = useStyles();

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} maxWidth="sm" onClose={handleClose}>
      <DialogTitle className={classes.dialogTitle}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center">
          <Grid item>
            <Typography className={classes.dialogTitleText}>
              {title}
            </Typography>
          </Grid>
          <Grid item>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent className={classes.dialogContent}>
        <Grid container>
          <Grid item>
            <Typography>{content}</Typography>
            <Typography>
              Are you sure you want to continue?
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className={classes.dialogActions}>
        <Grid container justifyContent="flex-end" alignItems="center">
          <Grid item>
            <Button
              onClick={handleClose}
              className={classes.cancelButton}>
              <Typography className={classes.buttonLabel}>
                Cancel
              </Typography>
            </Button>
          </Grid>
          <Grid item>
            <StyledButtonPrimary
              label={'Submit'}
              onClick={handleSubmit}
            />
          </Grid>
        </Grid>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
