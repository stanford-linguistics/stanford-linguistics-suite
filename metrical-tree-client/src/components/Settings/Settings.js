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
  Select,
  MenuItem,
  Chip,
  FormControl,
  InputLabel,
  Input,
} from '@material-ui/core';

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
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Settings = () => {
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  // TODO: Connection on create graph
  const onSubmit = (data) => console.log(data);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const unstressedWords = ['it', 'the', 'this'];
  const unstressedTags = ['CC'];

  const [settings, setSettings] = React.useState([]);

  const handleChange = (event, type) => {
    // if (type === 'unstressedWords') {
    //   setSettings({
    //     ...settings,

    //   })
    // }
    setSettings(event.target.value);
  };

  console.log('SETTINGS: ', settings);

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const handleDelete = () => {
    console.log('DELETE UNSTRESSED WORD');
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
        onClose={handleClose}
        TransitionComponent={Transition}
        keepMounted>
        <DialogTitle>
          <Grid container justify="space-between" alignItems="center">
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
          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container>
              <Grid item xs={12}>
                <section>
                  <Controller
                    name="Checkbox"
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
              <Grid item xs={12}>
                <section>
                  <Controller
                    render={({ field }) => (
                      <FormControl className={classes.formControl}>
                        <InputLabel id="unstressed-words-multiselect-label">
                          <Typography>Unstressed Words</Typography>
                        </InputLabel>
                        <Select
                          labelId="unstressed-words-multiselect-label"
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          multiple
                          value={settings}
                          onChange={handleChange}
                          input={<Input id="select-multiple-chip" />}
                          renderValue={(selected) => (
                            <div className={classes.chips}>
                              {selected.map((value) => (
                                <Chip
                                  key={value}
                                  label={value}
                                  className={classes.chip}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </div>
                          )}
                          MenuProps={MenuProps}>
                          {unstressedWords.map((word) => (
                            <MenuItem key={word} value={word}>
                              {word}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    name="unstressedWordsSelect"
                    control={control}
                  />
                </section>
              </Grid>
              <Grid item xs={12}>
                <section>
                  <Controller
                    render={({ field }) => (
                      <FormControl className={classes.formControl}>
                        <InputLabel id="unstressed-tags-multiselect-label">
                          <Typography>Unstressed Tags</Typography>
                        </InputLabel>
                        <Select
                          labelId="unstressed-tags-multiselect-label"
                          variant="outlined"
                          margin="dense"
                          fullWidth
                          multiple
                          value={settings}
                          onChange={handleChange}
                          input={<Input id="select-multiple-chip" />}
                          renderValue={(selected) => (
                            <div className={classes.chips}>
                              {selected.map((value) => (
                                <Chip
                                  key={value}
                                  label={value}
                                  className={classes.chip}
                                  onDelete={handleDelete}
                                />
                              ))}
                            </div>
                          )}
                          MenuProps={MenuProps}>
                          {unstressedTags.map((word) => (
                            <MenuItem key={word} value={word}>
                              {word}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                    name="unstressedWordsSelect"
                    control={control}
                  />
                </section>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
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
                className={classes.submitButton}
                onClick={handleSubmit}>
                <Typography className={classes.buttonLabel}>
                  Submit
                </Typography>
              </Button>
            </Grid>
          </Grid>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settings;
