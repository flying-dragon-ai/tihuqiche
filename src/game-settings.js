import { reactive, ref } from 'vue';

export const SOUND_STYLES = Object.freeze(['classic', 'arcade', 'bell', 'soft']);
export const DEFAULT_GAME_SETTINGS = Object.freeze({
  soundEnabled: true,
  soundStyle: 'classic',
  volume: 0.65,
  assistMarkers: true,
  speedLines: true,
  ambientLife: true,
  shadows: true,
});
const STORAGE_KEY = 'pelican-game-settings-v1';
const SETTING_KEYS = Object.keys(DEFAULT_GAME_SETTINGS);

function validateSettingValue(key, value) {
  if (key === 'soundStyle') return SOUND_STYLES.includes(value);
  if (key === 'volume') return Number.isFinite(value) && value >= 0 && value <= 1;
  return typeof value === 'boolean';
}

export function validateGameSettings(value) {
  const validShape =
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === SETTING_KEYS.length &&
    SETTING_KEYS.every((key) => Object.hasOwn(value, key));
  if (!validShape) throw new TypeError('Invalid game settings');
  for (const key of SETTING_KEYS) {
    if (!validateSettingValue(key, value[key]))
      throw new RangeError(`Invalid game setting: ${key}`);
  }
  return { ...value };
}

function readStoredSettings() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  const record = JSON.parse(raw);
  const validRecord =
    record?.version === 1 && Object.keys(record).length === 2 && Object.hasOwn(record, 'settings');
  if (!validRecord) throw new Error('Invalid game settings version');
  return validateGameSettings(record.settings);
}

function writeStoredSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, settings }));
}

export function createGameSettings(notify) {
  const settings = reactive({ ...DEFAULT_GAME_SETTINGS });
  const error = ref(null);

  function report(code, cause) {
    error.value = code;
    console.warn('Could not persist game settings', cause);
    notify(code);
    return false;
  }

  function init() {
    try {
      const stored = readStoredSettings();
      if (stored) Object.assign(settings, stored);
      error.value = null;
      return true;
    } catch (cause) {
      return report('settingsReadError', cause);
    }
  }

  function setSetting(key, value) {
    if (!SETTING_KEYS.includes(key)) throw new RangeError(`Unknown game setting: ${key}`);
    const next = validateGameSettings({ ...settings, [key]: value });
    Object.assign(settings, next);
    try {
      writeStoredSettings(next);
      error.value = null;
      return true;
    } catch (cause) {
      return report('settingsSaveError', cause);
    }
  }

  return { settings, error, init, setSetting };
}
