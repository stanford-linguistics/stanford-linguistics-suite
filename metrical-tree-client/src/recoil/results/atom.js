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
  const serializedResults = JSON.stringify(results);
  localStorage.setItem(LOCAL_STORAGE_RESULTS_KEY, serializedResults);
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

  const upsertComputeResult = (resultToUpsert) => {
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

  const deleteComputeResult = (resultToDelete) => {
    const results = getFilteredArray(
      computeResultsState.results,
      resultToDelete.id
    );
    setComputeResultsState({ ...computeResultsState, results });
    saveResultsToLocalStorage(results);
  };

  return [
    computeResultsState,
    { upsertComputeResult, deleteComputeResult },
  ];
};

export default computeResultsAtom;
