import React, { useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Help';
import { useForm, Controller } from 'react-hook-form';
import {
  makeStyles,
  MuiThemeProvider,
  createMuiTheme,
} from '@material-ui/core/styles';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  IconButton,
  Link,
  RadioGroup,
  Radio,
  FormControl,
  FormControlLabel,
  Popover,
  TextField,
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
  sectionTitle: {
    fontFamily: 'Source Sans Pro !important',
    fontWeight: 'bold',
    marginTop: 16,
    fontSize: '0.875rem',
  },
  sectionInstructions: { fontSize: '0.75rem' },
  link: {
    color: '#44AB77',
    fontWeight: 'bold',
    '&:hover': { cursor: 'pointer', color: '#44AB77' },
  },
  linkText: { fontSize: '0.75rem' },
  label: { fontSize: '0.75rem', fontFamily: 'Source Sans Pro' },
  formControlLabelRoot: { height: 25, marginLeft: 24 },
  checkedRadioButton: { '&$checked': { color: '#44AB77' } },
  popover: { pointerEvents: 'none' },
  infoIcon: { fontSize: '1rem', marginTop: 6, color: '#44AB77' },
}));

const ComputeDialog = ({ isOpen, setIsOpen }) => {
  const classes = useStyles();
  const [selectedInputMethod, setSelectedInputMethod] =
    useState('rawText');
  const [anchorEl, setAnchorEl] = useState(null);

  console.log('selectedInputMethod: ', selectedInputMethod);

  const theme = createMuiTheme({
    palette: { primary: { main: '#44AB77' } },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => console.log(data);

  const handleRadioOptionChange = (event) => {
    setSelectedInputMethod(event.target.value);
  };

  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Dialog open={isOpen} maxWidth="sm" onClose={handleClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className={classes.dialogTitle}>
            <Grid
              container
              justify="space-between"
              alignItems="center">
              <Grid item>
                <Typography className={classes.dialogTitleText}>
                  Compute Text
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
              <Grid item xs={12} className="form-container">
                <section>
                  <label
                    className={classes.sectionTitle}
                    htmlFor="name">
                    Name (Optional)
                  </label>
                  <Controller
                    render={({ field }) => (
                      <TextField
                        {...field}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    )}
                    name="TextField"
                    control={control}
                  />
                </section>
              </Grid>
              <Grid item xs={12}>
                <Typography className={classes.sectionTitle}>
                  Input
                </Typography>
                <Typography className={classes.sectionInstructions}>
                  Upload an existing file or enter raw text below.
                </Typography>
                <FormControl component="fieldset">
                  <RadioGroup
                    value={selectedInputMethod}
                    onChange={handleRadioOptionChange}>
                    <FormControlLabel
                      classes={{
                        label: classes.label,
                        root: classes.formControlLabelRoot,
                      }}
                      value={'rawText'}
                      control={
                        <Radio
                          classes={{
                            root: classes.checkedRadioButton,
                          }}
                          size="small"
                          color="primary"
                        />
                      }
                      label={'Raw Text'}
                    />
                    <FormControlLabel
                      classes={{
                        label: classes.label,
                        root: classes.formControlLabelRoot,
                      }}
                      value={'file'}
                      control={
                        <Radio
                          classes={{
                            root: classes.checkedRadioButton,
                          }}
                          size="small"
                          color="primary"
                        />
                      }
                      label={'File'}
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {selectedInputMethod === 'rawText' && (
                <Grid item xs={12}>
                  <Grid container justify="flex-end">
                    <Grid item>
                      <Link
                        className={classes.link}
                        underline="always">
                        <Typography className={classes.linkText}>
                          Paste sample text
                        </Typography>
                      </Link>
                    </Grid>
                  </Grid>
                  <section>
                    <label
                      className={classes.sectionTitle}
                      htmlFor="name">
                      My Text
                    </label>
                    <Controller
                      render={({ field }) => (
                        <TextField
                          {...field}
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          multiline
                          rows={10}
                        />
                      )}
                      name="TextField"
                      control={control}
                    />
                  </section>
                </Grid>
              )}
              <Grid item>
                <Grid
                  container
                  direction="row"
                  spacing={1}
                  alignItems="center">
                  <Grid item>
                    <Link className={classes.link} underline="always">
                      <Typography className={classes.linkText}>
                        Optional Configuration
                      </Typography>
                    </Link>
                  </Grid>
                  <Grid item>
                    <InfoIcon
                      aria-owns={
                        open ? 'mouse-over-popover' : undefined
                      }
                      aria-haspopup="true"
                      onMouseEnter={handlePopoverOpen}
                      onMouseLeave={handlePopoverClose}
                      className={classes.infoIcon}
                    />
                    <Popover
                      id="mouse-over-popover"
                      className={classes.popover}
                      classes={{
                        paper: classes.paper,
                      }}
                      open={open}
                      anchorEl={anchorEl}
                      anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left',
                      }}
                      transformOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                      onClose={handlePopoverClose}
                      disableRestoreFocus>
                      <Typography>TODO: HELPER TEXT</Typography>
                    </Popover>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions className={classes.dialogActions}>
            <Grid container justify="flex-end" alignItems="center">
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
                  className={classes.submitButton}>
                  <Typography className={classes.buttonLabel}>
                    Submit
                  </Typography>
                </Button>
              </Grid>
            </Grid>
          </DialogActions>
        </form>
      </Dialog>
    </MuiThemeProvider>
  );
};

export default ComputeDialog;
