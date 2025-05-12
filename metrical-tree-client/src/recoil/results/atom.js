import { atom, useRecoilState } from 'recoil';

const LOCAL_STORAGE_RESULTS_KEY = 'metrical-tree-results';

const getStoredResults = () => {
  const unserializedFilters = localStorage.getItem(
    LOCAL_STORAGE_RESULTS_KEY
  );
  if (unserializedFilters) {
    return JSON.parse(unserializedFilters);
  } else {
    return null;
  }
};

const saveResultsToLocalStorage = (results) => {
  try {
    // First try to save the full results
    const serializedResults = JSON.stringify(results);
    
    // Check if the size is approaching localStorage limits (typically 5-10MB)
    // Using 2MB as a conservative threshold to prevent browser performance issues
    const SIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB in bytes
    
    // Also consider row count as an indicator of large results
    const ROW_COUNT_THRESHOLD = 5000; // Number of rows that would cause rendering issues
    
    // Check if ANY result in the array is too large (either by size or row count)
    const hasLargeResults = serializedResults.length > SIZE_THRESHOLD || 
                           results.some(result => {
                             // Check data array length if it exists
                             if (result.data && Array.isArray(result.data)) {
                               return result.data.length > ROW_COUNT_THRESHOLD;
                             }
                             // If data is not an array but status is success, assume it's a large result
                             // This handles cases where the backend marked it as success but data isn't loaded yet
                             return result.status === 'success' && !result.data;
                           });
    
    if (hasLargeResults) {
      console.warn('Results too large for localStorage or display, saving metadata only');
      
      // Create lite versions of the results without the large data arrays
      const liteResults = results.map(result => {
        // Keep all metadata but replace data with a flag
        const { data, ...metadata } = result;
        // Mark as large if this specific result's data exceeds the row threshold
        const isLarge = !data ? false : (data.length > ROW_COUNT_THRESHOLD);
        return {
          ...metadata,
          isLargeResult: isLarge,
          dataSize: data ? data.length : 0
        };
      });
      
      localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(liteResults));
    } else {
      // Results are small enough to store completely
      localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, serializedResults);
    }
  } catch (error) {
    console.error('Failed to save results to localStorage:', error);
    
    // If we get a quota error, try saving minimal data
    if (error.name === 'QuotaExceededError') {
      try {
        const minimalResults = results.map(result => {
          const { data, ...metadata } = result;
          return {
            ...metadata,
            isLargeResult: true,
            dataSize: data ? data.length : 0
          };
        });
        localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, JSON.stringify(minimalResults));
      } catch (fallbackError) {
        console.error('Failed to save minimal results to localStorage:', fallbackError);
      }
    }
  }
};

const defaultState = {
  results: getStoredResults() ?? [],
};

const computeResultsAtom = atom({
  key: 'computeResults',
  default: defaultState,
});

const getFilteredArray = (arr, id) => {
  return arr.filter((result) => result.id !== id);
};

export const useComputeResults = () => {
  const [computeResultsState, setComputeResultsState] =
    useRecoilState(computeResultsAtom);

  const addComputeResult = (resultToUpsert) => {
    const results = [
      ...getFilteredArray(
        computeResultsState.results,
        resultToUpsert.id
      ),
      resultToUpsert,
    ];
    setComputeResultsState({ ...computeResultsState, results });
    saveResultsToLocalStorage(results);
  };

  const deleteComputeResult = (resultIdToDelete) => {
    const results = getFilteredArray(
      computeResultsState.results,
      resultIdToDelete
    );
    setComputeResultsState({ ...computeResultsState, results });
    saveResultsToLocalStorage(results);
  };

  const updateComputeResult = (resultToUpdate) => {
    const results = computeResultsState.results.map((result) => {
      if (result.id === resultToUpdate.id) {
        return {
          ...result,
          ...resultToUpdate,
        };
      } else {
        return result;
      }
    });

    setComputeResultsState({ ...computeResultsState, results });
    saveResultsToLocalStorage(results);
  };

  return [
    computeResultsState,
    { addComputeResult, deleteComputeResult, updateComputeResult },
  ];
};

export default computeResultsAtom;
