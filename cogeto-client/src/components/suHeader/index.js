import React from 'react';

const SuHeader = props => (
  <div id="brandbar">
    <div className="container">
      {' '}
      <a href="http://www.stanford.edu">
        {' '}
        <img
          src="https://www-media.stanford.edu/su-identity/images/brandbar-stanford-logo@2x.png"
          alt="Stanford University"
          width="159"
          height="30"
        />{' '}
      </a>{' '}
    </div>
  </div>
);

export default SuHeader;
