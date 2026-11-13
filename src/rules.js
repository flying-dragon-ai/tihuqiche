import { LEVELS } from './levels.js';

export const GAME_MODES = Object.freeze(['campaign', 'endless', 'duo', 'items']);
export const ITEM_TYPES = Object.freeze(['shield', 'magnet', 'double', 'clear']);
export const BOOST_FISH_PER_SECOND = 4;

const BOOST_SPEED_MULTIPLIER = 1.5;
const BOOST_SPEED_CAP = 1.75;
const FISH_SCORE = 25;
const FINISH_HP_BONUS = 150;
const SOLO_FISH_STAR_THRESHOLD = 25;
const DUO_FISH_STAR_THRESHOLD = 50;
const ITEM_DURATION_SECONDS = 8;
const CLEAR_RANGE_METERS = 30;
const OBSTACLE_TYPES = Object.freeze(['hurdle', 'gate', 'crate']);
const TIMED_FIELDS = Object.freeze(['duck', 'invincible', 'magnetRemaining', 'doubleRemaining']);

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

export function createPlayer(id = 0) {
  return {
    id,
    status: 'running',
    distance: 0,
    speed: 0,
    lane: 1,
    x: 0,
    jumpY: 0,
    vy: 0,
    duck: 0,
    hp: 3,
    fishCollected: 0,
    fishBalance: 0,
    bonusScore: 0,
    shield: false,
    invincible: 0,
    boosting: false,
    boostElapsed: 0,
    catchupBonus: 0,
    itemSlot: null,
    magnetRemaining: 0,
    doubleRemaining: 0,
  };
}

export function initialGameState() {
  return {
    mode: 'home',
    gameMode: 'campaign',
    level: 0,
    seed: 1,
    elapsed: 0,
    distance: 0,
    speed: 0,
    players: [createPlayer()],
    result: null,
    recordSaved: null,
    markers: [],
    homePreviewPlayer: 0,
    homePreviewAuto: true,
  };
}

export const endlessSpeed = (distance) => 18 + 14 * clamp(distance / 5000, 0, 1);
export const endlessGap = (distance) => 36 - 8 * clamp(distance / 5000, 0, 1);
export const catchupBonus = (gap) => 0.5 * clamp((gap - 10) / 8, 0, 1);

