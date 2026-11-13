import { LEVELS } from './levels.js';
import { defaultRiderConfig, validateRiderConfig } from './appearance.js';

const SAVE_KEY = 'pelican-pedal-run-v3';
const APPEARANCE_KEY = 'pelican-pedal-appearance-v1';
const LEGACY_LEVEL_COUNT = 6;
const SAVE_VERSIONS = Object.freeze([3, 2, 1]);
const GAME_MODES = Object.freeze(['campaign', 'endless', 'duo', 'items']);
const OUTCOMES = Object.freeze(['won', 'lost', 'ended']);

const campaignRecord = () => ({
  unlocked: 1,
  best: LEVELS.map(() => 0),
  stars: LEVELS.map(() => 0),
});

const natural = (value) => Number.isSafeInteger(value) && value >= 0;
const starCount = (value) => Number.isInteger(value) && value >= 0 && value <= 3;

export const emptySave = () => ({
  version: 3,
  records: {
    campaign: campaignRecord(),
    duo: campaignRecord(),
    items: campaignRecord(),
    endless: { bestScore: 0 },
  },
});

function validateRecord(value, count = LEVELS.length) {
  const validShape =
    value &&
    Number.isInteger(value.unlocked) &&
    value.unlocked >= 1 &&
    value.unlocked <= count &&
    Array.isArray(value.best) &&
    value.best.length === count &&
    Array.from(value.best).every(natural) &&
    Array.isArray(value.stars) &&
    value.stars.length === count &&
    Array.from(value.stars).every(starCount);
  if (!validShape) throw new Error('Invalid cycling progress record');
  return { unlocked: value.unlocked, best: [...value.best], stars: [...value.stars] };
}

function validateSave(value) {
  if (value?.version !== 3 || !natural(value.records?.endless?.bestScore)) {
    throw new Error('Invalid cycling v3 save');
  }
  const count = value.records.campaign?.best?.length;
  if (count !== LEGACY_LEVEL_COUNT && count !== LEVELS.length) {
    throw new Error('Invalid cycling v3 level count');
  }
  return {
    version: 3,
    records: {
      campaign: expandRecord(value.records.campaign, count),
      duo: expandRecord(value.records.duo, count),
      items: expandRecord(value.records.items, count),
      endless: { bestScore: value.records.endless.bestScore },
    },
  };
}

function expandRecord(value, count) {
  const record = validateRecord(value, count);
  if (count === LEVELS.length) return record;
  // Historical saves describe only their original levels; append new progress explicitly.
  const padding = Array(LEVELS.length - count).fill(0);
  return {
    unlocked:
      record.unlocked === count && record.stars[count - 1] > 0 ? count + 1 : record.unlocked,
    best: [...record.best, ...padding],
    stars: [...record.stars, ...padding],
  };
}

export function parseSave(raw, version = 3) {
  const value = JSON.parse(raw);
  if (version === 3) return validateSave(value);
  if (version !== 1 && version !== 2) throw new Error('Unsupported cycling save version');
  const count = version === 1 ? 3 : LEGACY_LEVEL_COUNT;
  const save = emptySave();
  save.records.campaign = expandRecord(value, count);
  return save;
}

function report(notify, code, error) {
  console.warn(`Cycling storage: ${code}`, error);
  notify(code);
}

function readRaw(key) {
  try {
    return { raw: localStorage.getItem(key), error: null };
  } catch (error) {
    return { raw: null, error };
  }
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return null;
  } catch (error) {
    return error;
  }
}

export function readSave(notify) {
  for (const version of SAVE_VERSIONS) {
    const { raw, error } = readRaw(`pelican-pedal-run-v${version}`);
    if (error) {
      report(notify, 'readError', error);
      return { save: emptySave(), writable: false, error: 'unavailable' };
    }
    if (raw === null) continue;
    try {
      return { save: parseSave(raw, version), writable: true, error: null };
    } catch (cause) {
      report(notify, 'readError', cause);
      return { save: emptySave(), writable: false, error: 'corrupt' };
    }
  }
  return { save: emptySave(), writable: true, error: null };
}

export function writeSave(save, notify) {
  try {
    const error = writeRaw(SAVE_KEY, JSON.stringify(validateSave(save)));
    if (!error) return true;
    report(notify, 'writeError', error);
  } catch (error) {
    report(notify, 'writeError', error);
  }
  return false;
}

function validateResult(result) {
  const validBase =
    result &&
    GAME_MODES.includes(result.gameMode) &&
    natural(result.score) &&
    OUTCOMES.includes(result.outcome);
  if (!validBase) throw new Error('Invalid cycling result');
  if (result.gameMode === 'endless') {
    if (result.levelIndex !== null || result.stars !== null || result.outcome === 'won') {
      throw new Error('Invalid endless result');
    }
    return;
  }
  const validCampaign =
    Number.isInteger(result.levelIndex) &&
    result.levelIndex >= 0 &&
    result.levelIndex < LEVELS.length &&
    Number.isInteger(result.stars) &&
    result.stars >= 0 &&
    result.stars <= 3 &&
    result.outcome !== 'ended' &&
    (result.outcome === 'won' ? result.stars >= 1 : result.stars === 0);
  if (!validCampaign) throw new Error('Invalid campaign result');
}

export function updateProgress(save, result) {
  validateResult(result);
  const next = validateSave(save);
  const record = next.records[result.gameMode];
  if (result.gameMode === 'endless') {
    record.bestScore = Math.max(record.bestScore, result.score);
    return next;
  }
  const index = result.levelIndex;
  if (index >= record.unlocked) throw new Error('Cannot record a locked cycling level');
  record.best[index] = Math.max(record.best[index], result.score);
  if (result.outcome === 'won') {
    record.stars[index] = Math.max(record.stars[index], result.stars);
    record.unlocked = Math.max(record.unlocked, Math.min(LEVELS.length, index + 2));
  }
  return next;
}

export const emptyAppearance = () => ({
  version: 1,
  players: [defaultRiderConfig(0), defaultRiderConfig(1)],
});

function validateAppearance(value) {
  if (value?.version !== 1 || !Array.isArray(value.players) || value.players.length !== 2) {
    throw new Error('Invalid cycling appearance save');
  }
  return {
    version: 1,
    players: Array.from(value.players, (config) => validateRiderConfig(config)),
  };
}

export function readAppearance(notify) {
  const { raw, error } = readRaw(APPEARANCE_KEY);
  if (error) {
    report(notify, 'appearanceReadError', error);
    return emptyAppearance();
  }
  if (raw === null) return emptyAppearance();
  try {
    return validateAppearance(JSON.parse(raw));
  } catch (cause) {
    report(notify, 'appearanceReadError', cause);
    return emptyAppearance();
  }
}

export function writeAppearance(appearance, notify) {
  try {
    const error = writeRaw(APPEARANCE_KEY, JSON.stringify(validateAppearance(appearance)));
    if (!error) return true;
    report(notify, 'appearanceWriteError', error);
  } catch (error) {
    report(notify, 'appearanceWriteError', error);
  }
  return false;
}
