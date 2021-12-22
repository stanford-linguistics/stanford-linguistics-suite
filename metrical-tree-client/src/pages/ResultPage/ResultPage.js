import React, { useState, useRef, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Link,
  Card,
  Select,
  MenuItem,
  Chip,
} from '@material-ui/core';

import IdentityBar from '../../components/IdentityBar';
import Appbar from '../../components/Appbar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import AddGraphDialog from '../../components/AddGraphDialog';
import { GET_RESULT_FOR_SINGLE_COMPUTE } from 'graphql/metricalTree';
import { useQuery } from '@apollo/client';
import { useComputeResults } from 'recoil/results';
import Moment from 'react-moment';
import 'moment-timezone';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';
import MUIDataTable from 'mui-datatables';
import ResultsGraph from 'components/ResultsGraph';
import ReactToPrint from 'react-to-print';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: 16,
    minHeight: 'calc(100vh - 236px)',
    height: 'auto',
    backgroundColor: '#f2f2f2',
    [theme.breakpoints.down('sm')]: {
      minHeight: 'calc(100vh - 322px)',
    },
    [theme.breakpoints.down('xs')]: {
      minHeight: 'calc(100vh - 360px)',
    },
  },
  title: { fontWeight: 'bold', fontSize: '1.25rem' },
  subTitle: { fontSize: '0.825rem', marginBottom: -4 },
  button: {
    margin: ' 8px 0 24px 0',
    borderRadius: 32,
    backgroundColor: '#44AB77',
    '&:hover': {
      backgroundColor: '#3C8F65',
      textDecoration: 'underline',
      color: 'white',
    },
  },
  buttonLabel: {
    color: 'white',
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
  },
  link: {
    color: '#44AB77',
    fontWeight: 'bold',
    '&:hover': { cursor: 'pointer', color: '#44AB77' },
  },
  linkText: { fontSize: '0.75rem' },
  card: { padding: theme.spacing(2), marginTop: theme.spacing(2) },
  cardTitle: { fontWeight: 'bold' },
  graphCard: { margin: theme.spacing(2, 0, 1, 0) },
  section: { marginBottom: theme.spacing(2) },
  parameterGroup: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  parameterName: { display: 'inline', fontSize: '0.75rem' },
  parameterWordChip: { marginRight: theme.spacing(0.5) },
}));

const selectableModels = [
  {
    label: 'm1 (raw)',
    apiKey: 'm1',
  },
  {
    label: 'm1 (normalized)',
    apiKey: 'norm_m1',
  },
  {
    label: 'm2a (raw)',
    apiKey: 'm2a',
  },
  {
    label: 'm2a (normalized)',
    apiKey: 'norm_m2a',
  },
  {
    label: 'm2b (raw)',
    apiKey: 'm2b',
  },
  {
    label: 'm2b (normalized)',
    apiKey: 'norm_m2b',
  },
  {
    label: 'mean (raw)',
    apiKey: 'mean',
  },
  {
    label: 'mean (normalized)',
    apiKey: 'norm_mean',
  },
];

const getModelForSpecifiedKey = (apiKey, data) => {
  return {
    data:
      data
        ?.map((row) => ({
          primary: row.word,
          secondary: Number(row[apiKey]),
        }))
        .filter((row) => !isNaN(row.secondary)) ?? [],
    label: apiKey,
  };
};

const getGraphOptions = (resultData) => {
  const options = selectableModels.map((model) => ({
    label: model.label,
    value: [getModelForSpecifiedKey(model.apiKey, resultData)],
  }));

  options.push({
    label: 'Series (raw)',
    value: [
      getModelForSpecifiedKey('m1', resultData),
      getModelForSpecifiedKey('m2a', resultData),
      getModelForSpecifiedKey('m2b', resultData),
      getModelForSpecifiedKey('mean', resultData),
    ],
  });

  options.push({
    label: 'Series (normalized)',
    value: [
      getModelForSpecifiedKey('norm_m1', resultData),
      getModelForSpecifiedKey('norm_m2a', resultData),
      getModelForSpecifiedKey('norm_m2b', resultData),
      getModelForSpecifiedKey('norm_mean', resultData),
    ],
  });

  return options;
};

