import React, { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
//import { useForm } from 'react-hook-form';
import { makeStyles } from '@material-ui/core/styles';
//import GetAppIcon from '@material-ui/icons/GetApp';
import {
  Grid,
  Typography,
  //Button,
  Link,
  Card,
  // Select,
  // MenuItem,
} from '@material-ui/core';
import { Chart } from 'react-charts';
import ResizableBox from 'components/ResizableBox';

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
}));

const ResultPage = () => {
  const classes = useStyles();
  const history = useHistory();
  const { resultId } = useParams();
  const [addGraphDialogIsOpen, setIsAddGraphDialogOpen] =
    useState(false);

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

  //const { handleSubmit, control } = useForm();

  // const onSubmit = (data) => {
  //   console.log(data);
  // };

  // const handleDeleteGraph = () => {
  //   console.log('HANDLE DELETE GRAPH');
  // };

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

  const denormalizedMechanicalStressData = [
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.m1),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'm1',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.m2a),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'm2a',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.m2b),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'm2b',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.mean),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'mean',
    },
  ];

  const normalizedMechanicalStressData = [
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.norm_m1),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'norm_m1',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.norm_m2a),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'norm_m2a',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.norm_m2b),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'norm_m2b',
    },
    {
      data:
        mergedResult?.data
          ?.map((row) => ({
            primary: row.word,
            secondary: Number(row.norm_mean),
          }))
          .filter((row) => !isNaN(row.secondary)) ?? [],
      label: 'norm_mean',
    },
  ];

  const primaryAxis = React.useMemo(
    () => ({
      getValue: (datum) => datum.primary,
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    () => [
      {
        getValue: (datum) => datum.secondary,
      },
    ],
    []
  );

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
                  alignItems="center">
                  <Grid item>
                    <Typography className={classes.cardTitle}>
                      Graphs
                    </Typography>
                  </Grid>
                  <Grid item>
                    {/* <Button
                      style={{ marginBottom: 0 }}
                      onClick={() => {
                        setIsAddGraphDialogOpen(true);
                      }}
                      className={classes.button}>
                      <Typography className={classes.buttonLabel}>
                        Add Graph
                      </Typography>
                    </Button> */}
                  </Grid>
                </Grid>
                <Grid container justifyContent="center">
                  <Grid item>
                    <Typography>
                      Mechanical Stress Models (Denormalized){' '}
                    </Typography>
                    <ResizableBox>
                      <Chart
                        options={{
                          data: denormalizedMechanicalStressData,
                          primaryAxis,
                          secondaryAxes,
                        }}
                      />
                    </ResizableBox>
                  </Grid>

                  <Grid item>
                    <Typography>
                      Mechanical Stress Models (Normalized){' '}
                    </Typography>
                    <ResizableBox>
                      <Chart
                        options={{
                          data: normalizedMechanicalStressData,
                          primaryAxis,
                          secondaryAxes,
                        }}
                      />
                    </ResizableBox>
                  </Grid>

                  {/* {graphs.map((graph) => (
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
                  ))} */}
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
