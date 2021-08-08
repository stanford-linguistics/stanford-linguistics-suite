import React, { useState, useEffect } from 'react';
import MUIDataTable from 'mui-datatables';
import { useHistory } from 'react-router-dom';
import DownloadIcon from '@material-ui/icons/GetApp';
import ViewIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  IconButton,
  LinearProgress,
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
        if (
          result.status === 'EXPIRED' &&
          settings.shouldDeleteExpiredResults
        ) {
          deleteComputeResult(result.id);
        }
      });
    }
    function shouldUpdate(result) {
      if (result.status === 'SUCCESS') {
        var utcSeconds = result.expiresOn;
        var d = new Date(0); // sets the date to the epoch
        d.setUTCSeconds(utcSeconds);

        var today = new Date();
        if (today >= d) {
          return true;
        }
      }
      return (
        result.status === 'PENDING' || result.status === 'RUNNING'
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
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        customBodyRender: (status, rowData) => {
          return (
            <>
              <Typography>{status}</Typography>
              {(status === 'RUNNING' || status === 'PENDING') && (
                <LinearProgress color="primary" />
              )}
            </>
          );
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
          const status = rowData.rowData[2];
          const downloadUrl = rowData.rowData[4]
            ? rowData.rowData[4].replace('https', 'http') //TODO: Remove this for prod
            : null;
          return (
            <Grid container alignItems="center">
              {status === 'SUCCESS' && downloadUrl && (
                <Grid item>
                  <a
                    className={classes.downloadLink}
                    title="Download"
                    role="button"
                    href={downloadUrl}
                    download>
                    <DownloadIcon style={{ marginTop: 4 }} />
                  </a>
                </Grid>
              )}
              {status === 'SUCCESS' && (
                <Grid item>
                  <IconButton
                    size="small"
                    onClick={() => history.push(`/result/${id}`)}>
                    <ViewIcon />
                  </IconButton>
                </Grid>
              )}

              <Grid item>
                <IconButton
                  size="small"
                  onClick={() => {
                    setSelectedResultIdToDelete(id);
                    if (status !== 'EXPIRED') {
                      setIsDeleteConfirmationDialogOpen(true);
                    } else {
                      deleteComputeResult(id);
                    }
                  }}>
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          );
        },
      },
    },
  ];

  const options = {
    selectableRowsHeader: false,
    selectableRows: 'none',
    selectableRowsOnClick: false,
    print: false,
    search: false,
    filter: false,
    download: false,
    viewColumns: false,
    rowsPerPageOptions: [],
    rowsPerPage: isMobileDevice ? 3 : 10,
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
            <Grid container justifyContent="center">
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
    </>
  );
};

export default ComputePage;
