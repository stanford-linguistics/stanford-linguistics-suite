import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import SettingsIcon from '@material-ui/icons/Settings';
import CloseIcon from '@material-ui/icons/Close';
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
  Grid,
  Checkbox,
  FormControlLabel,
} from '@material-ui/core';
import ComputeOptionalConfigForm from 'components/ComputeOptionalConfigForm';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';
import { useSettings } from 'recoil/settings';

const useStyles = makeStyles(() => ({
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

  icon: { color: '#8c1515' },
  settingsButton: { padding: 0, marginRight: 16 },
  warningMessage: {
    backgroundColor: '#f2f2f2',
    padding: 16,
    borderLeft: '8px solid #c1c1c1',
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Settings = () => {
  const classes = useStyles();
  const [isOpen, setIsOpen] = React.useState(false);
  const [settings, { handleSettingsChange }] = useSettings();

  const { handleSubmit, control, formState, reset, setValue } =
    useForm({
      defaultValues: settings,
    });

  const { isDirty, isValid } = formState;

  const onSubmit = (data) => {
    handleSettingsChange({
      ...data,
    });
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Tooltip title="Settings">
        <IconButton
          onClick={() => {
            reset(settings);
            setIsOpen(true);
          }}
          className={classes.settingsButton}>
          <SettingsIcon className={classes.icon} size="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={isOpen}
        onClose={handleClose}
        TransitionComponent={Transition}
        keepMounted>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            <Grid
              container
              justifyContent="space-between"
              alignItems="center">
              <Grid item>
                <Typography className={classes.dialogTitleText}>
                  Settings
                </Typography>
              </Grid>
              <Grid item>
                <IconButton onClick={handleClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Grid>
            </Grid>
          </DialogTitle>
          <DialogContent>
            <Grid container>
              <Grid item xs={12} className={classes.warningMessage}>
                <Grid
                  container
                  direction="row"
                  spacing={1}
                  alignItems="center">
                  <Grid item>
                    <ErrorOutlineIcon />
                  </Grid>
                  <Grid item>
                    <Typography style={{ fontWeight: 'bold' }}>
                      Please Note
                    </Typography>
                  </Grid>
                </Grid>
                <Typography variant="subtitle2">
                  These settings will be applied to all computations.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <section>
                  <Controller
                    name="shouldDeleteExpiredResults"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            onChange={(e) =>
                              field.onChange(e.target.checked)
                            }
                            checked={field.value}
                          />
                        }
                        label={
                          <Typography>
                            Automatically delete expired results
                          </Typography>
                        }
                      />
                    )}
                  />
                </section>
              </Grid>
              <ComputeOptionalConfigForm
                control={control}
                setValue={setValue}
              />
            </Grid>
          </DialogContent>
          <DialogActions>
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
                <StyledButtonPrimary
                  type={'submit'}
                  label={'Submit'}
                  disabled={!isDirty || !isValid}
                />
              </Grid>
            </Grid>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default Settings;
