import React, { useState } from 'react';
import { 
  Button, 
  ButtonGroup, 
  Tooltip, 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  makeStyles,
  useMediaQuery,
  useTheme,
  IconButton,
  Typography
} from '@material-ui/core';
import {
  Image as ImageIcon,
  TableChart as TableChartIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  ArrowDropDown as ArrowDropDownIcon,
  CollectionsBookmark as MultiPageIcon,
  PhotoLibrary as GalleryIcon,
  Print as PrintIcon,
  GetApp as DownloadIcon,
  AssessmentOutlined as AssessmentIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  header: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
      fontSize: '1.25rem',
    },
  },
  exportContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    [theme.breakpoints.down('xs')]: {
      padding: theme.spacing(1),
      justifyContent: 'flex-end',
    },
  },
  controlsWrapper: {
    padding: theme.spacing(1.5),
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'visible',
  },
  exportButton: {
    fontSize: '0.8rem',
    textTransform: 'none',
    fontWeight: 500,
    padding: theme.spacing(0.5, 1.5),
    borderRadius: theme.shape.borderRadius,
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.2s ease',
    '&:hover': {
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
  },
  splitButton: {
    marginLeft: -1,
    padding: '4px 8px',
    minWidth: '24px',
    borderLeft: `1px solid ${theme.palette.primary.main}`
  },
  menu: {
    '& .MuiListItemIcon-root': {
      minWidth: '32px',
    }
  },
  menuItem: {
    fontSize: '0.75rem',
    minHeight: '32px',
  },
  menuIcon: {
    fontSize: '1rem',
  },
  mobileExportButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    padding: theme.spacing(1),
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  mobileMenuContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: theme.spacing(1),
  },
  mobileHeader: {
    display: 'flex',
    alignItems: 'center',
    '& > svg': {
      marginRight: theme.spacing(1),
      color: theme.palette.primary.main,
      fontSize: '1.25rem',
    },
  }
}));

/**
 * Component for displaying export controls
 * 
 * @param {Object} props - Component props
 * @param {function} props.handleExportImage - Handler for exporting as image
 * @param {function} props.handleExportCsv - Handler for exporting as CSV
 * @param {function} props.handleExportState - Handler for exporting state as JSON
 * @param {function} props.handleExportPdf - Handler for exporting as PDF (optional)
 * @param {function} props.handleExportAllImages - Handler for exporting all pages as images (optional)
 * @param {function} props.handleExportAllPdf - Handler for exporting all pages as PDF (optional)
 * @param {number} props.totalPages - Total number of pages (optional)
 * @param {string} props.downloadLink - API link for downloading raw results (optional)
 * @returns {JSX.Element} The export controls component
 */
