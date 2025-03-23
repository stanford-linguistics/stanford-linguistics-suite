import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Grid,
  Divider,
  Paper,
  Chip,
  Tooltip,
  useTheme,
  alpha,
  Zoom
} from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import { POS_COLORS, STRESS_COLORS } from '../../constants';

const useStyles = makeStyles((theme) => ({
  dialogPaper: {
    borderRadius: theme.shape.borderRadius * 2,
    maxWidth: '90vw',
    width: 800,
    maxHeight: '80vh',
    overflow: 'hidden'
  },
  dialogTitle: {
    padding: theme.spacing(2, 3),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  posChip: {
    marginLeft: theme.spacing(1),
    height: 24
  },
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
    color: theme.palette.grey[500],
  },
  dialogContent: {
    padding: theme.spacing(2, 3, 3),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    display: 'flex',
    alignItems: 'center',
    '&::after': {
      content: '""',
      flex: 1,
      height: '1px',
      backgroundColor: theme.palette.divider,
      marginLeft: theme.spacing(1),
    },
  },
  contextHighlight: {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    fontWeight: 'bold',
    padding: '0 4px',
    borderRadius: '3px'
  },
  metricGauge: {
    height: 8,
    backgroundColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 12,
    position: 'relative'
  },
  metricGaugeValue: {
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: theme.shape.borderRadius
  },
  metricLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.875rem'
  },
  detailBox: {
    padding: theme.spacing(2),
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    borderRadius: theme.shape.borderRadius,
    height: '100%'
  },
  detailGrid: {
    marginBottom: theme.spacing(2)
  },
  detailItem: {
    marginBottom: theme.spacing(0.75)
  },
  detailValue: {
    fontWeight: 'bold'
  },
  badge: {
    padding: theme.spacing(0.5, 1),
    fontSize: '0.75rem',
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    borderRadius: theme.shape.borderRadius,
    display: 'inline-block',
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(0.5)
  },
  wordPropertiesBox: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: alpha(theme.palette.background.default, 0.7),
    borderRadius: theme.shape.borderRadius,
  },
  indexBadge: {
    display: 'inline-block',
    padding: theme.spacing(0.25, 1),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    fontSize: '0.875rem',
    marginRight: theme.spacing(1),
  },
  contextBox: {
    padding: theme.spacing(2),
    backgroundColor: alpha(theme.palette.background.paper, 0.9),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    marginTop: theme.spacing(1),
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    lineHeight: 1.6,
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: '-8px',
      left: '20px',
      width: 0,
      height: 0,
      borderLeft: '8px solid transparent',
      borderRight: '8px solid transparent',
      borderBottom: `8px solid ${alpha(theme.palette.background.paper, 0.9)}`,
    },
  },
  wordTitle: {
    fontWeight: 'bold',
    marginRight: theme.spacing(1)
  }
}));

/**
 * Get appropriate tooltip text for stress status
 * 
 * @param {string} stressType - The stress type ('yes', 'no', 'ambig')
 * @returns {string} Descriptive text for the tooltip
 */
const getStressTooltip = (stressType) => {
  switch(stressType) {
    case 'yes':
      return 'Word has lexical stress';
    case 'no':
      return 'Word does not have lexical stress';
    case 'ambig':
      return 'Word has ambiguous stress status';
    default:
      return 'Stress status';
  }
};

/**
 * Creates a context window around a target word in a sentence
 * 
 * @param {string} sentence - The full sentence text
 * @param {string} targetWord - The word to highlight
 * @param {number} windowSize - Number of words to include on each side of the target (default: 5)
 * @returns {Object} Object with contextBefore, targetWord, and contextAfter
 */
