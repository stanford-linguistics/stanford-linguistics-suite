import React from 'react';
import Panel from '../panel';
import { FormGroup, Form } from 'react-bootstrap';
import QuestionTooltip from '../questionTooltip';

function MyTordersPanel(props) {
  return (
    <Panel
      panelKey={1}
      id="my-torders-settings"
      header="My T-orders Settings"
      togglePanel={props.togglePanel}
      currentPanel={props.currentPanel}
      openPanel={props.openPanel}>
      <div>
        <FormGroup>
          <Form.Check
            name="shouldDeleteExpiredTorders"
            id="deleteExpiredCheckbox"
            type="checkbox"
            label="Automatically delete expired t-orders"
            inline
            checked={props.shouldDeleteExpiredTorders}
            onChange={props.deleteExpiredTordersCheckboxChanged}
          />
          <QuestionTooltip title="Delete expired t-orders">
            This is the popover text for the displayDeleteExpiredPopover.
          </QuestionTooltip>
        </FormGroup>
      </div>
    </Panel>
  );
}

export default MyTordersPanel;
