import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Typography,
  Grid,
  Paper,
  Chip,
  Tooltip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  alpha
} from '@material-ui/core';

import { POS_COLORS, STRESS_COLORS } from '../constants';
import WordDetailModal from './components/WordDetailModal';

const useStyles = makeStyles((theme) => ({
  controlsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2)
  },
  sortingSelect: {
    minWidth: 150,
    marginRight: theme.spacing(1)
  },
  wordGrid: {
    marginBottom: theme.spacing(2)
  },
  wordCard: {
    padding: theme.spacing(2),
    height: '100%',
    position: 'relative',
    transition: theme.transitions.create(['transform', 'box-shadow']),
    border: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: theme.shadows[4],
      borderColor: theme.palette.primary.light,
    }
  },
  wordCardSelected: {
    borderColor: theme.palette.primary.main,
    borderWidth: 2,
    backgroundColor: alpha(theme.palette.primary.light, 0.05)
  },
  wordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(1)
  },
  wordContent: {
    marginBottom: theme.spacing(1)
  },
  metricSection: {
    marginTop: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: alpha(theme.palette.background.default, 0.5),
    borderRadius: theme.shape.borderRadius
  },
  metricGauge: {
    height: 6,
    backgroundColor: theme.palette.divider,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    marginTop: 4,
    marginBottom: 12
  },
  metricGaugeValue: {
    height: '100%',
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.shape.borderRadius
  },
  metricLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem'
  },
  metrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5)
  },
  posChip: {
    marginBottom: theme.spacing(1)
  },
  stressChip: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1)
  },
  wordIndex: {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    fontSize: '0.7rem',
    backgroundColor: theme.palette.background.default,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.secondary
  },
  displayIndex: {
    position: 'absolute',
    bottom: theme.spacing(1),
    right: theme.spacing(1),
    fontSize: '0.7rem',
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    zIndex: 1
  },
  sentencePreview: {
    fontSize: '0.75rem',
    marginTop: theme.spacing(1),
    padding: theme.spacing(0.5),
    backgroundColor: alpha(theme.palette.background.default, 0.7),
    borderRadius: theme.shape.borderRadius,
    maxHeight: 60,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical'
  },
  highlightedWord: {
    backgroundColor: alpha(theme.palette.primary.main, 0.2),
    fontWeight: 'bold',
    padding: '0 2px',
    borderRadius: '2px'
  },
  contextSentence: {
    lineHeight: 1.5
  },
  starButton: {
    padding: 4
  },
  metricsHeader: {
    fontSize: '0.85rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(0.5),
    marginTop: theme.spacing(1)
  },
  wordText: {
    fontSize: '1.6rem',
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
    wordBreak: 'break-word'
  },
  wordDetails: {
    display: 'flex',
    gap: theme.spacing(1),
    flexWrap: 'wrap',
    marginBottom: theme.spacing(1)
  },
  wordDetail: {
    fontSize: '0.75rem',
    padding: theme.spacing(0.25, 0.5),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.background.default, 0.7)
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
const createContextWindow = (sentence, targetWord, windowSize = 5) => {
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
 * Word card component displaying a single word with its metrics and properties
 */
const WordCard = ({
  word,
  selected = false,
  onSelect = () => {},
  showSentence = true,
  displayIndex
}) => {
  const classes = useStyles();

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
  const context = useMemo(() => {
    return createContextWindow(word.sent, word.word);
  }, [word.sent, word.word]);

  return (
    <Paper
      className={`${classes.wordCard} ${selected ? classes.wordCardSelected : ''}`}
      elevation={selected ? 3 : 1}
      onClick={() => onSelect(word)}
    >
      <Tooltip title="Absolute word position in original text (widx/sidx)">
        <span className={classes.wordIndex}>
          #{word.widx}-{word.sidx}
        </span>
      </Tooltip>
      
      {displayIndex && (
        <Tooltip title="Current sort position">
          <span className={classes.displayIndex}>
            #{displayIndex}
          </span>
        </Tooltip>
      )}

      <div className={classes.wordHeader}>
        <Tooltip title={`Part of speech: ${word.pos}`}>
          <Chip
            label={word.pos}
            size="small"
            className={classes.posChip}
            style={{
              backgroundColor: posColor,
              color: '#fff'
            }}
          />
        </Tooltip>
      </div>

      <Tooltip title={getStressTooltip(word.lexstress)}>
        <Chip
          label={word.lexstress}
          size="small"
          className={classes.stressChip}
          style={{
            backgroundColor: stressColor,
            color: '#fff'
          }}
        />
      </Tooltip>

      <div className={classes.wordContent}>
        <Typography variant="h5" className={classes.wordText}>
          {word.word}
        </Typography>

        <div className={classes.wordDetails}>
          <Tooltip title="Segmentation: How the word is broken down phonetically">
            <Typography variant="body2" className={classes.wordDetail}>
              <strong>Seg:</strong> {word.seg}
            </Typography>
          </Tooltip>

          <Tooltip title="Number of syllables in the word">
            <Typography variant="body2" className={classes.wordDetail}>
              <strong>Syll:</strong> {word.nsyll}
            </Typography>
          </Tooltip>

          <Tooltip title="Dependency relationship in the sentence">
            <Typography variant="body2" className={classes.wordDetail}>
              <strong>Dep:</strong> {word.dep}
            </Typography>
          </Tooltip>
        </div>
      </div>

      <Divider />

      <div className={classes.metricSection}>
        <Tooltip title="Raw metric values measuring metrical prominence">
          <Typography variant="subtitle2" className={classes.metricsHeader}>
            Raw Metrics
          </Typography>
        </Tooltip>

        <div className={classes.metrics}>
          <div>
            <Typography variant="body2" className={classes.metricLabel}>
              <span>M1</span>
              <span>{metrics.m1.toFixed(3)}</span>
            </Typography>
            <div className={classes.metricGauge}>
              <div
                className={classes.metricGaugeValue}
                style={{ width: `${Math.min(metrics.m1 * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <Typography variant="body2" className={classes.metricLabel}>
              <span>M2a</span>
              <span>{metrics.m2a.toFixed(3)}</span>
            </Typography>
            <div className={classes.metricGauge}>
              <div
                className={classes.metricGaugeValue}
                style={{ width: `${Math.min(metrics.m2a * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <Typography variant="body2" className={classes.metricLabel}>
              <span>M2b</span>
              <span>{metrics.m2b.toFixed(3)}</span>
            </Typography>
            <div className={classes.metricGauge}>
              <div
                className={classes.metricGaugeValue}
                style={{ width: `${Math.min(metrics.m2b * 100, 100)}%` }}
              />
            </div>
          </div>

          <div>
            <Typography variant="body2" className={classes.metricLabel}>
              <span><strong>Mean</strong></span>
              <span><strong>{metrics.mean.toFixed(3)}</strong></span>
            </Typography>
            <div className={classes.metricGauge}>
              <div
                className={classes.metricGaugeValue}
                style={{
                  width: `${Math.min(metrics.mean * 100, 100)}%`,
                  backgroundColor: theme => theme.palette.secondary.main
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {showSentence && (
          <Typography variant="caption" className={classes.sentencePreview}>
            <span className={classes.contextSentence}>
              {context.before}{' '}
              <span className={classes.highlightedWord}>{context.target}</span>{' '}
              {context.after}
            </span>
          </Typography>
      )}
    </Paper>
  );
};


/**
 * WordFocusedView component displays words in a card-based layout
 *
 * @param {Object} props
 * @param {Object} props.pagination - Pagination object from useHybridPagination
 * @param {Array} props.data - Full data array (for filtering outside of pagination)
 * @returns {JSX.Element}
 */
const WordFocusedView = ({ pagination, data }) => {
  const classes = useStyles();
  const [selectedWord, setSelectedWord] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('position');
  const [showSentences, setShowSentences] = useState(true);

  // Available sorting options
  const sortOptions = [
    { value: 'position', label: 'Position' },
    { value: 'metric_high', label: 'Highest Metric' },
    { value: 'metric_low', label: 'Lowest Metric' },
    { value: 'alphabetical', label: 'Alphabetical' },
    { value: 'pos', label: 'Part of Speech' },
    { value: 'stress', label: 'Stress Pattern' }
  ];

  // Sort words based on selected criterion from the full dataset
  const sortedData = useMemo(() => {
    const allWords = [...data];

    switch (sortBy) {
      case 'metric_high':
        return allWords.sort((a, b) => (parseFloat(b.mean) || 0) - (parseFloat(a.mean) || 0));
      case 'metric_low':
        return allWords.sort((a, b) => (parseFloat(a.mean) || 0) - (parseFloat(b.mean) || 0));
      case 'alphabetical':
        return allWords.sort((a, b) => a.word.localeCompare(b.word));
      case 'pos':
        return allWords.sort((a, b) => a.pos.localeCompare(b.pos));
      case 'stress':
        return allWords.sort((a, b) => a.lexstress.localeCompare(b.lexstress));
      case 'position':
      default:
        // Ensure proper numeric sorting by position
        return allWords.sort((a, b) => {
          // First compare sentence index
          const sentenceCompare = parseInt(a.sidx, 10) - parseInt(b.sidx, 10);
          if (sentenceCompare !== 0) return sentenceCompare;
          
          // If same sentence, compare word position within sentence
          return parseInt(a.widx, 10) - parseInt(b.widx, 10);
        });
    }
  }, [data, sortBy]);
  
  // Track how many items to show with infinite scroll
  const [visibleItems, setVisibleItems] = useState(20); // Start with 20 items
  
  // Get visible data with infinite scroll instead of pagination
  const sortedWords = useMemo(() => {
    return sortedData.slice(0, visibleItems);
  }, [sortedData, visibleItems]);
  
  // Load more items when scrolling
  const loadMoreItems = useCallback(() => {
    setVisibleItems(prev => Math.min(prev + 20, sortedData.length));
  }, [sortedData.length]);
  
  // Handle scroll events for infinite scrolling
  const handleScroll = useCallback(() => {
    if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 500) {
      loadMoreItems();
    }
  }, [loadMoreItems]);
  
  // Setup scroll listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Generate a unique key for a word using widx and sidx
  const getWordKey = useCallback((word) => {
    return `${word.widx}-${word.sidx}`;
  }, []);
  
  // Handle word selection using the unique key
  const handleSelectWord = useCallback((word) => {
    setSelectedWord(word);
    setIsModalOpen(true);
  }, []);
  
  // Handle closing the modal
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Handle sort change
  const handleSortChange = (event) => {
    setSortBy(event.target.value);
  };
  
  // Modal is now handling the context display

  return (
    <div>
      {/* Controls */}
      <div className={classes.controlsContainer}>
        <div>
          <FormControl variant="outlined" size="small" className={classes.sortingSelect}>
            <InputLabel id="word-sort-label">Sort By</InputLabel>
            <Select
              labelId="word-sort-label"
              id="word-sort"
              value={sortBy}
              onChange={handleSortChange}
              label="Sort By"
            >
              {sortOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            size="small"
            color={showSentences ? "primary" : "default"}
            variant="outlined"
            onClick={() => setShowSentences(!showSentences)}
          >
            {showSentences ? "Hide Sentences" : "Show Sentences"}
          </Button>
        </div>
      </div>

      {/* Word cards grid */}
      <Grid container spacing={3} className={classes.wordGrid}>
        {sortedWords.map((word, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={`${word.widx}-${word.sidx}-${index}`}>
            <WordCard
              word={word}
              selected={selectedWord ? getWordKey(selectedWord) === getWordKey(word) : false}
              onSelect={handleSelectWord}
              showSentence={showSentences}
              displayIndex={index + 1} // For sorted display index
            />
          </Grid>
        ))}
      </Grid>
      
      {/* Loading status indicator */}
      {visibleItems < sortedData.length && (
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          mb={2}
        >
          <Typography variant="body2" color="textSecondary">
            Showing {visibleItems} of {sortedData.length} words. Scroll down for more.
          </Typography>
        </Box>
      )}
      
      {/* Word detail modal */}
      <WordDetailModal 
        word={selectedWord}
        open={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default WordFocusedView;