const ResultPage = () => {
  const classes = useStyles();
  const history = useHistory();
  const { resultId } = useParams();
  const [addGraphDialogIsOpen, setIsAddGraphDialogOpen] =
    useState(false);
  const graphResultToPrintRef = useRef();
  const [selectedModel, setSelectedModel] = useState(null);

  const [resultsState] = useComputeResults();

  const {
    // loading,
    //  error,
    data,
  } = useQuery(GET_RESULT_FOR_SINGLE_COMPUTE, {
    variables: { id: resultId },
    skip: !resultId,
    fetchPolicy: 'network-only',
  });
  const cachedResult = resultId
    ? resultsState?.results?.find((result) => result.id === resultId)
    : {};

  const mergedResult = {
    ...cachedResult,
    ...(data?.result ? data.result : {}),
  };

  console.log(mergedResult);

  const graphOptions = getGraphOptions(mergedResult.data);

  useEffect(() => {
    if (!selectedModel && graphOptions.length > 0) {
      const defaultModel = graphOptions.find(
        (option) => option.value[0].label === 'm2a'
      );
      setSelectedModel(defaultModel);
    }
  }, [graphOptions, selectedModel]);

  const columns = [
    {
      name: 'widx',
      label: 'widx',
    },
    {
      name: 'norm_widx',
      label: 'norm_widx',
    },
    {
      name: 'word',
      label: 'word',
    },
    {
      name: 'seg',
      label: 'seg',
    },
    {
      name: 'lexstress',
      label: 'lexstress',
    },
    {
      name: 'nseg',
      label: 'nseg',
    },
    {
      name: 'nsyll',
      label: 'nsyll',
    },
    {
      name: 'nstress',
      label: 'nstress',
    },
    {
      name: 'pos',
      label: 'pos',
    },
    {
      name: 'dep',
      label: 'dep',
    },
    {
      name: 'm1',
      label: 'm1',
    },
    {
      name: 'm2a',
      label: 'm2a',
    },
    {
      name: 'm2b',
      label: 'm2b',
    },

    {
      name: 'mean',
      label: 'mean',
    },
    {
      name: 'norm_m1',
      label: 'norm_m1',
    },
    {
      name: 'norm_m2a',
      label: 'norm_m2a',
    },
    {
      name: 'norm_m2b',
      label: 'norm_m2b',
    },
    {
      name: 'norm_mean',
      label: 'norm_mean',
    },
    {
      name: 'sidx',
      label: 'sidx',
    },
    {
      name: 'sent',
      label: 'sent',
      options: {
        display: false,
      },
    },
    {
      name: 'ambig_words',
      label: 'ambig_words',
    },
    {
      name: 'ambig_monosyll',
      label: 'ambig_monosyll',
    },
    {
      name: 'contour',
      label: 'contour',
    },
  ];

  const options = {
    selectableRowsHeader: false,
    selectableRows: 'none',
    selectableRowsOnClick: false,
    print: false,
    search: false,
    filter: false,
    download: true,
    viewColumns: true,
    rowsPerPageOptions: [],
  };

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justifyContent="center"
        className={classes.container}>
        <Grid item xs={12}>
          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography className={classes.subTitle}>
                Metrical Tree
              </Typography>
              <Typography className={classes.title}>
                {mergedResult?.name ?? 'Compute Result'}
              </Typography>

              {mergedResult?.expiresOn && (
                <Typography variant="subtitle2">
                  Expires{' '}
                  <Moment
                    interval={10000}
                    to={new Date(0).setUTCSeconds(
                      mergedResult.expiresOn
                    )}
                  />
                </Typography>
              )}
              {mergedResult?.status === 'SUCCESS' &&
                mergedResult?.link && (
                  <Link
                    className={classes.link}
                    underline="always"
                    href={mergedResult.link.replace('https', 'http')} //TODO: Remove this for prod
                    download>
                    <Typography className={classes.linkText}>
                      Download Raw Results
                    </Typography>
                  </Link>
                )}
            </Grid>
            <Grid item>
              <StyledButtonPrimary
                label={'Back'}
                onClick={() => {
                  history.push('/compute');
                }}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={12} className={classes.section}>
              <Card className={classes.card}>
                <Grid
                  container
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between">
                  <Grid item>
                    <Typography className={classes.cardTitle}>
                      Graphs
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Select
                      value={selectedModel?.label ?? ''}
                      variant="outlined"
                      onChange={(event) => {
                        const model = graphOptions.find(
                          (option) =>
                            option.label === event.target.value
                        );
                        setSelectedModel(model);
                      }}
                      margin="dense"
                      fullWidth>
                      {graphOptions.map((option, index) => (
                        <MenuItem key={index} value={option.label}>
                          <Typography
                            style={{ fontSize: '0.625rem' }}>
                            {option.label}
                          </Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </Grid>
                </Grid>
                <Grid container justifyContent="center">
                  <Grid item>
                    <ResultsGraph
                      ref={graphResultToPrintRef}
                      model={selectedModel}
                    />
                    <Grid container justifyContent="flex-end">
                      <ReactToPrint
                        trigger={() => (
                          <StyledButtonPrimary
                            label={'Print'}
                            onClick={() => {}}
                          />
                        )}
                        content={() => graphResultToPrintRef.current}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12} className={classes.section}>
              <Card className={classes.card}>
                <Typography className={classes.cardTitle}>
                  Parameters Used
                </Typography>
                <Grid container>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Unstressed Words:{' '}
                    </Typography>
                    {mergedResult?.params?.unstressed_words?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Unstressed Tags:{' '}
                    </Typography>
                    {mergedResult?.params?.unstressed_tags?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Unstressed Deps:{' '}
                    </Typography>
                    {mergedResult?.params?.unstressed_deps?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Ambiguous Words:{' '}
                    </Typography>
                    {mergedResult?.params?.ambiguous_words?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Ambiguous Tags:{' '}
                    </Typography>
                    {mergedResult?.params?.ambiguous_tags?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Ambiguous Deps:{' '}
                    </Typography>
                    {mergedResult?.params?.ambiguous_deps?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    className={classes.parameterGroup}>
                    <Typography className={classes.parameterName}>
                      Stressed Words:{' '}
                    </Typography>
                    {mergedResult?.params?.stressed_words?.map(
                      (word, index) => (
                        <Chip
                          key={index}
                          className={classes.parameterWordChip}
                          size="small"
                          color="primary"
                          variant="outlined"
                          label={
                            <Typography variant="caption">
                              {word}
                            </Typography>
                          }
                        />
                      )
                    )}
                  </Grid>
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <MUIDataTable
                title={'Results'}
                data={mergedResult?.data ?? []}
                columns={columns}
                options={options}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <SecondaryFooter />
      <PrimaryFooter />
      <AddGraphDialog
        isOpen={addGraphDialogIsOpen}
        setIsOpen={setIsAddGraphDialogOpen}
      />
    </>
  );
};

export default ResultPage;
