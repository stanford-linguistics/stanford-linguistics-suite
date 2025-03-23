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
  Tooltip,
  Collapse,
  IconButton,
  Divider
} from '@material-ui/core';
import {
  Tune as TuneIcon,
  AssessmentOutlined as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
} from '@material-ui/icons';

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
import EnhancedResultsTable from './components/EnhancedResultsTable';
import ResultsGraph from 'components/ResultsGraph';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(3),
    minHeight: 'calc(100vh - 236px)',
    height: 'auto',
    backgroundColor: theme.palette.background.default,
    [theme.breakpoints.down('sm')]: {
      minHeight: 'calc(100vh - 322px)',
      padding: theme.spacing(2),
    },
    [theme.breakpoints.down('xs')]: {
      minHeight: 'calc(100vh - 360px)',
      padding: theme.spacing(1),
    },
  },
  contentContainer: {
    maxWidth: '100%',
    overflowX: 'hidden',
  },
  headerSection: {
    marginBottom: theme.spacing(3),
  },
  title: { 
    fontWeight: 700, 
    fontSize: '1.35rem',
    color: '#2C3E50',
    letterSpacing: '-0.01em',
    marginTop: theme.spacing(0.5),
  },
  subTitle: { 
    fontSize: '0.875rem', 
    marginBottom: 0,
    color: '#7f8c8d',
    letterSpacing: '0.01em',
  },
  metadata: {
    marginTop: theme.spacing(1),
  },
  button: {
    margin: theme.spacing(1, 0),
    borderRadius: 32,
    backgroundColor: theme.palette.primary.main,
    boxShadow: '0 2px 8px rgba(68, 171, 119, 0.25)',
    padding: theme.spacing(1, 3),
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: '0 4px 12px rgba(68, 171, 119, 0.3)',
      transform: 'translateY(-1px)',
    },
  },
  buttonLabel: {
    color: 'white',
    textTransform: 'uppercase',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    letterSpacing: '0.05em',
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 600,
    display: 'inline-flex',
    alignItems: 'center',
    position: 'relative',
    textDecoration: 'none',
    '&:hover': { 
      cursor: 'pointer', 
      color: theme.palette.primary.dark,
      textDecoration: 'underline',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      width: '100%',
      transform: 'scaleX(0)',
      height: '1px',
      bottom: 0,
      left: 0,
      backgroundColor: theme.palette.primary.main,
      transformOrigin: 'bottom right',
      transition: 'transform 0.25s ease-out',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
      transformOrigin: 'bottom left',
    },
  },
  linkText: { 
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
  },
  downloadIcon: {
    fontSize: '1rem',
    marginRight: theme.spacing(0.5),
  },
  card: { 
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
    borderRadius: theme.spacing(1),
    boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    transition: 'all 0.2s ease',
    border: '1px solid rgba(0, 0, 0, 0.05)',
    overflow: 'visible',
    '&:hover': {
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    },
  },
  cardTitle: { 
    fontWeight: 600,
    color: '#2C3E50',
    fontSize: '1.1rem',
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(68, 171, 119, 0.08)',
    padding: theme.spacing(0.75),
    borderRadius: '50%',
  },
  graphCard: { 
    margin: theme.spacing(2, 0, 1, 0) 
  },
  section: { 
    marginBottom: theme.spacing(3) 
  },
  parameterGroup: {
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
  },
  parameterName: { 
    display: 'inline', 
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#34495e',
    marginRight: theme.spacing(0.75),
  },
  parameterWordChip: { 
    margin: theme.spacing(0.5),
    borderRadius: 16,
    backgroundColor: 'rgba(68, 171, 119, 0.08)',
    border: '1px solid rgba(68, 171, 119, 0.2)',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: 'rgba(68, 171, 119, 0.12)',
      border: '1px solid rgba(68, 171, 119, 0.3)',
    },
  },
  expand: {
    transform: 'rotate(0deg)',
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.standard,
    }),
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(68, 171, 119, 0.08)',
    padding: 6,
    '&:hover': {
      backgroundColor: 'rgba(68, 171, 119, 0.15)',
    },
  },
  expandOpen: {
    transform: 'rotate(180deg)',
  },
  parameterSection: {
    marginTop: theme.spacing(3),
    paddingTop: theme.spacing(2),
  },
  parameterHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: theme.spacing(1, 0),
    borderRadius: theme.spacing(0.5),
    transition: 'all 0.15s ease',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
  },
  modelSelector: {
    backgroundColor: 'white',
    borderRadius: theme.spacing(0.75),
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
    },
  },
  modelSelectorCaption: {
    fontWeight: 600,
    marginBottom: theme.spacing(0.5),
    color: '#34495e',
  },
  modelLabel: {
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.primary.main,
    fontWeight: 500,
    marginTop: theme.spacing(0.5),
  },
  modelIcon: {
    fontSize: '0.9rem',
    marginRight: theme.spacing(0.5),
    opacity: 0.7,
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
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
          // Preserve linguistic metadata for statistics
          pos: row.pos,               // For POS distribution
          lexstress: row.lexstress,   // For stress distribution
          nsyll: row.nsyll,           // For syllable counts
          // Additional useful fields for debugging/display
          widx: row.widx,
          sent: row.sent,
          dep: row.dep,
          seg: row.seg
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
  const [parametersExpanded, setParametersExpanded] = useState(false);
  
  const handleExpandClick = () => {
    setParametersExpanded(!parametersExpanded);
  };

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


  const graphOptions = getGraphOptions(mergedResult.data);

  useEffect(() => {
    if (!selectedModel && graphOptions.length > 0) {
      const defaultModel = graphOptions.find(
        (option) => option.value[0].label === 'm2a'
      );
      setSelectedModel(defaultModel);
    }
  }, [graphOptions, selectedModel]);

  // Enhanced results table has replaced the previous MUIDataTable

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justifyContent="center"
        className={classes.container}>
        <Grid item xs={12}>
          <Grid 
            container 
            spacing={2}
            direction="row"
            justifyContent="space-between" 
            alignItems="flex-start" 
            className={classes.headerSection}
          >
            <Grid item xs={12} sm={8}>
              <Typography className={classes.subTitle}>
                Metrical Tree
              </Typography>
              <Typography className={classes.title}>
                {mergedResult?.name ?? 'Compute Result'}
              </Typography>
              
              <div className={classes.metadata}>
                {mergedResult?.expiresOn && (
                  <Typography variant="subtitle2" style={{ color: '#7f8c8d', fontSize: '0.8rem' }}>
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
                      href={mergedResult.link.replace('https', 'http')} //TODO: Remove this for prod
                      download>
                      <Typography className={classes.linkText}>
                        <i className="fas fa-download" style={{ marginRight: '4px', fontSize: '0.8rem' }}></i>
                        Download Raw Results
                      </Typography>
                    </Link>
                  )}
              </div>
            </Grid>
            <Grid item xs={12} sm={4} container justifyContent={{xs: 'flex-start', sm: 'flex-end'}}>
              <StyledButtonPrimary
                label={'Back'}
                onClick={() => {
                  history.push('/compute');
                }}
                className={classes.button}
              />
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={12} className={classes.section}>
              <Card className={classes.card}>
                <Grid
                  container
                  direction="row"
                  spacing={2}
                  alignItems="flex-start"
                  justifyContent="space-between"
                  className={classes.contentContainer}>
                  <Grid item xs={12} sm={6} md={6}>
                    <Typography 
                      variant="h6" 
                      className={classes.cardTitle}
                    >
                      <AssessmentIcon className={classes.titleIcon} />
                      Linguistic Analysis
                    </Typography>
                    {selectedModel && (
                      <Typography 
                        variant="subtitle1" 
                        className={classes.modelLabel}
                      >
                        <Tooltip title="Currently selected model">
                          <TuneIcon className={classes.modelIcon} />
                        </Tooltip>
                        {selectedModel.label}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6} md={4} lg={3}>
                    <Typography 
                      variant="caption" 
                      className={classes.modelSelectorCaption}
                    >
                      Select Model:
                    </Typography>
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
                      fullWidth
                      className={classes.modelSelector}
                      MenuProps={{
                        PaperProps: {
                          style: { maxHeight: 300 }
                        }
                      }}
                    >
                      {graphOptions.map((option, index) => {
                        // Determine if this is a raw or normalized model for icon selection
                        const isRaw = option.label.includes('raw');
                        const isSeries = option.label.includes('Series');
                        
                        return (
                          <MenuItem 
                            key={index} 
                            value={option.label}
                            style={{
                              borderLeft: selectedModel?.label === option.label ? 
                                '3px solid #3498DB' : '3px solid transparent',
                              backgroundColor: selectedModel?.label === option.label ?
                                'rgba(52, 152, 219, 0.1)' : 'transparent'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <i 
                                className={isSeries ? 
                                  "fas fa-layer-group" : 
                                  isRaw ? "fas fa-chart-bar" : "fas fa-percentage"} 
                                style={{ 
                                  marginRight: '8px',
                                  color: isSeries ? '#9b59b6' : isRaw ? '#e74c3c' : '#2ecc71',
                                  fontSize: '14px'
                                }}
                              ></i>
                              <Typography style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                                {option.label}
                              </Typography>
                            </div>
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </Grid>
                </Grid>
                <Grid container justifyContent="center">
                  <Grid item>
                    <ResultsGraph
                      ref={graphResultToPrintRef}
                      model={selectedModel}
                    />
                  </Grid>
                </Grid>
                
                {/* Parameters Section - Collapsible */}
                <div className={classes.parameterSection}>
                  <Divider />
                  <div 
                    className={classes.parameterHeader}
                    onClick={handleExpandClick}
                  >
                    <Typography 
                      variant="subtitle1" 
                      style={{ 
                        fontWeight: 'bold',
                        color: '#2C3E50',
                        fontSize: '0.9rem',
                      }}
                    >
                      Analysis Parameters
                    </Typography>
                    <IconButton
                      className={`${classes.expand} ${parametersExpanded ? classes.expandOpen : ''}`}
                      aria-expanded={parametersExpanded}
                      aria-label="show parameters"
                      size="small"
                    >
                      <ExpandMoreIcon />
                    </IconButton>
                  </div>
                  <Collapse in={parametersExpanded} timeout="auto" unmountOnExit>
                    <Grid container style={{ marginTop: '8px' }}>
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
                  </Collapse>
                </div>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <EnhancedResultsTable mergedResult={mergedResult} />
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
