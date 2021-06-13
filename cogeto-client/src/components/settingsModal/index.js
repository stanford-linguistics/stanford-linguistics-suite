import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';

function SettingsModal(props) {
  return (
    <div>
      <Button
        className="torder-settings-btn"
        title="Settings"
        onClick={props.toggleModal}>
        <FontAwesomeIcon icon={faCog} />
      </Button>
      <Modal show={props.showModal} onHide={props.toggleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Settings</Modal.Title>
        </Modal.Header>
        <Modal.Body>{props.children}</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={props.toggleModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SettingsModal;
