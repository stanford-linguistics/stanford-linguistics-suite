import React from 'react';
import { OverlayTrigger, Popover } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

function QuestionTooltip(props) {
  const popoverToDisplay = (
    <Popover title={props.title}>{props.children}</Popover>
  );
  return (
    <OverlayTrigger
      trigger={['hover', 'focus']}
      placement="right"
      overlay={popoverToDisplay}>
      <FontAwesomeIcon icon={faQuestionCircle} className="torder-info-icon" />
    </OverlayTrigger>
  );
}

export default QuestionTooltip;
