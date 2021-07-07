import React, { useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Help';
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
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  dialogTitle: { padding: '0 0 0 16px' },
  dialogContent: { padding: '0 16px' },
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
  sectionTitle: { fontWeight: 'bold', marginTop: 16 },
  link: {
    color: '#44AB77',
    fontWeight: 'bold',
    '&:hover': { cursor: 'pointer', color: '#44AB77' },
  },
  label: { fontSize: '0.875rem' },
  formControlLabelRoot: { height: 25, marginLeft: 24 },
  checkedRadioButton: { '&$checked': { color: '#44AB77' } },
  popover: {
    pointerEvents: 'none',
  },
}));

const ComputeDialog = ({ isOpen, setIsOpen }) => {
  const classes = useStyles();
  const [selectedInputMethod, setSelectedInputMethod] = useState();
  const [anchorEl, setAnchorEl] = useState(null);

  const theme = createMuiTheme({
    palette: {
      primary: { main: '#44AB77' },
    },
  });

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
        <DialogTitle className={classes.dialogTitle}>
          <Grid container justify="space-between" alignItems="center">
            <Grid item>
              <Typography>Compute Text</Typography>
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
            <Grid item xs={12}>
              <Typography className={classes.sectionTitle}>
                Name (Optional)
              </Typography>
              Name input
            </Grid>
            <Grid item xs={12}>
              <Typography className={classes.sectionTitle}>
                Input
              </Typography>
              <Typography>
                Upload an existing file or enter raw text below.
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedInputMethod ?? ''}
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
            <Grid item xs={12}>
              <Grid container justify="space-between">
                <Grid item>
                  <Typography>My Text</Typography>
                </Grid>
                <Grid item>
                  <Link className={classes.link}>
                    <Typography>Paste sample text</Typography>
                  </Link>
                </Grid>
              </Grid>
              Multiline textarea
            </Grid>
            <Grid item>
              <Link className={classes.link}>
                <Typography>Optional Configuration</Typography>
              </Link>
              {/* <Typography
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}>
                {/* <InfoIcon /> poops
              </Typography>
              <Popover
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
                <Typography>poop</Typography>
              </Popover> */}
              <div>
                <Typography
                  aria-owns={open ? 'mouse-over-popover' : undefined}
                  aria-haspopup="true"
                  onMouseEnter={handlePopoverOpen}
                  onMouseLeave={handlePopoverClose}>
                  Hover with a Popover.
                </Typography>
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
                  <Typography>I use Popover.</Typography>
                </Popover>
              </div>
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
              <Button className={classes.submitButton}>
                <Typography className={classes.buttonLabel}>
                  Submit
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </MuiThemeProvider>
  );
};

export default ComputeDialog;
