import storage from 'redux-persist/lib/storage';
import { persistReducer } from 'redux-persist';

// constants
export const REQUEST_UPLOAD_TORDER_PENDING = 'REQUEST_UPLOAD_PENDING';
export const REQUEST_UPLOAD_SUCCESS = 'REQUEST_UPLOAD_SUCCESS';
export const REQUEST_TORDER_SUCCESS = 'REQUEST_TORDER_SUCCESS';
export const REQUEST_UPLOAD_TORDER_FAILED = 'REQUEST_UPLOAD_TORDER_FAILED';

export const REQUEST_RESULT_PENDING = 'REQUEST_RESULT_PENDING';
export const REQUEST_RESULT_SUCCESS = 'REQUEST_RESULT_SUCCESS';
export const REQUEST_RESULT_FAILED = 'REQUEST_RESULT_FAILED';

export const DELETE_TORDER = 'DELETE TORDER';

const UPLOAD_ROUTE = process.env.REACT_APP_TORDERS_API_URL + '/uploads';
const TORDER_ROUTE = process.env.REACT_APP_TORDERS_API_URL + '/torders';
const RESULT_ROUTE = process.env.REACT_APP_TORDERS_API_URL + '/results';

const persistConfig = {
  key: 'torders',
  storage: storage,
  whitelist: ['torders']
};

const initialState = {
  isPending: false,
  error: '',
  fileId: '',
  torder: {},
  torders: []
};

// reducer
const TordersReducer = (state = initialState, action) => {
  switch (action.type) {
    case REQUEST_UPLOAD_TORDER_PENDING:
      return Object.assign({}, state, { isPending: true });
    case REQUEST_UPLOAD_SUCCESS:
      return Object.assign({}, state, {
        fileId: action.payload.id
      });
    case REQUEST_TORDER_SUCCESS:
      return {
        ...state,
        torder: {
          ...state.torder,
          id: action.payload.id,
          status: (action.payload.status && action.payload.status.toUpperCase()) || action.payload.status,
          link: action.payload.link,
          errorMessage: action.payload.errorMessage,
          images: action.payload.images
        },
        torders: [...state.torders, 
          {
            ...action.payload,
            status: (action.payload.status && action.payload.status.toUpperCase()) || action.payload.status
          }
        ],
        isPending: false
      };
    case REQUEST_UPLOAD_TORDER_FAILED:
      return Object.assign({}, state, {
        error: action.payload,
        isPending: false
      });
    case REQUEST_RESULT_PENDING:
      return Object.assign({}, state, { isPending: true });
    case REQUEST_RESULT_SUCCESS:
      return {
        ...state,
        torders: state.torders.map(torder =>
          torder.id === action.payload.id
            ? {
                ...torder,
                status: (action.payload.status && action.payload.status.toUpperCase()) || action.payload.status,
                link: action.payload.link,
                errorMessage: action.payload.errorMessage,
                expiresOn: action.payload.expiresOn,
                expiresIn: action.payload.expiresIn,
                images: action.payload.images
              }
            : torder
        )
      };
    case DELETE_TORDER:
      return {
        ...state,
        torders: state.torders.filter(torder => torder.id !== action.payload)
      };
    case REQUEST_RESULT_FAILED:
      return Object.assign({}, state, {
        error: action.payload,
        isPending: false
      });

    default:
      return state;
  }
};

export default persistReducer(persistConfig, TordersReducer);

// actions
export const computeTorder = (file, configOptions) => dispatch => {
  dispatch({ type: REQUEST_UPLOAD_TORDER_PENDING });
  var data = new FormData();
  data.append('file', file);
  var options = {
    method: 'POST',
    body: data
  };
  fetch(UPLOAD_ROUTE, options)
    .then(response => response.json())
    .then(data => {
      dispatch({ type: REQUEST_UPLOAD_SUCCESS, payload: data });
      return requestTorder(data.id, configOptions);
    })
    .then(response => response.json())
    .then(data => dispatch({ type: REQUEST_TORDER_SUCCESS, payload: data }))
    .catch(error =>
      dispatch({ type: REQUEST_UPLOAD_TORDER_FAILED, payload: error })
    );
};

function requestTorder(fileId, torderOptions) {
  var options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(torderOptions)
  };
  var url = TORDER_ROUTE + '/' + fileId;
  return fetch(url, options);
}

export const updateTorder = fileId => dispatch => {
  dispatch({ type: REQUEST_RESULT_PENDING });
  fetch(RESULT_ROUTE + '/' + fileId)
    .then(response => response.json())
    .then(data => dispatch({ type: REQUEST_RESULT_SUCCESS, payload: data }))
    .catch(error => dispatch({ type: REQUEST_RESULT_FAILED, payload: error }));
};

export const deleteTorder = torderId => {
  return dispatch => {
    dispatch({
      type: DELETE_TORDER,
      payload: torderId
    });
  };
};
