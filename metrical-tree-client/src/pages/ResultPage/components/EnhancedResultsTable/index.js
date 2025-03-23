import React, { useState, useMemo } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
  Card,
  Grid,
  Typography,
  Tabs,
  Tab,
  Box,
  alpha,
  Tooltip,
} from '@material-ui/core';
import TableChartIcon from '@material-ui/icons/TableChart';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';

import useHybridPagination from './hooks/useHybridPagination';
import NavigationControls from '../../../../components/ResultsGraph/components/NavigationControls';
import { TABLE_TABS } from './constants';
import { VERY_LONG_INPUT_THRESHOLD } from '../../../../components/ResultsGraph/constants/chartConfig';

// Implement views as we create them
const RawDataView = React.lazy(() => import('./views/RawDataView'));
const WordFocusedView = React.lazy(() => import('./views/WordFocusedView'));
const MetricAnalysisView = React.lazy(() => import('./views/MetricAnalysisView'));
const SentenceContextView = React.lazy(() => import('./views/SentenceContextView'));

const useStyles = makeStyles((theme) => ({
  card: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    overflow: 'visible', // Allow dropdowns to overflow the card
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1.5),
      marginTop: theme.spacing(1.5),
      borderRadius: theme.spacing(0.75),
    },
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#2C3E50',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    [theme.breakpoints.down('xs')]: {
      fontSize: '1rem',
      marginBottom: theme.spacing(1.5),
    },
  },
  titleIcon: {
    marginRight: theme.spacing(1),
    color: '#3498DB',
  },
  tabs: {
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('xs')]: {
      marginBottom: theme.spacing(1.5),
    },
  },
  tab: {
    minWidth: 120,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
    },
    [theme.breakpoints.down('xs')]: {
      minWidth: 'auto',
      padding: theme.spacing(1, 1),
      fontSize: '0.75rem',
    },
  },
  tabIcon: {
    marginRight: theme.spacing(0.5),
    [theme.breakpoints.down('xs')]: {
      fontSize: '0.9rem',
    },
  },
  tabPanel: {
    padding: 0,
  },
  responsiveTabIcon: {
    [theme.breakpoints.down('xs')]: {
      marginRight: 0, 
    },
  },
  responsiveTabText: {
    [theme.breakpoints.down('xs')]: {
      display: 'none',
    },
  },
  loadingPlaceholder: {
    height: 400,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: alpha(theme.palette.background.paper, 0.5),
    borderRadius: theme.shape.borderRadius,
  },
  // Animation for view transitions
  '@keyframes fadeIn': {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeIn: {
    animation: '$fadeIn 0.3s ease-in-out',
  },
}));

/**
 * TabPanel to wrap each view
 */
