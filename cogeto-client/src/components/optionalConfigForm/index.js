import React from 'react';
import { Container, Form, FormGroup, FormControl } from 'react-bootstrap';
import QuestionTooltip from '../questionTooltip';

function OptionalConfigForm(props) {
  return (
    <Container id="optional-configuration">
      <hr />

      {/* <Form.Group controlId="torderForm.optimizationMethod">
        <Form.Label>Optimization method</Form.Label>
        <QuestionTooltip title="Optimization method">
          This is the popover text for the optimization method.
        </QuestionTooltip>
        <Form.Control
          required
          as="select"
          name="optimizationMethod"
          value={props.optimizationMethod}
          onChange={props.handleInputChange}>
          <option>simplex</option>
          <option>interior-point</option>
        </Form.Control>
      </Form.Group> */}

      <FormGroup controlId="candidatesBoundControls">
        <Form.Label>Bound on number of candidates</Form.Label>
        <QuestionTooltip title="Bound on number of candidates">
          This is a positive integer that determines the maximum number of
          candidates that the script is allowed to consider when checking the ME
          non-trivial sufficient condition (see the manual for more
          information). The larger the integer, the slower the script, the more
          accurate the answer.
        </QuestionTooltip>

        <FormControl
          required
          min={1}
          type="number"
          name="candidatesBound"
          value={props.candidatesBound}
          onChange={props.handleInputChange}
          placeholder="Enter bound"
        />
        <Form.Control.Feedback type="invalid">
          Please enter a value greater than 0.
        </Form.Control.Feedback>
      </FormGroup>

      <FormGroup controlId="numTrialsControls">
        <Form.Label>Number of trials</Form.Label>
        <QuestionTooltip title="Number of trials">
          This is a positive integer that determines the number of times that
          the script will attempt at randomly generating a counterexample
          against a ME implicational, whenever that implicational cannot be
          settled analytically (see the manual for more information). The larger
          the integer, the slower the script, the more accurate the answer.
        </QuestionTooltip>

        <FormControl
          required
          min={1}
          type="number"
          name="numTrials"
          value={props.numTrials}
          onChange={props.handleInputChange}
          placeholder="Enter number of trials"
        />
        <Form.Control.Feedback type="invalid">
          Please enter a value greater than 0.
        </Form.Control.Feedback>
      </FormGroup>

      <FormGroup controlId="weightBoundControls">
        <Form.Label>Weight bound</Form.Label>
        <QuestionTooltip title="Weight bound">
          This is a positive number that determines the largest weight that the
          script is allowed to consider when attempting at randomly generating a
          counterexample against a ME implicational, whenever that implicational
          cannot be settled analytically (see the manual for more information).
        </QuestionTooltip>
        <FormControl
          required
          min={1}
          name="weightBound"
          onChange={props.handleInputChange}
          type="number"
          value={props.weightBound}
          placeholder="Enter weight bound"
        />
        <Form.Control.Feedback type="invalid">
          Please enter a value greater than 0.
        </Form.Control.Feedback>
      </FormGroup>

      <FormGroup>
        <Form.Check
          id="hgMappingsOnlyCheckbox"
          name="hgMappingsOnly"
          type="checkbox"
          label="HG possible mappings only"
          inline
          checked={props.hgMappingsOnly}
          onChange={props.handleCheckBoxChanged}
        />
        <QuestionTooltip title="HG possible mappings only">
          If this box is checked, the script plots T-orders which only include
          those mappings that are possible relative to the HG typology, while HG
          impossible mappings are omitted from the T-order.
        </QuestionTooltip>
      </FormGroup>

      <FormGroup>
        <Form.Check
          name="displayArrows"
          id="displayArrowsCheckbox"
          type="checkbox"
          label="Display arrows entailed by transitivity"
          inline
          checked={props.displayArrows}
          onChange={props.handleCheckBoxChanged}
        />
        <QuestionTooltip title="Display arrows entailed by transitivity">
          If this box is checked, the script does not prune arrows entailed by
          transitivity by other arrows when plotting T-orders. This option is
          deprecated for large T-orders with a large number of arrows.
        </QuestionTooltip>
      </FormGroup>
    </Container>
  );
}

export default OptionalConfigForm;
