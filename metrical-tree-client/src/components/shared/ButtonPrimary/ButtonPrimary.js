import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import classnames from 'classnames';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      color: theme.palette.primary.contrastText,
    },
  },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    color: theme.palette.primary.contrastText,
  },
  disabled: {
    backgroundColor: '#c1c1c1',
  },
}));

const StyledButtonPrimary = ({ type, disabled, label, onClick }) => {
  const classes = useStyles();

  return (
    <Button
      type={type}
      disabled={disabled}
      className={classnames(classes.button, {
        [`${classes.disabled}`]: disabled,
      })}
      onClick={onClick}>
      <Typography className={classes.buttonLabel}>{label}</Typography>
    </Button>
  );
};

export default StyledButtonPrimary;
