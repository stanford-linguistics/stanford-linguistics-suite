import { createTheme } from '@material-ui/core';

const METRICAL_TREE_TYPOGRAPHY = {
  fontFamily: ['Source Sans Pro', 'Sans-serif'],
  useNextVariants: true,
};

export const METRICAL_TREE_THEME = createTheme({
  typography: METRICAL_TREE_TYPOGRAPHY,
  palette: {
    primary: {
      main: '#44AB77',
      light: '#7cc49f',
      dark: '#2f7753',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8c1515',
      contrastText: '#fff',
    },
    background: {
      default: '#f2f2f2',
    },
  },
  overrides: {
    //MUIDataTableToolbar: { root: { display: 'none' } },
    MUIDataTableHeadCell: {
      root: { padding: '8px 0 8px 16px' },
    },
    MUIDataTableBodyCell: { root: { padding: '0 0 0 8px' } },
  },
});
