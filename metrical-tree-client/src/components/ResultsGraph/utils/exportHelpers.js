/**
 * Export functionality helpers for the ResultsGraph component
 */
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Captures the color legend as a canvas
 * @param {Array} colorLegendData - Array of {label, color} objects for the legend
 * @returns {Promise<HTMLCanvasElement|null>} Canvas element or null if failed
 */
const captureColorLegend = async (colorLegendData) => {
  if (!colorLegendData || !colorLegendData.length) return null;
  
  try {
    // Create a temporary div to render the legend
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      left: -9999px;
      background: white;
      padding: 16px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    `;
    
    // Create legend title
    const title = document.createElement('div');
    title.textContent = 'Color Legend';
    title.style.cssText = `
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 12px;
      font-weight: 400;
    `;
    tempDiv.appendChild(title);
    
    // Create legend items container
    const container = document.createElement('div');
    container.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      border: 1px solid rgba(0, 0, 0, 0.12);
    `;

    // Define groups based on color scheme
    const groups = colorLegendData[0]?.label === 'yes' || colorLegendData[0]?.label === 'no' || colorLegendData[0]?.label === 'ambig'
      ? {
          // Stress groups
          stress: {
            title: 'Stress Patterns',
            items: ['yes', 'no', 'ambig'],
            labels: {
              'yes': 'Stressed',
              'no': 'Unstressed',
              'ambig': 'Ambiguous'
            }
          }
        }
      : {
          // POS groups
          nouns: {
            title: 'Nouns',
            items: ['NN', 'NNS', 'NNP', 'NNPS']
          },
          verbs: {
            title: 'Verbs',
            items: ['VB', 'VBD', 'VBG', 'VBN', 'VBP', 'VBZ']
          },
          adjectives: {
            title: 'Adjectives',
            items: ['JJ', 'JJR', 'JJS']
          },
          adverbs: {
            title: 'Adverbs',
            items: ['RB', 'RBR', 'RBS']
          },
          others: {
            title: 'Other',
            items: ['IN', 'CC', 'DT', 'PRP', 'PRP$', 'WP', 'WP$', 'MD', 'TO']
          }
        };

    // Create rows container
    const rowsContainer = document.createElement('div');
    rowsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    `;

    // Add legend items by group
    colorLegendData.forEach(({ label, color }) => {
      let added = false;
      
      // Find which group this item belongs to
      for (const [groupName, { title, items }] of Object.entries(groups)) {
        if (items.includes(label)) {
          // Get or create group container
          let groupContainer = rowsContainer.querySelector(`[data-group="${groupName}"]`);
          if (!groupContainer) {
            groupContainer = document.createElement('div');
            groupContainer.setAttribute('data-group', groupName);
            
            // Add group title if not already added
            if (!groupContainer.querySelector('.group-title')) {
              const titleElem = document.createElement('div');
              titleElem.className = 'group-title';
              titleElem.textContent = title;
              titleElem.style.cssText = `
                font-size: 12px;
                font-weight: 500;
                color: rgba(0, 0, 0, 0.7);
                margin-bottom: 4px;
                padding-bottom: 4px;
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
              `;
              groupContainer.appendChild(titleElem);
            }
            
            groupContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 4px;
              background: rgba(255, 255, 255, 0.7);
              padding: 8px;
              border-radius: 4px;
              margin-bottom: 4px;
            `;
            rowsContainer.appendChild(groupContainer);
          }
          // Create item
          const item = document.createElement('div');
          item.style.cssText = `
            display: flex;
            align-items: center;
            padding: 4px 6px;
            border-radius: 4px;
            background: white;
            transition: all 0.2s ease;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          `;
      
          const colorBox = document.createElement('div');
          colorBox.style.cssText = `
            width: 16px;
            height: 16px;
            margin-right: 8px;
            border-radius: 4px;
            background-color: ${color};
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          `;
          
          const labelElem = document.createElement('span');
          labelElem.textContent = groups[groupName].labels?.[label] || label;
          labelElem.style.cssText = `
            font-size: 12px;
            color: rgba(0, 0, 0, 0.87);
          `;
          
          item.appendChild(colorBox);
          item.appendChild(labelElem);
          groupContainer.appendChild(item);
          added = true;
          break;
        }
      }

      // If item doesn't belong to any group, add it directly
      if (!added) {
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex;
          align-items: center;
          padding: 4px 6px;
          border-radius: 4px;
          background: white;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        `;
        
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
          width: 16px;
          height: 16px;
          margin-right: 8px;
          border-radius: 4px;
          background-color: ${color};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        `;
        
        const labelElem = document.createElement('span');
        labelElem.textContent = label;
        labelElem.style.cssText = `
          font-size: 12px;
          color: rgba(0, 0, 0, 0.87);
        `;
        
        item.appendChild(colorBox);
        item.appendChild(labelElem);
        rowsContainer.appendChild(item);
      }
    });
    
    container.appendChild(rowsContainer);
    tempDiv.appendChild(container);
    document.body.appendChild(tempDiv);
    
    // Capture the legend as canvas
    const canvas = await html2canvas(tempDiv, {
      backgroundColor: 'white',
      scale: 2, // Higher resolution
    });
    
    // Clean up
    document.body.removeChild(tempDiv);
    
    return canvas;
  } catch (error) {
    console.error('Error capturing color legend:', error);
    return null;
  }
};

