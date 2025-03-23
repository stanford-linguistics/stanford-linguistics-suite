import React, { useMemo, useState, useCallback } from 'react';
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
} from '@material-ui/core';
import {
  Bookmark as BookmarkIcon,
  FileCopy as FileCopyIcon,
  HighlightOff as HighlightIcon,
  FilterList as FilterIcon,
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
  sentenceHighlighted: {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
  sentenceId: {
    position: 'absolute',
    right: theme.spacing(2),
    top: theme.spacing(2),
    color: theme.palette.text.secondary,
    fontWeight: 'bold',
    fontSize: '0.8rem',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
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
  const [highlightedSentence, setHighlightedSentence] = useState(null);
  const [showPOS, setShowPOS] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  
  // Process data to group by sentences using the full dataset
  const allSentences = useMemo(() => {
    return processSentences(data);
  }, [data]);
  
  // Get the paginated sentences based on the current page index and size
  const sentences = useMemo(() => {
    const startIndex = pagination.currentPage * pagination.chunkSize;
    return allSentences.slice(startIndex, startIndex + pagination.chunkSize);
  }, [allSentences, pagination.currentPage, pagination.chunkSize]);
  
  // Handle word click
  const handleWordClick = useCallback((word) => {
    setSelectedWord(selectedWord?.widx === word.widx ? null : word);
  }, [selectedWord]);
  
  // Handle sentence highlight
  const handleSentenceHighlight = useCallback((sidx) => {
    setHighlightedSentence(highlightedSentence === sidx ? null : sidx);
  }, [highlightedSentence]);
  
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
    const isHighlighted = highlightedSentence === sentence.sidx;
    // Only extract the metrics we're actually using in this view
    const { avgMetrics } = sentence.stats;
    
    // Distribution data can be enabled in a future update if needed
    // const { posDistribution, stressDistribution } = sentence.stats;
    
    return (
      <Paper 
        key={sentence.sidx} 
        className={`${classes.sentencePaper} ${isHighlighted ? classes.sentenceHighlighted : ''}`}
        elevation={isHighlighted ? 3 : 1}
      >
        <span className={classes.sentenceId}>
          Sentence {sentence.sidx}
        </span>
        
        <div className={classes.sentenceToolbar}>
          <Typography variant="subtitle2" gutterBottom>
            {sentence.words.length} words
          </Typography>
          
          <div>
            <IconButton 
              size="small" 
              onClick={() => handleSentenceHighlight(sentence.sidx)}
              color={isHighlighted ? "primary" : "default"}
            >
              <HighlightIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small"
              onClick={() => handleCopySentence(sentence.text)}
            >
              <FileCopyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <BookmarkIcon fontSize="small" />
            </IconButton>
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
  }, [classes, highlightedSentence, handleSentenceHighlight, handleCopySentence, renderWord]);
  
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
        
        <IconButton size="small">
          <FilterIcon />
        </IconButton>
      </div>
      
      {/* Sentences container */}
      <div className={classes.container}>
        {sentences.map(sentence => renderSentence(sentence))}
      </div>
      
      {/* Selected word details */}
      {selectedWord && (
        <Paper className={classes.wordDetailsCard} elevation={2}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Word Details: <strong>{selectedWord.text}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Word Index:</strong> {selectedWord.widx}
              </Typography>
              <Typography variant="body2">
                <strong>POS:</strong> {selectedWord.pos}
              </Typography>
              <Typography variant="body2">
                <strong>Dependency:</strong> {selectedWord.dep}
              </Typography>
              <Typography variant="body2">
                <strong>Segmentation:</strong> {selectedWord.seg}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2">
                <strong>Lexical Stress:</strong> {selectedWord.stress}
              </Typography>
              <Typography variant="body2">
                <strong>Syllables:</strong> {selectedWord.nsyll}
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6} md={6}>
              <Typography variant="subtitle2" gutterBottom>
                Metrics
              </Typography>
              
              <Box>
                <Typography variant="body2" className={classes.metricGaugeLabel}>
                  <span>M1</span>
                  <span>{selectedWord.metrics.m1.toFixed(3)}</span>
                </Typography>
                <div className={classes.metricGauge}>
                  <div 
                    className={classes.metricGaugeValue} 
                    style={{ width: `${Math.min(selectedWord.metrics.m1 * 100, 100)}%` }}
                  />
                </div>
              </Box>
              
              <Box>
                <Typography variant="body2" className={classes.metricGaugeLabel}>
                  <span>M2a</span>
                  <span>{selectedWord.metrics.m2a.toFixed(3)}</span>
                </Typography>
                <div className={classes.metricGauge}>
                  <div 
                    className={classes.metricGaugeValue} 
                    style={{ width: `${Math.min(selectedWord.metrics.m2a * 100, 100)}%` }}
                  />
                </div>
              </Box>
              
              <Box>
                <Typography variant="body2" className={classes.metricGaugeLabel}>
                  <span>M2b</span>
                  <span>{selectedWord.metrics.m2b.toFixed(3)}</span>
                </Typography>
                <div className={classes.metricGauge}>
                  <div 
                    className={classes.metricGaugeValue} 
                    style={{ width: `${Math.min(selectedWord.metrics.m2b * 100, 100)}%` }}
                  />
                </div>
              </Box>
              
              <Box>
                <Typography variant="body2" className={classes.metricGaugeLabel}>
                  <span>Mean</span>
                  <span>{selectedWord.metrics.mean.toFixed(3)}</span>
                </Typography>
                <div className={classes.metricGauge}>
                  <div 
                    className={classes.metricGaugeValue} 
                    style={{ width: `${Math.min(selectedWord.metrics.mean * 100, 100)}%` }}
                  />
                </div>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
    </div>
  );
};

export default SentenceContextView;
