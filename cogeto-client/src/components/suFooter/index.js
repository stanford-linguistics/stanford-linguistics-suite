import React from 'react';

const SuFooter = props => (
  <div id="torder-su-footer">
    <div className="su-footer-item-container">
      <a href="https://www.stanford.edu">
        <img
          src="https://www-media.stanford.edu/su-identity/images/footer-stanford-logo@2x.png"
          alt="Stanford University"
          width="105"
          height="49"
        />
      </a>
    </div>
    <div className="su-footer-item-container">
      <ul id="primary-links">
        <li>
          <a href="https://www.stanford.edu">Stanford Home</a>
        </li>
        <li>
          <a href="https://visit.stanford.edu/plan/">Maps & Directions</a>
        </li>
        <li>
          <a href="https://www.stanford.edu/search/">Search Stanford</a>
        </li>
        <li>
          <a href="https://emergency.stanford.edu">Emergency Info</a>
        </li>
      </ul>
    </div>
    <div className="su-footer-item-container">
      <ul id="policy-links">
        <li>
          <a
            href="https://www.stanford.edu/site/terms/"
            title="Terms of use for sites">
            Terms of Use
          </a>
        </li>
        <li>
          <a
            href="https://www.stanford.edu/site/privacy/"
            title="Privacy and cookie policy">
            Privacy
          </a>
        </li>
        <li>
          <a
            href="https://uit.stanford.edu/security/copyright-infringement"
            title="Report alleged copyright infringement">
            Copyright
          </a>
        </li>
        <li>
          <a
            href="https://adminguide.stanford.edu/chapter-1/subchapter-5/policy-1-5-4"
            title="Ownership and use of Stanford trademarks and images">
            Trademarks
          </a>
        </li>
        <li>
          <a
            href="http://exploredegrees.stanford.edu/nonacademicregulations/nondiscrimination/"
            title="Non-discrimination policy">
            Non-Discrimination
          </a>
        </li>
        <li>
          <a
            href="https://www.stanford.edu/site/accessibility"
            title="Report web accessibility issues">
            Accessibility
          </a>
        </li>
      </ul>
    </div>
    <div className="su-footer-item-container">
      <ul id="copywrite">
        <li>
          &copy; <span>Stanford University</span>
        </li>
      </ul>
    </div>
  </div>
);

export default SuFooter;
