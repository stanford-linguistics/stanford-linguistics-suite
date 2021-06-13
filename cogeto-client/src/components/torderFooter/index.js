import React from 'react';
import { Navbar, Image } from 'react-bootstrap';
import CNRS_Logo from '../../assets/images/cnrs.svg';
import ANR_LOGO from '../../assets/images/anr-logo.png';
import GITHUB_LOGO from '../../assets/images/Professortocat_v2.png';
import LING_SIG from '../../assets/images/ling_sig.png';
import FRANCE_SIG from '../../assets/images/france_sig.png';

const TorderFooter = props => (
  <Navbar id="torder-footer" bg="dark" variant="dark">
    <div className="footer-item-container">
      <a
        href="https://linguistics.stanford.edu/"
        title="Stanford University Department of Linguistics"
        target="_blank"
        rel="noopener noreferrer">
        <Image width={200} src={LING_SIG} fluid />
      </a>
    </div>
    <div className="footer-item-container">
      <a
        href="https://francestanford.stanford.edu/"
        title="France-Stanford Center"
        target="_blank"
        rel="noopener noreferrer">
        <Image width={200} src={FRANCE_SIG} fluid />
      </a>
    </div>
    <div className="footer-item-container">
      <a
        href="http://www.cnrs.fr/"
        title="Centre national de la recherche scientifique"
        target="_blank"
        rel="noopener noreferrer">
        <Image width={100} src={CNRS_Logo} fluid />
      </a>
    </div>
    <div className="footer-item-container">
      <a
        href="https://anr.fr/en/anrs-role-in-research/missions/"
        title="The French National Research Agency (ANR)"
        target="_blank"
        rel="noopener noreferrer">
        <Image width={100} src={ANR_LOGO} fluid />
      </a>
    </div>
    <div id="torder-footer-contact" className="footer-item-container">
      <h4>Contact</h4>
      <hr />
      <div>
        <p>Arto Anttila</p>
        <p>
          <a
            href="mailto:anttila@stanford.edu"
            title="anttila@stanford.edu"
            target="_blank"
            rel="noopener noreferrer">
            anttila@stanford.edu
          </a>
        </p>
        <p>Giorgio Magri</p>
        <a
          href="mailto:magrigrg@gmail.com"
          title="magrigrg@gmail.com"
          target="_blank"
          rel="noopener noreferrer">
          magrigrg@gmail.com
        </a>
        <p />
      </div>
    </div>
    <div className="footer-item-container">
      <a
        href="https://github.com/CoGeTo/T-orders"
        title="https://github.com/CoGeTo/T-orders"
        target="_blank"
        rel="noopener noreferrer">
        <Image width={100} src={GITHUB_LOGO} fluid />
      </a>
    </div>
  </Navbar>
);

export default TorderFooter;
