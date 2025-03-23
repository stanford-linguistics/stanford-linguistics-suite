import React, { useState } from 'react';
import { 
  Button, 
  ButtonGroup, 
  Tooltip, 
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  makeStyles 
} from '@material-ui/core';
import {
  Image as ImageIcon,
  TableChart as TableChartIcon,
  Code as CodeIcon,
  PictureAsPdf as PdfIcon,
  ArrowDropDown as ArrowDropDownIcon,
  CollectionsBookmark as MultiPageIcon,
  PhotoLibrary as GalleryIcon,
  Print as PrintIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  exportContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  exportButton: {
    fontSize: '0.75rem',
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
 * @returns {JSX.Element} The export controls component
 */
const ExportControls = ({
  handleExportImage,
  handleExportCsv,
  handleExportState,
  handleExportPdf,
  handleExportAllImages,
  handleExportAllPdf,
  totalPages = 1
}) => {
  const classes = useStyles();
  const [imageMenuAnchor, setImageMenuAnchor] = useState(null);
  const [pdfMenuAnchor, setPdfMenuAnchor] = useState(null);
  
  const openImageMenu = (event) => {
    setImageMenuAnchor(event.currentTarget);
  };
  
  const closeImageMenu = () => {
    setImageMenuAnchor(null);
  };
  
  const openPdfMenu = (event) => {
    setPdfMenuAnchor(event.currentTarget);
  };
  
  const closePdfMenu = () => {
    setPdfMenuAnchor(null);
  };
  
  const handleImageExport = () => {
    handleExportImage();
    closeImageMenu();
  };
  
  const handleAllImagesExport = () => {
    if (handleExportAllImages) {
      handleExportAllImages();
    }
    closeImageMenu();
  };
  
  const handlePdfExport = () => {
    if (handleExportPdf) {
      handleExportPdf();
    }
    closePdfMenu();
  };
  
  const handleAllPdfExport = () => {
    if (handleExportAllPdf) {
      handleExportAllPdf();
    }
    closePdfMenu();
  };
  
  const buttons = [];
  
  // Image Export Button
  buttons.push(
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
    buttons.push(
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
    buttons.push(
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
      buttons.push(
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
  
  // CSV Export
  buttons.push(
    <Tooltip key="csv-btn" title="Export complete dataset as CSV for analysis in Excel/R/etc.">
      <Button 
        className={classes.exportButton}
        onClick={handleExportCsv}
        startIcon={<TableChartIcon />}
      >
        CSV
      </Button>
    </Tooltip>
  );
  
  // JSON Export
  buttons.push(
    <Tooltip key="json-btn" title="Export complete state as JSON (for sharing/archiving)">
      <Button 
        className={classes.exportButton}
        onClick={handleExportState}
        startIcon={<CodeIcon />}
      >
        JSON
      </Button>
    </Tooltip>
  );
  
  // Print Function
  if (handleExportPdf) {
    buttons.push(
      <Tooltip key="print-btn" title="Print the visualization">
        <Button 
          className={classes.exportButton}
          onClick={handlePdfExport}
          startIcon={<PrintIcon />}
        >
          Print
        </Button>
      </Tooltip>
    );
  }
  
  return (
    <div className={classes.exportContainer}>
      <ButtonGroup size="small" variant="outlined" color="primary">
        {buttons}
      </ButtonGroup>
      
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
  );
};

export default ExportControls;