/**
 * Exports chart as a high-resolution image
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {Object} colorLegendData - Color legend data if color scheme is selected
 * @param {number} [scaleFactor=3] - Scale factor for higher resolution (3-4x recommended for quality)
 * @returns {Promise<boolean>} Success status
 */
export const exportAsImage = async (chartRef, colorLegendData = null, scaleFactor = 3) => {
  if (!chartRef.current) return false;
  
  try {
    // Use the same high-resolution capture approach as captureChartAsCanvas
    const canvas = await captureChartAsCanvas(chartRef, scaleFactor);
    if (!canvas) {
      console.error('Failed to capture chart');
      return false;
    }

    // Export the chart directly without legend
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.download = `linguistic-chart-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = dataUrl;
    link.click();

    return true;
  } catch (error) {
    console.error('Error exporting image:', error);
    return false;
  }
};

/**
 * Captures the current chart as a high-resolution canvas
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {number} [scaleFactor=3] - Scale factor for higher resolution (3-4x recommended for PDF)
 * @returns {Promise<HTMLCanvasElement|null>} Canvas element or null if failed
 */
export const captureChartAsCanvas = async (chartRef, scaleFactor = 3) => {
  if (!chartRef.current) return null;
  
  try {
    // Find the Chart.js canvas element
    const originalCanvas = chartRef.current.querySelector('canvas');
    if (!originalCanvas) {
      console.error('Canvas element not found');
      return null;
    }
    
    // Get canvas dimensions
    const rect = originalCanvas.getBoundingClientRect();
    
    // Create a new high-resolution canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set high-resolution canvas dimensions
    canvas.width = rect.width * scaleFactor;
    canvas.height = rect.height * scaleFactor;
    
    // Set canvas CSS dimensions to match original
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    
    // Fill canvas with white background first
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scale the context to handle the higher resolution
    ctx.scale(scaleFactor, scaleFactor);
    
    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Draw the original canvas onto our high-resolution canvas
    ctx.drawImage(originalCanvas, 0, 0, rect.width, rect.height);
    
    return canvas;
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};

// Export type constants
const ExportTypes = {
  IMAGE: 'image',
  PDF: 'pdf',
  ZIP: 'zip'
};

// Loading messages for each export type
const getLoadingMessage = (type) => ({
  [ExportTypes.IMAGE]: 'Generating image export...',
  [ExportTypes.PDF]: 'Creating PDF document...',
  [ExportTypes.ZIP]: 'Preparing ZIP archive...',
})[type] || 'Processing...';

/**
 * Creates and displays a loading overlay for long operations
 * @param {string} type - Type of export operation (image, pdf, zip)
 * @param {string} [customMessage] - Optional custom message to override default
 * @returns {Object} Loading overlay control object with start and stop methods
 */
export const createLoadingOverlay = (type, customMessage = null) => {
  const message = customMessage || getLoadingMessage(type);
  const overlayId = 'export-loading-overlay';
  const existingOverlay = document.getElementById(overlayId);
  
  // If an overlay already exists, return controls for it
  if (existingOverlay) {
    return {
      start: () => {
        existingOverlay.style.display = 'flex';
        document.body.style.pointerEvents = 'none';
      },
      stop: () => {
        existingOverlay.style.display = 'none';
        document.body.style.pointerEvents = 'auto';
      },
      updateProgress: (message) => {
        const progressElement = existingOverlay.querySelector('div:last-child');
        if (progressElement) {
          progressElement.innerText = message;
        }
      }
    };
  }
  
  // Create overlay elements
  const overlay = document.createElement('div');
  overlay.id = overlayId;
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: none;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    z-index: 9999;
  `;
  
  const spinner = document.createElement('div');
  spinner.style.cssText = `
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 5px solid #fff;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  `;
  
  // Add spinner animation
  const styleSheet = document.createElement('style');
  styleSheet.innerText = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
  
  const messageElement = document.createElement('div');
  messageElement.innerText = message;
  messageElement.style.cssText = `
    color: white;
    font-size: 18px;
    font-family: sans-serif;
  `;
  
  const progressElement = document.createElement('div');
  progressElement.style.cssText = `
    color: white;
    font-size: 14px;
    font-family: sans-serif;
    margin-top: 10px;
  `;
  
  overlay.appendChild(spinner);
  overlay.appendChild(messageElement);
  overlay.appendChild(progressElement);
  document.body.appendChild(overlay);
  
  return {
    start: () => {
      overlay.style.display = 'flex';
      document.body.style.pointerEvents = 'none';
    },
    stop: () => {
      overlay.style.display = 'none';
      document.body.style.pointerEvents = 'auto';
    },
    updateProgress: (message) => {
      progressElement.innerText = message;
    }
  };
};

/**
 * Exports all pages as images in a ZIP file
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {number} totalPages - Total number of pages
 * @param {function} setCurrentPage - Function to set the current page
 * @param {string} title - Title of the analysis
 * @param {Object} metadata - Additional metadata
 * @param {Object} colorLegendData - Color legend data if color scheme is selected
 * @returns {Promise<boolean>} Success status
 */
export const exportAllAsImages = async (
  chartRef,
  totalPages,
  setCurrentPage,
  title = 'Linguistic Analysis',
  metadata = {},
  colorLegendData = null
) => {
  // Create loading overlay
  const loading = createLoadingOverlay(ExportTypes.ZIP);
  loading.start();
  
  try {
    // Create new ZIP instance
    const zip = new JSZip();
    const currentPageBackup = metadata.currentPage || 0;
    
    // Store original page
    const originalPage = currentPageBackup;
    
    // Add a simple readme
    zip.file('README.txt', 
      `Linguistic Analysis Charts\n` +
      `Generated: ${new Date().toLocaleString()}\n` +
      `Title: ${title}\n` +
      `Total Pages: ${totalPages}\n` +
      `Color scheme: ${metadata.colorScheme || 'Default'}\n\n` +
      `These images represent the analysis broken down by chunks of words.\n` +
      (colorLegendData ? `\nA color_legend.png file is included showing the color scheme used for visualization.` : '')
    );

    // Add color legend if present
    if (colorLegendData && colorLegendData.length > 0) {
      const legendCanvas = await captureColorLegend(colorLegendData);
      if (legendCanvas) {
        // Create a new canvas with white background and padding
        const paddedCanvas = document.createElement('canvas');
        const ctx = paddedCanvas.getContext('2d');
        const padding = 20;
        
        paddedCanvas.width = legendCanvas.width + (padding * 2);
        paddedCanvas.height = legendCanvas.height + (padding * 2);
        
        // Fill white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
        
        // Draw legend in the center
        ctx.drawImage(legendCanvas, padding, padding);
        
        // Add border
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        ctx.strokeRect(padding/2, padding/2, paddedCanvas.width - padding, paddedCanvas.height - padding);
        
        // Convert to blob with high quality
        const legendBlob = await new Promise(resolve => paddedCanvas.toBlob(resolve, 'image/png', 1.0));
        zip.file('color_legend.png', legendBlob);
      }
    }
    
    // Capture each page
    for (let i = 0; i < totalPages; i++) {
      // Update progress indicator
      loading.updateProgress(`Processing page ${i+1} of ${totalPages}...`);
      
      // Add delay for rendering
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Set the page
      setCurrentPage(i);
      
      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Capture the chart in high resolution
      const canvas = await captureChartAsCanvas(chartRef, 3); // Use scale factor 3 for high quality
      if (canvas) {
        // Convert canvas to blob with high quality
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        
        // Add to ZIP
        zip.file(`linguistic-chart-page${i+1}of${totalPages}.png`, blob);
      }
    }
    
    // Restore original page
    setCurrentPage(originalPage);
    
    // Generate ZIP and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `linguistic-charts-${new Date().toISOString().slice(0, 10)}.zip`;
    link.click();
    
    loading.stop();
    return true;
  } catch (error) {
    console.error('Error exporting all images:', error);
    loading.stop();
    return false;
  }
};

/**
 * Export the chart as a PDF document
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {string} title - Title of the chart
 * @param {Object} metadata - Additional metadata
 * @param {Object} colorLegendData - Color legend data if color scheme is selected
 * @returns {Promise<boolean>} Success status
 */
export const exportAsPdf = async (
  chartRef,
  title = 'Linguistic Analysis',
  metadata = {},
  colorLegendData = null
) => {
  const loading = createLoadingOverlay(ExportTypes.PDF);
  loading.start();
  
  try {
    // Capture the chart in high resolution
    const canvas = await captureChartAsCanvas(chartRef, 3); // Use scale factor 3 for high quality
    if (!canvas) {
      console.error('Failed to capture chart');
      loading.stop();
      return false;
    }
    
    // Initialize PDF - use larger format to avoid cutting off content
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3' // Larger format than a4
    });
    
    // Set up dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15; // mm
    
    // Set PDF metadata
    doc.setProperties({
      title: `${title} - Linguistic Analysis Report`,
      subject: 'Metrical and Linguistic Analysis',
      author: 'Stanford Linguistics Suite',
      keywords: 'linguistics, metrical, analysis, stress, phonology',
      creator: 'Stanford Linguistics Suite'
    });
    
    // Page dimensions for reference
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Draw header bar
    doc.setFillColor(50, 70, 120); // Professional blue color
    doc.rect(0, 0, pageWidth, 20, 'F');
    
    // Draw footer bar
    doc.setFillColor(50, 70, 120);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    // Add Stanford Linguistics Suite text to header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Stanford Linguistics Suite', margin, 13);
    
    // Add page title to header
    const headerTitleText = title;
    doc.text(headerTitleText, pageWidth/2 - doc.getTextWidth(headerTitleText)/2, 13); // Centered
    
    // Add date to right side of header
    const headerDateText = `Generated: ${new Date().toLocaleString()}`;
    const headerDateWidth = doc.getTextWidth(headerDateText);
    doc.text(headerDateText, pageWidth - margin - headerDateWidth, 13);
    
    // Add footer text
    doc.setFontSize(8);
    doc.text('© Stanford Linguistics Suite | For Academic Research Purposes', margin, pageHeight - 5);
    
    // Reset to black text
    doc.setTextColor(0, 0, 0);
    
    // Add decorative line below header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 25, pageWidth - margin, 25);
    
    // Convert chart canvas to image data with high quality
    const chartImgData = canvas.toDataURL('image/png', 1.0);
    
    // Calculate dimensions for chart
    const chartImgWidth = pageWidth - (margin * 2); // Use full width
    const chartImgHeight = (canvas.height * chartImgWidth) / canvas.width;
    
    // Add chart image centered
    doc.addImage(chartImgData, 'PNG', margin, margin + 18, chartImgWidth, chartImgHeight);
    
    // Save PDF
    doc.save(`linguistic-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    loading.stop();
    return true;
  } catch (error) {
    console.error('Error exporting PDF:', error);
    loading.stop();
    return false;
  }
};

/**
 * Export all pages as a multi-page PDF document with attractive layout
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {number} totalPages - Total number of pages
 * @param {function} setCurrentPage - Function to set the current page
 * @param {string} title - Title of the analysis
 * @param {Object} metadata - Additional metadata
 * @param {Object} colorLegendData - Color legend data if color scheme is selected
 * @returns {Promise<boolean>} Success status
 */
export const exportAllAsPdf = async (
  chartRef,
  totalPages,
  setCurrentPage,
  title = 'Linguistic Analysis',
  metadata = {},
  colorLegendData = null
) => {
  // Create and show loading overlay
  const loading = createLoadingOverlay(ExportTypes.PDF, 'Generating Multi-Page PDF...');
  loading.start();
  
  try {
    // Initialize PDF - use larger format to avoid cutting off content
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3' // Larger format than a4
    });
    
    // Store original page
    const originalPage = metadata.currentPage || 0;
    
    // Set up dimensions
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15; // mm
    
    // Create a professional cover page
    // Set PDF metadata
    doc.setProperties({
      title: `${title} - Linguistic Analysis Report`,
      subject: 'Metrical and Linguistic Analysis',
      author: 'Stanford Linguistics Suite',
      keywords: 'linguistics, metrical, analysis, stress, phonology',
      creator: 'Stanford Linguistics Suite'
    });
    
    // Page dimensions for reference
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Draw header bar
    doc.setFillColor(50, 70, 120); // Professional blue color
    doc.rect(0, 0, pageWidth, 25, 'F');
    
    // Draw footer bar
    doc.setFillColor(50, 70, 120);
    doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
    
    // Add Stanford Linguistics Suite text to header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Stanford Linguistics Suite', margin, 15);
    
    // Add generated date to right side of header
    const dateText = `Generated: ${new Date().toLocaleString()}`;
    const dateTextWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - margin - dateTextWidth, 15);
    
    // Add footer text
    doc.setFontSize(10);
    doc.text('© Stanford Linguistics Suite | For Academic Research Purposes', margin, pageHeight - 5);
    
    // Reset to black text
    doc.setTextColor(0, 0, 0);
    
    // Add decorative line below header
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 35, pageWidth - margin, 35);
    
    // Document title (centered)
    doc.setFontSize(32);
    doc.setFont(undefined, 'bold');
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(title, titleX, 60);
    
    // Subtitle
    doc.setFontSize(20);
    doc.setFont(undefined, 'normal');
    const subtitle = 'Linguistic Analysis Report';
    const subtitleWidth = doc.getTextWidth(subtitle);
    const subtitleX = (pageWidth - subtitleWidth) / 2;
    doc.text(subtitle, subtitleX, 75);
    
    // Add decorative line
    doc.setDrawColor(50, 70, 120);
    doc.setLineWidth(1);
    doc.line(margin + 40, 85, pageWidth - margin - 40, 85);
    
    // Document information section
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Analysis Information', margin, 105);
    
    // Reset font for normal text
    doc.setFont(undefined, 'normal');
    doc.setFontSize(12);
    
    // Draw background for information box
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, 110, pageWidth - (margin * 2), 65, 'F');
    
    // Draw border for information box
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.5);
    doc.rect(margin, 110, pageWidth - (margin * 2), 65, 'S');
    
    // Add information content
    doc.setFontSize(11);
    doc.text(`Total Pages: ${totalPages}`, margin + 5, 120);
    doc.text(`Analysis Timestamp: ${new Date().toLocaleString()}`, margin + 5, 130);
    
    // Methodology section header
    let currentY = 150;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Methodology and Filters', margin + 5, currentY);
    currentY += 10;
    
    // Reset font for normal text
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    
    // Add color scheme information
    doc.text(`Color scheme: ${metadata.colorScheme || 'Default'}`, margin + 5, currentY);
    currentY += 10;
    doc.text('The visualization uses color coding to highlight linguistic properties of the text.', 
      margin + 5, currentY);
    
    // Abstract section
    currentY = 210;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Abstract', margin, currentY);
    currentY += 10;
    
    // Reset font for normal text
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);
    
    // Draw background for abstract box
    doc.setFillColor(245, 245, 250);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 60, 'F');
    
    // Draw border for abstract box
    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.5);
    doc.rect(margin, currentY, pageWidth - (margin * 2), 60, 'S');
    
    currentY += 10;
    
    // Add abstract content
    const abstractText = 
      'This document presents a detailed linguistic analysis focusing on metrical patterns, ' +
      'stress distribution, and part-of-speech characteristics of the analyzed text. ' +
      'The analysis examines prosodic features, lexical stress patterns, and positional metrics ' +
      'to provide insights into the rhythmic and structural properties of the language sample. ' +
      'Each page represents a segment of the analyzed text with corresponding visualizations and statistics.';
    
    // Break abstract into multiple lines
    const abstractLines = doc.splitTextToSize(abstractText, pageWidth - (margin * 2) - 10);
    
    // Add the lines to the document
    abstractLines.forEach(line => {
      doc.text(line, margin + 5, currentY);
      currentY += 6;
    });

    
    // Add attribution at the bottom of the abstract
    currentY += 10;
    doc.setFontSize(9);
    doc.setFont(undefined, 'italic');
    doc.text(`Analysis performed by Stanford Linguistics Suite - Metrical Tree (${new Date().getFullYear()})`, 
      margin + 5, currentY);
    
    // Process each page - starting from 0 for the actual content
    for (let i = 0; i < totalPages; i++) {
      // Update progress indicator
      loading.updateProgress(`Processing page ${i+1} of ${totalPages}...`);
      
      // Add a new page after the cover
      if (i > 0) {
        doc.addPage();
      } else if (totalPages > 1) {
        // Only for multi-page documents, add a page after the cover
        doc.addPage();
      }
      
      // Set the page
      setCurrentPage(i);
      
      // Wait a bit for rendering
      await new Promise(resolve => setTimeout(resolve, 300)); // Longer delay for more reliable rendering
      
      // Add header and footer to match cover page style
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Draw header bar
      doc.setFillColor(50, 70, 120);
      doc.rect(0, 0, pageWidth, 20, 'F');
      
      // Draw footer bar
      doc.setFillColor(50, 70, 120);
      doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      // Add page title to header
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text(`${title} - Page ${i+1} of ${totalPages}`, margin, 13);
      
      // Add date to right side of header
      const headerDateText = `Generated: ${new Date().toLocaleString()}`;
      const headerDateWidth = doc.getTextWidth(headerDateText);
      doc.text(headerDateText, pageWidth - margin - headerDateWidth, 13);
      
      // Add footer text
      doc.setFontSize(8);
      doc.text('© Stanford Linguistics Suite - Metrical Tree | For Academic Research Purposes', margin, pageHeight - 5);
      doc.text(`Page ${i+1} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 5);
      
      // Reset to black text
      doc.setTextColor(0, 0, 0);
      
      // Add decorative line below header
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(margin, 25, pageWidth - margin, 25);
      
      // Capture the chart in high resolution
      const canvas = await captureChartAsCanvas(chartRef, 3); // Use scale factor 3 for high quality
      if (canvas) {
        // Convert canvas to image data with maximum quality
        const imgData = canvas.toDataURL('image/png', 1.0);
        
        // Calculate dimensions for chart
        const chartImgWidth = pageWidth - (margin * 2); // Use full width
        const chartImgHeight = (canvas.height * chartImgWidth) / canvas.width;
        
        // Add chart image centered
        doc.addImage(imgData, 'PNG', margin, margin + 18, chartImgWidth, chartImgHeight);

      }
    }
    
    // Restore original page
    setCurrentPage(originalPage);
    
    // Save PDF
    doc.save(`complete-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    loading.stop();
    return true;
  } catch (error) {
    console.error('Error exporting all pages to PDF:', error);
    loading.stop();
    return false;
  }
};

/**
 * Exports data as CSV
 * @param {Array} data - The data to export
 * @param {string} filename - Optional filename (defaults to data-YYYY-MM-DD.csv)
 * @returns {boolean} Success status
 */
export const exportAsCsv = (data, filename) => {
  if (!data || !data.length) return false;
  
  try {
    // Prepare CSV headers
    const headers = Object.keys(data[0]).join(',');
    
    // Prepare CSV rows
    const rows = data.map(item => {
      return Object.values(item).map(value => {
        // Handle values that might contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    }).join('\n');
    
    // Combine headers and rows
    const csvContent = `${headers}\n${rows}`;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename || `data-${new Date().toISOString().slice(0, 10)}.csv`);
    link.click();
    
    return true;
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return false;
  }
};

/**
 * Exports current visualization state
 * @param {Object} model - The data model
 * @param {Object} metadata - Current display settings (color scheme)
 * @param {number} currentPage - Current page index
 * @param {Object} stats - Current statistics
 * @returns {Object} The exported state
 */
export const exportState = (model, metadata, currentPage, stats) => {
  const state = {
    data: model ? { ...model } : null,
    colorScheme: metadata.colorScheme,
    currentPage,
    stats: { ...stats },
    exportDate: new Date().toISOString()
  };
  
  try {
    // Convert to JSON and create downloadable file
    const jsonContent = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `linguistic-analysis-${new Date().toISOString().slice(0, 10)}.json`);
    link.click();
    
    return true;
  } catch (error) {
    console.error('Error exporting state:', error);
    return false;
  }
};
