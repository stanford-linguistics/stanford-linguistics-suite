import React, { useState } from 'react';
import CloseIcon from '@material-ui/icons/Close';
import { useForm, Controller } from 'react-hook-form';
import { makeStyles } from '@material-ui/core/styles';
import {
  LinearProgress,
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
  TextField,
} from '@material-ui/core';
import ComputeOptionalConfigForm from 'components/ComputeOptionalConfigForm';
import StyledButtonPrimary from 'components/shared/ButtonPrimary';
import { SAMPLE_RAW_TEXT } from 'constants/settings';
import {
  UPLOAD_METRICAL_TREE_FILE,
  COMPUTE_METRICAL_TREE_FILE,
} from 'graphql/metricalTree';
import { useMutation } from '@apollo/client';
import { useComputeResults } from 'recoil/results';
import { useSettings } from 'recoil/settings';

const useStyles = makeStyles((theme) => ({
  dialogTitle: { padding: '8px 8px 0 16px' },
  dialogTitleText: { fontWeight: 'bold' },
  dialogContent: {},
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
  cancelButtonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      textDecoration: 'underline',
      color: 'white',
    },
  },
  chooseFileButton: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
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
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    '&:hover': {
      cursor: 'pointer',
      color: theme.palette.primary.dark,
    },
  },
  linkText: { fontSize: '0.75rem' },
  label: { fontSize: '0.75rem', fontFamily: 'Source Sans Pro' },
  formControlLabelRoot: { height: 25, marginLeft: 24 },
  checkedRadioButton: {
    '&:checked': { color: theme.palette.primary.main },
  },
  infoIcon: {
    fontSize: '1rem',
    marginTop: 6,
    color: theme.palette.primary.main,
  },
  configurationLinkContainer: { marginTop: theme.spacing(2) },
}));

const ComputeDialog = ({ isOpen, setIsOpen }) => {
  const classes = useStyles();
  const [selectedInputMethod, setSelectedInputMethod] =
    useState('rawText');
  const [shouldShowConfigOptions, setShouldShowConfigOptions] =
    useState(false);
  const [, { addComputeResult }] = useComputeResults();
  const [settings] = useSettings();

  const [
    uploadMetricalTreeFile,
    {
      loading: uploadLoading,
      //error: uploadError
    },
  ] = useMutation(UPLOAD_METRICAL_TREE_FILE);

  const [
    computeMetricalTreeFile,
    {
      loading: computeLoading,
      //error: computeError
    },
  ] = useMutation(COMPUTE_METRICAL_TREE_FILE);

  const isLoading = uploadLoading || computeLoading;

  const defaultValues = {
    name: '',
    rawText: '',
    unstressedWords: settings.unstressedWords,
    unstressedTags: settings.unstressedTags,
    unstressedDeps: settings.unstressedDeps,
    ambiguousWords: settings.ambiguousWords,
    ambiguousTags: settings.ambiguousTags,
    ambiguousDeps: settings.ambiguousDeps,
    stressedWords: settings.stressedWords,
  };

  const {
    watch,
    register,
    handleSubmit,
    control,
    formState,
    setValue,
    reset,
  } = useForm({ defaultValues });

  const { isValid } = formState;

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
        return computeMetricalTreeFile({
          variables: {
            id: result.data.upload.id,
            options: {
              name: data?.name ?? undefined,
              description: '',
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

  const handleClose = () => {
    setShouldShowConfigOptions(false);
    setSelectedInputMethod('rawText');
    setIsOpen(false);
    reset(defaultValues);
  };

  return (
    <Dialog open={isOpen} maxWidth="sm" onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {isLoading && <LinearProgress color="primary" />}
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
                            required: selectedInputMethod === 'file',
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
                  <Typography className={classes.sectionTitle}>
                    My Text
                  </Typography>
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
                {shouldShowConfigOptions && (
                  <ComputeOptionalConfigForm
                    control={control}
                    setValue={setValue}
                  />
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
                disabled={isLoading}
                className={classes.cancelButton}>
                <Typography className={classes.cancelButtonLabel}>
                  Cancel
                </Typography>
              </Button>
            </Grid>
            <Grid item>
              <StyledButtonPrimary
                type={'submit'}
                disabled={!isValid || isLoading}
                label={'Submit'}
              />
            </Grid>
          </Grid>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ComputeDialog;
