import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Link } from '@material-ui/core';
import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    height: 'calc(100vh - 316px)',
    overflowY: 'auto',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    fontSize: '1.25rem',
  },
  subTitle: { fontSize: '0.825rem', marginBottom: -4 },
  sectionTitle: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: '0.75rem',
  },
  sectionText: { fontSize: '0.75rem', marginTop: 8 },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    '&:hover': {
      cursor: 'pointer',
      color: theme.palette.primary.dark,
    },
  },
}));

const AboutPage = () => {
  const classes = useStyles();
  const history = useHistory();

  return (
    <>
      <IdentityBar />
      <Appbar />
      <Grid
        container
        justifyContent="center"
        alignContent="center"
        className={classes.container}>
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <Typography className={classes.subTitle}>
            Metrical Tree
          </Typography>
          <Typography className={classes.title}>About</Typography>
          <Typography className={classes.sectionText}>
            MetricalTree generates a normal stress contour for English
            sentences.
          </Typography>
          <Typography className={classes.sectionText}>
            You can type in your own text from the keyboard or upload
            a text file.
          </Typography>
          <Typography className={classes.sectionText}>
            Normal stress means a baseline stress that depends on the
            syntactic and phonological structure of the sentence.
            MetricalTree builds on the classical SPE theory (Chomsky,
            Halle, and Lukoff 1956; Chomsky and Halle 1968; Liberman
            and Prince 1977; Cinque 1993). It uses syntactic parse
            trees provided by the Stanford Parser (Klein and Manning
            2003; Chen and Manning 2014; Manning et al. 2014). The
            source code for MetricalTree is available at{' '}
            <Link
              href="https://github.com/tdozat/Metrics"
              className={classes.link}>
              https://github.com/tdozat/Metrics.
            </Link>
          </Typography>
          <Link href="https://web.stanford.edu/~anttila/research/AMP-2020-Tutorial-Handout.pdf">
            <Typography style={{ fontSize: '12px' }}>
              Download Tutorial Handout
            </Typography>
          </Link>
          <Typography className={classes.sectionTitle}>
            FINE-TUNING
          </Typography>
          <Typography className={classes.sectionText}>
            Function words are a major puzzle. It is not clear whether
            small words like "a", "all", "in", "is", "not", "that",
            "the", "this", "will", "you", etc., are stressable or not.
            Whatever you decide will have a huge impact on the
            calculation of normal stress in virtually every sentence.
          </Typography>
          <Typography className={classes.sectionText}>
            MetricalTree solves the problem as follows:
          </Typography>
          <Typography className={classes.sectionText}>
            (a) By default, all words are stressed.
          </Typography>
          <Typography className={classes.sectionText}>
            (b) You can manually define words, or classes of words, as
            unstressable or stress-ambiguous.
          </Typography>
          <Typography className={classes.sectionText}>
            For more information, see Anttila, Dozat, Galbraith, and
            Shapiro 2020.
          </Typography>
          <Typography className={classes.sectionTitle}>
            STRESS MODELS
          </Typography>
          <Typography className={classes.sectionText}>
            MetricalTree produces four different stress models:
          </Typography>
          <Typography className={classes.sectionText}>
            Model 1: Ambiguous words are stressed. Model 2: Ambiguous
            monosyllables are unstressed, polysyllables stressed.
            Model 3: Ambiguous words are unstressed. Model 4: Ensemble
            model that takes the mean of the three prior models.
          </Typography>
          <Typography className={classes.sectionText}>
            If in doubt, start with Model 2.
          </Typography>
          <Typography className={classes.sectionTitle}>
            CITATION
          </Typography>
          <Typography className={classes.sectionText}>
            If you use MetricalTree you can cite the following
            article:
          </Typography>
          <Typography className={classes.sectionText}>
            <Link href="https://ling.auf.net/lingbuzz/004303">
              Anttila, Arto, Timothy Dozat, Daniel Galbraith, and
              Naomi Shapiro. 2020. Sentence stress in presidential
              speeches.
            </Link>{' '}
            In Gerrit Kentner and Joost Kremers (eds.), Prosody in
            Syntactic Encoding, Walter De Gruyter: Berlin/Boston, pp.
            17-50.
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Grid container justifyContent="center">
            <Grid item>
              <StyledButtonPrimary
                label={'Home'}
                onClick={() => history.push('/')}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <SecondaryFooter />
      <PrimaryFooter />
    </>
  );
};

export default AboutPage;
