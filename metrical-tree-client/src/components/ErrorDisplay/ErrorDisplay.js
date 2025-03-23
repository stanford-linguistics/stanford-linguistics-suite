import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import {
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from '@material-ui/core';
import ErrorIcon from '@material-ui/icons/Error';
import WarningIcon from '@material-ui/icons/Warning';
import InfoIcon from '@material-ui/icons/Info';
import LightbulbIcon from '@material-ui/icons/EmojiObjects';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(1),
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
    border: '1px solid',
    borderColor: theme.palette.divider,
  },
  error: {
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: theme.palette.error.main,
  },
  warning: {
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: theme.palette.warning.main,
  },
  info: {
    borderLeftWidth: 4,
    borderLeftStyle: 'solid',
    borderLeftColor: theme.palette.info.main,
  },
  success: {
    borderLeftWidth: 4, 
    borderLeftStyle: 'solid',
    borderLeftColor: theme.palette.success.main,
  },
  header: {
    padding: theme.spacing(1, 2),
    display: 'flex',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    marginLeft: theme.spacing(1),
  },
  content: {
    padding: theme.spacing(1, 2),
  },
  message: {
    fontSize: '0.875rem',
  },
  suggestion: {
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    fontStyle: 'italic',
    marginTop: theme.spacing(0.5),
  },
  itemsList: {
    marginTop: theme.spacing(1),
    paddingLeft: theme.spacing(2),
    fontSize: '0.875rem',
  },
  divider: {
    margin: theme.spacing(1, 0),
  },
  listItem: {
    padding: theme.spacing(0.5, 2),
  },
  listItemIcon: {
    minWidth: 36,
  },
  iconError: {
    color: theme.palette.error.main,
  },
  iconWarning: {
    color: theme.palette.warning.main,
  },
  iconInfo: {
    color: theme.palette.info.main,
  },
  iconSuggestion: {
    color: theme.palette.success.main,
  },
  noErrors: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.success.main,
  },
}));

/**
 * Alert message component for displaying errors, warnings, and informational messages
 */
const ErrorDisplay = ({
  messages,
  showSuccessWhenNoMessages = false,
}) => {
  const classes = useStyles();

  if (!messages || messages.length === 0) {
    if (showSuccessWhenNoMessages) {
      return (
        <div className={classes.root}>
          <Paper className={`${classes.paper} ${classes.success}`}>
            <div className={classes.header}>
              <CheckCircleIcon className={classes.iconSuggestion} />
              <Typography variant="body1" className={classes.headerText}>
                All inputs look good
              </Typography>
            </div>
          </Paper>
        </div>
      );
    }
    return null;
  }

  const errorCount = messages.filter(m => m.type === 'error').length;
  const warningCount = messages.filter(m => m.type === 'warning').length;

  return (
    <div className={classes.root}>
      <Paper className={`${classes.paper} ${errorCount > 0 ? classes.error : classes.warning}`}>
        <div className={classes.header}>
          {errorCount > 0 ? (
            <>
              <ErrorIcon className={classes.iconError} />
              <Typography variant="body1" className={classes.headerText}>
                {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}{' '}
                {warningCount > 0 && `and ${warningCount} ${warningCount === 1 ? 'Warning' : 'Warnings'}`}
              </Typography>
            </>
          ) : (
            <>
              <WarningIcon className={classes.iconWarning} />
              <Typography variant="body1" className={classes.headerText}>
                {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
              </Typography>
            </>
          )}
        </div>
        
        <div className={classes.content}>
          <List dense disablePadding>
            {messages.map((message, index) => (
              <React.Fragment key={index}>
                {index > 0 && <Divider className={classes.divider} />}
                <ListItem alignItems="flex-start" className={classes.listItem} disableGutters>
                  <ListItemIcon className={classes.listItemIcon}>
                    {message.type === 'error' ? (
                      <ErrorIcon className={classes.iconError} fontSize="small" />
                    ) : message.type === 'warning' ? (
                      <WarningIcon className={classes.iconWarning} fontSize="small" />
                    ) : (
                      <InfoIcon className={classes.iconInfo} fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={message.message}
                    secondary={
                      <>
                        {message.suggestion && (
                          <Box display="flex" alignItems="flex-start" mt={0.5}>
                            <LightbulbIcon fontSize="small" className={classes.iconSuggestion} style={{ marginRight: 8 }} />
                            <Typography component="span" className={classes.suggestion}>
                              {message.suggestion}
                            </Typography>
                          </Box>
                        )}
                        {message.items && message.items.length > 0 && (
                          <List dense className={classes.itemsList}>
                            {message.items.map((item, idx) => (
                              <ListItem key={idx} dense>
                                <Typography variant="body2">• {item}</Typography>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </div>
      </Paper>
    </div>
  );
};

ErrorDisplay.propTypes = {
  /**
   * Array of message objects: { type: 'error'|'warning'|'info', message: string, suggestion: string, items: string[] }
   */
  messages: PropTypes.arrayOf(
    PropTypes.shape({
      type: PropTypes.oneOf(['error', 'warning', 'info']).isRequired,
      message: PropTypes.string.isRequired,
      suggestion: PropTypes.string,
      items: PropTypes.arrayOf(PropTypes.string),
    })
  ),
  /**
   * Whether to show a success message when there are no errors/warnings
   */
  showSuccessWhenNoMessages: PropTypes.bool,
};

export default ErrorDisplay;