const ExportControls = ({
  handleExportImage,
  handleExportCsv,
  handleExportState,
  handleExportPdf,
  handleExportAllImages,
  handleExportAllPdf,
  totalPages = 1,
  modelName = "m2a (raw)",
  downloadLink
}) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('xs'));
  
  const [imageMenuAnchor, setImageMenuAnchor] = useState(null);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState(null);
  
  // Open/close handlers for menus
  const openImageMenu = (event) => setImageMenuAnchor(event.currentTarget);
  const closeImageMenu = () => setImageMenuAnchor(null);
  
  const openPdfMenu = (event) => setPdfMenuAnchor(event.currentTarget);
  const closePdfMenu = () => setPdfMenuAnchor(null);
  
  const openMobileMenu = (event) => setMobileMenuAnchor(event.currentTarget);
  const closeMobileMenu = () => setMobileMenuAnchor(null);
  
  // Export handlers
  const handleImageExport = () => {
    handleExportImage();
    closeImageMenu();
    closeMobileMenu();
  };
  
  const handleAllImagesExport = () => {
    if (handleExportAllImages) {
      handleExportAllImages();
    }
    closeImageMenu();
    closeMobileMenu();
  };
  
  const handlePdfExport = () => {
    if (handleExportPdf) {
      handleExportPdf();
    }
    closePdfMenu();
    closeMobileMenu();
  };
  
  const handleAllPdfExport = () => {
    if (handleExportAllPdf) {
      handleExportAllPdf();
    }
    closePdfMenu();
    closeMobileMenu();
  };
  
  const handleCsvExport = () => {
    if (downloadLink) {
      // If we have a direct download link from the API, use that
      window.open(downloadLink, '_blank');
    } else if (handleExportCsv) {
      // Fallback to local CSV export if no direct link available
      handleExportCsv();
    }
    closeMobileMenu();
  };
  
  const handleJsonExport = () => {
    handleExportState();
    closeMobileMenu();
  };
  
  // For desktop view
  const desktopButtons = [];
  
  // Image Export Button
  desktopButtons.push(
    <Tooltip key="image-btn" title="Export current chart as PNG image">
      <Button 
        className={classes.exportButton}
        onClick={handleExportImage}
        startIcon={<ImageIcon />}
      >
        Image
      </Button>
    </Tooltip>
  );
  
  // Image Dropdown (if multiple pages)
  if (totalPages > 1) {
    desktopButtons.push(
      <Button 
        key="image-dropdown"
        className={classes.splitButton}
        onClick={openImageMenu}
        aria-controls="image-export-menu"
        aria-haspopup="true"
      >
        <ArrowDropDownIcon fontSize="small" />
      </Button>
    );
  }
  
  // PDF Export (if handler exists)
  if (handleExportPdf) {
    desktopButtons.push(
      <Tooltip key="pdf-btn" title="Export as PDF for printing">
        <Button 
          className={classes.exportButton}
          onClick={handleExportPdf}
          startIcon={<PdfIcon />}
        >
          PDF
        </Button>
      </Tooltip>
    );
    
    // PDF Dropdown (if multiple pages)
    if (totalPages > 1) {
      desktopButtons.push(
        <Button 
          key="pdf-dropdown"
          className={classes.splitButton}
          onClick={openPdfMenu}
          aria-controls="pdf-export-menu"
          aria-haspopup="true"
        >
          <ArrowDropDownIcon fontSize="small" />
        </Button>
      );
    }
  }
  
  if (downloadLink) {
    desktopButtons.push(
      <Tooltip key="csv-btn" title="Download raw results">
        <Button 
          className={classes.exportButton}
          onClick={handleCsvExport}
          startIcon={<TableChartIcon />}
        >
          CSV
        </Button>
      </Tooltip>
    );
  }
  
  
  // Mobile View
  const renderMobileMenu = () => (
    <div className={classes.mobileMenuContainer}>
      <div className={classes.mobileHeader}>
        <AssessmentIcon />
        <Typography variant="h6">{modelName}</Typography>
      </div>
      <Tooltip title="Export Options">
        <IconButton
          className={classes.mobileExportButton}
          onClick={openMobileMenu}
          aria-controls="mobile-export-menu"
          aria-haspopup="true"
          color="primary"
        >
          <DownloadIcon />
        </IconButton>
      </Tooltip>
      
      <Menu
        id="mobile-export-menu"
        anchorEl={mobileMenuAnchor}
        keepMounted
        open={Boolean(mobileMenuAnchor)}
        onClose={closeMobileMenu}
        className={classes.menu}
      >
        <MenuItem onClick={handleImageExport} className={classes.menuItem}>
          <ListItemIcon>
            <ImageIcon className={classes.menuIcon} />
          </ListItemIcon>
          <ListItemText primary="Export as Image" />
        </MenuItem>
        
        {handleExportAllImages && totalPages > 1 && (
          <MenuItem onClick={handleAllImagesExport} className={classes.menuItem}>
            <ListItemIcon>
              <GalleryIcon className={classes.menuIcon} />
            </ListItemIcon>
            <ListItemText primary={`All Pages as Images (${totalPages})`} />
          </MenuItem>
        )}
        
        {handleExportPdf && (
          <MenuItem onClick={handlePdfExport} className={classes.menuItem}>
            <ListItemIcon>
              <PdfIcon className={classes.menuIcon} />
            </ListItemIcon>
            <ListItemText primary="Export as PDF" />
          </MenuItem>
        )}
        
        {handleExportAllPdf && totalPages > 1 && (
          <MenuItem onClick={handleAllPdfExport} className={classes.menuItem}>
            <ListItemIcon>
              <MultiPageIcon className={classes.menuIcon} />
            </ListItemIcon>
            <ListItemText primary={`All Pages as PDF (${totalPages})`} />
          </MenuItem>
        )}
        
        <MenuItem onClick={handleCsvExport} className={classes.menuItem}>
          <ListItemIcon>
            <TableChartIcon className={classes.menuIcon} />
          </ListItemIcon>
          <ListItemText primary="Export as CSV" />
        </MenuItem>
        
        <MenuItem onClick={handleJsonExport} className={classes.menuItem}>
          <ListItemIcon>
            <CodeIcon className={classes.menuIcon} />
          </ListItemIcon>
          <ListItemText primary="Export as JSON" />
        </MenuItem>
        
        {handleExportPdf && (
          <MenuItem onClick={handlePdfExport} className={classes.menuItem}>
            <ListItemIcon>
              <PrintIcon className={classes.menuIcon} />
            </ListItemIcon>
            <ListItemText primary="Print" />
          </MenuItem>
        )}
      </Menu>
    </div>
  );
  
  return (
    <>
      {isMobile ? (
        renderMobileMenu()
      ) : (
        <div className={classes.controlsWrapper}>
          <div className={classes.header}>
            <AssessmentIcon />
            <Typography variant="h6" style={{ marginLeft: '8px', fontWeight: 500 }}>{modelName}</Typography>
          </div>
          <div className={classes.exportContainer} style={{ paddingRight: theme.spacing(1) }}>
            <ButtonGroup size="small" variant="contained" color="primary">
            {desktopButtons}
            </ButtonGroup>
          </div>
          
          {/* Menus (outside ButtonGroup) */}
          <Menu
            id="image-export-menu"
            anchorEl={imageMenuAnchor}
            keepMounted
            open={Boolean(imageMenuAnchor)}
            onClose={closeImageMenu}
            className={classes.menu}
          >
            <MenuItem onClick={handleImageExport} className={classes.menuItem}>
              <ListItemIcon>
                <ImageIcon className={classes.menuIcon} />
              </ListItemIcon>
              <ListItemText primary="Current page" />
            </MenuItem>
            <MenuItem onClick={handleAllImagesExport} className={classes.menuItem}>
              <ListItemIcon>
                <GalleryIcon className={classes.menuIcon} />
              </ListItemIcon>
              <ListItemText primary={`All pages (${totalPages})`} />
            </MenuItem>
          </Menu>
          
          <Menu
            id="pdf-export-menu"
            anchorEl={pdfMenuAnchor}
            keepMounted
            open={Boolean(pdfMenuAnchor)}
            onClose={closePdfMenu}
            className={classes.menu}
          >
            <MenuItem onClick={handlePdfExport} className={classes.menuItem}>
              <ListItemIcon>
                <PdfIcon className={classes.menuIcon} />
              </ListItemIcon>
              <ListItemText primary="Current page" />
            </MenuItem>
            <MenuItem onClick={handleAllPdfExport} className={classes.menuItem}>
              <ListItemIcon>
                <MultiPageIcon className={classes.menuIcon} />
              </ListItemIcon>
              <ListItemText primary={`All pages (${totalPages})`} />
            </MenuItem>
          </Menu>
        </div>
      )}
    </>
  );
};

export default ExportControls;
