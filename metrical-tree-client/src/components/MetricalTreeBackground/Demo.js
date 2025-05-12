import React, { useRef, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Slider from '@material-ui/core/Slider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import MetricalTreeBackground from './index';
import { STANFORD_COLORS } from './constants';

// Styles for the demo component
const useStyles = makeStyles((theme) => ({
  root: {
    position: 'relative',
    height: '100vh',
    width: '100%',
    overflow: 'hidden',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    padding: theme.spacing(2),
  },
  content: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: theme.spacing(3),
    borderRadius: theme.shape.borderRadius,
    maxWidth: 600,
    width: '100%',
    boxShadow: theme.shadows[4],
  },
  title: {
    color: STANFORD_COLORS.RED,
    marginBottom: theme.spacing(2),
  },
  description: {
    marginBottom: theme.spacing(3),
  },
  controlsContainer: {
    marginTop: theme.spacing(3),
  },
  controlGroup: {
    marginBottom: theme.spacing(2),
  },
  controlLabel: {
    marginBottom: theme.spacing(1),
  },
  sliderWrapper: {
    padding: theme.spacing(0, 2),
  },
  buttonGroup: {
    display: 'flex',
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  },
  button: {
    backgroundColor: STANFORD_COLORS.RED,
    color: 'white',
    '&:hover': {
      backgroundColor: STANFORD_COLORS.LIGHT_RED,
    },
  },
  stressLegend: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(3),
    gap: theme.spacing(3),
  },
  stressItem: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 12,
  },
  stressIndicator: {
    display: 'inline-block',
    width: 12,
    height: 12,
    marginRight: theme.spacing(0.5),
    borderRadius: '50%',
  },
}));

/**
 * Demo component for MetricalTreeBackground.
 * This demonstrates how to use the component and its various configuration options.
 */
