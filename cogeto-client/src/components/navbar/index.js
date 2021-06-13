import React, { Component } from 'react';
import { push } from 'connected-react-router';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import Settings from '../../containers/settings';
import { withRouter } from 'react-router-dom';

class TorderNavbar extends Component {
  state = {
    isOpen: false
  };

  toggleCollapse = () => {
    this.setState({ isOpen: !this.state.isOpen });
  };

  isActiveRoute = (activeRoute, path) => {
    return activeRoute === path;
  };

  render() {
    const activeRoute = this.props.location.pathname;
    return (
      <Navbar
        fixed="top"
        className="sticky-nav"
        bg="dark"
        variant="dark"
        expand="sm">
        <Container>
          <Navbar.Brand to="/" style={{ paddingLeft: 0.5 + 'em' }}>
            <span className="cogeto-font">C</span>o
            <span className="cogeto-font">G</span>e
            <span className="cogeto-font">T</span>o
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <LinkContainer
                exact
                to="/home"
                isActive={() => this.isActiveRoute(activeRoute, '/home')}
                activeClassName="">
                <Nav.Link active={false}>Home</Nav.Link>
              </LinkContainer>
              <LinkContainer
                exact
                to="/about"
                isActive={() => this.isActiveRoute(activeRoute, '/about')}
                activeClassName="">
                <Nav.Link active={false}>About</Nav.Link>
              </LinkContainer>
              <LinkContainer
                exact
                to="/compute"
                isActive={() => this.isActiveRoute(activeRoute, '/compute')}
                activeClassName="">
                <Nav.Link active={false}>Compute</Nav.Link>
              </LinkContainer>
            </Nav>
            <Nav className="justify-content-end">
              <Settings />
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    );
  }
}

const mapStateToProps = () => ({});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      changePage: page => push(page)
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withRouter(TorderNavbar));
