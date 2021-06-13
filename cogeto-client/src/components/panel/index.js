import React from 'react';
import { Collapse, Card } from 'react-bootstrap';

function Panel(props) {
  return (
    <Card className="torder-panel" key={props.panelKey}>
      <Card.Header
        onClick={() => props.togglePanel(props.panelKey)}
        data-event={props.panelKey}
        aria-controls={props.id}
        aria-expanded={props.openPanel}>
        {props.header}
      </Card.Header>
      <Collapse in={props.currentPanel === props.panelKey}>
        <div id={props.id}>
          <Card.Body>{props.children}</Card.Body>
        </div>
      </Collapse>
    </Card>
  );
}

export default Panel;
