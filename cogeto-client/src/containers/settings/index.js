import React, { Component } from 'react';
import {
  setDeleteExpiredTorders,
  setPreferredTorderConfig,
  resetPreferredTorderConfig
} from '../../modules/settings';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import SettingsModal from '../../components/settingsModal';
import MyTordersPanel from '../../components/myTordersPanel';
import ComputeTorderPanel from '../../components/computeTorderPanel';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

class Settings extends Component {
  constructor(props, context) {
    super(props, context);

    this.toggleModal = this.toggleModal.bind(this);
    this.togglePanel = this.togglePanel.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleCheckBoxChanged = this.handleCheckBoxChanged.bind(this);
    this.setPreferredConfig = this.setPreferredConfig.bind(this);
    this.resetConfig = this.resetConfig.bind(this);
    this.resetState = this.resetState.bind(this);

    this.state = {
      showModal: false,
      openPanel: false,
      currentPanel: null,
      validated: false,
      optimizationMethod: this.props.preferredSettings.optimizationMethod,
      candidatesBound: this.props.preferredSettings.boundOnNumberOfCandidates,
      numTrials: this.props.preferredSettings.numTrials,
      weightBound: this.props.preferredSettings.weightBound,
      hgMappingsOnly: this.props.preferredSettings.hgFeasibleMappingsOnly,
      displayArrows: this.props.preferredSettings.includeArrows
    };
  }

  toggleModal() {
    this.setState({
      showModal: !this.state.showModal,
      currentPanel: null,
      showPanel: false
    });
  }

  deleteExpiredTordersCheckboxChanged = e => {
    this.props.setDeleteExpiredTorders(e.target.checked);
  };

  togglePanel = panelKey => {
    this.setState({
      openPanel: !this.state.openPanel,
      currentPanel: this.state.currentPanel === panelKey ? null : panelKey
    });
  };

  handleInputChange = e => {
    this.setState({ [e.target.name]: e.target.value });
  };

  handleCheckBoxChanged = e => {
    this.setState({ [e.target.name]: e.target.checked });
  };

  setPreferredConfig = form => {
    if (form.checkValidity() === true) {
      var config = {
        hgFeasibleMappingsOnly: this.state.hgMappingsOnly,
        optimizationMethod: this.state.optimizationMethod,
        boundOnNumberOfCandidates: Number(this.state.candidatesBound),
        numTrials: Number(this.state.numTrials),
        weightBound: Number(this.state.weightBound),
        includeArrows: this.state.displayArrows
      };

      this.setState({ validated: false });
      this.props.setPreferredTorderConfig(config);
      form.reset();
      this.displaySuccessToast('Your settings have been successfully saved.');
    }
    this.setState({ validated: true });
  };

  resetConfig = () => {
    this.resetState();
    this.props.resetPreferredTorderConfig();
    this.displaySuccessToast('Your settings have been successfully reset.');
  };

  resetState = () => {
    this.setState({
      optimizationMethod: this.props.defaultSettings.optimizationMethod,
      candidatesBound: this.props.defaultSettings.boundOnNumberOfCandidates,
      numTrials: this.props.defaultSettings.numTrials,
      weightBound: this.props.defaultSettings.weightBound,
      hgMappingsOnly: this.props.defaultSettings.hgFeasibleMappingsOnly,
      displayArrows: this.props.defaultSettings.includeArrows
    });
  };

  displaySuccessToast = message => toast.success(message);

  render() {
    return (
      <div>
        <SettingsModal
          showModal={this.state.showModal}
          toggleModal={this.toggleModal}>
          <MyTordersPanel
            togglePanel={this.togglePanel}
            currentPanel={this.state.currentPanel}
            openPanel={this.openPanel}
            shouldDeleteExpiredTorders={this.shouldDeleteExpiredTorders}
            deleteExpiredTordersCheckboxChanged={
              this.deleteExpiredTordersCheckboxChanged
            }
          />
          <ComputeTorderPanel
            togglePanel={this.togglePanel}
            currentPanel={this.state.currentPanel}
            openPanel={this.openPanel}
            preferredSettings={this.props.preferredSettings}
            handleInputChange={this.handleInputChange}
            handleCheckBoxChanged={this.handleCheckBoxChanged}
            setPreferredConfig={this.setPreferredConfig}
            resetConfig={this.resetConfig}
            optimizationMethod={this.state.optimizationMethod}
            candidatesBound={this.state.candidatesBound}
            numTrials={this.state.numTrials}
            weightBound={this.state.weightBound}
            hgMappingsOnly={this.state.hgMappingsOnly}
            displayArrows={this.state.displayArrows}
            validated={this.state.validated}
          />
        </SettingsModal>
        <ToastContainer
          position="bottom-center"
          autoClose={8000}
          hideProgressBar={true}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnVisibilityChange
          draggable={false}
          pauseOnHover={false}
        />
      </div>
    );
  }
}

const mapStateToProps = ({ settings }) => ({
  shouldDeleteExpiredTorders: settings.deleteExpiredTorders,
  preferredSettings: settings.preferredComputeSettings,
  defaultSettings: settings.defaultComputeSettings
});

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setDeleteExpiredTorders,
      setPreferredTorderConfig,
      resetPreferredTorderConfig
    },
    dispatch
  );

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);
