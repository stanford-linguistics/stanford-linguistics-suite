import React from 'react';
import { Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Documentation = () => (
  <Container id="torder-docs-container">
    <Container className="torder-docs-section">
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
      <h6 className="doc-header" style={{ fontWeight: 'bold' }}>
        In brief
      </h6>
      <p>
        <span className="cogeto-font">C</span>o
        <span className="cogeto-font">G</span>e
        <span className="cogeto-font">T</span>o is a web app that allows you to
        work out the predictions of your linguistic theory. It provides a suite
        of tools that exploit the rich convex geometry underlying
        constraint-based phonology to extract typological information without
        ever enumerating the typology. These tools thus allow you to analyze not
        only categorical typologies in OT and HG, but also infinite
        probabilistic typologies in Stochastic OT, Noisy HG, and Maxent.
      </p>
    </Container>
    <Container className="torder-docs-section">
      <h6 className="doc-header">In more detail</h6>
      <p>
        In categorical theories, typologies can be exhaustively listed and
        directly inspected (at least in principle) because they are usually
        finite. In probabilistic theories, that won’t work because a typology
        consists of an infinite number of probability distributions. A natural
        strategy that gets around this problem is to enumerate, not the
        individual languages, grammars, or distributions, but the universals
        hidden in the typology (Greenberg 1963).{' '}
        <span className="cogeto-font">C</span>o
        <span className="cogeto-font">G</span>e
        <span className="cogeto-font">T</span>o exploits the rich convex
        geometry underlying constraint-based phonology to compute universals
        without enumerating the typology. The current implementation (version
        1.0) computes three types of universals:
      </p>
      <ul className="doc-list">
        <li>
          <span className="uppercase-text">Positive absolute universals</span>:
          Which phonological structures are necessarily present/most probable in
          every language in the typology?
        </li>
        <li>
          <span className="uppercase-text">Negative absolute universals</span>:
          Which phonological structures are impossible/least probable in every
          language in the typology?
        </li>
        <li>
          <span className="uppercase-text">Implicational universals</span>: If a
          language in the typology has a certain phonological structure, what
          other structures are also guaranteed to be present/to be at least as
          probable in that language?
        </li>
      </ul>
    </Container>
    <Container className="torder-docs-section">
      <h6 className="doc-header">What Do you need?</h6>
      <p>
        All you need is a grammar spreadsheet (.xls) in the OTSoft/OTHelp
        format, with inputs, candidates, and violations. A sample input file is
        available{' '}
        <a href={process.env.PUBLIC_URL + '/sample.xls'} download>
          here
        </a>
        . You can upload your grammar on the <Link to="/compute">Compute</Link>{' '}
        page and start running <span className="cogeto-font">C</span>o
        <span className="cogeto-font">G</span>e
        <span className="cogeto-font">T</span>o.
      </p>
    </Container>
    <Container className="torder-docs-section">
      <h6 className="doc-header">Help</h6>
      <p>
        <a
          href="https://sites.google.com/site/magrigrg/home/cogeto"
          title="CoGeTo manual"
          target="_blank"
          rel="noopener noreferrer">
          Here
        </a>{' '}
        you can find a manual that explains how to read the output produced by{' '}
        <span className="cogeto-font">C</span>o
        <span className="cogeto-font">G</span>e
        <span className="cogeto-font">T</span>o. For questions or bug reports,
        please contact us at{' '}
        <a
          href="mailto:magrigrg@gmail.com"
          title="magrigrg@gmail.com"
          target="_blank"
          rel="noopener noreferrer">
          magrigrg@gmail.com
        </a>{' '}
        or{' '}
        <a
          href="mailto:anttila@stanford.edu"
          title="anttila@stanford.edu"
          target="_blank"
          rel="noopener noreferrer">
          anttila@stanford.edu
        </a>
        .
      </p>
    </Container>
    <Container className="torder-docs-section">
      <h6 className="doc-header">
        Some work that uses <span className="cogeto-font">C</span>o
        <span className="cogeto-font">G</span>e
        <span className="cogeto-font">T</span>o
      </h6>
      <ul className="doc-list">
        <li>
          Anttila, Arto, Scott Borgeson, and Giorgio Magri. 2019.{' '}
          <a
            href="https://arxiv.org/abs/1907.05839"
            title="Equiprobable mappings in weighted constraint grammars"
            target="_blank"
            rel="noopener noreferrer">
            Equiprobable mappings in weighted constraint grammars.
          </a>{' '}
          In{' '}
          <em>
            Proceedings of the 16th SIGMORPHON Workshop on Computational
            Research in Phonetics, Phonology, and Morphology
          </em>
          .
        </li>
        <li>
          Anttila, Arto and Giorgio Magri. 2018.{' '}
          <a
            href="https://journals.linguisticsociety.org/proceedings/index.php/amphonology/article/view/4260"
            title="Does MaxEnt Overgenerate?
            Implicational Universals in Maximum Entropy Grammar"
            target="_blank"
            rel="noopener noreferrer">
            Does MaxEnt Overgenerate? Implicational Universals in Maximum
            Entropy Grammar.
          </a>{' '}
          In Gallagher, Gillian, Maria Gouskova, and Sora Yin (eds.),{' '}
          <em>Proceedings of the 2017 Annual Meeting on Phonology</em>.
          Washington, DC: Linguistic Society of America.
        </li>
      </ul>
    </Container>
    <Container id="citing" className="torder-docs-section">
      <h6 className="doc-header">Citing</h6>
      <p>
        Giorgio Magri and Arto Anttila. 2019.{' '}
        <a
          href="https://cogeto.stanford.edu"
          title="https://cogeto.stanford.edu"
          target="_blank"
          rel="noopener noreferrer">
          <span className="cogeto-font">C</span>o
          <span className="cogeto-font">G</span>e
          <span className="cogeto-font">T</span>o: Convex Geometry Tools for
          typological analysis in categorical and probabilistic constraint-based
          phonology
        </a>{' '}
        (Version 1.0).
      </p>
    </Container>
  </Container>
);

export default Documentation;
