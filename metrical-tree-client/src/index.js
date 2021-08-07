import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './components/App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { ApolloProvider } from '@apollo/client';
import { client } from './config/apollo';
import { RecoilRoot } from 'recoil';

export const theme = createTheme({
  typography: {
    fontFamily: ['Source Sans Pro', 'Roboto'].join(','),
  },
});

ReactDOM.render(
  // <React.StrictMode>
  <RecoilRoot>
    <ApolloProvider client={client}>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </ApolloProvider>
  </RecoilRoot>,
  // </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
