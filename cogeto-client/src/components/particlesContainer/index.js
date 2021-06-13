import React from 'react';
import Particles from 'react-particles-js';

const styles = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  paddingTop: 30 + 16
};

const ParticlesContainer = props => (
  <Particles
    style={styles}
    params={{
      particles: {
        number: {
          value: 100
        },
        size: {
          value: 3
        }
      }
    }}
  />
);

export default ParticlesContainer;