const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`table-tabpanel-${index}`}
      aria-labelledby={`table-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
};

/**
 * Enhanced Results Table component with tabbed views and virtualization
 * 
 * @param {Object} props
 * @param {Object} props.mergedResult - The result data from the API
 * @returns {JSX.Element}
 */
const EnhancedResultsTable = ({ mergedResult }) => {
  const classes = useStyles();
  const [activeView, setActiveView] = useState('sentence-context');
  
  // Initialize the hybrid pagination with larger chunk sizes for the table
  const hybridPagination = useHybridPagination(
    mergedResult?.data ?? [], 
    50,  // Initial chunk size
    20   // Rows to render at once (virtualization window)
  );
  
  // Get the active tab index based on the activeView state
  const activeTabIndex = useMemo(() => {
    return TABLE_TABS.findIndex(tab => tab.id === activeView);
  }, [activeView]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    const selectedTab = TABLE_TABS[newValue];
    setActiveView(selectedTab.id);
  };
  
  // The table uses default chunk sizes from chartConfig.js
  
  return (
    <Card className={classes.card}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6" className={classes.cardTitle}>
            <TableChartIcon className={classes.titleIcon} />
            Detailed Results
          </Typography>
          
          {/* Tab navigation */}
          <Tabs
            value={activeTabIndex}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            className={classes.tabs}
          >
            {TABLE_TABS.map((tab, index) => (
              <Tab
                key={tab.id}
                id={`table-tab-${index}`}
                aria-controls={`table-tabpanel-${index}`}
                label={
                  <Box display="flex" alignItems="center">
                    <tab.icon className={`${classes.tabIcon} ${classes.responsiveTabIcon}`} fontSize="small" />
                    <span className={classes.responsiveTabText}>{tab.label}</span>
                    <Tooltip 
                      title={
                        <div>
                          <Typography variant="body2" gutterBottom>
                            <strong>{tab.label}</strong>
                          </Typography>
                          {tab.id === 'word-focused' && (
                            <>
                              <Typography variant="caption">
                                Displays individual words with their linguistic properties.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Each word is shown with its part of speech and stress patterns.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Click on words to see detailed metrics and additional information.
                              </Typography>
                            </>
                          )}
                          {tab.id === 'metric-analysis' && (
                            <>
                              <Typography variant="caption">
                                Analyze and compare different metric values across words.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Visualize metric distributions, trends, and patterns.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Sort words by various metrics to identify significant patterns.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Toggle between raw and normalized metric values.
                              </Typography>
                            </>
                          )}
                          {tab.id === 'sentence-context' && (
                            <>
                              <Typography variant="caption">
                                This view groups words by their original sentences, providing linguistic context.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Sentences are determined from the data based on sentence index (sidx).
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Each card displays a complete sentence with its average metrics calculated from all words.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Click on any word to see its detailed metrics and properties.
                              </Typography>
                            </>
                          )}
                          {tab.id === 'raw-data' && (
                            <>
                              <Typography variant="caption">
                                View all raw data in tabular format.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Access complete dataset with all available fields.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Sort and filter data by any column.
                              </Typography>
                              <br />
                              <Typography variant="caption">
                                Use pagination controls to navigate through large datasets.
                              </Typography>
                            </>
                          )}
                        </div>
                      }
                      placement="bottom-start"
                    >
                      <InfoOutlinedIcon
                        style={{
                          fontSize: '16px',
                          marginLeft: '4px',
                          opacity: 0.7,
                          cursor: 'help'
                        }}
                      />
                    </Tooltip>
                  </Box>
                }
                className={classes.tab}
              />
            ))}
          </Tabs>
        </Grid>
        
        {/* Navigation controls - visually hidden for Metric Analysis, Word-Focused, and Sentence Context views */}
        <Grid item xs={12} style={{ display: activeView === 'metric-analysis' || activeView === 'word-focused' || activeView === 'sentence-context' ? 'none' : 'block' }}>
          <NavigationControls
            currentPage={hybridPagination.currentPage}
            totalPages={hybridPagination.totalPages}
            goToNextPage={hybridPagination.goToNextPage}
            goToPrevPage={hybridPagination.goToPrevPage}
            goToFirstPage={hybridPagination.goToFirstPage}
            goToLastPage={hybridPagination.goToLastPage}
            chunkSize={hybridPagination.chunkSize}
            changeChunkSize={hybridPagination.changeChunkSize}
            isVeryLongInput={hybridPagination.totalItems > VERY_LONG_INPUT_THRESHOLD}
            jumpToPageValue={hybridPagination.jumpToPageValue}
            handleJumpToPageChange={hybridPagination.handleJumpToPageChange}
            handleJumpToPage={hybridPagination.handleJumpToPage}
            handleJumpToPageKeyPress={hybridPagination.handleJumpToPageKeyPress}
            showChunkSizeControls={true}
          />
        </Grid>
        
        {/* Tab panels for each view */}
        <Grid item xs={12}>
          <React.Suspense 
            fallback={
              <div className={classes.loadingPlaceholder}>
                <Typography>Loading view...</Typography>
              </div>
            }
          >
            <TabPanel value={activeTabIndex} index={0} className={classes.tabPanel}>
              <div className={classes.fadeIn}>
                <WordFocusedView 
                  pagination={hybridPagination} 
                  data={mergedResult?.data ?? []} 
                />
              </div>
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={1} className={classes.tabPanel}>
              <div className={classes.fadeIn}>
                <MetricAnalysisView 
                  pagination={hybridPagination} 
                  data={mergedResult?.data ?? []} 
                />
              </div>
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={2} className={classes.tabPanel}>
              <div className={classes.fadeIn}>
                <SentenceContextView 
                  pagination={hybridPagination} 
                  data={mergedResult?.data ?? []} 
                />
              </div>
            </TabPanel>
            
            <TabPanel value={activeTabIndex} index={3} className={classes.tabPanel}>
              <div className={classes.fadeIn}>
                <RawDataView 
                  pagination={hybridPagination} 
                  data={mergedResult?.data ?? []} 
                />
              </div>
            </TabPanel>
          </React.Suspense>
        </Grid>
      </Grid>
    </Card>
  );
};

export default EnhancedResultsTable;
