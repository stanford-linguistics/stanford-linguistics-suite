import React, { useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import InfoIcon from '@material-ui/icons/Help';
import { useForm, Controller } from 'react-hook-form';
import {
  makeStyles,
  MuiThemeProvider,
  createTheme,
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
import ComputeOptionalConfigForm from 'components/ComputeOptionalConfigForm';
import StyledButtonPrimary from 'components/shared/ButtonPrimary';
import {
  DEFAULT_SETTINGS_CONFIG,
  SAMPLE_RAW_TEXT,
} from 'constants/settings';
import {
  UPLOAD_METRICAL_TREE_FILE,
  COMPUTE_METRICAL_TREE_FILE,
} from 'graphql/metricalTree';
import { useMutation } from '@apollo/client';
import { useComputeResults } from 'recoil/results';

const useStyles = makeStyles((theme) => ({
  dialogTitle: { padding: '8px 8px 0 16px' },
  dialogTitleText: { fontWeight: 'bold' },
  dialogContent: { padding: '0 16px', height: 'auto' },
  dialogActions: { padding: 16 },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    color: '#fff',
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
  chooseFileButton: {
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
  configurationLinkContainer: { marginTop: theme.spacing(2) },
}));

const defaultValues = {
  name: '',
  rawText: '',
  unstressedWords: DEFAULT_SETTINGS_CONFIG.unstressedWords,
  unstressedTags: DEFAULT_SETTINGS_CONFIG.unstressedTags,
  unstressedDeps: DEFAULT_SETTINGS_CONFIG.unstressedDeps,
  ambiguousWords: DEFAULT_SETTINGS_CONFIG.ambiguousWords,
  ambiguousTags: DEFAULT_SETTINGS_CONFIG.ambiguousTags,
  ambiguousDeps: DEFAULT_SETTINGS_CONFIG.ambiguousDeps,
  stressedWords: DEFAULT_SETTINGS_CONFIG.stressedWords,
};

const ComputeDialog = ({ isOpen, setIsOpen }) => {
  const classes = useStyles();
  const [selectedInputMethod, setSelectedInputMethod] =
    useState('rawText');
  const [anchorEl, setAnchorEl] = useState(null);
  const [shouldShowConfigOptions, setShouldShowConfigOptions] =
    useState(false);
  const [, { addComputeResult }] = useComputeResults();

  const [
    uploadMetricalTreeFile,
    { loading: uploadLoading, error: uploadError },
  ] = useMutation(UPLOAD_METRICAL_TREE_FILE);

  const [
    computeMetricalTreeFile,
    { loading: computeLoading, error: computeError },
  ] = useMutation(COMPUTE_METRICAL_TREE_FILE);

  const theme = createTheme({
    palette: { primary: { main: '#44AB77' } },
  });

  const {
    watch,
    register,
    handleSubmit,
    control,
    formState,
    setValue,
  } = useForm({ defaultValues });

  const selectedFile = watch('file');
  const currentRawText = watch('rawText');

  const onSubmit = (data) => {
    console.log(data);

    const getFileFromRawText = () => {
      const blob = new Blob([data.rawText], { type: 'text/plain' });
      return new File([blob], 'input.txt', {
        type: 'text/plain',
      });
    };

    const fileToUpload =
      selectedInputMethod === 'file'
        ? data.file[0]
        : getFileFromRawText();

    uploadMetricalTreeFile({
      variables: {
        file: fileToUpload,
      },
    })
      .then((result) => {
        console.log('RESULT DATA: ', result.data.upload);
        return computeMetricalTreeFile({
          variables: {
            id: result.data.upload.id,
            options: {
              name: data?.name ?? undefined,
              description: '', // TODO: Implement this?
              unstressed_words: data.unstressedWords,
              unstressed_tags: data.unstressedTags,
              unstressed_deps: data.unstressedDeps,
              ambiguous_words: data.ambiguousWords,
              ambiguous_tags: data.ambiguousTags,
              ambiguous_deps: data.ambiguousDeps,
              stressed_words: data.stressedWords,
            },
          },
        });
      })
      .then((result) => {
        console.log('COMPUTE RESULT: ', result);
        addComputeResult(result.data.compute);
        handleClose();
      });
  };

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
    setShouldShowConfigOptions(false);
    setSelectedInputMethod('rawText');
    setIsOpen(false);
  };

  return (
    <MuiThemeProvider theme={theme}>
      <Dialog open={isOpen} maxWidth="sm" onClose={handleClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle className={classes.dialogTitle}>
            <Grid
              container
              justifyContent="space-between"
              alignItems="center">
              <Grid item>
                <Typography className={classes.dialogTitleText}>
                  Compute
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
                  <Typography className={classes.sectionTitle}>
                    Name (Optional)
                  </Typography>
                  <Controller
                    render={({ field }) => (
                      <TextField
                        {...field}
                        variant="outlined"
                        margin="dense"
                        fullWidth
                      />
                    )}
                    name="name"
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
                      label={
                        <Typography variant="subtitle2">
                          Raw Text
                        </Typography>
                      }
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
                      label={
                        <Typography variant="subtitle2">
                          File
                        </Typography>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {selectedInputMethod === 'file' && (
                <Grid item xs={12}>
                  <section>
                    <Typography className={classes.sectionTitle}>
                      Input File (.txt only)
                    </Typography>
                    <Grid
                      container
                      direction="row"
                      spacing={2}
                      alignItems="center">
                      <Grid item>
                        <Button
                          variant="contained"
                          component="label"
                          className={classes.chooseFileButton}>
                          <Typography className={classes.buttonLabel}>
                            Choose File
                          </Typography>
                          <input
                            {...register('file', {
                              required:
                                selectedInputMethod === 'file',
                            })}
                            type="file"
                            hidden
                            name="file"
                            accept=".txt"
                          />
                        </Button>
                      </Grid>
                      <Grid item>
                        <Typography
                          variant="subtitle2"
                          className={classes.fileName}>
                          {selectedFile?.[0]?.name
                            ? selectedFile[0].name
                            : 'No file chosen'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </section>
                </Grid>
              )}

              {selectedInputMethod === 'rawText' && (
                <Grid item xs={12}>
                  <Grid container justifyContent="flex-end">
                    <Grid item>
                      <Link
                        className={classes.link}
                        onClick={() =>
                          setValue(
                            'rawText',
                            currentRawText + SAMPLE_RAW_TEXT,
                            {
                              shouldDirty: true,
                            }
                          )
                        }
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
                      name="rawText"
                      rules={{
                        required: selectedInputMethod === 'rawText',
                      }}
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
                  <Grid
                    item
                    className={classes.configurationLinkContainer}>
                    <Link
                      className={classes.link}
                      underline="always"
                      onClick={() =>
                        setShouldShowConfigOptions(
                          !shouldShowConfigOptions
                        )
                      }>
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
                  {shouldShowConfigOptions && (
                    <ComputeOptionalConfigForm control={control} />
                  )}
                </Grid>
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
                <StyledButtonPrimary
                  type={'submit'}
                  disabled={!formState.isValid}
                  label={'Submit'}
                />
              </Grid>
            </Grid>
          </DialogActions>
        </form>
      </Dialog>
    </MuiThemeProvider>
  );
};

export default ComputeDialog;
