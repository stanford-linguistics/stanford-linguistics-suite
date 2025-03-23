import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Paper,
  Tooltip,
  IconButton,
  Grid,
  Box,
  Chip,
  Divider,
  FormControlLabel,
  Switch,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
} from '@material-ui/core';
import {
  FileCopy as FileCopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@material-ui/icons';

import { POS_COLORS, STRESS_COLORS } from '../constants';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(1),
    overflowY: 'auto',
    height: '600px',
  },
  sentencePaper: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    position: 'relative',
    borderLeft: '4px solid transparent',
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:hover': {
      boxShadow: theme.shadows[4],
    },
  },
  // Removed highlighted styling since we removed that functionality
  sentenceId: {
    position: 'absolute',
    right: theme.spacing(6), // Increased from 2 to 6 to avoid overlap with the copy button
    top: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontWeight: 'bold',
    fontSize: '0.8rem',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    zIndex: 1,
  },
  wordInSentence: {
    display: 'inline-block',
    padding: theme.spacing(0.5, 0.75),
    margin: theme.spacing(0.25),
    borderRadius: theme.shape.borderRadius,
    cursor: 'pointer',
    transition: theme.transitions.create(['background-color', 'box-shadow']),
    userSelect: 'none',
    position: 'relative',
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.light, 0.1),
      boxShadow: theme.shadows[1],
    },
  },
  wordHighlighted: {
    backgroundColor: alpha(theme.palette.primary.main, 0.1),
    boxShadow: theme.shadows[1],
  },
  wordSelected: {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    boxShadow: theme.shadows[2],
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.3),
    },
  },
  wordMetadata: {
    position: 'absolute',
    top: -8,
    right: -4,
    fontSize: '0.6rem',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(0, 0.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    zIndex: 1,
  },
  wordMetrics: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '0.6rem',
    color: theme.palette.text.secondary,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(0, 0.5),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
    zIndex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
  metricsIndicator: {
    display: 'inline-block',
    width: 6,
    height: 6,
    borderRadius: '50%',
    marginRight: 2,
  },
  sentenceToolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  sentenceStats: {
    display: 'flex',
    gap: theme.spacing(1),
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  statChip: {
    height: 24,
    fontSize: '0.7rem',
  },
  statsLabel: {
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
  },
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
  },
  controlsLeft: {
    display: 'flex',
    gap: theme.spacing(2),
  },
  legend: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(1.5),
    backgroundColor: alpha(theme.palette.background.paper, 0.8),
    borderRadius: theme.shape.borderRadius,
    border: `1px solid ${theme.palette.divider}`,
  },
  legendHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.05),
    },
  },
  legendTitle: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
  },
  toggleButton: {
    padding: 2,
  },
  legendSection: {
    marginBottom: theme.spacing(1),
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
  },
  legendColor: {
    width: 16,
    height: 16,
    marginRight: theme.spacing(1),
    borderRadius: 2,
    border: `1px solid ${theme.palette.divider}`,
  },
  legendLabel: {
    fontSize: '0.8rem',
  },
  legendGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: theme.spacing(1),
  },
  wordDetailsCard: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    borderTop: `3px solid ${theme.palette.primary.main}`,
  },
  metricGauge: {
    height: 4,
    backgroundColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    position: 'relative',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  metricGaugeValue: {
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius,
  },
  metricGaugeLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.75rem',
    color: theme.palette.text.secondary,
  },
  viewHeading: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  viewTitle: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
}));

/**
 * Process data to group by sentences with calculated statistics
 * 
 * @param {Array} data - Current page data
 * @returns {Array} Processed sentences
 */