const MetricalTreeBackgroundDemo = () => {
  const classes = useStyles();
  const treeRef = useRef(null);
  
  // State for configuration options
  const [config, setConfig] = useState({
    maxDepth: 6,
    growthSpeed: 3,
    particlesEnabled: true,
    particleCount: 25,
    pulseEnabled: true,
    autoRegenerate: true,
  });
  
  // Handle change for sliders
  const handleSliderChange = (name) => (event, newValue) => {
    setConfig({
      ...config,
      [name]: newValue,
    });
    
    // Update tree configuration
    if (treeRef.current) {
      if (name === 'maxDepth') {
        treeRef.current.setConfig({
          tree: { maxDepth: newValue }
        });
      } else if (name === 'growthSpeed') {
        treeRef.current.setConfig({
          tree: { growthSpeed: newValue }
        });
      } else if (name === 'particleCount') {
        treeRef.current.setConfig({
          particles: { count: newValue }
        });
      }
    }
  };
  
  // Handle change for switches
  const handleSwitchChange = (name) => (event) => {
    const newValue = event.target.checked;
    setConfig({
      ...config,
      [name]: newValue,
    });
    
    // Update tree configuration
    if (treeRef.current) {
      if (name === 'particlesEnabled') {
        treeRef.current.setConfig({
          particles: { enabled: newValue }
        });
      } else if (name === 'pulseEnabled') {
        treeRef.current.setConfig({
          tree: { pulseEnabled: newValue }
        });
      } else if (name === 'autoRegenerate') {
        treeRef.current.setConfig({
          animation: { autoRegenerate: newValue }
        });
      }
    }
  };
  
  // Regenerate the tree
  const handleRegenerate = () => {
    if (treeRef.current) {
      treeRef.current.regenerateTree();
    }
  };
  
  // Toggle animation
  const handleToggleAnimation = () => {
    if (treeRef.current) {
      // Check if tree is currently animating
      if (config.isAnimating) {
        treeRef.current.pauseAnimation();
      } else {
        treeRef.current.resumeAnimation();
      }
      
      // Update state
      setConfig({
        ...config,
        isAnimating: !config.isAnimating,
      });
    }
  };
  
  return (
    <div className={classes.root}>
      {/* MetricalTreeBackground component */}
      <MetricalTreeBackground
        ref={treeRef}
        showControls={false}
        tree={{
          maxDepth: config.maxDepth,
          growthSpeed: config.growthSpeed,
          pulseEnabled: config.pulseEnabled,
        }}
        particles={{
          enabled: config.particlesEnabled,
          count: config.particleCount,
        }}
        animation={{
          autoRegenerate: config.autoRegenerate,
        }}
        onReady={() => console.log("MetricalTreeBackground is ready")}
        onTreeGenerated={() => console.log("Tree generation complete")}
      />
      
      {/* Content overlay with controls */}
      <div className={classes.contentWrapper}>
        <Paper className={classes.content}>
          <Typography variant="h4" component="h1" className={classes.title}>
            Metrical Tree Visualization
          </Typography>
          
          <Typography variant="body1" className={classes.description}>
            This dynamic background visualizes linguistic stress patterns in metrical trees,
            using different colors to represent unstressed, normal, and stressed syllables.
            Customize the visualization using the controls below.
          </Typography>
          
          <Divider />
          
          <div className={classes.controlsContainer}>
            <div className={classes.controlGroup}>
              <Typography variant="subtitle1" className={classes.controlLabel}>
                Tree Depth: {config.maxDepth}
              </Typography>
              <div className={classes.sliderWrapper}>
                <Slider
                  value={config.maxDepth}
                  onChange={handleSliderChange('maxDepth')}
                  min={3}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </div>
            </div>
            
            <div className={classes.controlGroup}>
              <Typography variant="subtitle1" className={classes.controlLabel}>
                Growth Speed: {config.growthSpeed}
              </Typography>
              <div className={classes.sliderWrapper}>
                <Slider
                  value={config.growthSpeed}
                  onChange={handleSliderChange('growthSpeed')}
                  min={1}
                  max={10}
                  step={1}
                  marks
                  valueLabelDisplay="auto"
                />
              </div>
            </div>
            
            {config.particlesEnabled && (
              <div className={classes.controlGroup}>
                <Typography variant="subtitle1" className={classes.controlLabel}>
                  Particle Count: {config.particleCount}
                </Typography>
                <div className={classes.sliderWrapper}>
                  <Slider
                    value={config.particleCount}
                    onChange={handleSliderChange('particleCount')}
                    min={0}
                    max={50}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                  />
                </div>
              </div>
            )}
            
            <Box mt={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.particlesEnabled}
                    onChange={handleSwitchChange('particlesEnabled')}
                    color="primary"
                  />
                }
                label="Enable Particles"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.pulseEnabled}
                    onChange={handleSwitchChange('pulseEnabled')}
                    color="primary"
                  />
                }
                label="Enable Pulse Effect"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={config.autoRegenerate}
                    onChange={handleSwitchChange('autoRegenerate')}
                    color="primary"
                  />
                }
                label="Auto Regenerate"
              />
            </Box>
            
            <div className={classes.buttonGroup}>
              <Button 
                variant="contained" 
                className={classes.button}
                onClick={handleRegenerate}
              >
                Regenerate Tree
              </Button>
              
              <Button 
                variant="contained" 
                className={classes.button}
                onClick={handleToggleAnimation}
              >
                {config.isAnimating ? 'Pause Animation' : 'Resume Animation'}
              </Button>
            </div>
          </div>
          
          <div className={classes.stressLegend}>
            <div className={classes.stressItem}>
              <span 
                className={classes.stressIndicator} 
                style={{ backgroundColor: STANFORD_COLORS.GOLD }}
              />
              <span>Unstressed</span>
            </div>
            <div className={classes.stressItem}>
              <span 
                className={classes.stressIndicator} 
                style={{ backgroundColor: STANFORD_COLORS.CLAY }}
              />
              <span>Normal</span>
            </div>
            <div className={classes.stressItem}>
              <span 
                className={classes.stressIndicator} 
                style={{ backgroundColor: STANFORD_COLORS.RED }}
              />
              <span>Stressed</span>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default MetricalTreeBackgroundDemo;
