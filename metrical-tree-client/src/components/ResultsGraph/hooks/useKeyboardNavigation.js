import { useEffect } from 'react';

/**
 * Custom hook for handling keyboard navigation in the ResultsGraph
 * 
 * @param {React.RefObject} ref - Reference to the component container
 * @param {Object} navigationHandlers - Object containing navigation handler functions
 * @param {function} navigationHandlers.goToNextPage - Function to go to next page
 * @param {function} navigationHandlers.goToPrevPage - Function to go to previous page
 * @param {function} navigationHandlers.goToFirstPage - Function to go to first page
 * @param {function} navigationHandlers.goToLastPage - Function to go to last page
 * @param {function} navigationHandlers.changeChunkSize - Function to change chunk size
 * @param {Object} dependencies - Dependencies that should trigger rebuilding the event listeners
 * @returns {void}
 */
export const useKeyboardNavigation = (
  ref,
  {
    goToNextPage,
    goToPrevPage,
    goToFirstPage,
    goToLastPage,
    changeChunkSize,
    toggleFilters
  },
  dependencies = []
) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle keys if component is focused within the container
      if (!ref?.current?.contains(document.activeElement)) return;
      
      switch (e.key) {
        // Basic navigation
        case 'ArrowLeft':
          goToPrevPage?.();
          break;
        case 'ArrowRight':
          goToNextPage?.();
          break;
        case 'Home':
          goToFirstPage?.();
          break;
        case 'End':
          goToLastPage?.();
          break;
          
        // Chunk size shortcuts (Ctrl/Cmd + number)
        case '1':
        case '2':
        case '3':
        case '4':
          if ((e.ctrlKey || e.metaKey) && changeChunkSize) {
            const sizes = [5, 8, 12, 20];
            const sizeIndex = parseInt(e.key, 10) - 1;
            if (sizeIndex >= 0 && sizeIndex < sizes.length) {
              changeChunkSize(sizes[sizeIndex]);
              e.preventDefault();
            }
          }
          break;
          
        // Toggle filters with Space
        case ' ':
          if (e.ctrlKey && toggleFilters) {
            toggleFilters();
            e.preventDefault();
          }
          break;
          
        default:
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, goToNextPage, goToPrevPage, goToFirstPage, goToLastPage, changeChunkSize, toggleFilters, dependencies]);
};

export default useKeyboardNavigation;
