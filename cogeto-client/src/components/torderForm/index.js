import React, { Component } from 'react';
import {
  FormGroup,
  FormControl,
  Form,
  Button,
  Collapse,
  Container,
  Row,
  Col
} from 'react-bootstrap';

import QuestionTooltip from '../questionTooltip';
import OptionalConfigForm from '../optionalConfigForm';

class TorderForm extends Component {
  constructor(props, context) {
    super(props, context);
    this.computeForm = React.createRef();
  }

  optionalInputsAreValid = () => {
    var that = this;
    if (this.props.validated && this.computeForm.current) {
      return (
        that.computeForm.current['candidatesBound'].checkValidity() &&
        that.computeForm.current['numTrials'].checkValidity() &&
        that.computeForm.current['weightBound'].checkValidity()
      );
    }
    return true;
  };

  render() {
    return (
      <div>
        <Form
          ref={this.computeForm}
          validated={this.props.validated}
          noValidate
          id="compute-form">
          <FormGroup controlId="torderNameControls">
            <Form.Label>Name (Optional)</Form.Label>
            <FormControl
              type="text"
              name="name"
              onChange={this.props.handleInputChange}
              placeholder="Enter a name for this T-order"
            />
          </FormGroup>
          <FormGroup>
            <Container>
              <Row>
                <Col id="torder-input-file-col">
                  <Form.Label>Input file</Form.Label>
                  <QuestionTooltip title="Input file">
                    <em>The input file must be in an excel format.</em>
                    <br />
                    Please refer to the documentation for how to format the
                    excel file.
                  </QuestionTooltip>
                </Col>
                <Col id="torder-sample-file-col">
                  <a href={process.env.PUBLIC_URL + '/sample.xls'} download>
                    Sample input file
                  </a>
                </Col>
              </Row>
            </Container>

            <Form.Control
              type="file"
              required
              accept=".xls,.xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={this.props.addFile}
              isInvalid={!this.props.isValidFileType()}
            />
            <Form.Control.Feedback type="invalid">
              Please upload an excel file having extensions .xls/.xlsx only.
            </Form.Control.Feedback>
          </FormGroup>

          <br />
          <Button
            variant="link"
            onClick={this.props.toggleShowOptionalConfigs}
            disabled={!this.optionalInputsAreValid()}
            aria-controls="optional-configuration"
            aria-expanded={this.props.showOptionalConfigs}>
            Optional Configuration
          </Button>
          <Collapse in={this.props.showOptionalConfigs}>
            <Container id="optional-configuration">
              <p>
                Optional Configuration allows you to change the value of various
                parameters. (See{' '}
                <a
                  href="https://sites.google.com/site/magrigrg/home/cogeto"
                  title="CoGeTo manual"
                  target="_blank"
                  rel="noopener noreferrer">
                  CoGeTo manual
                </a>{' '}
                for details)
              </p>
              <OptionalConfigForm
                preferredSettings={this.props.preferredSettings}
                handleInputChange={this.props.handleInputChange}
                handleCheckBoxChanged={this.props.handleCheckBoxChanged}
                optimizationMethod={this.props.optimizationMethod}
                candidatesBound={this.props.candidatesBound}
                numTrials={this.props.numTrials}
                weightBound={this.props.weightBound}
                hgMappingsOnly={this.props.hgMappingsOnly}
                displayArrows={this.props.displayArrows}
              />
            </Container>
          </Collapse>
        </Form>
      </div>
    );
  }
}

export default TorderForm;
