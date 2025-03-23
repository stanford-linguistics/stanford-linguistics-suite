import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  Box,
  Collapse,
  IconButton,
  Grid,
  Link,
} from '@material-ui/core';
import {
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(3),
    marginTop: theme.spacing(1),
  },
  paper: {
    backgroundColor: theme.palette.error.light,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    border: `1px solid ${theme.palette.error.main}`,
  },
  iconContainer: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.common.white,
    borderRadius: '50%',
    width: 40,
    height: 40,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing(2),
  },
  title: {
    fontWeight: 'bold',
    color: theme.palette.error.dark,
    marginBottom: theme.spacing(1),
  },
  message: {
    marginBottom: theme.spacing(1),
  },
  suggestion: {
    fontStyle: 'italic',
    marginBottom: theme.spacing(1),
  },
  details: {
    marginTop: theme.spacing(2),
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: theme.spacing(1),
  },
  expandButton: {
    padding: theme.spacing(0.5),
  },
  codeBlock: {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(1.5),
    borderRadius: theme.shape.borderRadius,
    fontFamily: 'monospace',
    fontSize: '0.875rem',
    overflowX: 'auto',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    position: 'relative',
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  category: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    color: theme.palette.error.main,
    marginBottom: theme.spacing(1),
  },
  retryLink: {
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    display: 'inline-block',
  },
}));

/**
 * Enhanced error display component for computation results
 */
const ResultErrorDisplay = ({ error, onRetry }) => {
  const classes = useStyles();
  const [detailsExpanded, setDetailsExpanded] = React.useState(false);

  // Default error info if error structure is not as expected
  const errorInfo = error?.errorDetails || {
    message: error?.errorMessage || 'An unexpected error occurred',
    category: 'unknown',
    category_description: 'An unexpected error occurred',
    suggestion: 'Please try again or contact support if the problem persists',
    details: {},
  };

  // Parse & format technical details for display
  const hasDetails = 
    errorInfo.details && 
    Object.keys(errorInfo.details).length > 0;

  // Format JSON for display
  const formatJSON = (obj) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  return (
    <div className={classes.root}>
      <Paper className={classes.paper} elevation={2}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item>
            <div className={classes.iconContainer}>
              <ErrorIcon />
            </div>
          </Grid>
          <Grid item xs>
            <Typography 
              variant="subtitle1" 
              className={classes.category}
            >
              {errorInfo.category_description || 'Error'}
            </Typography>
            
            <Typography
              variant="h6"
              className={classes.title}
            >
              {errorInfo.message || error?.errorMessage || 'An error occurred'}
            </Typography>
            
            {errorInfo.suggestion && (
              <Typography className={classes.suggestion}>
                {errorInfo.suggestion}
              </Typography>
            )}
            
            {hasDetails && (
              <>
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2">
                    <strong>Technical details</strong>
                  </Typography>
                  <IconButton
                    className={classes.expandButton}
                    onClick={() => setDetailsExpanded(!detailsExpanded)}
                    size="small"
                  >
                    {detailsExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={detailsExpanded}>
                  <Box mt={1}>
                    {Object.entries(errorInfo.details).map(([key, value]) => (
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
              </>
            )}
            
            {onRetry && (
              <Link
                component="button"
                className={classes.retryLink}
                onClick={onRetry}
                color="primary"
              >
                Try again
              </Link>
            )}
          </Grid>
        </Grid>
      </Paper>
    </div>
  );
};

ResultErrorDisplay.propTypes = {
  /**
   * Error object from the server with structure:
   * { 
   *   errorMessage: string,
   *   errorDetails: {
   *     message: string,
   *     category: string,
   *     category_description: string,
   *     suggestion: string,
   *     details: Object
   *   }
   * }
   */
  error: PropTypes.object.isRequired,
  
  /**
   * Optional callback for retry button
   */
  onRetry: PropTypes.func,
};

export default ResultErrorDisplay;
