import { combineReducers } from 'redux';
import settings from './settings';
import torders from './dataService/torders';

export default combineReducers({ settings, torders });
