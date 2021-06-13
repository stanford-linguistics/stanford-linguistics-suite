import React from 'react';
import { Route, Redirect, Switch, withRouter } from 'react-router-dom';
import Home from '../home';
import Documentation from '../documentation';
import Navbar from '../navbar';
import MyTorders from '../myTorders';
import SuFooter from '../suFooter';
import SuHeader from '../suHeader';
import { Container, Row, Col } from 'react-bootstrap';
import ParticlesContainer from '../particlesContainer';
import TorderFooter from '../torderFooter';

function getClassForRoute(path) {
  if (path === '/home') {
    return 'torder-home-main-container';
  } else if (path === '/about') {
    return 'torder-docs-main-container';
  } else if (path === '/compute') {
    return 'torder-my-torders-main-container';
  } else {
    return null;
  }
}

const App = props => (
  <div>
    {props.location.pathname === '/home' && <ParticlesContainer />}
    <div
      id="torder-main-container"
      className={getClassForRoute(props.location.pathname)}>
      <div id="su-wrap">
        <div id="su-content">
          <SuHeader />
          <main>
            <Navbar />
            <Container>
              <Row>
                <Col md="auto">
                  <Switch>
                    <Route exact path="/home" component={Home} />
                    <Route exact path="/about" component={Documentation} />
                    <Route exact path="/compute" component={MyTorders} />
                    <Redirect from="*" to="/home" />
                  </Switch>
                </Col>
              </Row>
            </Container>
          </main>
        </div>
      </div>
      <TorderFooter />
      <SuFooter />
    </div>
  </div>
);

export default withRouter(App);
