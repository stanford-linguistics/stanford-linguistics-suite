import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  TextField,
  Typography,
  Grid,
  Link,
  Chip,
} from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { DEFAULT_SETTINGS_CONFIG } from 'constants/settings';
import { Controller } from 'react-hook-form';

const useStyles = makeStyles((theme) => ({
  section: { marginTop: theme.spacing(2) },
  label: { fontWeight: 'bold', fontSize: '0.75rem' },
  restoreDefaultsLabel: {
    fontSize: '0.75rem',
    textDecoration: 'underline',
  },
  link: { '&:hover': { cursor: 'pointer' } },
  autocompleteInputRoot: { padding: 0 + '!important' },
}));

const ResetDefaultLink = ({ onClick }) => {
  const classes = useStyles();

  return (
    <Link className={classes.link} onClick={onClick}>
      <Typography className={classes.restoreDefaultsLabel}>
        Restore Defaults
      </Typography>
    </Link>
  );
};

const ComputeOptionalConfigForm = ({ control, setValue }) => {
  const classes = useStyles();

  const handleRestoreDefaults = (type, defaultValue) => {
    setValue(type, defaultValue);
  };

  return (
    <Grid item xs={12}>
      <Grid container>
        <Grid item xs={12}>
          <Typography style={{ fontWeight: 'bold' }}>
            Instructions
          </Typography>
          <Typography gutterBottom variant="subtitle2">
            Optional configuration allows you to change the value of
            various parameters.
          </Typography>
          <Typography gutterBottom variant="subtitle2">
            Select from default parameters or create you own by typing
            in a new parameter and pressing 'Enter'.
          </Typography>
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Unstressed Words
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'unstressedWords',
                    DEFAULT_SETTINGS_CONFIG.unstressedWords
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.unstressedWords.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="unstressedWords"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Unstressed Tags
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'unstressedTags',
                    DEFAULT_SETTINGS_CONFIG.unstressedTags
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.unstressedTags.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="unstressedTags"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Unstressed Deps
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'unstressedDeps',
                    DEFAULT_SETTINGS_CONFIG.unstressedDeps
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.unstressedDeps.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="unstressedDeps"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Ambiguous Words
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'ambiguousWords',
                    DEFAULT_SETTINGS_CONFIG.ambiguousWords
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.ambiguousWords.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="ambiguousWords"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Ambiguous Tags
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'ambiguousTags',
                    DEFAULT_SETTINGS_CONFIG.ambiguousTags
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.ambiguousTags.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="ambiguousTags"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Ambiguous Deps
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'ambiguousDeps',
                    DEFAULT_SETTINGS_CONFIG.ambiguousDeps
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.ambiguousDeps.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="ambiguousDeps"
            control={control}
          />
        </Grid>
        <Grid item xs={12} className={classes.section}>
          <Grid container direction="row" spacing={2}>
            <Grid item>
              <Typography className={classes.label}>
                Stressed Words
              </Typography>
            </Grid>
            <Grid item>
              <ResetDefaultLink
                onClick={() =>
                  handleRestoreDefaults(
                    'stressedWords',
                    DEFAULT_SETTINGS_CONFIG.stressedWords
                  )
                }
              />
            </Grid>
          </Grid>
          <Controller
            render={({ field }) => (
              <Autocomplete
                classes={{
                  inputRoot: classes.autocompleteInputRoot,
                }}
                {...field}
                multiple
                filterSelectedOptions
                options={DEFAULT_SETTINGS_CONFIG.stressedWords.map(
                  (option) => option
                )}
                freeSolo
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      size="small"
                      variant="outlined"
                      label={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="filled" />
                )}
                onChange={(_, data) => field.onChange(data)}
              />
            )}
            name="stressedWords"
            control={control}
          />
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ComputeOptionalConfigForm;
