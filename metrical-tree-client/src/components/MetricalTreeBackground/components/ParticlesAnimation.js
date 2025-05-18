import React, { useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import { backgroundConfig } from '../config';

/**
 * Style definitions for ParticlesAnimation
 */
const useStyles = makeStyles(() => ({
  particlesSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
  }
}));

/**
 * ParticlesAnimation component
 * 
 * Renders and animates floating particles based on configuration
 */
const ParticlesAnimation = ({ 
  enabled = true, 
  count, 
  colors,
  isMobile = false 
}) => {
  // Always declare hooks at the top level, regardless of the enabled state
  // Styles
  const classes = useStyles();
  
  // Refs
  const svgRef = useRef(null);
  const animationFrameId = useRef(null);
  const particlesData = useRef([]);
  
  /**
   * Create particles in the SVG and initialize animation data
   */
  const createParticles = useCallback(() => {
    // Only create particles if enabled and the ref is available
    if (!svgRef.current || !enabled) return;

    // Clear existing particles
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = svgRef.current.clientHeight;
    
    // Determine particle count based on mobile status and props
    const particleCount = isMobile ? 
      backgroundConfig.particles.mobileCount : 
      (count || backgroundConfig.particles.count);
      
    const ns = 'http://www.w3.org/2000/svg';
    
    // Initialize particles data for animation
    particlesData.current = [];
    
    // Use colors from props or config
    const particleColors = colors || backgroundConfig.particles.colors;
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElementNS(ns, 'circle');
      
      // Random position, size, and opacity
      const x = Math.random() * containerWidth;
      const y = Math.random() * containerHeight;
      const size = Math.random() * 
        (backgroundConfig.particles.maxSize - backgroundConfig.particles.minSize) + 
        backgroundConfig.particles.minSize;
      const opacity = Math.random() * 
        (backgroundConfig.particles.opacityMax - backgroundConfig.particles.opacityMin) + 
        backgroundConfig.particles.opacityMin;
      
      // Random velocity for animation
      const vx = (Math.random() - 0.5) * 0.5; // velocity x component
      const vy = (Math.random() - 0.5) * 0.5; // velocity y component
      
      // Random color from the defined colors array
      const colorIndex = Math.floor(Math.random() * particleColors.length);
      const color = particleColors[colorIndex];
      
      particle.setAttribute('cx', x);
      particle.setAttribute('cy', y);
      particle.setAttribute('r', size);
      particle.setAttribute('fill', color);
      particle.setAttribute('opacity', opacity);
      
      svgRef.current.appendChild(particle);
      
      // Store particle data for animation
      particlesData.current.push({
        element: particle,
        x,
        y,
        vx,
        vy,
        size
      });
    }
  }, [isMobile, count, colors]);
  
  /**
   * Animate particles
   */
  const animateParticles = useCallback(() => {
    if (!svgRef.current || !particlesData.current.length || !enabled) return;
    
    const containerWidth = svgRef.current.clientWidth;
    const containerHeight = svgRef.current.clientHeight;
    
    // Update each particle's position
    particlesData.current.forEach(particle => {
      // Update position based on velocity
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x <= particle.size || particle.x >= containerWidth - particle.size) {
        particle.vx = -particle.vx;
        particle.x = Math.max(particle.size, Math.min(containerWidth - particle.size, particle.x));
      }
      
      if (particle.y <= particle.size || particle.y >= containerHeight - particle.size) {
        particle.vy = -particle.vy;
        particle.y = Math.max(particle.size, Math.min(containerHeight - particle.size, particle.y));
      }
      
      // Update particle element position
      particle.element.setAttribute('cx', particle.x);
      particle.element.setAttribute('cy', particle.y);
    });
    
    // Continue animation loop
    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, []);
  
  /**
   * Start particle animation
   */
  const startParticleAnimation = useCallback(() => {
    // Only start animation if enabled
    if (!enabled) return;
    
    // Cancel any existing animation frame
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    // Start animation loop
    animationFrameId.current = requestAnimationFrame(animateParticles);
  }, [animateParticles, enabled]);
  
  /**
   * Stop particle animation
   */
  const stopParticleAnimation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // Handle component mount/unmount and updates
  useEffect(() => {
    if (enabled) {
      createParticles();
      startParticleAnimation();
    }
    
    // Cleanup on unmount or when enabled changes
    return () => {
      stopParticleAnimation();
    };
  }, [
    createParticles, 
    startParticleAnimation, 
    stopParticleAnimation, 
    isMobile, 
    count,
    enabled
  ]);

  // Handle resize effect
  useEffect(() => {
    const handleResize = () => {
      if (enabled) {
        createParticles();
      }
    };
    
    if (enabled) {
      window.addEventListener('resize', handleResize);
    }
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [createParticles, enabled]);

  // Conditionally render based on enabled prop
  return enabled ? (
    <svg 
      className={classes.particlesSvg} 
      ref={svgRef} 
      xmlns="http://www.w3.org/2000/svg"
    />
  ) : null;
};

ParticlesAnimation.propTypes = {
  enabled: PropTypes.bool,
  count: PropTypes.number,
  colors: PropTypes.arrayOf(PropTypes.string),
  isMobile: PropTypes.bool
};

export default ParticlesAnimation;
