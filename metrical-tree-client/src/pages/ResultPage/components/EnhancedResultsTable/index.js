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
} from '@material-ui/core';
import TableChartIcon from '@material-ui/icons/TableChart';

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
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#2C3E50',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  titleIcon: {
    marginRight: theme.spacing(1),
    color: '#3498DB',
  },
  tabs: {
    marginBottom: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  tab: {
    minWidth: 120,
    '&.Mui-selected': {
      color: theme.palette.primary.main,
      fontWeight: 'bold',
    },
  },
  tabIcon: {
    marginRight: theme.spacing(0.5),
  },
  tabPanel: {
    padding: 0,
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
  const [activeView, setActiveView] = useState('raw-data');
  
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
                    <tab.icon className={classes.tabIcon} fontSize="small" />
                    {tab.label}
                  </Box>
                }
                className={classes.tab}
              />
            ))}
          </Tabs>
        </Grid>
        
        {/* Navigation controls - visually hidden for Metric Analysis and Word-Focused views */}
        <Grid item xs={12} style={{ display: activeView === 'metric-analysis' || activeView === 'word-focused' ? 'none' : 'block' }}>
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
