/**
 * Export functionality helpers for the ResultsGraph component
 */
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

/**
 * Exports chart as a high-resolution image
 * @param {React.RefObject} chartRef - Reference to the chart container
 * @param {number} [scaleFactor=3] - Scale factor for higher resolution (3-4x recommended for quality)
 * @returns {Promise<boolean>} Success status
 */
export const exportAsImage = async (chartRef, scaleFactor = 3) => {
  if (!chartRef.current) return false;
  
  try {
    // Use the same high-resolution capture approach as captureChartAsCanvas
    const canvas = await captureChartAsCanvas(chartRef, scaleFactor);
    if (!canvas) {
      console.error('Failed to capture chart');
      return false;
    }
    
    // Convert canvas to data URL and trigger download with high quality
    const dataUrl = canvas.toDataURL('image/png', 1.0); // Use max quality (1.0)
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
    // Try to find the SVG element
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) {
      console.error('SVG element not found');
      return null;
    }
    
    // Clone the SVG to avoid modifying the original
    const svgClone = svgElement.cloneNode(true);
    
    // Add a white background rect to the SVG if not already there
    const hasBackground = svgClone.querySelector('rect.chart-background');
    if (!hasBackground) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      rect.setAttribute('class', 'chart-background');
      // Insert at the beginning so it's behind all other elements
      svgClone.insertBefore(rect, svgClone.firstChild);
    }
    
    // Get SVG dimensions
    const svgRect = svgElement.getBoundingClientRect();
    
    // Create a canvas with higher resolution
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set high-resolution canvas dimensions
    canvas.width = svgRect.width * scaleFactor;
    canvas.height = svgRect.height * scaleFactor;
    
    // Set canvas CSS dimensions to match original SVG (important for proper rendering)
    canvas.style.width = `${svgRect.width}px`;
    canvas.style.height = `${svgRect.height}px`;
    
    // Fill canvas with white background first
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scale the context to handle the higher resolution
    ctx.scale(scaleFactor, scaleFactor);
    
    // Enable high-quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Create an image from the SVG with enhanced attributes
    const svgData = new XMLSerializer().serializeToString(svgClone);
    // Process SVG to ensure it has proper dimensions for quality rendering
    const processedSvgData = svgData.replace(/<svg/, `<svg width="${svgRect.width}" height="${svgRect.height}"`);
    const img = new Image();
    
    // Create a Promise to handle the async image loading
    return new Promise((resolve) => {
      // Set up image load handler
      img.onload = () => {
        // Draw the image to the canvas at original size (ctx is already scaled)
        ctx.drawImage(img, 0, 0, svgRect.width, svgRect.height);
        resolve(canvas);
      };
      
      // Handle errors
      img.onerror = (e) => {
        console.error('Error generating image:', e);
        resolve(null);
      };
      
      // Load the SVG data
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(processedSvgData);
    });
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
};

/**
 * Creates and displays a loading overlay for long operations
 * @param {string} [message='Processing...'] - Message to display in the loading overlay
 * @returns {Object} Loading overlay control object with start and stop methods
 */
