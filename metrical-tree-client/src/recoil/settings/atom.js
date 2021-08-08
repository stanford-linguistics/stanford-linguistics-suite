import { atom, useRecoilState } from 'recoil';
import { DEFAULT_SETTINGS_CONFIG } from 'constants/settings';
const LOCAL_STORAGE_SETTINGS_KEY = 'metrical-tree-settings';

const getStoredSettingsState = () => {
  const unserializedSettings = localStorage.getItem(
    LOCAL_STORAGE_SETTINGS_KEY
  );
  if (unserializedSettings) {
    return JSON.parse(unserializedSettings);
  } else {
    return null;
  }
};

const saveSettingsToLocalStorage = (results) => {
  const serializedSettings = JSON.stringify(results);
  localStorage.setItem(
    LOCAL_STORAGE_SETTINGS_KEY,
    serializedSettings
  );
};

const defaultState = {
  shouldDeleteExpiredResults: false,
  unstressedWords: DEFAULT_SETTINGS_CONFIG.unstressedWords,
  unstressedTags: DEFAULT_SETTINGS_CONFIG.unstressedTags,
  unstressedDeps: DEFAULT_SETTINGS_CONFIG.unstressedDeps,
  ambiguousWords: DEFAULT_SETTINGS_CONFIG.ambiguousWords,
  ambiguousTags: DEFAULT_SETTINGS_CONFIG.ambiguousTags,
  ambiguousDeps: DEFAULT_SETTINGS_CONFIG.ambiguousDeps,
  stressedWords: DEFAULT_SETTINGS_CONFIG.stressedWords,
};

const settingsAtom = atom({
  key: 'computeSettings',
  default: getStoredSettingsState() ?? defaultState,
});

export const useSettings = () => {
  const [settings, setSettings] = useRecoilState(settingsAtom);

  const handleSettingsChange = (newState) => {
    const newSettings = {
      ...settings,
      ...newState,
    };
    setSettings(newSettings);
    saveSettingsToLocalStorage(newSettings);
  };

  return [settings, { handleSettingsChange }];
};

export default settingsAtom;
