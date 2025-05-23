import React, { useState, useRef, useEffect } from 'react';
import ResultErrorDisplay from 'components/ResultErrorDisplay/ResultErrorDisplay';
import { useHistory, useParams } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import LargeResultNotice from './components/LargeResultNotice';
import {
  Grid,
  Typography,
  Link,
  Card,
  Select,
  MenuItem,
  Chip,
  Collapse,
  IconButton,
  Divider,
  LinearProgress
} from '@material-ui/core';
import CrispTooltip from '../../components/CrispTooltip';
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
import { mapBackendStatus, getStatusDisplay } from 'utils/statusMapping';
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
    textDecoration: 'none',
    '&:hover': { 
      cursor: 'pointer', 
      color: theme.palette.primary.dark,
      textDecoration: 'underline',
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
  exportLinksContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      flexDirection: 'row',
      gap: theme.spacing(2),
    },
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
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(2),
    },
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1.5),
      marginBottom: theme.spacing(2),
    },
  },
  cardTitle: { 
    fontWeight: 600,
    color: '#2C3E50',
    fontSize: '1.1rem',
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: '1rem',
      marginBottom: theme.spacing(1.5),
    },
  },
  titleIcon: {
    marginRight: theme.spacing(1.5),
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(68, 171, 119, 0.08)',
    padding: theme.spacing(0.75),
    borderRadius: '50%',
    [theme.breakpoints.down('xs')]: {
      marginRight: theme.spacing(1),
      padding: theme.spacing(0.5),
      fontSize: '1.2rem',
    },
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
  headerActions: {
    display: 'flex',
    justifyContent: 'flex-start',
    [theme.breakpoints.up('sm')]: {
      justifyContent: 'flex-end',
    },
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
          // CRITICAL: Preserve all normalized values for contour line calculation
          norm_mean: row.norm_mean,   // For normalized contour line
          norm_m1: row.norm_m1,
          norm_m2a: row.norm_m2a,
          norm_m2b: row.norm_m2b,
          // Also preserve raw values for non-normalized contour
          mean: row.mean,
          m1: row.m1,
          m2a: row.m2a,
          m2b: row.m2b,
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

  const [resultsState, { updateComputeResult }] = useComputeResults();

  const {
    loading,
    // error is unused
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
  
  // Check if this is a stale pending task that should be marked expired
  useEffect(() => {
    // Only check after data is loaded and if the status is pending
    if (!loading && mergedResult?.status?.toLowerCase() === 'pending') {
      const isStale = checkIfStale(mergedResult);
      if (isStale) {
        console.warn('Marking stale pending task as expired on result page:', mergedResult.id);
        // Update the merged result and recoil state
        updateComputeResult({
          ...mergedResult,
          status: 'expired',
          errorMessage: 'Task expired due to inactivity or backend reset'
        });
      }
    }
  }, [loading, mergedResult, updateComputeResult]);
  
  // Function to determine if a pending task is stale
  const checkIfStale = (result) => {
    if (!result.createdOn) return false;
    
    // Consider a task stale if it's been pending for more than 10 minutes
    const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes in milliseconds
    const createdDate = new Date(result.createdOn * 1000);
    const now = new Date();
    const ageMs = now - createdDate;
    
    return ageMs > STALE_THRESHOLD_MS;
  };
  
  // Use the data array directly from the response
  const graphOptions = getGraphOptions(mergedResult.data);
  

  useEffect(() => {
    // Only set the default model when:
    // 1. No model is currently selected
    // 2. GraphQL query has completed (not loading)
    // 3. We have graph options available
    // 4. The data is actually available
    if (!selectedModel && !loading && graphOptions.length > 0 && data?.result?.data) {
      const defaultModel = graphOptions.find(
        (option) => option.value[0].label === 'm2a'
      );
      
      // Verify the model has actual data before setting it
      if (defaultModel && defaultModel.value[0]?.data?.length > 0) {
        setSelectedModel(defaultModel);
      }
    }
  }, [graphOptions, selectedModel, loading, data]);

  // Enhanced results table has replaced the previous MUIDataTable

  // Check if the result contains an error
  const hasError = mergedResult?.errorMessage || mergedResult?.error;

  // Map backend status to canonical frontend status, with enhanced reliability info
  const mappedStatus = mapBackendStatus(
    mergedResult?.status,
    {
      isReliableState: mergedResult?.isReliableState,
      stateDetails: mergedResult?.stateDetails
    }
  );
  const statusDisplay = getStatusDisplay(mappedStatus);
  
  // Handler for retry button
  const handleRetry = () => {
    history.push('/compute');
  };

  // UI for status
  let statusUI = null;
  if (mappedStatus === 'pending' || mappedStatus === 'running') {
    statusUI = (
      <Grid item xs={12}>
        <Card className={classes.card}>
          <Typography variant="h6" className={classes.cardTitle}>
            {statusDisplay.label}
          </Typography>
          <Typography>
            Your analysis is {mappedStatus === 'pending' ? 'queued and waiting to start.' : 'currently running.'}
          </Typography>
          <LinearProgress color="primary" style={{ marginTop: 16 }} />
        </Card>
      </Grid>
    );
  } else if (mappedStatus === 'expired') {
    statusUI = (
      <Grid item xs={12}>
        <Card className={classes.card}>
          <Typography variant="h6" className={classes.cardTitle}>
            {statusDisplay.label}
          </Typography>
          <Typography>
            Your results have expired. Please recompute to generate new results.
          </Typography>
          <StyledButtonPrimary
            label={'Back to Compute'}
            onClick={handleRetry}
            className={classes.button}
          />
        </Card>
      </Grid>
    );
  } else if (mappedStatus === 'retry') {
    statusUI = (
      <Grid item xs={12}>
        <Card className={classes.card}>
          <Typography variant="h6" className={classes.cardTitle}>
            {statusDisplay.label}
          </Typography>
          <Typography>
            The system is retrying your analysis after a failure. Please wait or try again later.
          </Typography>
        </Card>
      </Grid>
    );
  } else if (mappedStatus === 'revoked') {
    statusUI = (
      <Grid item xs={12}>
        <Card className={classes.card}>
          <Typography variant="h6" className={classes.cardTitle}>
            {statusDisplay.label}
          </Typography>
          <Typography>
            This analysis was cancelled. Please recompute if you wish to try again.
          </Typography>
          <StyledButtonPrimary
            label={'Back to Compute'}
            onClick={handleRetry}
            className={classes.button}
          />
        </Card>
      </Grid>
    );
  }

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
                {mappedStatus === 'success' &&
                  mergedResult?.link && (
                    <CrispTooltip title="Download results zip file (includes raw, enhanced, and analysis files)">
                      <Link
                        className={classes.link}
                        href={mergedResult.link}
                        target="_blank" // Optional: open in new tab
                        rel="noopener noreferrer"
                        style={{ cursor: 'pointer' }}>
                        <Typography className={classes.linkText}>
                          <i className="fas fa-file-archive" style={{ marginRight: '4px', fontSize: '0.8rem' }}></i>
                          Download Results (.zip)
                        </Typography>
                      </Link>
                    </CrispTooltip>
                  )}
              </div>
            </Grid>
            <Grid item xs={12} sm={4} container className={classes.headerActions}> 
              <StyledButtonPrimary
                label={'Back'}
                onClick={() => {
                  history.push('/compute');
                }}
                className={classes.button}
              />
            </Grid>
          </Grid>
          {/* Display error if present */}
          {hasError && (
            <Grid item xs={12}>
              <ResultErrorDisplay 
                error={mergedResult} 
                onRetry={handleRetry}
              />
            </Grid>
          )}
          {/* Show status UI for non-success, non-error states */}
          {!hasError && mappedStatus !== 'success' && statusUI}
          {/* Main content - only show if success and no error */}
          {!hasError && mappedStatus === 'success' && mergedResult.isLargeDataset && (
            <Grid container>
              <Grid item xs={12}>
                <LargeResultNotice result={mergedResult} />
              </Grid>
            </Grid>
          )}
          {/* Main content - only show if success, no error, and not a large result */}
          {!hasError && mappedStatus === 'success' && !mergedResult.isLargeDataset && (
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
                    <CrispTooltip title="SPE (Sound Pattern of English) numbers transformed to grid notation">
                      <Typography 
                        variant="h6" 
                        className={classes.cardTitle}
                      >
                        <AssessmentIcon className={classes.titleIcon} />
                        Normal Stress Contour
                      </Typography>
                    </CrispTooltip>
                    {selectedModel && (
                      <Typography 
                        variant="subtitle1" 
                        className={classes.modelLabel}
                      >
                        <CrispTooltip title="Currently selected model">
                          <TuneIcon className={classes.modelIcon} />
                        </CrispTooltip>
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
                  <Grid item xs={12}>
                    <ResultsGraph
                      ref={graphResultToPrintRef}
                      model={selectedModel}
                      fullApiResponse={mergedResult} // Pass full API response to access sentences data
                      downloadLink={mergedResult?.link} // Pass download link for CSV export
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
          )}
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