const processSentences = (data) => {
  const sentenceMap = new Map();
  
  // Group words by sentence
  data.forEach(word => {
    const sidx = word.sidx;
    if (!sentenceMap.has(sidx)) {
      sentenceMap.set(sidx, {
        sidx,
        text: word.sent,
        words: [],
        stats: {
          posDistribution: {},
          stressDistribution: {},
          avgMetrics: {
            m1: 0,
            m2a: 0,
            m2b: 0,
            mean: 0,
          },
          wordCount: 0,
        }
      });
    }
    
    const sentence = sentenceMap.get(sidx);
    
    // Add word to the sentence
    sentence.words.push({
      widx: word.widx,
      text: word.word,
      pos: word.pos,
      stress: word.lexstress,
      metrics: {
        m1: parseFloat(word.m1) || 0,
        m2a: parseFloat(word.m2a) || 0,
        m2b: parseFloat(word.m2b) || 0,
        mean: parseFloat(word.mean) || 0,
      },
      nsyll: word.nsyll,
      dep: word.dep,
      seg: word.seg,
      raw: word, // Store the original word data
    });
    
    // Update sentence statistics
    const stats = sentence.stats;
    
    // Update POS distribution
    if (!stats.posDistribution[word.pos]) {
      stats.posDistribution[word.pos] = 0;
    }
    stats.posDistribution[word.pos]++;
    
    // Update stress distribution
    if (!stats.stressDistribution[word.lexstress]) {
      stats.stressDistribution[word.lexstress] = 0;
    }
    stats.stressDistribution[word.lexstress]++;
    
    // Update metrics totals (we'll calculate averages later)
    stats.avgMetrics.m1 += parseFloat(word.m1) || 0;
    stats.avgMetrics.m2a += parseFloat(word.m2a) || 0;
    stats.avgMetrics.m2b += parseFloat(word.m2b) || 0;
    stats.avgMetrics.mean += parseFloat(word.mean) || 0;
    
    stats.wordCount++;
  });
  
  // Calculate average metrics for each sentence
  sentenceMap.forEach(sentence => {
    const stats = sentence.stats;
    if (stats.wordCount > 0) {
      stats.avgMetrics.m1 /= stats.wordCount;
      stats.avgMetrics.m2a /= stats.wordCount;
      stats.avgMetrics.m2b /= stats.wordCount;
      stats.avgMetrics.mean /= stats.wordCount;
    }
  });
  
  // Convert map to array and sort by sentence index
  return Array.from(sentenceMap.values())
    .sort((a, b) => a.sidx - b.sidx);
};

/**
 * Color Legend component with collapsible content
 */
