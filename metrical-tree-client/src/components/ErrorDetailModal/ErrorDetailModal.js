import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Collapse,
  IconButton,
} from '@material-ui/core';
import {
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Replay as RetryIcon,
  ArrowForward as ViewDetailsIcon,
} from '@material-ui/icons';
import { useHistory } from 'react-router-dom';

const useStyles = makeStyles((theme) => ({
  dialogTitle: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
    padding: theme.spacing(2),
    '& .MuiTypography-root': {
      display: 'flex',
      alignItems: 'center',
      fontWeight: 'bold',
    },
  },
  titleIcon: {
    marginRight: theme.spacing(1.5),
    backgroundColor: theme.palette.error.main,
    color: 'white',
    padding: theme.spacing(0.5),
    borderRadius: '50%',
  },
  dialogContent: {
    padding: theme.spacing(3, 3, 1, 3),
  },
  message: {
    fontWeight: 500,
    marginBottom: theme.spacing(2),
  },
  suggestion: {
    fontStyle: 'italic',
    marginTop: theme.spacing(1),
    color: theme.palette.text.secondary,
  },
  category: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: theme.spacing(0.5, 1.5),
    borderRadius: 16,
    marginBottom: theme.spacing(2),
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.dark,
  },
  categoryIcon: {
    fontSize: '1rem',
    marginRight: theme.spacing(1),
  },
  detailsSection: {
    marginTop: theme.spacing(2),
  },
  detailsHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    padding: theme.spacing(1, 0),
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)',
    },
  },
  detailsTitle: {
    fontWeight: 500,
    fontSize: '0.875rem',
  },
  expandIcon: {
    transition: theme.transitions.create('transform', {
      duration: theme.transitions.duration.standard,
    }),
  },
  expandIconOpen: {
    transform: 'rotate(180deg)',
  },
  codeBlock: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    overflowX: 'auto',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  actionButton: {
    margin: theme.spacing(0, 1),
  },
  viewDetailsButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  retryButton: {
    backgroundColor: theme.palette.warning.main,
    color: theme.palette.warning.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.warning.dark,
    },
  },
}));

/**
 * Modal component for displaying error details in a compact format
 */
const ErrorDetailModal = ({ open, onClose, errorResult, onRetry }) => {
  const classes = useStyles();
  const history = useHistory();
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  // Early return if no error result is provided
  if (!errorResult) {
    return null;
  }

  // Extract error information from the result
  const errorMessage = errorResult.errorMessage || 'An error occurred';
  const errorDetails = errorResult.errorDetails || {};
  
  // Check if we have technical details to display
  const hasDetails = 
    errorDetails.details && 
    Object.keys(errorDetails.details).length > 0;

  // Format JSON for display
  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  // Get category display info
  const getCategoryInfo = (category) => {
    switch(category) {
      case 'input_validation':
        return { 
          label: 'Input Error', 
          icon: <WarningIcon className={classes.categoryIcon} />,
          color: theme => ({
            bg: theme.palette.warning.light,
            text: theme.palette.warning.dark
          })
        };
      case 'linguistic_processing':
        return { 
          label: 'Processing Error', 
          icon: <ErrorIcon className={classes.categoryIcon} />,
          color: theme => ({
            bg: theme.palette.error.light,
            text: theme.palette.error.dark
          })
        };
      case 'computational':
        return { 
          label: 'System Resource Error', 
          icon: <ErrorIcon className={classes.categoryIcon} />,
          color: theme => ({
            bg: theme.palette.error.light,
            text: theme.palette.error.dark
          })
        };
      case 'system':
        return { 
          label: 'System Error', 
          icon: <ErrorIcon className={classes.categoryIcon} />,
          color: theme => ({
            bg: theme.palette.error.light,
            text: theme.palette.error.dark
          })
        };
      default:
        return { 
          label: 'Unknown Error', 
          icon: <InfoIcon className={classes.categoryIcon} />,
          color: theme => ({
            bg: theme.palette.grey[200],
            text: theme.palette.grey[800]
          })
        };
    }
  };

  // Get category styling
  const categoryInfo = getCategoryInfo(errorDetails.category);

  // Handle viewing full details
  const handleViewDetails = () => {
    if (errorResult.id) {
      history.push(`/result/${errorResult.id}`);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="error-detail-title"
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle id="error-detail-title" className={classes.dialogTitle}>
        <ErrorIcon className={classes.titleIcon} />
        Error Details
      </DialogTitle>
      
      <DialogContent className={classes.dialogContent} dividers>
        {/* Category Tag */}
        {errorDetails.category && (
          <Box
            className={classes.category}
            style={{
              backgroundColor: categoryInfo.color(theme => theme).bg,
              color: categoryInfo.color(theme => theme).text
            }}
          >
            {categoryInfo.icon}
            {errorDetails.category_description || categoryInfo.label}
          </Box>
        )}
        
        {/* Error Message */}
        <Typography
          variant="subtitle1"
          className={classes.message}
        >
          {errorDetails.message || errorMessage}
        </Typography>
        
        {/* Suggestion */}
        {errorDetails.suggestion && (
          <Typography className={classes.suggestion}>
            {errorDetails.suggestion}
          </Typography>
        )}
        
        {/* Technical Details Expandable Section */}
        {hasDetails && (
          <div className={classes.detailsSection}>
            <Divider />
            <Box
              className={classes.detailsHeader}
              onClick={() => setDetailsExpanded(!detailsExpanded)}
            >
              <Typography className={classes.detailsTitle}>
                Technical Details
              </Typography>
              <IconButton size="small">
                <ExpandMoreIcon
                  className={`${classes.expandIcon} ${detailsExpanded ? classes.expandIconOpen : ''}`}
                />
              </IconButton>
            </Box>
            
            <Collapse in={detailsExpanded}>
              <Box mt={1}>
                {Object.entries(errorDetails.details).map(([key, value]) => (
                  <React.Fragment key={key}>
                    <Typography variant="subtitle2">
                      {key.replace(/_/g, ' ')}:
                    </Typography>
                    {typeof value === 'object' ? (
                      <div className={classes.codeBlock}>
                        <pre>{formatJSON(value)}</pre>
                      </div>
                    ) : (
                      <Typography variant="body2" paragraph>
                        {String(value)}
                      </Typography>
                    )}
                  </React.Fragment>
                ))}
              </Box>
            </Collapse>
          </div>
        )}
      </DialogContent>

      <DialogActions>
        {onRetry && (
          <Button
            onClick={() => {
              onRetry(errorResult.id);
              onClose();
            }}
            className={`${classes.actionButton} ${classes.retryButton}`}
            variant="contained"
            startIcon={<RetryIcon />}
          >
            Try Again
          </Button>
        )}
        
        <Button
          onClick={handleViewDetails}
          className={`${classes.actionButton} ${classes.viewDetailsButton}`}
          variant="contained"
          endIcon={<ViewDetailsIcon />}
        >
          View Full Details
        </Button>
        
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ErrorDetailModal.propTypes = {
  /**
   * Whether the modal is open
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * Callback when the modal is closed
   */
  onClose: PropTypes.func.isRequired,
  
  /**
   * The error result object containing error details
   */
  errorResult: PropTypes.object,
  
  /**
   * Optional callback for retry button
   */
  onRetry: PropTypes.func,
};

export default ErrorDetailModal;
