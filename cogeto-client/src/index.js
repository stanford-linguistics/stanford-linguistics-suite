import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConnectedRouter } from 'connected-react-router';
import store, { history, persistor } from './store';
import App from './components/app';

import 'sanitize.css/sanitize.css';
import './index.css';

const target = document.querySelector('#root');

const onBeforeLift = () => {
  // take some action before the gate lifts
};

render(
  <Provider store={store}>
    <PersistGate
      loading={null}
      onBeforeLift={onBeforeLift}
      persistor={persistor}>
      <ConnectedRouter history={history}>
        <App />
      </ConnectedRouter>
    </PersistGate>
  </Provider>,
  target
);
