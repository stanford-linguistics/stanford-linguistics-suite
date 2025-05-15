import React, { useRef, useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import LinguisticMetricalTree from './LinguisticMetricalTree';
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
 * Demo component for LinguisticMetricalTree.
 * This demonstrates how to use the component and its various configuration options.
 */
const LinguisticMetricalTreeDemo = () => {
  const classes = useStyles();
  const treeRef = useRef(null);
  
  // State for configuration options
  const [config, setConfig] = useState({
    particlesEnabled: true,
    pulseEnabled: true,
    autoRegenerate: true,
    isAnimating: true
  });
  
  // Handle change for switches
  const handleSwitchChange = (name) => (event) => {
    const newValue = event.target.checked;
    setConfig({
      ...config,
      [name]: newValue,
    });
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
      {/* LinguisticMetricalTree component */}
      <LinguisticMetricalTree
        ref={treeRef}
        showControls={false}
        particles={{
          enabled: config.particlesEnabled,
          count: 20,
        }}
        animation={{
          autoRegenerate: config.autoRegenerate,
          active: config.isAnimating
        }}
        onReady={() => console.log("LinguisticMetricalTree is ready")}
        onTreeGenerated={() => console.log("Tree generation complete")}
      />
      
      {/* Content overlay with controls */}
      <div className={classes.contentWrapper}>
        <Paper className={classes.content}>
          <Typography variant="h4" component="h1" className={classes.title}>
            Linguistic Metrical Tree Visualization
          </Typography>
          
          <Typography variant="body1" className={classes.description}>
            This visualization displays a metrical tree for the phrase "When America says something America means it", 
            showing stress patterns in linguistic structures with coordinated bar graph animation. 
            The diagram shows the hierarchical prosodic structure with strong (s) and weak (w) nodes.
          </Typography>
          
          <Divider />
          
          <div className={classes.controlsContainer}>
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
                Regenerate Visualization
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
                style={{ backgroundColor: STANFORD_COLORS.LIGHT_GREY }}
              />
              <span>Value 1 (Low)</span>
            </div>
            <div className={classes.stressItem}>
              <span 
                className={classes.stressIndicator} 
                style={{ backgroundColor: STANFORD_COLORS.CLAY }}
              />
              <span>Value 2 (Medium)</span>
            </div>
            <div className={classes.stressItem}>
              <span 
                className={classes.stressIndicator} 
                style={{ backgroundColor: STANFORD_COLORS.RED }}
              />
              <span>Value 4 (High)</span>
            </div>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default LinguisticMetricalTreeDemo;