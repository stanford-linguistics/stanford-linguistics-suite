import React, { useState } from 'react';
import { 
  Typography, 
  Button, 
  Tooltip, 
  makeStyles 
} from '@material-ui/core';
import { 
  TextFields as TextFieldsIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@material-ui/icons';
import { CONTEXT_WINDOW_SIZE } from '../constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  previewContainer: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.primary.light}`,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    cursor: 'pointer',
  },
  previewHeaderIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  previewContent: {
    position: 'relative',
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.grey[50],
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.spacing(0.5),
    fontSize: '0.9rem',
    lineHeight: '1.5',
    maxHeight: '80px',
    overflowY: 'auto',
    transition: 'max-height 0.3s ease-in-out, opacity 0.2s ease',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(to right, rgba(255,255,255,0.7), transparent 10%, transparent 90%, rgba(255,255,255,0.7))',
      pointerEvents: 'none',
    }
  },
  expandedPreview: {
    maxHeight: '200px',
  },
  sentenceStats: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: theme.palette.text.secondary,
    marginTop: theme.spacing(1),
    display: 'flex',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: '0.8rem',
    marginLeft: theme.spacing(0.5),
    color: theme.palette.text.secondary,
  },
  highlightedChunk: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: '0 4px',
    borderRadius: '3px',
    margin: '0 2px',
    fontWeight: 500,
    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  },
  expandButton: {
    marginLeft: 'auto',
    padding: theme.spacing(0.5),
    minWidth: 'unset',
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'scale(1.1)',
    },
  }
}));

/**
 * Component for displaying the sentence with the current chunk highlighted
 * 
 * @param {Object} props - Component props
 * @param {string} props.fullSentence - The complete sentence
 * @param {boolean} props.needsChunking - Whether chunking is needed
 * @param {boolean} props.isVeryLongInput - Whether this is a very long input
 * @param {number} props.currentPage - Current page index
 * @param {number} props.chunkSize - Size of each chunk
 * @param {number} props.totalWords - Total number of words
 * @returns {JSX.Element} The sentence preview component
 */
const SentencePreview = ({ 
  fullSentence, 
  needsChunking, 
  isVeryLongInput,
  currentPage,
  chunkSize,
  totalWords
}) => {
  const classes = useStyles();
  
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  // If there's no sentence at all, don't render anything
  if (!fullSentence) {
    return null;
  }
  
  // If there's no chunking needed, just show the full sentence
  if (!needsChunking) {
    return (
      <div className={classes.previewContainer}>
        <div className={classes.previewHeader} onClick={toggleExpand}>
          <TextFieldsIcon className={classes.previewHeaderIcon} fontSize="small" />
          <Typography variant="subtitle2">Text Preview</Typography>
          
          <Tooltip title={expanded ? "Collapse preview" : "Expand preview"}>
            <Button 
              className={classes.expandButton}
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand();
              }}
              size="small"
            >
              {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
            </Button>
          </Tooltip>
        </div>
        <div 
          className={`${classes.previewContent} ${expanded ? classes.expandedPreview : ''}`}
        >
          {fullSentence}
        </div>
      </div>
    );
  }
  
  // Create the sentence preview with the current chunk highlighted
  const createSentencePreview = () => {
    // Get the words in the current chunk
    const words = fullSentence.split(' ');
    
    // Calculate which words to highlight
    const wordsPerPage = Math.min(chunkSize, words.length);
    const startIdx = Math.min(currentPage * wordsPerPage, words.length - 1);
    const endIdx = Math.min(startIdx + wordsPerPage - 1, words.length - 1);
    
    // For very long inputs, only show a window around the current chunk
    if (isVeryLongInput) {
      const contextWindow = CONTEXT_WINDOW_SIZE;
      const previewStartIdx = Math.max(0, startIdx - contextWindow);
      const previewEndIdx = Math.min(words.length - 1, endIdx + contextWindow);
      
      return (
        <>
          {previewStartIdx > 0 ? '... ' : ''}
          {previewStartIdx < startIdx ? words.slice(previewStartIdx, startIdx).join(' ') + ' ' : ''}
          <span className={classes.highlightedChunk}>
            {words.slice(startIdx, endIdx + 1).join(' ')}
          </span>
          {endIdx < previewEndIdx ? ' ' + words.slice(endIdx + 1, previewEndIdx + 1).join(' ') : ''}
          {previewEndIdx < words.length - 1 ? ' ...' : ''}
        </>
      );
    }
    
    // For normal-length inputs, show the entire sentence with highlighted chunk
    return (
      <>
        {startIdx > 0 ? words.slice(0, startIdx).join(' ') + ' ' : ''}
        <span className={classes.highlightedChunk}>
          {words.slice(startIdx, endIdx + 1).join(' ')}
        </span>
        {endIdx < words.length - 1 ? ' ' + words.slice(endIdx + 1).join(' ') : ''}
      </>
    );
  };

  return (
    <div className={classes.previewContainer}>
      {/* Preview header with title and expand button */}
      <div className={classes.previewHeader} onClick={toggleExpand}>
        <TextFieldsIcon className={classes.previewHeaderIcon} fontSize="small" />
        <Typography variant="subtitle2">Text Preview</Typography>
        
        <Tooltip title={expanded ? "Collapse preview" : "Expand preview"}>
          <Button 
            className={classes.expandButton}
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            size="small"
          >
            {expanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Button>
        </Tooltip>
      </div>
      
      {/* Preview content with highlighted text */}
      <div 
        className={`${classes.previewContent} ${expanded ? classes.expandedPreview : ''}`}
      >
        {createSentencePreview()}
      </div>
      
      {/* Stats about the displayed words */}
      {isVeryLongInput && (
        <Typography className={classes.sentenceStats}>
          Showing words {currentPage * chunkSize + 1}-{Math.min((currentPage + 1) * chunkSize, totalWords)} of {totalWords} total words
          <Tooltip title="The highlighted text shows the current page of words. Use navigation controls to see more.">
            <InfoIcon className={classes.infoIcon} />
          </Tooltip>
        </Typography>
      )}
    </div>
  );
};

export default SentencePreview;
