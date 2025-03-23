import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook for handling pagination with chunk size selection
 * 
 * @param {Array} data - The data array to paginate
 * @param {number} initialChunkSize - Initial chunk size
 * @returns {Object} Pagination methods and state
 */
export const usePagination = (data, initialChunkSize = 8) => {
  // States for pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [chunkSize, setChunkSize] = useState(initialChunkSize);
  const [jumpToPageValue, setJumpToPageValue] = useState('');
  
  // Calculate if we need chunking based on data length
  const needsChunking = useMemo(() => {
    return data.length > initialChunkSize;
  }, [data, initialChunkSize]);
  
  // Calculate total number of pages
  const totalPages = useMemo(() => {
    return Math.ceil(data.length / chunkSize) || 1;
  }, [data.length, chunkSize]);
  
  // Get current chunk of data
  const currentChunkData = useMemo(() => {
    if (!needsChunking) {
      return data;
    }
    
    const start = currentPage * chunkSize;
    const end = Math.min((currentPage + 1) * chunkSize, data.length);
    
    return data.slice(start, end);
  }, [data, currentPage, chunkSize, needsChunking]);
  
  // Reset to first page when data changes
  const resetPagination = useCallback(() => {
    setCurrentPage(0);
  }, []);
  
  // Navigation functions
  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  }, [totalPages]);
  
  const goToPrevPage = useCallback(() => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  }, []);
  
  const goToFirstPage = useCallback(() => {
    setCurrentPage(0);
  }, []);
  
  const goToLastPage = useCallback(() => {
    setCurrentPage(totalPages - 1);
  }, [totalPages]);
  
  // Change chunk size
  const changeChunkSize = useCallback((newSize) => {
    const currentFirstWordIndex = currentPage * chunkSize;
    setChunkSize(newSize);
    // Preserve position when changing chunk size
    setCurrentPage(Math.floor(currentFirstWordIndex / newSize));
  }, [currentPage, chunkSize]);
  
  // Jump to specific page
  const handleJumpToPageChange = useCallback((e) => {
    setJumpToPageValue(e.target.value);
  }, []);
  
  const handleJumpToPage = useCallback(() => {
    const pageNum = parseInt(jumpToPageValue, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum - 1); // Convert to 0-based index
      setJumpToPageValue('');
    }
  }, [jumpToPageValue, totalPages]);
  
  const handleJumpToPageKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  }, [handleJumpToPage]);
  
  return {
    // State
    currentPage,
    chunkSize,
    jumpToPageValue,
    needsChunking,
    totalPages,
    currentChunkData,
    
    // Actions
    setCurrentPage,
    resetPagination,
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changeChunkSize,
    handleJumpToPageChange,
    handleJumpToPage,
    handleJumpToPageKeyPress
  };
};

export default usePagination;
