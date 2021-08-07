import React, { useState, useEffect } from 'react';
import MUIDataTable from 'mui-datatables';
import { useHistory } from 'react-router-dom';
import DownloadIcon from '@material-ui/icons/GetApp';
import ViewIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles, createTheme } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Button,
  IconButton,
  LinearProgress,
} from '@material-ui/core';
import Moment from 'react-moment';
import 'moment-timezone';

import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import { MuiThemeProvider } from '@material-ui/core';
import ComputeDialog from '../../components/ComputeDialog';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { useComputeResults } from 'recoil/results';
import useLazyQueryPromise from 'hooks/useLazyQueryPromise';
import { GET_RESULT_FOR_SINGLE_COMPUTE } from 'graphql/metricalTree';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 80,
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
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: '1.25rem',
  },
  subTitle: { fontSize: '0.625rem', marginBottom: -4 },
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
  expirationNotice: {
    textAlign: 'center',
    fontSize: '0.625rem',
    marginBottom: 4,
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
  const [resultsState, { deleteComputeResult, updateComputeResult }] =
    useComputeResults();

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
              console.log(
                'UPDATED RESULT: ',
                updatedResult.data.result
              );
              updateComputeResult(updatedResult.data.result);
            }
          );
        }
        if (
          result.status === 'EXPIRED'
          //&&shouldDeleteExpiredTorders
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

  const theme = createTheme({
    overrides: {
      MUIDataTableToolbar: { root: { display: 'none' } },
      MUIDataTableHeadCell: {
        root: { padding: '8px 0 8px 16px', fontWeight: 'bold' },
      },
      MUIDataTableBodyCell: { root: { padding: '0 0 0 8px' } },
    },
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
                // TODO: Fix color
                <LinearProgress color="secondary" />
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
            ? rowData.rowData[4].replace('https', 'http')
            : null;
          return (
            <Grid container justifyContent="flex-end">
              {downloadUrl && (
                <Grid item>
                  <a
                    title="Download"
                    role="button"
                    href={downloadUrl}
                    download>
                    <DownloadIcon />
                  </a>
                </Grid>
              )}

              <Grid item>
                <IconButton
                  size="small"
                  onClick={() => history.push('/')}>
                  <ViewIcon />
                </IconButton>
              </Grid>
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
  };

  return (
    <>
      <MuiThemeProvider theme={theme}>
        <IdentityBar />
        <Appbar />
        <Grid
          container
          justifyContent="center"
          className={classes.container}>
          <Grid item xs={10} sm={10} md={8} lg={8}>
            <Typography className={classes.subTitle}>
              Metrical Tree
            </Typography>
            <Typography className={classes.title}>Compute</Typography>
            <Typography>
              Click the button below to begin analysis of text.
            </Typography>
            <Button
              onClick={handleComputeClick}
              className={classes.button}>
              <Typography className={classes.buttonLabel}>
                Compute
              </Typography>
            </Button>
            <Typography className={classes.expirationNotice}>
              Your results are listed below. They will expire after 3
              days.
            </Typography>
            <MUIDataTable
              title={'Results'}
              data={results}
              columns={columns}
              options={options}
            />
          </Grid>
        </Grid>
        <SecondaryFooter />
        <PrimaryFooter />
      </MuiThemeProvider>
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
