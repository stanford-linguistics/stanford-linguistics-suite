import React from 'react';
import PropTypes from 'prop-types';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { StylesProvider } from '@material-ui/styles';

import { METRICAL_TREE_THEME } from 'constants/theme';

const MetricalTreeThemeWrapper = (props) => {
  return (
    <StylesProvider>
      <MuiThemeProvider theme={METRICAL_TREE_THEME}>
        <div>{props.children}</div>
      </MuiThemeProvider>
    </StylesProvider>
  );
};

MetricalTreeThemeWrapper.propTypes = {
  children: PropTypes.node,
};

export default MetricalTreeThemeWrapper;
