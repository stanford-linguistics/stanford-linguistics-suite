import React from 'react';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import { Grid, Typography, Link, Divider, Paper, List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import FiberManualRecordIcon from '@material-ui/icons/FiberManualRecord';
import IdentityBar from '../../components/IdentityBar';
import PrimaryFooter from '../../components/PrimaryFooter';
import SecondaryFooter from '../../components/SecondaryFooter';
import Appbar from '../../components/Appbar';
import StyledButtonPrimary from 'components/shared/ButtonPrimary/ButtonPrimary';

const useStyles = makeStyles((theme) => ({
  container: {
    padding: theme.spacing(3),
    backgroundColor: '#f8f8f8',
    minHeight: 'calc(100vh - 316px)',
    height: 'auto',
    overflowY: 'auto',
  },
  contentPaper: {
    padding: theme.spacing(3),
    backgroundColor: '#ffffff',
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: theme.spacing(3),
  },
  pageHeader: {
    marginBottom: theme.spacing(3),
  },
  title: {
    fontWeight: 'bold',
    fontSize: '1.5rem',
    color: theme.palette.primary.dark,
    marginBottom: theme.spacing(1),
  },
  subTitle: { 
    fontSize: '1rem', 
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(0.5) 
  },
  sectionTitle: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(2),
    textAlign: 'center',
    fontSize: '1.1rem',
    fontWeight: 600,
    letterSpacing: '0.5px',
    color: theme.palette.primary.main,
    textTransform: 'uppercase',
  },
  sectionText: { 
    fontSize: '0.95rem', 
    marginTop: theme.spacing(1.5),
    lineHeight: 1.6,
    color: theme.palette.text.primary,
  },
  paragraphContainer: {
    marginBottom: theme.spacing(2),
  },
  listItem: {
    paddingTop: theme.spacing(0.5),
    paddingBottom: theme.spacing(0.5),
  },
  listItemIcon: {
    minWidth: 28,
  },
  bulletIcon: {
    fontSize: '0.6rem',
    color: theme.palette.primary.main,
  },
  listItemText: {
    margin: 0,
  },
  list: {
    padding: theme.spacing(0, 0, 1, 0),
  },
  link: {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
    '&:hover': {
      cursor: 'pointer',
      color: theme.palette.primary.dark,
      textDecoration: 'none',
    },
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  homeButton: {
    marginTop: theme.spacing(3),
  }
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
        alignContent="flex-start"
        className={classes.container}>
        <Grid item xs={12} sm={10} md={8} lg={6}>
          <Paper className={classes.contentPaper} elevation={0}>
            <div className={classes.pageHeader}>
              <Typography className={classes.subTitle}>
                Metrical Tree
              </Typography>
              <Typography className={classes.title}>About</Typography>
            </div>
            
            <Typography className={classes.sectionTitle} variant="h5">
              WHAT METRICAL TREE DOES
            </Typography>
            <Divider className={classes.divider} />
            
            <Typography className={classes.sectionText}>
              Metrical Tree is a web app that generates a normal stress contour for English sentences.
            </Typography>
            <Typography className={classes.sectionText}>
              You can type in your own text from the keyboard or upload
              a text file.
            </Typography>
            <Typography className={classes.sectionText}>
              You can download the result as a spreadsheet for your research.
            </Typography>
            <Typography className={classes.sectionText}>
              <Link 
                href="https://web.stanford.edu/~anttila/research/AMP-2020-Tutorial-Handout.pdf"
                className={classes.link}>
                Download Tutorial Handout
              </Link>
            </Typography>
            
            <Typography className={classes.sectionTitle} variant="h5">
              WHAT IS NORMAL STRESS?
            </Typography>
            <Divider className={classes.divider} />
            
            <div className={classes.paragraphContainer}>
              <Typography className={classes.sectionText}>
                Sentential prominence is largely predictable from syntax, phonology, and the information content of words.
              </Typography>
              
              <Typography className={classes.sectionText}>
                Normal stress is a baseline derived from the syntactic and phonological structure of the sentence.
              </Typography>
              
              <Typography className={classes.sectionText}>
                Metrical Tree builds on the classical theories of Chomsky, Halle, and Lukoff 1956, Chomsky and Halle 1968 (= SPE), Liberman and Prince 1977, and Cinque 1993.
              </Typography>
              
              <Typography className={classes.sectionText}>
                It uses syntactic parse trees provided by the Stanford Parser (Klein and Manning 2003; Chen and Manning 2014; Manning et al. 2014). The
                source code for MetricalTree is available at{' '}
                <Link
                  href="https://github.com/tdozat/Metrics"
                  className={classes.link}>
                  https://github.com/tdozat/Metrics.
                </Link>
              </Typography>
            </div>
            
            <Typography className={classes.sectionTitle} variant="h5">
              PARAMETER SETTINGS
            </Typography>
            <Divider className={classes.divider} />
            
            <Typography variant="h6" style={{ fontSize: '1.05rem', marginTop: '16px', fontWeight: 600 }}>
              1. Function words
            </Typography>
            <div className={classes.paragraphContainer}>
              <Typography className={classes.sectionText}>
                Function words are a major puzzle in English phonology. It is not clear whether small words like "a", "all", "in", "is", "not", "that", "the", "this", "will", "you", etc., are lexically stressed or not.
              </Typography>
              
              <Typography className={classes.sectionText}>
                This matters because only lexically stressed words are visible to the normal stress algorithm. Whatever we decide will impact normal stress in virtually every sentence.
              </Typography>
            </div>
            <Typography className={classes.sectionText}>
              Metrical Tree solves the problem as follows:
            </Typography>
            <List className={classes.list}>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      By default, all words are stressed.
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      The user can manually define words, or classes of words, as lexically unstressed or as stress-ambiguous.
                    </Typography>
                  }
                />
              </ListItem>
            </List>
            
            <Typography variant="h6" style={{ fontSize: '1.05rem', marginTop: '24px', fontWeight: 600 }}>
              2. Stress models
            </Typography>
            <Typography className={classes.sectionText}>
              Metrical Tree produces four different stress models:
            </Typography>
            <List className={classes.list}>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      <strong>m1:</strong> Stress-ambiguous words are stressed.
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      <strong>m2a:</strong> Stress-ambiguous monosyllables are unstressed, polysyllables are stressed.
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      <strong>m2b:</strong> Stress-ambiguous words are unstressed.
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem className={classes.listItem}>
                <ListItemIcon className={classes.listItemIcon}>
                  <FiberManualRecordIcon className={classes.bulletIcon} />
                </ListItemIcon>
                <ListItemText 
                  className={classes.listItemText}
                  primary={
                    <Typography className={classes.sectionText} style={{ marginTop: 0 }}>
                      <strong>mean:</strong> Ensemble model that takes the mean of the three prior models.
                    </Typography>
                  }
                />
              </ListItem>
            </List>
            <Typography className={classes.sectionText}>
              If in doubt, start with model m2a.
            </Typography>
            <Typography className={classes.sectionText}>
              For more information, see Anttila, Dozat, Galbraith, and Shapiro 2020.
            </Typography>
            
            <Typography className={classes.sectionTitle} variant="h5">
              ATTRIBUTION
            </Typography>
            <Divider className={classes.divider} />
            
            <Typography className={classes.sectionText}>
              The code for Metrical Tree was originally written in 2015 by Timothy Dozat. The current web interface was developed in 2025 by Juan Solis.
            </Typography>
            <Typography className={classes.sectionText}>
              If you use MetricalTree you can cite the following
              article:
            </Typography>
            <Typography className={classes.sectionText}>
              <Link 
                href="https://ling.auf.net/lingbuzz/004303"
                className={classes.link}>
                Anttila, Arto, Timothy Dozat, Daniel Galbraith, and
                Naomi Shapiro. 2020. Sentence stress in presidential
                speeches.
              </Link>{' '}
              In Gerrit Kentner and Joost Kremers (eds.), Prosody in
              Syntactic Encoding, Walter De Gruyter: Berlin/Boston, pp.
              17-50.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} className={classes.homeButton}>
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