const ColorLegend = ({ classes, expanded = false, onToggle = () => {} }) => (
  <Paper className={classes.legend}>
    <div className={classes.legendHeader} onClick={onToggle}>
      <Typography className={classes.legendTitle}>Color Legend</Typography>
      <IconButton className={classes.toggleButton} size="small">
        {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
      </IconButton>
    </div>
    
    <Collapse in={expanded} timeout="auto">
      <div style={{ marginTop: 8 }}>
        <Grid container spacing={2}>
          {/* POS Colors */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Part of Speech (Background Colors)
            </Typography>
            <div className={classes.legendGrid}>
              {Object.entries(POS_COLORS).map(([pos, color]) => (
                pos !== 'default' && (
                  <div key={pos} className={classes.legendItem}>
                    <div 
                      className={classes.legendColor} 
                      style={{ backgroundColor: alpha(color, 0.1) }}
                    />
                    <Typography className={classes.legendLabel}>{pos}</Typography>
                  </div>
                )
              ))}
            </div>
          </Grid>
          
          {/* Stress Colors */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Lexical Stress (Bottom Border Colors)
            </Typography>
            <div className={classes.legendGrid}>
              {Object.entries(STRESS_COLORS).map(([stress, color]) => (
                stress !== 'default' && (
                  <div key={stress} className={classes.legendItem}>
                    <div 
                      className={classes.legendColor} 
                      style={{ backgroundColor: color }}
                    />
                    <Typography className={classes.legendLabel}>
                      {stress === '0' ? 'Unstressed' : 
                       stress === '1' ? 'Primary' : 
                       stress === '2' ? 'Secondary' : stress}
                    </Typography>
                  </div>
                )
              ))}
            </div>
          </Grid>
          
          {/* Metric Colors */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" gutterBottom>
              Metric Indicators
            </Typography>
            <div className={classes.legendItem}>
              <div 
                className={classes.legendColor} 
                style={{ backgroundColor: alpha('#4caf50', 0.7) }}
              />
              <Typography className={classes.legendLabel}>
                High metrics (&gt; 0.6)
              </Typography>
            </div>
            <div className={classes.legendItem}>
              <div 
                className={classes.legendColor} 
                style={{ backgroundColor: alpha('#ff9800', 0.7) }}
              />
              <Typography className={classes.legendLabel}>
                Medium metrics (0.3-0.6)
              </Typography>
            </div>
            <div className={classes.legendItem}>
              <div 
                className={classes.legendColor} 
                style={{ backgroundColor: alpha('#f44336', 0.7) }}
              />
              <Typography className={classes.legendLabel}>
                Low metrics (&lt; 0.3)
              </Typography>
            </div>
          </Grid>
        </Grid>
      </div>
    </Collapse>
  </Paper>
);

/**
 * Word detail component for the modal
 */
const WordDetailContent = ({ word, classes }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} sm={6} md={3}>
      <Typography variant="body2">
        <strong>Word Index:</strong> {word.widx}
      </Typography>
      <Typography variant="body2">
        <strong>POS:</strong> {word.pos}
      </Typography>
      <Typography variant="body2">
        <strong>Dependency:</strong> {word.dep}
      </Typography>
      <Typography variant="body2">
        <strong>Segmentation:</strong> {word.seg}
      </Typography>
    </Grid>
    
    <Grid item xs={12} sm={6} md={3}>
      <Typography variant="body2">
        <strong>Lexical Stress:</strong> {word.stress}
      </Typography>
      <Typography variant="body2">
        <strong>Syllables:</strong> {word.nsyll}
      </Typography>
    </Grid>
    
    <Grid item xs={12} sm={12} md={6}>
      <Typography variant="subtitle2" gutterBottom>
        Metrics
      </Typography>
      
      <Box>
        <Typography variant="body2" className={classes.metricGaugeLabel}>
          <span>M1</span>
          <span>{word.metrics.m1.toFixed(3)}</span>
        </Typography>
        <div className={classes.metricGauge}>
          <div 
            className={classes.metricGaugeValue} 
            style={{ width: `${Math.min(word.metrics.m1 * 100, 100)}%` }}
          />
        </div>
      </Box>
      
      <Box>
        <Typography variant="body2" className={classes.metricGaugeLabel}>
          <span>M2a</span>
          <span>{word.metrics.m2a.toFixed(3)}</span>
        </Typography>
        <div className={classes.metricGauge}>
          <div 
            className={classes.metricGaugeValue} 
            style={{ width: `${Math.min(word.metrics.m2a * 100, 100)}%` }}
          />
        </div>
      </Box>
      
      <Box>
        <Typography variant="body2" className={classes.metricGaugeLabel}>
          <span>M2b</span>
          <span>{word.metrics.m2b.toFixed(3)}</span>
        </Typography>
        <div className={classes.metricGauge}>
          <div 
            className={classes.metricGaugeValue} 
            style={{ width: `${Math.min(word.metrics.m2b * 100, 100)}%` }}
          />
        </div>
      </Box>
      
      <Box>
        <Typography variant="body2" className={classes.metricGaugeLabel}>
          <span>Mean</span>
          <span>{word.metrics.mean.toFixed(3)}</span>
        </Typography>
        <div className={classes.metricGauge}>
          <div 
            className={classes.metricGaugeValue} 
            style={{ width: `${Math.min(word.metrics.mean * 100, 100)}%` }}
          />
        </div>
      </Box>
    </Grid>
  </Grid>
);

/**
 * SentenceContextView component groups words by sentence for contextual analysis
 * 
 * @param {Object} props
 * @param {Object} props.pagination - Pagination object from useHybridPagination
 * @param {Array} props.data - Full data array (for filtering outside of pagination)
 * @returns {JSX.Element}
 */
const SentenceContextView = ({ pagination, data }) => {
  const classes = useStyles();
  const [selectedWord, setSelectedWord] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [legendExpanded, setLegendExpanded] = useState(false);
  
  // Handle toggle legend
  const handleToggleLegend = useCallback(() => {
    setLegendExpanded(!legendExpanded);
  }, [legendExpanded]);
  
  // Save legend state in localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sentenceContextLegendExpanded');
    if (savedState !== null) {
      setLegendExpanded(savedState === 'true');
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('sentenceContextLegendExpanded', legendExpanded.toString());
  }, [legendExpanded]);
  
  // Process data to group by sentences using the full dataset
  // Sentences are determined based on the 'sidx' (sentence index) field in the data
  // Each sentence contains all words that share the same sentence index
  const allSentences = useMemo(() => {
    return processSentences(data);
  }, [data]);
  
  // Display all sentences without pagination
  // The pagination.chunkSize is still used as a visual density control
  const sentences = useMemo(() => {
    return allSentences;
  }, [allSentences]);
  
  // Handle word click to open modal
  const handleWordClick = useCallback((word) => {
    setSelectedWord(word);
    setModalOpen(true);
  }, []);
  
  // Handle modal close
  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
  }, []);
  
  // Copy sentence text to clipboard
  const handleCopySentence = useCallback((text) => {
    navigator.clipboard.writeText(text);
    // TODO: Add a toast or notification here
  }, []);
  
  // Render a word with its styling based on POS and stress
  const renderWord = useCallback((word, index) => {
    const isSelected = selectedWord?.widx === word.widx;
    const isHighlighted = word.metrics.mean > 0.6; // Highlight high-metric words
    
    // Style based on part of speech and stress
    const posColor = alpha(POS_COLORS[word.pos] || POS_COLORS.default, 0.1);
    const stressColor = STRESS_COLORS[word.stress] || STRESS_COLORS.default;
    
    // Calculate metric color (green for high, red for low)
    const metricValue = word.metrics.mean;
    const metricColor = metricValue > 0.6 
      ? theme => alpha(theme.palette.success.main, 0.7)
      : metricValue < 0.3 
        ? theme => alpha(theme.palette.error.main, 0.7)
        : theme => alpha(theme.palette.warning.main, 0.7);
    
    return (
      <Tooltip
        key={`${word.widx}-${index}`}
        title={
          <div>
            <Typography variant="body2"><strong>{word.text}</strong></Typography>
            <Typography variant="caption">POS: {word.pos}</Typography>
            <br />
            <Typography variant="caption">Stress: {word.stress}</Typography>
            <br />
            <Typography variant="caption">M1: {word.metrics.m1.toFixed(3)}</Typography>
            <br />
            <Typography variant="caption">M2a: {word.metrics.m2a.toFixed(3)}</Typography>
            <br />
            <Typography variant="caption">M2b: {word.metrics.m2b.toFixed(3)}</Typography>
            <br />
            <Typography variant="caption">Mean: {word.metrics.mean.toFixed(3)}</Typography>
          </div>
        }
        placement="top"
      >
        <span
          className={`${classes.wordInSentence} ${isSelected ? classes.wordSelected : ''} ${isHighlighted ? classes.wordHighlighted : ''}`}
          onClick={() => handleWordClick(word)}
          style={{
            backgroundColor: posColor,
            borderBottom: `2px solid ${stressColor}`,
          }}
        >
          {word.text}
          
          {/* POS tag */}
          {showPOS && (
            <span className={classes.wordMetadata}>
              {word.pos}
            </span>
          )}
          
          {/* Metrics indicator */}
          {showMetrics && (
            <span className={classes.wordMetrics}>
              <span 
                className={classes.metricsIndicator} 
                style={{ backgroundColor: metricColor }}
              />
              {word.metrics.mean.toFixed(2)}
            </span>
          )}
        </span>
      </Tooltip>
    );
  }, [classes, selectedWord, showPOS, showMetrics, handleWordClick]);
  
  // Render a sentence card with its words
  const renderSentence = useCallback((sentence) => {
    // Only extract the metrics we're actually using in this view
    const { avgMetrics } = sentence.stats;
    
    // Distribution data can be enabled in a future update if needed
    // const { posDistribution, stressDistribution } = sentence.stats;
    
    return (
      <Paper 
        key={sentence.sidx} 
        className={classes.sentencePaper}
        elevation={1}
      >
        <span className={classes.sentenceId}>
          Sentence {sentence.sidx}
        </span>
        
        <div className={classes.sentenceToolbar}>
          <Typography variant="subtitle2" gutterBottom>
            {sentence.words.length} words
          </Typography>
          
          <div className={classes.buttonGroup}>
            <Tooltip title="Copy sentence text">
              <IconButton 
                size="small"
                onClick={() => handleCopySentence(sentence.text)}
              >
                <FileCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </div>
        </div>
        
        <div className={classes.sentenceStats}>
          <Typography className={classes.statsLabel}>
            Avg Metrics:
          </Typography>
          <Chip 
            label={`M1: ${avgMetrics.m1.toFixed(2)}`} 
            size="small"
            className={classes.statChip}
          />
          <Chip 
            label={`M2a: ${avgMetrics.m2a.toFixed(2)}`} 
            size="small"
            className={classes.statChip}
          />
          <Chip 
            label={`M2b: ${avgMetrics.m2b.toFixed(2)}`} 
            size="small"
            className={classes.statChip}
          />
          <Chip 
            label={`Mean: ${avgMetrics.mean.toFixed(2)}`} 
            size="small"
            className={classes.statChip}
          />
        </div>
        
        <Divider style={{ marginBottom: 12 }} />
        
        <Typography variant="body1" paragraph style={{ lineHeight: 2.2 }}>
          {sentence.words.map((word, idx) => renderWord(word, idx))}
        </Typography>
      </Paper>
    );
  }, [classes, handleCopySentence, renderWord]);
  
  return (
    <div>
      
      {/* Controls */}
      <div className={classes.controlsContainer}>
        <div className={classes.controlsLeft}>
          <FormControlLabel
            control={
              <Switch
                checked={showPOS}
                onChange={() => setShowPOS(!showPOS)}
                size="small"
                color="primary"
              />
            }
            label="Show POS Tags"
          />
          <FormControlLabel
            control={
              <Switch
                checked={showMetrics}
                onChange={() => setShowMetrics(!showMetrics)}
                size="small"
                color="primary"
              />
            }
            label="Show Metrics"
          />
        </div>
      </div>
      
      {/* Color Legend */}
      <ColorLegend 
        classes={classes} 
        expanded={legendExpanded} 
        onToggle={handleToggleLegend} 
      />
      
      {/* Sentences container */}
      <div className={classes.container}>
        {sentences.map(sentence => renderSentence(sentence))}
      </div>
      
      {/* Word Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="md"
        fullWidth
        aria-labelledby="word-details-dialog-title"
      >
        <DialogTitle id="word-details-dialog-title">
          Word Details: {selectedWord?.text}
        </DialogTitle>
        <DialogContent dividers>
          {selectedWord && <WordDetailContent word={selectedWord} classes={classes} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SentenceContextView;
