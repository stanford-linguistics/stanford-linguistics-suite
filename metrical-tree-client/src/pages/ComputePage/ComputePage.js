import React, { useState, useEffect } from 'react';
import MUIDataTable from 'mui-datatables';
import { useHistory } from 'react-router-dom';
import DownloadIcon from '@material-ui/icons/GetApp';
import ViewIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import ErrorIcon from '@material-ui/icons/Error';
import InfoIcon from '@material-ui/icons/Info';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import HourglassEmptyIcon from '@material-ui/icons/HourglassEmpty';
import ErrorDetailModal from '../../components/ErrorDetailModal';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  IconButton,
  LinearProgress,
  Tooltip,
} from '@material-ui/core';
import Moment from 'react-moment';
import 'moment-timezone';
import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import ComputeDialog from '../../components/ComputeDialog';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { useComputeResults } from 'recoil/results';
import useLazyQueryPromise from 'hooks/useLazyQueryPromise';
import { GET_RESULT_FOR_SINGLE_COMPUTE } from 'graphql/metricalTree';
import { mapBackendStatus, getStatusDisplay } from 'utils/statusMapping';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';
import { useMediaQuery } from 'react-responsive';
import { useSettings } from 'recoil/settings';
import noFilesImage from 'assets/images/noFiles.svg';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(3),
    backgroundColor: theme.palette.background.default,
    minHeight: 'calc(100vh - 236px)',
    height: 'auto',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      minHeight: 'calc(100vh - 322px)',
      padding: theme.spacing(2),
    },
    [theme.breakpoints.down('xs')]: {
      minHeight: 'calc(100vh - 360px)',
      padding: theme.spacing(1),
    },
  },
  actionIcon: {
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#3498DB',
    },
  },
  downloadIcon: {
    color: '#44AB77',
  },
  viewIcon: {
    color: '#3498DB',
  },
  deleteIcon: {
    color: '#E74C3C',
  },
  // Enhanced status indicators
  runningAnimation: {
    animation: '$pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': { opacity: 1 },
    '50%': { opacity: 0.6 },
    '100%': { opacity: 1 },
  },
  // Enhanced empty state
  emptyStateContainer: {
    textAlign: 'center',
    animation: '$fadeIn 0.5s ease-in',
    marginTop: theme.spacing(4),
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  title: { 
    fontWeight: 700, 
    fontSize: '1.35rem',
    color: '#2C3E50',
    letterSpacing: '-0.01em',
    marginTop: theme.spacing(0.5),
    marginBottom: theme.spacing(2),
  },
  subTitle: { 
    fontSize: '0.875rem', 
    marginBottom: 0,
    color: '#7f8c8d',
    letterSpacing: '0.01em',
  },
  expirationNotice: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: '#7f8c8d',
    marginBottom: theme.spacing(1),
    marginTop: theme.spacing(3),
  },
  downloadLink: { color: 'rgba(0, 0, 0, 0.54)' },
  noFilesImage: { width: 250 },
  noFilesTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: '#2C3E50',
    marginTop: theme.spacing(2),
  },
  noFilesSubTitle: { 
    textAlign: 'center',
    color: '#7f8c8d',
    marginTop: theme.spacing(1),
  },
  statusContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  statusIcon: {
    marginRight: theme.spacing(1),
    fontSize: '1.25rem',
  },
  errorIcon: {
    color: '#E74C3C',
  },
  successIcon: {
    color: '#44AB77',
  },
  pendingIcon: {
    color: '#F39C12',
  },
  runningIcon: {
    color: '#3498DB',
  },
  statusText: {
    fontWeight: 500,
  },
  errorStatusText: {
    color: '#E74C3C',
    fontWeight: 600,
  },
  statusErrorMessage: {
    fontSize: '0.75rem',
    color: '#E74C3C',
    marginTop: theme.spacing(0.5),
    display: '-webkit-box',
    '-webkit-line-clamp': 2,
    '-webkit-box-orient': 'vertical',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: 200,
  },
  infoButton: {
    padding: 2,
    color: theme.palette.info.main,
    marginLeft: theme.spacing(0.5),
  },
  computeButton: {
    margin: theme.spacing(2, 0),
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
  headerSection: {
    marginBottom: theme.spacing(3),
  },
  contentCard: {
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
}));