const createContextWindow = (sentence, targetWord, windowSize = 10) => {
  if (!sentence || !targetWord) return { before: '', target: targetWord, after: '' };
  
  // Split the sentence into words
  const words = sentence.split(/\s+/);
  
  // Find the index of the target word
  let targetIndex = -1;
  for (let i = 0; i < words.length; i++) {
    // Clean up the word for comparison (remove punctuation)
    const cleanWord = words[i].replace(/[.,;:!?()'"]/g, '');
    if (cleanWord.toLowerCase() === targetWord.toLowerCase()) {
      targetIndex = i;
      break;
    }
  }
  
  // If target word not found, return the whole sentence
  if (targetIndex === -1) return { before: '', target: targetWord, after: sentence };
  
  // Calculate the start and end indices for the context window
  const startIndex = Math.max(0, targetIndex - windowSize);
  const endIndex = Math.min(words.length, targetIndex + windowSize + 1);
  
  // Create the context parts
  const contextBefore = words.slice(startIndex, targetIndex).join(' ');
  const contextAfter = words.slice(targetIndex + 1, endIndex).join(' ');
  
  // Add ellipsis if there are words before or after the window
  const before = startIndex > 0 ? '... ' + contextBefore : contextBefore;
  const after = endIndex < words.length ? contextAfter + ' ...' : contextAfter;
  
  return { before, target: words[targetIndex], after };
};

/**
 * Word detail modal component
 */
const WordDetailModal = ({ word, open, onClose }) => {
  const classes = useStyles();
  const theme = useTheme();
  
  if (!word) return null;
  
  // Parse metric values safely as numbers
  const metrics = {
    m1: parseFloat(word.m1) || 0,
    m2a: parseFloat(word.m2a) || 0,
    m2b: parseFloat(word.m2b) || 0,
    mean: parseFloat(word.mean) || 0,
    norm_m1: parseFloat(word.norm_m1) || 0,
    norm_m2a: parseFloat(word.norm_m2a) || 0,
    norm_m2b: parseFloat(word.norm_m2b) || 0,
    norm_mean: parseFloat(word.norm_mean) || 0
  };
  
  // Get color for POS tag
  const posColor = POS_COLORS[word.pos] || POS_COLORS.default;
  
  // Get color for stress
  const stressColor = STRESS_COLORS[word.lexstress] || STRESS_COLORS.default;
  
  // Create the context window for the sentence
  const context = createContextWindow(word.sent, word.word);
  
  // Metric colors
  const metricColors = {
    m1: theme.palette.info.main,
    m2a: theme.palette.warning.main,
    m2b: theme.palette.error.main,
    mean: theme.palette.success.main
  };
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      classes={{ paper: classes.dialogPaper }}
      TransitionComponent={Zoom}
      maxWidth="md"
    >
      <DialogTitle disableTypography className={classes.dialogTitle}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" className={classes.wordTitle}>
            {word.word}
          </Typography>
          
          <Chip
            label={word.pos}
            size="small"
            className={classes.posChip}
            style={{
              backgroundColor: posColor,
              color: '#fff'
            }}
          />
          
          <Tooltip title={getStressTooltip(word.lexstress)}>
            <Chip
              label={word.lexstress}
              size="small"
              style={{
                backgroundColor: stressColor,
                color: '#fff',
                marginLeft: 8
              }}
            />
          </Tooltip>
        </div>
        
        <IconButton className={classes.closeButton} onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <Divider />
      
      <DialogContent className={classes.dialogContent}>
        {/* Word Identification */}
        <div className={classes.section}>
          <div className={classes.wordPropertiesBox}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="body2">
                  <span className={classes.indexBadge}>#{word.widx}-{word.sidx}</span>
                  Word ID
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="body2">
                  <strong>Syllables:</strong> {word.nsyll}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="body2">
                  <strong>Segmentation:</strong> {word.seg}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <Typography variant="body2">
                  <strong>Stress Count:</strong> {word.nstress || '0'}
                </Typography>
              </Grid>
            </Grid>
          </div>
        </div>
        
        {/* Sentence Context */}
        <div className={classes.section}>
          <Typography className={classes.sectionTitle}>
            Sentence Context
          </Typography>
          
          <Typography variant="body2" style={{ marginBottom: 8 }}>
            <strong>Sentence ID:</strong> {word.sidx}
          </Typography>
          
          <div className={classes.contextBox}>
            {context.before}{' '}
            <span className={classes.contextHighlight}>{context.target}</span>{' '}
            {context.after}
          </div>
        </div>
        
        {/* Metrics */}
        <div className={classes.section}>
          <Typography className={classes.sectionTitle}>
            Metric Analysis
          </Typography>
          
          <Grid container spacing={3}>
            {/* Raw Metrics */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.detailBox} elevation={0}>
                <Typography variant="subtitle2" gutterBottom>
                  Raw Metrics
                </Typography>
                
                <div>
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>M1</span>
                    <span>{metrics.m1.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.m1 * 100, 100)}%`,
                        backgroundColor: metricColors.m1
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>M2a</span>
                    <span>{metrics.m2a.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.m2a * 100, 100)}%`,
                        backgroundColor: metricColors.m2a
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>M2b</span>
                    <span>{metrics.m2b.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.m2b * 100, 100)}%`,
                        backgroundColor: metricColors.m2b
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span><strong>Mean</strong></span>
                    <span><strong>{metrics.mean.toFixed(3)}</strong></span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.mean * 100, 100)}%`,
                        backgroundColor: metricColors.mean
                      }}
                    />
                  </div>
                </div>
              </Paper>
            </Grid>
            
            {/* Normalized Metrics */}
            <Grid item xs={12} md={6}>
              <Paper className={classes.detailBox} elevation={0}>
                <Typography variant="subtitle2" gutterBottom>
                  Normalized Metrics
                </Typography>
                
                <div>
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>Norm M1</span>
                    <span>{metrics.norm_m1.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.norm_m1 * 100, 100)}%`,
                        backgroundColor: metricColors.m1
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>Norm M2a</span>
                    <span>{metrics.norm_m2a.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.norm_m2a * 100, 100)}%`,
                        backgroundColor: metricColors.m2a
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span>Norm M2b</span>
                    <span>{metrics.norm_m2b.toFixed(3)}</span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.norm_m2b * 100, 100)}%`,
                        backgroundColor: metricColors.m2b
                      }}
                    />
                  </div>
                  
                  <Typography variant="body2" className={classes.metricLabel}>
                    <span><strong>Norm Mean</strong></span>
                    <span><strong>{metrics.norm_mean.toFixed(3)}</strong></span>
                  </Typography>
                  <div className={classes.metricGauge}>
                    <div
                      className={classes.metricGaugeValue}
                      style={{ 
                        width: `${Math.min(metrics.norm_mean * 100, 100)}%`,
                        backgroundColor: metricColors.mean
                      }}
                    />
                  </div>
                </div>
              </Paper>
            </Grid>
          </Grid>
        </div>
        
        {/* Linguistic Properties */}
        <div className={classes.section}>
          <Typography className={classes.sectionTitle}>
            Linguistic Properties
          </Typography>
          
          <Grid container spacing={2} className={classes.detailGrid}>
            <Grid item xs={12} sm={6}>
              <Paper className={classes.detailBox} elevation={0}>
                <Typography className={classes.detailItem}>
                  <strong>Part of Speech:</strong> {word.pos}
                </Typography>
                
                <Typography className={classes.detailItem}>
                  <strong>Dependency:</strong> {word.dep}
                </Typography>
                
                <Typography className={classes.detailItem}>
                  <strong>Lexical Stress:</strong> {word.lexstress}
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Paper className={classes.detailBox} elevation={0}>
                <Typography className={classes.detailItem}>
                  <strong>Syllable Count:</strong> {word.nsyll}
                </Typography>
                
                <Typography className={classes.detailItem}>
                  <strong>Segmentation:</strong> {word.seg}
                </Typography>
                
                {word.contour && (
                  <Typography className={classes.detailItem}>
                    <strong>Contour:</strong> {word.contour}
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordDetailModal;