export function seededRandom(seed) {
  let value = ((seed >>> 0) % 2147483646) + 1;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

export function applyAction(player, type) {
  if (player.status !== 'running') return false;
  switch (type) {
    case 'left':
    case 'right':
      player.lane = clamp(player.lane + (type === 'left' ? -1 : 1), 0, 2);
      return true;
    case 'jump':
      if (player.jumpY !== 0) return false;
      player.vy = 9.5;
      player.duck = 0;
      return true;
    case 'duck':
      if (player.jumpY !== 0) return false;
      player.duck = 0.95;
      return true;
    case 'boost':
      if (!player.boosting && player.fishBalance === 0) return false;
      player.boosting = !player.boosting;
      return true;
    default:
      return false;
  }
}

export function collectFish(player) {
  player.fishCollected++;
  player.fishBalance++;
  if (player.doubleRemaining > 0) player.bonusScore += FISH_SCORE;
}

export function useItem(player, entities) {
  if (player.status !== 'running' || !player.itemSlot) return false;
  const item = player.itemSlot;
  if (item === 'shield' && player.shield) return false;
  applyItemEffect(player, item, entities);
  player.itemSlot = null;
  return true;
}

function applyItemEffect(player, item, entities) {
  switch (item) {
    case 'shield':
      player.shield = true;
      break;
    case 'magnet':
      player.magnetRemaining = ITEM_DURATION_SECONDS;
      break;
    case 'double':
      player.doubleRemaining = ITEM_DURATION_SECONDS;
      break;
    case 'clear':
      clearObstaclesAhead(player, entities);
      break;
  }
}

function clearObstaclesAhead(player, entities) {
  for (const entity of entities) {
    const inRange =
      entity.at >= player.distance && entity.at <= player.distance + CLEAR_RANGE_METERS;
    if (OBSTACLE_TYPES.includes(entity.type) && inRange) entity.resolved = true;
  }
}

function advanceBoost(player, dt) {
  if (!player.boosting) return 0;
  const duration = Math.min(dt, player.fishBalance / BOOST_FISH_PER_SECOND - player.boostElapsed);
  const elapsed = player.boostElapsed + duration;
  const spent = Math.min(player.fishBalance, Math.floor(elapsed * BOOST_FISH_PER_SECOND + 1e-9));
  player.fishBalance -= spent;
  player.boostElapsed = Math.max(0, elapsed - spent / BOOST_FISH_PER_SECOND);
  if (player.fishBalance === 0) {
    player.boosting = false;
    player.boostElapsed = 0;
  }
  return duration;
}

export function advancePlayers(game, dt) {
  if (game.mode !== 'playing') return;
  const running = game.players.filter((player) => player.status === 'running');
  const lead = Math.max(0, ...running.map((player) => player.distance));
  const level = LEVELS[game.level];
  const baseSpeed = game.gameMode === 'endless' ? endlessSpeed(lead) : campaignSpeed(level, lead);
  game.elapsed += dt;
  for (const player of running) advancePlayer(game, player, level, baseSpeed, lead, dt);
  syncOverview(game);
}

function campaignSpeed(level, distance) {
  return level.speed + (level.maxSpeed - level.speed) * Math.min(1, distance / level.length);
}

function advancePlayer(game, player, level, baseSpeed, lead, dt) {
  player.catchupBonus = game.gameMode === 'duo' ? catchupBonus(lead - player.distance) : 0;
  const boostTime = advanceBoost(player, dt);
  const normalSpeed = baseSpeed * (1 + player.catchupBonus);
  const boostSpeed =
    baseSpeed * Math.min(BOOST_SPEED_CAP, BOOST_SPEED_MULTIPLIER + player.catchupBonus);
  player.speed = player.boosting ? boostSpeed : normalSpeed;
  const distance = player.distance + normalSpeed * dt + (boostSpeed - normalSpeed) * boostTime;
  player.distance = game.gameMode === 'endless' ? distance : Math.min(level.length, distance);
  player.x += ((player.lane - 1) * 3.4 - player.x) * (1 - Math.exp(-14 * dt));
  advanceJump(player, dt);
  decayTimers(player, dt);
}

function advanceJump(player, dt) {
  if (player.vy === 0 && player.jumpY <= 0) return;
  player.jumpY += player.vy * dt - 11 * dt * dt;
  player.vy -= 22 * dt;
  if (player.jumpY <= 0) {
    player.jumpY = 0;
    player.vy = 0;
  }
}

function decayTimers(player, dt) {
  for (const field of TIMED_FIELDS) player[field] = Math.max(0, player[field] - dt);
}

function syncOverview(game) {
  const active = game.players.filter((player) => player.status === 'running');
  const overview = active.length ? active : game.players;
  game.distance = Math.max(0, ...overview.map((player) => player.distance));
  game.speed = game.players[0].speed;
}

export function settlePlayers(game) {
  for (const player of game.players) settlePlayer(game, player);
  syncOverview(game);
  if (game.players.some((player) => player.status === 'running')) return null;
  return game.players.some((player) => player.status === 'finished') ? 'won' : 'lost';
}

function settlePlayer(game, player) {
  if (player.status !== 'running') return;
  if (player.hp <= 0) retirePlayer(player, 'downed');
  else if (game.gameMode !== 'endless' && player.distance >= LEVELS[game.level].length)
    retirePlayer(player, 'finished');
}

function retirePlayer(player, status) {
  player.status = status;
  player.speed = 0;
  player.boosting = false;
}

function deepFreeze(object) {
  Object.values(object).forEach((value) => {
    if (value && typeof value === 'object') deepFreeze(value);
  });
  return Object.freeze(object);
}

export function scorePlayer(game, player) {
  const finishBonus =
    game.gameMode !== 'endless' && player.status === 'finished' ? player.hp * FINISH_HP_BONUS : 0;
  return (
    Math.floor(player.distance) +
    player.fishCollected * FISH_SCORE +
    player.bonusScore +
    finishBonus
  );
}

export function countStars(game, { outcome, players, fishCollected }) {
  if (game.gameMode === 'endless') return null;
  if (outcome !== 'won') return 0;
  const perfect = players.every((player) => player.status === 'finished' && player.hp === 3);
  const threshold = game.gameMode === 'duo' ? DUO_FISH_STAR_THRESHOLD : SOLO_FISH_STAR_THRESHOLD;
  return 1 + Number(perfect) + Number(fishCollected >= threshold);
}

function resultReason(outcome) {
  if (outcome === 'ended') return 'retired';
  return outcome === 'won' ? 'finish' : 'exhausted';
}

export function makeResult(game, { outcome, appearances, bestScore = 0 }) {
  const players = game.players.map((player) => ({
    id: player.id,
    status: player.status,
    distance: player.distance,
    hp: player.hp,
    fishCollected: player.fishCollected,
    fishBalance: player.fishBalance,
    bonusScore: player.bonusScore,
    score: scorePlayer(game, player),
    appearance: { ...appearances[player.id] },
  }));
  const fishCollected = players.reduce((total, player) => total + player.fishCollected, 0);
  const score = players.reduce((total, player) => total + player.score, 0);
  return deepFreeze({
    gameMode: game.gameMode,
    levelIndex: game.gameMode === 'endless' ? null : game.level,
    seed: game.seed,
    outcome,
    reason: resultReason(outcome),
    score,
    stars: countStars(game, { outcome, players, fishCollected }),
    isNewRecord: score > bestScore,
    distance: Math.max(...players.map((player) => player.distance)),
    fishCollected,
    players,
  });
}
