import { useState, useCallback, useMemo } from 'react';
import { VERY_LONG_INPUT_THRESHOLD } from '../../../../../components/ResultsGraph/constants/chartConfig';

/**
 * Custom hook that combines pagination with virtualization for efficiently
 * handling extremely large datasets in the results table
 * 
 * @param {Array} data - The data array to paginate and virtualize
 * @param {number} initialChunkSize - Initial number of items per page
 * @param {number} rowsToRender - Maximum number of rows to render at once (virtualization window)
 * @returns {Object} Hybrid pagination methods and state
 */
export const useHybridPagination = (data, initialChunkSize = 50, rowsToRender = 20) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const [jumpToPageValue, setJumpToPageValue] = useState('');
  
  // Virtualization state
  const [scrollIndex, setScrollIndex] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const [rowHeight, setRowHeight] = useState(48); // Default height of each row in pixels
  
  // Calculate if the dataset is very large
  const isVeryLongInput = useMemo(() => {
    return data.length > VERY_LONG_INPUT_THRESHOLD;
  }, [data.length]);
  
  // Calculate total number of pages
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / chunkSize) || 1;
  }, [data.length, chunkSize]);
  
  // Get current chunk of data (pagination)
  const currentPageData = useMemo(() => {
    const start = currentPage * chunkSize;
    const end = Math.min((currentPage + 1) * chunkSize, data.length);
    return data.slice(start, end);
  }, [data, currentPage, chunkSize]);
  
  // Calculate total height of all rows for the current page
  const totalHeight = useMemo(() => {
    return currentPageData.length * rowHeight;
  }, [currentPageData.length, rowHeight]);
  
  // Get visible rows (virtualization)
  const visibleRows = useMemo(() => {
    const start = Math.max(0, scrollIndex);
    const end = Math.min(start + rowsToRender, currentPageData.length);
    return currentPageData.slice(start, end);
  }, [currentPageData, scrollIndex, rowsToRender]);
  
  // Reset pagination when data changes
  const resetPagination = useCallback(() => {
    setCurrentPage(0);
    setScrollIndex(0);
  }, []);
  
  // Navigation functions
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
    setScrollIndex(0); // Reset scroll position when changing pages
  }, [totalPages]);
  
  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
    setScrollIndex(0); // Reset scroll position when changing pages
  }, []);
  
  const goToFirstPage = useCallback(() => {
    setCurrentPage(0);
    setScrollIndex(0);
  }, []);
  
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages - 1);
    setScrollIndex(0);
  }, [totalPages]);
  
  // Change chunk size (items per page)
  const changeChunkSize = useCallback((newSize) => {
    const currentFirstItemIndex = currentPage * chunkSize;
    setChunkSize(newSize);
    // Preserve position when changing chunk size
    setCurrentPage(Math.floor(currentFirstItemIndex / newSize));
    setScrollIndex(0);
  }, [currentPage, chunkSize]);
  
  // Jump to specific page
  const handleJumpToPageChange = useCallback((e) => {
    setJumpToPageValue(e.target.value);
  }, []);
  
  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpToPageValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum - 1); // Convert to 0-based index
      setScrollIndex(0);
      setJumpToPageValue('');
    }
  }, [jumpToPageValue, totalPages]);
  
  const handleJumpToPageKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  }, [handleJumpToPage]);
  
  // Handle virtualization scroll
  const handleScroll = useCallback((event) => {
    const { scrollTop } = event.target;
    const newScrollIndex = Math.floor(scrollTop / rowHeight);
    setScrollIndex(newScrollIndex);
  }, [rowHeight]);
  
  // Update container height
  const setTableContainerHeight = useCallback((height) => {
    setContainerHeight(height);
  }, []);
  
  return {
    // Pagination state
    currentPage,
    chunkSize,
    totalPages,
    jumpToPageValue,
    isVeryLongInput,
    
    // Pagination actions
    setCurrentPage,
    resetPagination,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changeChunkSize,
    handleJumpToPageChange,
    handleJumpToPage,
    handleJumpToPageKeyPress,
    
    // Virtualization state
    scrollIndex,
    containerHeight,
    rowHeight,
    totalHeight,
    
    // Virtualization actions
    handleScroll,
    setTableContainerHeight,
    setRowHeight,
    
    // Data access
    currentPageData,
    visibleRows,
    totalItems: data.length,
    
    // Combined data for rendering
    virtualizedData: {
      items: visibleRows,
      startIndex: scrollIndex,
      totalHeight,
      containerHeight,
      rowHeight
    }
  };
};

export default useHybridPagination;
