import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Home from '../../pages/Home';
import AboutPage from '../../pages/AboutPage';
import ComputePage from '../../pages/ComputePage';
import MyResultsPage from '../../pages/MyResultsPage';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact={true} component={Home} />
        <Route path="/about" exact={true} component={AboutPage} />
        <Route path="/compute" exact={true} component={ComputePage} />
        <Route
          path="/my-results"
          exact={true}
          component={MyResultsPage}
        />
      </Switch>
    </Router>
  );
};

export default App;