export const createLoadingOverlay = (message = 'Processing...') => {
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
      updateProgress: (current, total) => {
        const progressElement = existingOverlay.querySelector('div:last-child');
        if (progressElement) {
          progressElement.innerText = `Page ${current} of ${total}`;
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
    updateProgress: (current, total) => {
      progressElement.innerText = `Page ${current} of ${total}`;
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
 * @returns {Promise<boolean>} Success status
 */
export const exportAllAsImages = async (
  chartRef,
  totalPages,
  setCurrentPage,
  title = 'Linguistic Analysis',
  metadata = {}
) => {
  // Create loading overlay
  const loading = createLoadingOverlay('Exporting images to ZIP file...');
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
      `Filters applied: ${metadata.filters ? JSON.stringify(metadata.filters) : 'None'}\n\n` +
      `These images represent the analysis broken down by chunks of words.`
    );
    
    // Capture each page
    for (let i = 0; i < totalPages; i++) {
      // Update progress indicator
      loading.updateProgress(i + 1, totalPages);
      
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
 * @param {Object} stats - Statistics for the current chart
 * @param {string} title - Title of the chart
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
export const exportAsPdf = async (
  chartRef,
  stats,
  title = 'Linguistic Analysis',
  metadata = {}
) => {
  const loading = createLoadingOverlay('Generating PDF...');
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
    
    // Calculate dimensions for larger chart - using the same side-by-side layout as multi-page export
    const chartImgWidth = (pageWidth - (margin * 2)) * 0.65; // 65% of page width
    const chartImgHeight = (canvas.height * chartImgWidth) / canvas.width;
    
    // Add chart image to left side
    doc.addImage(chartImgData, 'PNG', margin, margin + 18, chartImgWidth, chartImgHeight);
    
    // Add text-based stats on the right side
    const statsX = margin + chartImgWidth + margin;
    let statsY = margin + 18;
    
    doc.setFontSize(12);
    doc.text('Statistical Analysis', statsX, statsY);
    statsY += 7;
    
    doc.setFontSize(10);
    
    // Add average stress metrics
    if (stats && stats.averageStress) {
      doc.text('Stress Metrics:', statsX, statsY);
      statsY += 5;
      
      const stressMetrics = [
        `m1 (position): ${stats.averageStress.m1 || 'N/A'}`,
        `m2a (prosody): ${stats.averageStress.m2a || 'N/A'}`,
        `m2b (lexical): ${stats.averageStress.m2b || 'N/A'}`,
        `mean: ${stats.averageStress.mean || 'N/A'}`
      ];
      
      stressMetrics.forEach(metric => {
        doc.text(metric, statsX + 5, statsY);
        statsY += 5;
      });
    }
    
    // Add POS distribution if available
    if (stats && stats.posDistribution) {
      statsY += 2;
      doc.text('Part of Speech Distribution:', statsX, statsY);
      statsY += 5;
      
      Object.entries(stats.posDistribution)
        .sort((a, b) => b[1].percentage - a[1].percentage)
        .forEach(([pos, data]) => {
          doc.text(`${pos}: ${data.percentage}% (${data.count})`, statsX + 5, statsY);
          statsY += 5;
        });
    }
    
    // Add syllable counts
    if (stats && stats.syllableCounts) {
      statsY += 5;
      doc.text('Syllable Counts:', statsX, statsY);
      statsY += 5;
      
      doc.text(`Monosyllabic: ${stats.syllableCounts['1']}`, statsX + 5, statsY);
      statsY += 5;
      doc.text(`Disyllabic: ${stats.syllableCounts['2']}`, statsX + 5, statsY);
      statsY += 5;
      doc.text(`3+ Syllables: ${stats.syllableCounts['3+']}`, statsX + 5, statsY);
    }
    
    // Add stress distribution
    if (stats && stats.stressDistribution) {
      statsY += 5;
      doc.text('Stress Distribution:', statsX, statsY);
      statsY += 5;
      
      if (stats.stressDistribution.yes) {
        doc.text(`Stressed: ${stats.stressDistribution.yes.percentage}% (${stats.stressDistribution.yes.count})`, 
          statsX + 5, statsY);
        statsY += 5;
      }
      
      if (stats.stressDistribution.no) {
        doc.text(`Unstressed: ${stats.stressDistribution.no.percentage}% (${stats.stressDistribution.no.count})`, 
          statsX + 5, statsY);
        statsY += 5;
      }
      
      if (stats.stressDistribution.ambig) {
        doc.text(`Ambiguous: ${stats.stressDistribution.ambig.percentage}% (${stats.stressDistribution.ambig.count})`, 
          statsX + 5, statsY);
      }
    }
    
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
 * @param {function} calculateStats - Function to calculate stats for current page
 * @param {string} title - Title of the analysis
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} Success status
 */
export const exportAllAsPdf = async (
  chartRef,
  totalPages,
  setCurrentPage,
  calculateStats,
  title = 'Linguistic Analysis',
  metadata = {}
) => {
  // Create and show loading overlay
  const loading = createLoadingOverlay('Generating Multi-Page PDF...');
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
    
    // Add methodology description
    if (metadata.filters && (
      (metadata.filters.posFilter && metadata.filters.posFilter !== 'all') ||
      (metadata.filters.stressFilter && metadata.filters.stressFilter !== 'all') ||
      (metadata.filters.syllableFilter && metadata.filters.syllableFilter !== 'all')
    )) {
      doc.text('This analysis was performed with the following filters:', margin + 5, currentY);
      currentY += 10;
      
      if (metadata.filters.posFilter && metadata.filters.posFilter !== 'all') {
        doc.text(`• Part of Speech: ${metadata.filters.posFilter}`, margin + 10, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.text('Part of Speech filtering focuses the analysis on specific grammatical categories.', 
          margin + 15, currentY);
        currentY += 10;
        doc.setFontSize(11);
      }
      
      if (metadata.filters.stressFilter && metadata.filters.stressFilter !== 'all') {
        doc.text(`• Stress: ${metadata.filters.stressFilter}`, margin + 10, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.text('Stress filtering allows analysis of syllabic emphasis patterns in the text.', 
          margin + 15, currentY);
        currentY += 10;
        doc.setFontSize(11);
      }
      
      if (metadata.filters.syllableFilter && metadata.filters.syllableFilter !== 'all') {
        doc.text(`• Syllable Count: ${metadata.filters.syllableFilter}`, margin + 10, currentY);
        currentY += 6;
        doc.setFontSize(9);
        doc.text('Syllable filtering focuses the analysis on words with specific syllable counts.', 
          margin + 15, currentY);
        currentY += 10;
        doc.setFontSize(11);
      }
    } else {
      doc.text('This analysis was performed on the complete dataset with no filters applied.', margin + 5, currentY);
      currentY += 10;
      doc.text('The results represent the full linguistic properties of the text without selective filtering.', 
        margin + 5, currentY);
    }
    
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
      loading.updateProgress(i + 1, totalPages);
      
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
      
      // Get stats if the function is available
      let pageStats = null;
      if (typeof calculateStats === 'function') {
        pageStats = calculateStats();
      }
      
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
        
        // Calculate dimensions for larger chart
        const chartImgWidth = (pageWidth - (margin * 2)) * 0.65; // 65% of page width
        const chartImgHeight = (canvas.height * chartImgWidth) / canvas.width;
        
        // Add chart image to left side
        doc.addImage(imgData, 'PNG', margin, margin + 18, chartImgWidth, chartImgHeight);
        
        // Add text-based stats on the right side for better appearance
        if (pageStats) {
          const statsX = margin + chartImgWidth + margin;
          let statsY = margin + 18;
          
          doc.setFontSize(12);
          doc.text('Statistical Analysis', statsX, statsY);
          statsY += 7;
          
          doc.setFontSize(10);
          
          // Add average stress metrics
          if (pageStats.averageStress) {
            doc.text('Stress Metrics:', statsX, statsY);
            statsY += 5;
            
            const stressMetrics = [
              `m1 (position): ${pageStats.averageStress.m1 || 'N/A'}`,
              `m2a (prosody): ${pageStats.averageStress.m2a || 'N/A'}`,
              `m2b (lexical): ${pageStats.averageStress.m2b || 'N/A'}`,
              `mean: ${pageStats.averageStress.mean || 'N/A'}`
            ];
            
            stressMetrics.forEach(metric => {
              doc.text(metric, statsX + 5, statsY);
              statsY += 5;
            });
          }
          
          // Add POS distribution
          if (pageStats.posDistribution && Object.keys(pageStats.posDistribution).length > 0) {
            statsY += 5;
            doc.text('Part of Speech Distribution:', statsX, statsY);
            statsY += 5;
            
            Object.entries(pageStats.posDistribution)
              .sort((a, b) => b[1].percentage - a[1].percentage)
              .forEach(([pos, data]) => {
                doc.text(`${pos}: ${data.percentage}% (${data.count})`, statsX + 5, statsY);
                statsY += 5;
              });
          }
          
          // Add syllable counts
          if (pageStats.syllableCounts) {
            statsY += 5;
            doc.text('Syllable Counts:', statsX, statsY);
            statsY += 5;
            
            doc.text(`Monosyllabic: ${pageStats.syllableCounts['1']}`, statsX + 5, statsY);
            statsY += 5;
            doc.text(`Disyllabic: ${pageStats.syllableCounts['2']}`, statsX + 5, statsY);
            statsY += 5;
            doc.text(`3+ Syllables: ${pageStats.syllableCounts['3+']}`, statsX + 5, statsY);
          }
          
          // Add stress distribution
          if (pageStats.stressDistribution && Object.keys(pageStats.stressDistribution).length > 0) {
            statsY += 5;
            doc.text('Stress Distribution:', statsX, statsY);
            statsY += 5;
            
            if (pageStats.stressDistribution.yes) {
              doc.text(`Stressed: ${pageStats.stressDistribution.yes.percentage}% (${pageStats.stressDistribution.yes.count})`, 
                statsX + 5, statsY);
              statsY += 5;
            }
            
            if (pageStats.stressDistribution.no) {
              doc.text(`Unstressed: ${pageStats.stressDistribution.no.percentage}% (${pageStats.stressDistribution.no.count})`, 
                statsX + 5, statsY);
              statsY += 5;
            }
            
            if (pageStats.stressDistribution.ambig) {
              doc.text(`Ambiguous: ${pageStats.stressDistribution.ambig.percentage}% (${pageStats.stressDistribution.ambig.count})`, 
                statsX + 5, statsY);
            }
          }
        }
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
 * @param {Object} filters - Current filter settings
 * @param {number} currentPage - Current page index
 * @param {Object} stats - Current statistics
 * @returns {Object} The exported state
 */
export const exportState = (model, filters, currentPage, stats) => {
  const state = {
    data: model ? { ...model } : null,
    filters: { ...filters },
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
