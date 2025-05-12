import { makeStyles } from '@material-ui/core/styles';
import { STANFORD_COLORS } from './constants';

export const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    overflow: 'hidden',
    backgroundColor: props => props.backgroundColor || 'transparent',
  },
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linguisticPattern: {
    position: 'absolute',
    zIndex: 0,
    width: '100%',
    height: '100%',
    opacity: 0.05,
    backgroundImage: `repeating-linear-gradient(
      45deg,
      ${STANFORD_COLORS.RED} 0,
      ${STANFORD_COLORS.RED} 1px,
      transparent 1px,
      transparent 15px
    )`,
    pointerEvents: 'none',
  },
  gridSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
  },
  particlesSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 2,
    pointerEvents: 'none',
  },
  treeSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 3,
    pointerEvents: 'none',
    overflow: 'hidden', // Prevent elements from going outside the SVG container
  },
  mobileTreeSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 3,
    pointerEvents: 'none',
    overflow: 'hidden', // Prevent elements from going outside the SVG container
  },
  controls: {
    position: 'absolute',
    bottom: theme.spacing(3),
    right: theme.spacing(3),
    zIndex: 10,
    display: 'flex',
    gap: theme.spacing(1),
  },
  controlButton: {
    backgroundColor: STANFORD_COLORS.RED,
    color: 'white',
    '&:hover': {
      backgroundColor: STANFORD_COLORS.LIGHT_RED,
    },
    minWidth: 'unset',
    padding: theme.spacing(0.5, 1),
  },
  // Responsive styles
  '@media (max-width: 768px)': {
    controls: {
      bottom: theme.spacing(2),
      right: theme.spacing(2),
    },
  },
}));
