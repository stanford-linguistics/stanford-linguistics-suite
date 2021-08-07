import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { makeStyles } from '@material-ui/core/styles';
import GetAppIcon from '@material-ui/icons/GetApp';
import {
  Grid,
  Typography,
  Button,
  Link,
  Card,
  Select,
  MenuItem,
} from '@material-ui/core';

import IdentityBar from '../../components/IdentityBar';
import Appbar from '../../components/Appbar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import AddGraphDialog from '../../components/AddGraphDialog';
import DeleteConfirmationDialog from '../../components/DeleteConfirmationDialog/DeleteConfirmationDialog';

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
  title: { fontWeight: 'bold', fontSize: '1.25rem' },
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
  link: {
    color: '#44AB77',
    fontWeight: 'bold',
    '&:hover': { cursor: 'pointer', color: '#44AB77' },
  },
  linkText: { fontSize: '0.75rem' },
  downloadIcon: { fontSize: '1rem', marginTop: 3 },
  card: { padding: theme.spacing(2), marginTop: theme.spacing(2) },
  cardTitle: { fontWeight: 'bold' },
  graphCard: { margin: theme.spacing(2, 0, 1, 0) },
}));

const ResultPage = () => {
  const classes = useStyles();
  const history = useHistory();
  const [addGraphDialogIsOpen, setIsAddGraphDialogOpen] =
    useState(false);
  const [
    deleteConfirmationDialogIsOpen,
    setIsDeleteConfirmationDialogOpen,
  ] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm();

  // TODO: Connection on create graph
  const onSubmit = (data) => console.log(data);

  const daysUntilExpiration = 2;

  const graphs = [
    {
      id: 0,
      name: 'Test Graph 1',
    },
    {
      id: 1,
      name: 'Test Graph 2',
    },
  ];

  // TODO: Connection on delete graph
  const handleDeleteGraph = () => {
    console.log('HANDLE DELETE GRAPH');
  };

  // TODO: Download
  const handleDownloadRawResults = () => {
    console.log('DOWNLOAD RAW RESULTS');
  };

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justifyContent="center"
        className={classes.container}>
        <Grid item xs={10} sm={10} md={10} lg={8}>
          <Grid container justifyContent="space-between">
            <Grid item>
              <Typography className={classes.subTitle}>
                Metrical Tree
              </Typography>
              <Typography className={classes.title}>
                [NAME] expires in {daysUntilExpiration} days
              </Typography>
              <Link
                className={classes.link}
                underline="always"
                onClick={handleDownloadRawResults}>
                <Grid container direction="row">
                  <Grid item>
                    <GetAppIcon className={classes.downloadIcon} />
                  </Grid>
                  <Grid item>
                    <Typography className={classes.linkText}>
                      Download Raw Results
                    </Typography>
                  </Grid>
                </Grid>
              </Link>
            </Grid>
            <Grid item>
              <Button
                onClick={() => {
                  history.push('/compute');
                }}
                className={classes.button}>
                <Typography className={classes.buttonLabel}>
                  Back
                </Typography>
              </Button>
            </Grid>
          </Grid>
          <Grid container>
            <Grid item xs={12}>
              <Card className={classes.card}>
                <Grid
                  container
                  direction="row"
                  spacing={1}
                  alignItems="center">
                  <Grid item>
                    <Typography className={classes.cardTitle}>
                      Graphs
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Button
                      style={{ marginBottom: 0 }}
                      onClick={() => {
                        setIsAddGraphDialogOpen(true);
                      }}
                      className={classes.button}>
                      <Typography className={classes.buttonLabel}>
                        Add Graph
                      </Typography>
                    </Button>
                  </Grid>
                </Grid>
                <Grid container direction="row" spacing={2}>
                  {graphs.map((graph) => (
                    <Grid
                      key={graph.id}
                      item
                      xs={12}
                      sm={12}
                      md={6}
                      lg={6}>
                      <form onSubmit={handleSubmit(onSubmit)}>
                        <section>
                          <label>
                            <Typography>Model</Typography>
                          </label>
                          <Controller
                            render={({ field }) => (
                              <Select
                                {...field}
                                className={classes.select}
                                variant="outlined"
                                margin="dense"
                                fullWidth>
                                {/* TODO: Handle model options */}
                                <MenuItem value={10}>Ten</MenuItem>
                                <MenuItem value={20}>Twenty</MenuItem>
                                <MenuItem value={30}>Thirty</MenuItem>
                              </Select>
                            )}
                            name="Select"
                            control={control}
                          />
                        </section>
                      </form>
                      <Card className={classes.graphCard}>
                        [GRAPH]
                      </Card>
                      <Grid container justifyContent="flex-end">
                        <Button
                          style={{ marginBottom: 0 }}
                          onClick={() =>
                            setIsDeleteConfirmationDialogOpen(true)
                          }
                          className={classes.button}>
                          <Typography className={classes.buttonLabel}>
                            Delete Graph
                          </Typography>
                        </Button>
                      </Grid>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card className={classes.card}>
                <Typography className={classes.cardTitle}>
                  Results
                </Typography>
              </Card>
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
      <DeleteConfirmationDialog
        isOpen={deleteConfirmationDialogIsOpen}
        setIsOpen={setIsDeleteConfirmationDialogOpen}
        title={'Delete Graph'}
        content={
          ' You are deleting the graph [NAME]. This action cannot be undone.'
        }
        handleSubmit={handleDeleteGraph}
      />
    </>
  );
};

export default ResultPage;
