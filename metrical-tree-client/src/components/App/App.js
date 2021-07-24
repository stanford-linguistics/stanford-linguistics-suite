import React from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
} from 'react-router-dom';

import Home from '../../pages/Home';
import AboutPage from '../../pages/AboutPage';
import ComputePage from '../../pages/ComputePage';
import ResultPage from '../../pages/ResultPage';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/" exact={true} component={Home} />
        <Route path="/about" exact={true} component={AboutPage} />
        <Route path="/compute" exact={true} component={ComputePage} />
        <Route path="/result" exact={true} component={ResultPage} />
      </Switch>
    </Router>
  );
};

export default App;
