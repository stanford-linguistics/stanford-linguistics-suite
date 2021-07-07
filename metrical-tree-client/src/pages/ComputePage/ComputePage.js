import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import MUIDataTable from 'mui-datatables';
import DownloadIcon from '@material-ui/icons/GetApp';
import ViewIcon from '@material-ui/icons/Visibility';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles, createMuiTheme } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  Button,
  IconButton,
} from '@material-ui/core';

import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import { UPLOAD_METRICAL_TREE_FILE } from '../../graphql/metricalTree';
import { MuiThemeProvider } from '@material-ui/core';
import ComputeDialog from '../../components/ComputeDialog';

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
  const [computeDialogIsOpen, setIsComputeDialogOpen] =
    useState(false);

  const theme = createMuiTheme({
    overrides: {
      MUIDataTableToolbar: { root: { display: 'none' } },
      MUIDataTableHeadCell: {
        root: { padding: '8px 0 8px 16px', fontWeight: 'bold' },
      },
      MUIDataTableBodyCell: { root: { padding: '0 0 0 8px' } },
    },
  });

  // TODO: GET FILES
  const files = [
    {
      id: 'file-abc',
    },
  ];

  const [uploadFile, { data }] = useMutation(
    UPLOAD_METRICAL_TREE_FILE
  );
  console.log('Data: ', data);

  const handleComputeClick = () => {
    setIsComputeDialogOpen(true);
  };

  const handleUpload = () => {
    const blob = new Blob(['Hello, this is a test input'], {
      type: 'text/plain',
    });
    var fileOfBlob = new File([blob], 'input.txt', {
      type: 'text/plain',
    });
    uploadFile({
      variables: {
        file: fileOfBlob,
      },
    });
  };

  const columns = [
    {
      name: 'id',
      label: 'Id',
      options: {
        filter: false,
        display: 'excluded',
      },
    },
    {
      name: 'id',
      label: '#',
      options: {
        filter: false,
        searchable: false,
        sort: false,
      },
    },
    {
      name: 'id',
      label: 'Name',
      options: {
        filter: false,
        searchable: false,
        sort: false,
      },
    },
    {
      name: 'id',
      label: 'Status',
      options: {
        filter: false,
        searchable: false,
        sort: false,
      },
    },
    {
      name: 'id',
      label: 'Expires',
      options: {
        filter: false,
        searchable: false,
        sort: false,
      },
    },
    {
      name: 'id',
      label: ' ',
      options: {
        filter: false,
        searchable: false,
        sort: false,
        customBodyRender: (id, rowData) => {
          return (
            <Grid container justify="flex-end">
              <Grid item>
                <IconButton size="small">
                  <DownloadIcon />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton size="small">
                  <ViewIcon />
                </IconButton>
              </Grid>
              <Grid item>
                <IconButton size="small">
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
          justify="center"
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
              data={files}
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
    </>
  );
};

export default ComputePage;
