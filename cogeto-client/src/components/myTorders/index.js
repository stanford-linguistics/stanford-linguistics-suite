import React, { Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import {
  Container,
  Row,
  Col,
  Modal,
  Button,
  Table,
  Image,
  Tabs,
  Tab
} from 'react-bootstrap';
import TorderFormContainer from '../../containers/torderFormContainer';
import { updateTorder, deleteTorder } from '../../modules/dataService/torders';
import MyTorderTable from '../myTordersTable';
import QuestionTooltip from '../questionTooltip';

class MyTorders extends Component {
  constructor(props, context) {
    super(props, context);

    this.removeTorder = this.removeTorder.bind(this);
    this.viewTorder = this.viewTorder.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.getExpirationDate = this.getExpirationDate.bind(this);

    this.state = {
      resultsPoller: null,
      showModal: false,
      torder: {
        params: {}
      }
    };
  }

  componentDidMount() {
    this.updateAll();
    this.startPolling();
  }

  updateAll = () => {
    var that = this;
    if (this.props.torders.length > 0) {
      that.props.torders.forEach(function(torder) {
        that.props.updateTorder(torder.id);
      });
    }
  };

  startPolling = () => {
    var resultsPoller = setInterval(this.requestResults, 5000);
    this.setState({ resultsPoller: resultsPoller });
  };

  requestResults = () => {
    var that = this;
    if (this.props.torders.length > 0) {
      that.props.torders.forEach(function(torder) {
        if (shouldUpdate(torder)) {
          that.props.updateTorder(torder.id);
        }
        if (
          torder.status && torder.status.toUpperCase() === 'EXPIRED' &&
          that.props.shouldDeleteExpiredTorders
        ) {
          that.props.deleteTorder(torder.id);
        }
      });
    }
    function shouldUpdate(torder) {
      if (torder.status && torder.status.toUpperCase() === 'SUCCESS') {
        var utcSeconds = torder.expiresOn;
        var d = new Date(0); // sets the date to the epoch
        d.setUTCSeconds(utcSeconds);

        var today = new Date();
        if (today >= d) {
          return true;
        }
      }
      return (torder.status && torder.status.toUpperCase() === 'PENDING') || (torder.status && torder.status.toUpperCase() === 'RUNNING');
    }
  };

  componentWillUnmount() {
    this.clearPoller();
  }

  clearPoller = () => {
    var poller = this.state.resultsPoller;
    var that = this;
    if (poller) {
      clearInterval(poller);
      that.setState({ resultsPoller: null });
    }
  };

  removeTorder = torder => {
    this.props.deleteTorder(torder.id);
  };

  viewTorder = torder => {
    this.setState({
      torder: Object.assign({}, this.state.torder, torder)
    });
    this.toggleModal();
  };

  toggleModal() {
    this.setState({ showModal: !this.state.showModal });
  }

  getExpirationDate = () => {
    var utcSeconds = this.state.torder.expiresOn;
    var d = new Date(0); //sets the date to the epoch
    d.setUTCSeconds(utcSeconds);
    return d;
  };

  render() {
    return (
      <Container id="torder-mytorders-container">
        <Container id="torder-home-content">
          <h1>
            <span className="cogeto-font">C</span>o
            <span className="cogeto-font">G</span>e
            <span className="cogeto-font">T</span>o
          </h1>{' '}
          <hr />
          <h6 style={{ marginTop: 0 }}>
            Convex Geometry Tools for typological analysis
          </h6>
        </Container>
        <Row>
          <Col lg={{ span: 12 }}>
            <p style={{ marginTop: '2em' }} className="centered">
              To upload your grammar spreadsheet and start{' '}
              <span className="cogeto-font">C</span>o
              <span className="cogeto-font">G</span>e
              <span className="cogeto-font">T</span>o, click the button below.
            </p>
          </Col>
          <Col lg={{ span: 12 }}>
            {this.props.torders.length > 0 && (
              <Container
                className="centered"
                fluid
                id="torder-mytorders-inner-container">
                <TorderFormContainer />
                <p className="centered">
                  Your recent results are listed below. They will expire after
                  three days.{' '}
                  <QuestionTooltip title="T-order Expiration">
                    <em>Expired t-orders are not able to be downloaded.</em>
                    <br />
                    T-orders that are expired can be set to be automatically
                    deleted in the settings.
                  </QuestionTooltip>
                </p>

                <MyTorderTable
                  torders={this.props.torders}
                  removeTorder={this.removeTorder}
                  viewTorder={this.viewTorder}
                />
              </Container>
            )}
            {this.props.torders <= 0 && (
              <Container fluid className="centered">
                <TorderFormContainer />
              </Container>
            )}
          </Col>
        </Row>

        <Modal
          show={this.state.showModal}
          onHide={this.toggleModal}
          keyboard={false}
          backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>Details - {this.state.torder.name}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.torder.status && this.state.torder.status.toUpperCase() === 'FAILURE' && (
              <div>
                <h1>Status: {this.state.torder.status}</h1>
                <p>{this.state.torder.errorMessage}</p>
              </div>
            )}
            {this.state.torder.status && this.state.torder.status.toUpperCase() === 'SUCCESS' && (
              <Tabs defaultActiveKey="params">
                <Tab eventKey="params" title="Params">
                  <Table responsive striped bordered hover>
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Optimization method</strong>
                        </td>
                        <td>{this.state.torder.params.optimizationMethod}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Bound on number of candidates</strong>
                        </td>
                        <td>
                          {this.state.torder.params.boundOnNumberOfCandidates}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Number of trials</strong>
                        </td>
                        <td>{this.state.torder.params.numTrials}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Weight bound</strong>
                        </td>
                        <td>{this.state.torder.params.weightBound}</td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Hg feasible mappings only</strong>
                        </td>
                        <td>
                          {String(
                            this.state.torder.params.hgFeasibleMappingsOnly
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Display arrows</strong>
                        </td>
                        <td>
                          {String(this.state.torder.params.includeArrows)}
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Tab>
                <Tab eventKey="graphs" title="Graphs">
                  <div>
                    {this.state.torder.images.map((image, index) => (
                      <div key={index}>
                        <h3>{image.name}</h3>
                        <Image src={image.url} fluid />
                      </div>
                    ))}
                  </div>
                </Tab>
                <Tab eventKey="notes" title="Notes" />
              </Tabs>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button className="torder-primary-btn" onClick={this.toggleModal}>
              close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    );
  }
}

const mapStateToProps = ({ torders, settings }) => ({
  torders: torders.torders,
  shouldDeleteExpiredTorders: settings.deleteExpiredTorders
});

const mapDispatchToProps = dispatch =>
  bindActionCreators({ updateTorder, deleteTorder }, dispatch);

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyTorders);
