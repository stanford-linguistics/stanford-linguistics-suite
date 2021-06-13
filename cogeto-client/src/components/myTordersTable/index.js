import React from 'react';
import { Button, Table } from 'react-bootstrap';
import { BarLoader } from 'react-spinners';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDownload,
  faTrashAlt,
  faListAlt
} from '@fortawesome/free-solid-svg-icons';
import Moment from 'react-moment';
import 'moment-timezone';

function MyTorderTable(props) {
  return (
    <div id="torder-mytorders-table-container">
      <div id="torder-mytorders-table-wrapper">
        <Table id="torder-mytorders-table" striped bordered hover>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Status</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.torders.map((torder, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>{torder.name}</td>
                <td>
                  {torder.status}
                  <BarLoader
                    sizeUnit={'px'}
                    size={20}
                    color={'#8c1515'}
                    loading={
                      torder.status === 'RUNNING' || torder.status === 'PENDING'
                    }
                  />
                </td>
                <td>
                  {torder.expiresOn && (
                    <Moment
                      interval={10000}
                      to={new Date(0).setUTCSeconds(torder.expiresOn)}
                    />
                  )}
                </td>
                <td>
                  <div>
                    {torder.status === 'SUCCESS' && (
                      <a
                        title="Download"
                        className="btn torder-primary-btn"
                        role="button"
                        href={torder.link}
                        download>
                        <FontAwesomeIcon icon={faDownload} />
                      </a>
                    )}
                    {torder.status !== 'SUCCESS' && (
                      <Button className="torder-primary-btn" disabled>
                        <FontAwesomeIcon icon={faDownload} />
                      </Button>
                    )}
                    <Button
                      title="View Details"
                      className="torder-primary-btn"
                      value={torder}
                      disabled={torder.status !== 'SUCCESS'}
                      onClick={() => props.viewTorder(torder)}>
                      <FontAwesomeIcon icon={faListAlt} />
                    </Button>
                    <Button
                      title="delete"
                      className="torder-primary-btn"
                      value={torder}
                      onClick={() => props.removeTorder(torder)}>
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default MyTorderTable;
