import React from 'react';
import { 
  Typography, 
  Button, 
  IconButton, 
  Tooltip,
  makeStyles,
} from '@material-ui/core';
import { 
  ChevronLeft as ChevronLeftIcon, 
  ChevronRight as ChevronRightIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
} from '@material-ui/icons';
import { CHUNK_SIZES } from '../constants/chartConfig';

const useStyles = makeStyles((theme) => ({
  navContainer: {
    padding: theme.spacing(1.5),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.spacing(1),
    boxShadow: theme.shadows[1],
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
    },
  },
  controlsWrapper: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    [theme.breakpoints.down('xs')]: {
      flexDirection: 'column',
      alignItems: 'center',
    },
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: theme.spacing(1, 0),
    width: '100%',
  },
  pageInfo: {
    margin: theme.spacing(0, 1),
    fontWeight: 500,
    minWidth: '80px',
    textAlign: 'center',
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.75rem',
      minWidth: '60px',
    },
  },
  jumpToPageContainer: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      marginTop: theme.spacing(1),
      width: '100%',
      justifyContent: 'center',
    },
  },
  jumpToPageInput: {
    width: '50px',
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    padding: theme.spacing(0.5, 1),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    [theme.breakpoints.down('xs')]: {
      width: '40px',
      height: '30px',
      fontSize: '0.9rem',
    },
  },
  chunkSizeContainer: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing(1.5),
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  },
  chunkSizeLabel: {
    marginRight: theme.spacing(1),
    fontSize: '0.8rem',
    fontWeight: 500,
    [theme.breakpoints.down('xs')]: {
      width: '100%',
      textAlign: 'center',
      marginBottom: theme.spacing(0.5),
      marginRight: 0,
    },
  },
  chunkSizeButton: {
    minWidth: '40px',
    marginRight: theme.spacing(0.5),
    height: '28px',
    [theme.breakpoints.down('xs')]: {
      height: '32px', // Larger touch target
      minWidth: '48px',
      marginBottom: theme.spacing(0.5),
    },
  },
  buttonGroup: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.down('xs')]: {
      margin: theme.spacing(1, 0),
    },
  },
  navIconButton: {
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
    },
  },
  goButton: {
    [theme.breakpoints.down('xs')]: {
      height: '32px',
      minWidth: '48px',
    }
  }
}));

/**
 * Component for displaying navigation controls with pagination
 * 
 * @param {Object} props - Component props
 * @param {number} props.currentPage - Current page index
 * @param {number} props.totalPages - Total number of pages
 * @param {function} props.goToNextPage - Function to go to the next page
 * @param {function} props.goToPrevPage - Function to go to the previous page
 * @param {function} props.goToFirstPage - Function to go to the first page
 * @param {function} props.goToLastPage - Function to go to the last page
 * @param {number} props.chunkSize - Current chunk size
 * @param {function} props.changeChunkSize - Function to change chunk size
 * @param {boolean} props.isVeryLongInput - Whether this is a very long input
 * @param {string} props.jumpToPageValue - Current jump-to-page input value
 * @param {function} props.handleJumpToPageChange - Handler for jump-to-page input changes
 * @param {function} props.handleJumpToPage - Handler for jump-to-page button click
 * @param {function} props.handleJumpToPageKeyPress - Handler for jump-to-page key press
 * @returns {JSX.Element} The navigation controls component
 */
const NavigationControls = ({
  currentPage,
  totalPages,
  goToNextPage,
  goToPrevPage,
  goToFirstPage,
  goToLastPage,
  chunkSize,
  changeChunkSize,
  isVeryLongInput,
  jumpToPageValue,
  handleJumpToPageChange,
  handleJumpToPage,
  handleJumpToPageKeyPress,
  showChunkSizeControls = true
}) => {
  const classes = useStyles();

  return (
    <div className={classes.navContainer}>
      <div className={classes.controlsWrapper}>
        {/* Words per page controls */}
        {showChunkSizeControls && (
          <div className={classes.chunkSizeContainer}>
            <Typography variant="caption" className={classes.chunkSizeLabel}>
              Words per page:
            </Typography>
            {CHUNK_SIZES.map(size => (
              <Button 
                key={size}
                size="small"
                variant={chunkSize === size ? "contained" : "outlined"}
                color={chunkSize === size ? "primary" : "default"}
                className={classes.chunkSizeButton}
                onClick={() => changeChunkSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        )}

        {/* Navigation controls */}
        <div className={classes.buttonGroup}>
          <Tooltip title="First page">
            <span> {/* Wrapper needed for disabled tooltips */}
              <IconButton 
                size="small" 
                onClick={goToFirstPage} 
                disabled={currentPage === 0}
                className={classes.navIconButton}
              >
                <FirstPageIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Previous page">
            <span>
              <IconButton 
                size="small" 
                onClick={goToPrevPage} 
                disabled={currentPage === 0}
                className={classes.navIconButton}
              >
                <ChevronLeftIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Typography variant="body2" className={classes.pageInfo}>
            Page {currentPage + 1} of {totalPages}
          </Typography>
          <Tooltip title="Next page">
            <span>
              <IconButton 
                size="small" 
                onClick={goToNextPage} 
                disabled={currentPage === totalPages - 1}
                className={classes.navIconButton}
              >
                <ChevronRightIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Last page">
            <span>
              <IconButton 
                size="small" 
                onClick={goToLastPage} 
                disabled={currentPage === totalPages - 1}
                className={classes.navIconButton}
              >
                <LastPageIcon />
              </IconButton>
            </span>
          </Tooltip>
        </div>
        
        {/* Jump to page controls */}
        {isVeryLongInput && (
          <div className={classes.jumpToPageContainer}>
            <Typography variant="caption">Jump to page:</Typography>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPageValue}
              onChange={handleJumpToPageChange}
              onKeyPress={handleJumpToPageKeyPress}
              className={classes.jumpToPageInput}
              aria-label="Jump to page number"
            />
            <Button 
              size="small" 
              variant="contained"
              color="primary"
              onClick={handleJumpToPage}
            >
              Go
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NavigationControls;
