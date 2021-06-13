import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';

// constants
export const SET_DELETE_EXPIRED_TORDERS = 'settings/SET_DELETE_EXPIRED_TORDERS';
export const SET_PREFERRED_TORDER_CONFIG =
  'settings/SET_PREFERRED_TORDER_CONFIG';
export const RESET_PREFERRED_TORDER_CONFIG =
  'settings/RESET_PREFERRED_TORDER_CONFIG';

const DEFAULT_COMPUTE_SETTINGS = {
  optimizationMethod: 'simplex',
  boundOnNumberOfCandidates: 10,
  hgFeasibleMappingsOnly: false,
  includeArrows: false,
  numTrials: 1000,
  weightBound: 20
};

const persistConfig = {
  key: 'settings',
  storage: storage,
  whitelist: ['deleteExpiredTorders', 'preferredComputeSettings']
};

const initialState = {
  deleteExpiredTorders: false,
  preferredComputeSettings: DEFAULT_COMPUTE_SETTINGS,
  defaultComputeSettings: DEFAULT_COMPUTE_SETTINGS
};

// reducer
const SettingsReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_DELETE_EXPIRED_TORDERS:
      return {
        ...state,
        deleteExpiredTorders: action.payload
      };
    case SET_PREFERRED_TORDER_CONFIG:
      return {
        ...state,
        preferredComputeSettings: {
          ...state.preferredComputeSettings,
          optimizationMethod: action.payload.optimizationMethod,
          boundOnNumberOfCandidates: action.payload.boundOnNumberOfCandidates,
          hgFeasibleMappingsOnly: action.payload.hgFeasibleMappingsOnly,
          includeArrows: action.payload.includeArrows,
          numTrials: action.payload.numTrials,
          weightBound: action.payload.weightBound
        }
      };
    case RESET_PREFERRED_TORDER_CONFIG:
      return {
        ...state,
        preferredComputeSettings: {
          ...state.preferredComputeSettings,
          optimizationMethod: DEFAULT_COMPUTE_SETTINGS.optimizationMethod,
          boundOnNumberOfCandidates:
            DEFAULT_COMPUTE_SETTINGS.boundOnNumberOfCandidates,
          hgFeasibleMappingsOnly:
            DEFAULT_COMPUTE_SETTINGS.hgFeasibleMappingsOnly,
          includeArrows: DEFAULT_COMPUTE_SETTINGS.includeArrows,
          numTrials: DEFAULT_COMPUTE_SETTINGS.numTrials,
          weightBound: DEFAULT_COMPUTE_SETTINGS.weightBound
        }
      };

    default:
      return state;
  }
};

export default persistReducer(persistConfig, SettingsReducer);

// actions
export const setDeleteExpiredTorders = shouldDelete => {
  return dispatch => {
    dispatch({
      type: SET_DELETE_EXPIRED_TORDERS,
      payload: shouldDelete
    });
  };
};

export const setPreferredTorderConfig = preferredConfig => {
  return dispatch => {
    dispatch({
      type: SET_PREFERRED_TORDER_CONFIG,
      payload: preferredConfig
    });
  };
};

export const resetPreferredTorderConfig = () => {
  return dispatch => {
    dispatch({
      type: RESET_PREFERRED_TORDER_CONFIG
    });
  };
};