const ComputePage = () => {
  const classes = useStyles();
  const history = useHistory();
  const [computeDialogIsOpen, setIsComputeDialogOpen] =
    useState(false);
  const [selectedResultIdToDelete, setSelectedResultIdToDelete] =
    useState(null);
  const [
    deleteConfirmationDialogIsOpen,
    setIsDeleteConfirmationDialogOpen,
  ] = useState(false);
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [selectedErrorResult, setSelectedErrorResult] = useState(null);
  const [resultsState, { deleteComputeResult, updateComputeResult }] =
    useComputeResults();
  const isMobileDevice = useMediaQuery({
    query: '(max-width: 960px)',
  });
  const [settings] = useSettings();

  const results = resultsState.results;

  const [getComputeResult] = useLazyQueryPromise(
    GET_RESULT_FOR_SINGLE_COMPUTE,
    {
      fetchPolicy: 'no-cache',
    }
  );

  const requestResults = (forceRefreshAll = false) => {
    if (results.length > 0) {
      results.forEach(function (result) {
        // On force refresh, update ALL tasks regardless of status
        if (forceRefreshAll || shouldUpdate(result)) {
          getComputeResult({ id: result.id }).then(
            (updatedResult) => {
              updateComputeResult(updatedResult.data.result);
            }
          );
        } else {
          // Check if we need to mark a pending task as expired due to staleness
          const mappedStatus = mapBackendStatus(
            result.status,
            {
              isReliableState: result.isReliableState,
              stateDetails: result.stateDetails
            }
          );
          
          if (mappedStatus === 'pending' && isStale(result)) {
            console.warn('Marking stale pending task as expired:', result.id);
            // Mark the task as expired by updating its status
            updateComputeResult({
              ...result,
              status: 'expired',
              errorMessage: 'Task expired due to inactivity or backend reset'
            });
          }
        }
        
        const mappedStatus = mapBackendStatus(result.status);
        if (
          mappedStatus === 'expired' &&
          settings.shouldDeleteExpiredResults
        ) {
          deleteComputeResult(result.id);
        }
      });
    }
    
    // Check if a pending compute is stale (too old to be still pending)
    function isStale(result) {
      if (!result.createdOn) return false;
      
      // Consider a task stale if it's been pending for more than 10 minutes
      const STALE_THRESHOLD_MS = 45 * 60 * 1000; // 45 minutes in milliseconds
      const createdDate = new Date(result.createdOn * 1000);
      const now = new Date();
      const ageMs = now - createdDate;
      
      return ageMs > STALE_THRESHOLD_MS;
    }
    
    function shouldUpdate(result) {
      // Map status with reliability info if available
      const mappedStatus = mapBackendStatus(
        result.status, 
        {
          isReliableState: result.isReliableState,
          stateDetails: result.stateDetails
        }
      );
      
      // Check for expired results that need refreshing
      if (mappedStatus === 'success') {
        var utcSeconds = result.expiresOn;
        var d = new Date(0); // sets the date to the epoch
        d.setUTCSeconds(utcSeconds);

        var today = new Date();
        if (today >= d) {
          return true;
        }
      }
      
      // For pending tasks, check if it's still appropriate to poll
      if (mappedStatus === 'pending') {
        // If we have a reliable indication that this is actually succeeded despite
        // being reported as pending, no need to aggressively poll
        if (result.isReliableState && 
            (result.stateDetails?.resolutionMethod === 'results_json_existence' || 
             result.stateDetails?.artifactsFound?.has_json)) {
          // Success was reconstructed from artifacts, poll less frequently (return false)
          return false;
        }
        
        // Don't update stale pending tasks - they'll be marked as expired instead
        if (isStale(result)) {
          return false;
        }
      }
      
      // Default polling behavior
      return (
        mappedStatus === 'pending' || mappedStatus === 'running'
      );
    }
  };

  // Force refresh all results on mount and when page becomes visible
  useEffect(() => {
    // Initial fetch on mount - force refresh ALL tasks
    console.log('Initial page load - refreshing all task states...');
    requestResults(true);
    
    // Also refresh when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing all task states...');
        requestResults(true);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Polling for active tasks only
  useEffect(() => {
    // Only poll if there are pending/running tasks
    const hasActiveTasks = results.some(result => {
      const mappedStatus = mapBackendStatus(result.status);
      return mappedStatus === 'pending' || mappedStatus === 'running';
    });
    
    if (hasActiveTasks) {
      const intervalId = setInterval(requestResults, 3000);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results]);

  const handleComputeClick = () => {
    setIsComputeDialogOpen(true);
  };

  const handleDeleteComputation = (id) => {
    deleteComputeResult(id);
  };
  
  // Handle opening the error modal
  const handleOpenErrorModal = (resultId) => {
    const errorResult = results.find(r => r.id === resultId);
    setSelectedErrorResult(errorResult);
    setErrorModalOpen(true);
  };
  

  const columns = [
    {
      name: 'id',
      label: 'Id',
      options: {
        filter: false,
        searchable: false,
        sort: false,
        display: 'excluded',
      },
    },
    {
      name: 'name',
      label: 'Name',
      options: {
        customBodyRender: (name, rowData) => {
          const resultId = rowData.rowData[0];
          return (
            <Typography
              component="a"
              href={`/result/${resultId}`}
              style={{
                color: '#3498DB',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onClick={e => {
                e.preventDefault();
                history.push(`/result/${resultId}`);
              }}
              title="View result"
            >
              {name}
            </Typography>
          );
        }
      }
    },
    {
      name: 'createdOn',
      label: 'Created',
      options: {
        filter: false,
        sort: true,
        customBodyRender: (createdOn, rowData) => {
          if (createdOn) {
            const createdDate = new Date(createdOn * 1000).toLocaleString();
            return (
              <Typography variant="body2" color="textPrimary">
                {createdDate}
              </Typography>
            );
          } else {
            return (
              <Typography variant="body2" color="textSecondary">
                N/A
              </Typography>
            );
          }
        },
      },
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        customBodyRender: (status, rowData) => {
          // Check if there's an error
          const resultId = rowData.rowData[0];
          const result = results.find(r => r.id === resultId);
          const hasError = result && (result.error || result.errorMessage);
          
          // Use status mapping utility with enhanced reliability data
          const mappedStatus = mapBackendStatus(
            status,
            {
              isReliableState: result?.isReliableState,
              stateDetails: result?.stateDetails
            }
          );
          const statusDisplay = getStatusDisplay(mappedStatus);
          
          if (mappedStatus === 'success') {
            return (
              <div>
                <div className={classes.statusContainer}>
                  <CheckCircleIcon className={`${classes.statusIcon} ${classes.successIcon}`} />
                  <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
                </div>
              </div>
            );
          } else if (mappedStatus === 'running') {
            return (
              <div>
                <div className={classes.statusContainer}>
                  <HourglassEmptyIcon className={`${classes.statusIcon} ${classes.runningIcon} ${classes.runningAnimation}`} />
                  <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
                </div>
                <LinearProgress color="primary" />
              </div>
            );
          } else if (mappedStatus === 'pending') {
            return (
              <div>
                <div className={classes.statusContainer}>
                  <HourglassEmptyIcon className={`${classes.statusIcon} ${classes.pendingIcon} ${classes.runningAnimation}`} />
                  <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
                </div>
                <LinearProgress color="primary" variant="indeterminate" />
              </div>
            );
          } else if (mappedStatus === 'expired') {
            return (
              <div className={classes.statusContainer}>
                <ErrorIcon className={`${classes.statusIcon} ${classes.errorIcon}`} />
                <Typography className={classes.errorStatusText}>{statusDisplay.label}</Typography>
              </div>
            );
          } else if (mappedStatus === 'retry') {
            return (
              <div className={classes.statusContainer}>
                <InfoIcon className={`${classes.statusIcon} ${classes.pendingIcon}`} />
                <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
              </div>
            );
          } else if (mappedStatus === 'revoked') {
            return (
              <div className={classes.statusContainer}>
                <ErrorIcon className={`${classes.statusIcon} ${classes.errorIcon}`} />
                <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
              </div>
            );
          } else if (hasError || mappedStatus === 'failure' || mappedStatus === 'error') {
            // Format for error display
            return (
              <div>
                <div className={classes.statusContainer}>
                  <ErrorIcon className={`${classes.statusIcon} ${classes.errorIcon}`} />
                  <Typography className={classes.errorStatusText}>
                    {statusDisplay.label}
                  </Typography>
                  <IconButton 
                    className={classes.infoButton}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenErrorModal(resultId);
                    }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </div>
                {result?.errorMessage && (
                  <Typography className={classes.statusErrorMessage}>
                    {result.errorMessage}
                  </Typography>
                )}
              </div>
            );
          } else {
            // Default display for other statuses
            return (
              <Typography className={classes.statusText}>
                {statusDisplay.label}
              </Typography>
            );
          }
        },
      },
    },
    {
      name: 'expiresOn',
      label: 'Expires',
      options: {
        filter: false,
        customBodyRender: (expiresOn, rowData) => {
          return (
            <>
              {expiresOn && (
                <Moment
                  interval={10000}
                  to={new Date(0).setUTCSeconds(expiresOn)}
                />
              )}
            </>
          );
        },
      },
    },
    {
      name: 'link',
      label: 'Download Link',
      options: {
        filter: false,
        searchable: false,
        sort: false,
        display: 'excluded',
      },
    },
    {
      name: 'id',
      label: 'Actions',
      options: {
        filter: false,
        searchable: false,
        sort: false,
        customBodyRender: (id, rowData) => {
          const status = rowData.rowData[3];
          const mappedStatus = mapBackendStatus(status);
          const downloadUrl = rowData.rowData[5]
            ? rowData.rowData[5]
            : null;
          return (
            <Grid container alignItems="center">
              {mappedStatus === 'success' && downloadUrl && (
                <Grid item>
                  <Tooltip title="Download result">
                    <a
                      className={classes.downloadLink}
                      role="button"
                      href={downloadUrl}
                      download
                      tabIndex={0}
                    >
                      <DownloadIcon
                        style={{ marginTop: 4 }}
                        className={`${classes.actionIcon} ${classes.downloadIcon}`}
                      />
                    </a>
                  </Tooltip>
                </Grid>
              )}
              {mappedStatus === 'success' && (
                <Grid item>
                  <Tooltip title="View result">
                    <IconButton
                      size="small"
                      onClick={() => history.push(`/result/${id}`)}
                      className={classes.actionIcon}
                    >
                      <ViewIcon className={classes.viewIcon} />
                    </IconButton>
                  </Tooltip>
                </Grid>
              )}
              <Grid item>
                <Tooltip title="Delete computation">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedResultIdToDelete(id);
                      if (mappedStatus !== 'expired') {
                        setIsDeleteConfirmationDialogOpen(true);
                      } else {
                        deleteComputeResult(id);
                      }
                    }}
                    className={classes.actionIcon}
                  >
                    <DeleteIcon className={classes.deleteIcon} />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          );
        },
      },
    },
  ];

  // State for table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobileDevice ? 3 : 10);

  // Handle page change
  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const options = {
    selectableRowsHeader: false,
    selectableRows: 'none',
    selectableRowsOnClick: false,
    print: false,
    search: false,
    filter: false,
    download: false,
    viewColumns: false,
    rowsPerPageOptions: [3, 5, 10, 25],
    rowsPerPage: rowsPerPage,
    page: page,
    count: results.length,
    serverSide: false,
    onPageChange: handleChangePage,
    onRowsPerPageChange: handleChangeRowsPerPage,
    setRowProps: () => ({
      style: {
        cursor: 'pointer',
        transition: 'background 0.2s',
      },
      onMouseOver: e => {
        e.currentTarget.style.background = 'rgba(52, 152, 219, 0.08)';
      },
      onMouseOut: e => {
        e.currentTarget.style.background = '';
      },
    }),
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
                Compute
              </Typography>
              <Typography>
                Click the button below to begin analysis of text.
              </Typography>
              <StyledButtonPrimary
                label={'Compute'}
                onClick={handleComputeClick}
                className={classes.computeButton}
              />
            </Grid>
          </Grid>
          
          {results.length > 0 && (
            <Grid item xs={12}>
              <div className={classes.contentCard}>
                <Typography className={classes.expirationNotice}>
                  Your results are listed below. They will expire after 3 days.
                </Typography>
                <MUIDataTable
                  title={'Results'}
                  data={results}
                  columns={columns}
                  options={options}
                />
              </div>
            </Grid>
          )}
          
          {results.length < 1 && (
            <Grid container justifyContent="center" className={classes.emptyStateContainer}>
              <img
                className={classes.noFilesImage}
                src={noFilesImage}
                alt={'Woman analyzing charts'}
              />
              <Grid item xs={12}>
                <Typography className={classes.noFilesTitle}>
                  You have no computations.
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography className={classes.noFilesSubTitle}>
                  Click the compute button above to begin analysis.
                </Typography>
              </Grid>
            </Grid>
          )}
        </Grid>
      </Grid>
      <SecondaryFooter />
      <PrimaryFooter />
      <ComputeDialog
        isOpen={computeDialogIsOpen}
        setIsOpen={setIsComputeDialogOpen}
      />
      <DeleteConfirmationDialog
        isOpen={deleteConfirmationDialogIsOpen}
        setIsOpen={setIsDeleteConfirmationDialogOpen}
        title={'Delete Computation'}
        content={
          'You are deleting this computation. This action cannot be undone.'
        }
        handleSubmit={() => {
          handleDeleteComputation(selectedResultIdToDelete);
          setSelectedResultIdToDelete(null);
          setIsDeleteConfirmationDialogOpen(false);
        }}
      />
      {/* Error details modal */}
      <ErrorDetailModal
        open={errorModalOpen}
        onClose={() => setErrorModalOpen(false)}
        errorResult={selectedErrorResult}
      />
    </>
  );
};

export default ComputePage;
