import { Button, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  button: {
    marginTop: 8,
    borderRadius: 32,
    backgroundColor: '#44AB77',
    '&:hover': {
      backgroundColor: '#3C8F65',
      textDecoration: 'underline',
      color: 'white',
    },
  },
  buttonLabel: {
    textTransform: 'uppercase',
    fontSize: '0.625rem',
    fontWeight: 'bold',
    color: '#fff',
  },
}));

const StyledButtonPrimary = ({ type, disabled, label }) => {
  const classes = useStyles();

  return (
    <Button
      type={type}
      disabled={disabled}
      className={classes.button}>
      <Typography className={classes.buttonLabel}>{label}</Typography>
    </Button>
  );
};

export default StyledButtonPrimary;
