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
    padding: 16,
    backgroundColor: theme.palette.background.default,
    height: 'calc(100vh - 316px)',
    overflowY: 'auto',
    [theme.breakpoints.down('sm')]: {
      height: 'calc(100vh - 402px)',
    },
    [theme.breakpoints.down('xs')]: {
      height: 'calc(100vh - 421px)',
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
  },
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: '1.25rem',
  },
  subTitle: { fontSize: '0.825rem', marginBottom: -4 },
  expirationNotice: {
    textAlign: 'center',
    fontSize: '0.625rem',
    marginBottom: 4,
  },
  downloadLink: { color: 'rgba(0, 0, 0, 0.54)' },
  noFilesImage: { width: 250 },
  noFilesTitle: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: '1.5rem',
  },
  noFilesSubTitle: { textAlign: 'center' },
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

  const requestResults = () => {
    if (results.length > 0) {
      results.forEach(function (result) {
        if (shouldUpdate(result)) {
          getComputeResult({ id: result.id }).then(
            (updatedResult) => {
              updateComputeResult(updatedResult.data.result);
            }
          );
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
    function shouldUpdate(result) {
      const mappedStatus = mapBackendStatus(result.status);
      if (mappedStatus === 'success') {
        var utcSeconds = result.expiresOn;
        var d = new Date(0); // sets the date to the epoch
        d.setUTCSeconds(utcSeconds);

        var today = new Date();
        if (today >= d) {
          return true;
        }
      }
      return (
        mappedStatus === 'pending' || mappedStatus === 'running'
      );
    }
  };

  useEffect(() => {
    requestResults();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const intervalId = setInterval(requestResults, 3000);
    return () => clearInterval(intervalId);
  });

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
  
  // Handle retrying a failed computation
  const handleRetryComputation = (resultId) => {
    // Find the original computation that failed
    const originalResult = results.find(r => r.id === resultId);
    
    if (originalResult) {
      // Re-open the compute dialog with the same parameters
      setIsComputeDialogOpen(true);
      // We could pre-populate form fields here if needed
    }
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
          
          // Use status mapping utility for all status rendering
          const mappedStatus = mapBackendStatus(status);
          const statusDisplay = getStatusDisplay(mappedStatus);

          if (mappedStatus === 'success') {
            return (
              <div className={classes.statusContainer}>
                <CheckCircleIcon className={`${classes.statusIcon} ${classes.successIcon}`} />
                <Typography className={classes.statusText}>{statusDisplay.label}</Typography>
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
            ? rowData.rowData[5].replace('https', 'http')
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
        <Grid item xs={12} sm={12} md={8} lg={8}>
          <Grid container>
            <Grid item>
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
            <>
              <Typography className={classes.expirationNotice}>
                Your results are listed below. They will expire after
                3 days.
              </Typography>
              <MUIDataTable
                title={'Results'}
                data={results}
                columns={columns}
                options={options}
              />
            </>
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
        onRetry={handleRetryComputation}
      />
    </>
  );
};

export default ComputePage;
