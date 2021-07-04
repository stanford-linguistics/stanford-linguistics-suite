import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Grid,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
} from '@material-ui/core';
import { useMutation } from '@apollo/client';

import IdentityBar from '../../components/IdentityBar';
import Footer from '../../components/Footer';
import Appbar from '../../components/Appbar';
import { UPLOAD_METRICAL_TREE_FILE } from '../../graphql/metricalTree';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: 64,
    height: 'calc(100vh - 216px)',
    backgroundColor: 'white',
  },
}));

const ComputePage = () => {
  const classes = useStyles();

  const [uploadFile, { data }] = useMutation(
    UPLOAD_METRICAL_TREE_FILE
  );
  console.log('Data: ', data);

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

  function createData(name, calories, fat, carbs, protein) {
    return { name, calories, fat, carbs, protein };
  }

  const rows = [
    createData('Frozen yoghurt', 159, 6.0, 24, 4.0),
    createData('Ice cream sandwich', 237, 9.0, 37, 4.3),
    createData('Eclair', 262, 16.0, 24, 6.0),
    createData('Cupcake', 305, 3.7, 67, 4.3),
    createData('Gingerbread', 356, 16.0, 49, 3.9),
  ];

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justify="center"
        alignContent="center"
        className={classes.container}>
        <Grid item xs={10} sm={10} md={6} lg={4}>
          <Typography>COMPUTE</Typography>
          <Button onClick={handleUpload}>UPLOAD FILE</Button>
          <TableContainer component={Paper}>
            <Table
              className={classes.table}
              aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Dessert (100g serving)</TableCell>
                  <TableCell align="right">Calories</TableCell>
                  <TableCell align="right">Fat&nbsp;(g)</TableCell>
                  <TableCell align="right">Carbs&nbsp;(g)</TableCell>
                  <TableCell align="right">
                    Protein&nbsp;(g)
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell component="th" scope="row">
                      {row.name}
                    </TableCell>
                    <TableCell align="right">
                      {row.calories}
                    </TableCell>
                    <TableCell align="right">{row.fat}</TableCell>
                    <TableCell align="right">{row.carbs}</TableCell>
                    <TableCell align="right">{row.protein}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
      <Footer />
    </>
  );
};

export default ComputePage;
