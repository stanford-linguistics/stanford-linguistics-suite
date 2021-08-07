import React from 'react';
import { useForm, Controller } from 'react-hook-form';
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
  Select,
  MenuItem,
} from '@material-ui/core';

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
  submitButton: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: '#44AB77',
    '&:hover': {
      backgroundColor: '#3C8F65',
      textDecoration: 'underline',
      color: 'white',
    },
  },
  select: { minWidth: 300, width: 'auto' },
}));

const AddGraphDialog = ({ isOpen, setIsOpen }) => {
  const classes = useStyles();

  const { handleSubmit, control } = useForm();

  // TODO: Connection on create graph
  const onSubmit = (data) => console.log(data);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} maxWidth="sm" onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogTitle className={classes.dialogTitle}>
          <Grid
            container
            justifyContent="space-between"
            alignItems="center">
            <Grid item>
              <Typography className={classes.dialogTitleText}>
                Delete Computation
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
              <section>
                <label>
                  <Typography>Model</Typography>
                </label>
                <Controller
                  render={({ field }) => (
                    <Select
                      {...field}
                      className={classes.select}
                      variant="outlined"
                      margin="dense"
                      fullWidth>
                      {/* TODO: Handle model options */}
                      <MenuItem value={10}>Ten</MenuItem>
                      <MenuItem value={20}>Twenty</MenuItem>
                      <MenuItem value={30}>Thirty</MenuItem>
                    </Select>
                  )}
                  name="Select"
                  control={control}
                />
              </section>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions className={classes.dialogActions}>
          <Grid
            container
            justifyContent="flex-end"
            alignItems="center">
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
              <Button
                type={'submit'}
                className={classes.submitButton}
                onClick={handleSubmit}>
                <Typography className={classes.buttonLabel}>
                  Submit
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddGraphDialog;
