import { LEVELS } from './levels.js';
import {
  GAME_MODES,
  initialGameState,
  createPlayer,
  applyAction,
  useItem,
  advancePlayers,
  settlePlayers,
  makeResult,
} from './rules.js';
import { resolveCollisions } from './collisions.js';
import { writeSave, updateProgress } from './storage.js';

const VICTORY_BURST_COLORS = Object.freeze(['#ffcb58', '#ef8765', '#7ad9bd']);

export function createSession({
  game,
  save,
  app,
  course,
  riders,
  canvas,
  finish,
  tone,
  notify,
  setMode,
  updateHUD,
  theme,
  restoreRiders,
  resetClock,
  V,
}) {
  function startRun({ gameMode, levelIndex, seed }) {
    if (app.error.value || app.helpOpen.value || app.wardrobeOpen.value || app.settingsOpen.value)
      return false;
    if (!GAME_MODES.includes(gameMode)) return false;
    if (gameMode === 'duo' && app.isMobile.value) {
      notify('mobileDuo');
      return false;
    }
    if (!Number.isInteger(levelIndex) || levelIndex < 0 || levelIndex >= LEVELS.length)
      return false;
    if (gameMode !== 'endless' && levelIndex >= save.records[gameMode].unlocked) return false;
    if (seed !== undefined && (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff))
      return false;
    const runSeed = seed === undefined ? crypto.getRandomValues(new Uint32Array(1))[0] : seed;
    Object.assign(game, initialGameState(), {
      gameMode,
      level: gameMode === 'endless' ? 0 : levelIndex,
      seed: runSeed,
      homePreviewPlayer: game.homePreviewPlayer,
      homePreviewAuto: game.homePreviewAuto,
      players: gameMode === 'duo' ? [createPlayer(0), createPlayer(1)] : [createPlayer(0)],
    });
    app.selectedMode.value = gameMode;
    app.selected.value = game.level;
    restoreRiders();
    theme.setTheme(game.level);
    course.generateCourse(game.level);
    course.clearParticles();
    for (const model of riders) {
      model.rider.position.set(0, 0, 0);
      model.rider.rotation.set(0, 0, 0);
      model.shieldBubble.visible = false;
    }
    app.hitFlash.value = 0;
    tone('move');
    setMode('playing');
    canvas.focus();
    if (gameMode !== 'endless')
      notify('stageToast', { number: game.level + 1, name: app.levelName(game.level) });
    return true;
  }

  function startLevel(index) {
    return startRun({
      gameMode: game.mode === 'home' ? app.selectedMode.value : game.gameMode,
      levelIndex: index,
      seed: game.mode !== 'home' && index === game.level ? game.seed : undefined,
    });
  }

  function goHome() {
    course.clearCourse();
    course.clearParticles();
    finish.visible = false;
    game.result = null;
    game.markers = [];
    game.players.forEach((player) => {
      player.jumpY = 0;
      player.duck = 0;
    });
    restoreRiders();
    theme.setTheme(app.selected.value);
    app.clearToast();
    app.hitFlash.value = 0;
    setMode('home');
  }

  function pauseGame() {
    if (game.mode !== 'playing') return;
    setMode('paused');
    app.clearToast();
  }

  function resumeGame() {
    const blocked =
      app.error.value || app.helpOpen.value || app.wardrobeOpen.value || app.settingsOpen.value;
    if (game.mode !== 'paused' || blocked) return;
    setMode('playing');
    canvas.focus();
    resetClock();
  }

  function action({ playerId, type }) {
    const blocked =
      app.error.value || app.helpOpen.value || app.wardrobeOpen.value || app.settingsOpen.value;
    if (game.mode !== 'playing' || blocked) return false;
    if (!Number.isInteger(playerId) || !game.players[playerId]) return false;
    const player = game.players[playerId];
    if (player.status !== 'running') return false;
    if (type === 'boost' && !player.boosting && player.fishBalance === 0) {
      notify('boostEmpty');
      return false;
    }
    if (type === 'item' && game.gameMode === 'items' && !player.itemSlot) {
      notify('itemEmpty');
      return false;
    }
    if (type === 'item' && player.itemSlot === 'shield' && player.shield) {
      notify('shieldActive');
      return false;
    }
    const applied =
      type === 'item'
        ? game.gameMode === 'items' && useItem(player, course.entities)
        : applyAction(player, type);
    if (applied) {
      tone(
        type === 'jump' ? 'jump' : type === 'duck' ? 'duck' : type === 'item' ? 'shield' : 'move',
      );
      updateHUD();
    }
    return Boolean(applied);
  }

  function collisionEvent(kind, player, entity) {
    if (kind === 'fish') tone('fish');
    else if (kind === 'hit') {
      tone('hit');
      notify(player.hp > 0 ? 'hit' : 'exhausted', { hp: player.hp });
    } else {
      tone('shield');
      if (kind === 'item') notify('itemPickup', { item: app.copy.value.items[player.itemSlot] });
      if (kind === 'shield') notify('pickup');
      if (kind === 'shieldHit') notify('shieldHit');
    }
    course.burst(
      V(player.x, entity.height, game.distance - player.distance),
      kind === 'hit' ? '#f29262' : kind === 'fish' ? '#ffc449' : '#7cf5ce',
      kind === 'fish' ? 4 : 12,
    );
  }

  function collide(previousPlayers) {
    if (game.mode !== 'playing') return;
    resolveCollisions(game, course.entities, {
      previous: previousPlayers,
      onEvent: collisionEvent,
    });
    const outcome = settlePlayers(game);
    if (outcome) finishRun(outcome);
  }

  function finishRun(outcome) {
    if (game.result) return;
    const record = save.records[game.gameMode];
    const bestScore = game.gameMode === 'endless' ? record.bestScore : record.best[game.level];
    game.result = makeResult(game, {
      outcome,
      appearances: app.appearance.players,
      bestScore,
    });
    Object.assign(save, updateProgress(save, game.result));
    game.recordSaved = app.saveWritable.value ? writeSave(save, notify) : false;
    if (!app.saveWritable.value) notify('readError');
    if (outcome === 'won') {
      tone('win');
      for (let index = 0; index < 5; index++)
        course.burst(
          V((index - 2) * 1.5, 3, -2),
          VICTORY_BURST_COLORS[index % VICTORY_BURST_COLORS.length],
          12,
        );
    }
    app.clearToast();
    setMode(outcome);
  }

  function endRun() {
    if (game.mode !== 'paused' || game.gameMode !== 'endless') return false;
    game.players.forEach((player) => {
      if (player.status !== 'running') return;
      player.status = 'retired';
      player.speed = 0;
      player.boosting = false;
    });
    game.speed = 0;
    finishRun('ended');
    return true;
  }

  function step(dt) {
    if (game.mode !== 'playing') return;
    if (!Number.isFinite(dt) || dt < 0) throw new RangeError('Invalid timestep');
    let remaining = dt;
    while (remaining > 0 && game.mode === 'playing') {
      const slice = Math.min(remaining, 1 / 90);
      const previousPlayers = game.players.map((player) => ({ ...player }));
      course.streamCourse();
      advancePlayers(game, slice);
      collide(previousPlayers);
      remaining -= slice;
    }
    if (game.gameMode === 'endless') {
      course.streamCourse();
      const nextTheme = Math.floor(game.distance / 1000) % LEVELS.length;
      if (nextTheme !== theme.index) theme.setTheme(nextTheme);
    }
  }

  function selectMode(mode) {
    if (!GAME_MODES.includes(mode) || game.mode !== 'home') return false;
    app.selectedMode.value = mode;
    game.gameMode = mode;
    app.selected.value = mode === 'endless' ? 0 : save.records[mode].unlocked - 1;
    theme.setTheme(app.selected.value);
    updateHUD();
    return true;
  }

  function selectLevel(index) {
    const unlocked = save.records[app.selectedMode.value].unlocked;
    if (
      game.mode !== 'home' ||
      app.selectedMode.value === 'endless' ||
      !Number.isInteger(index) ||
      index < 0 ||
      index >= unlocked
    )
      return false;
    app.selected.value = index;
    theme.setTheme(index);
    return true;
  }

  return {
    startRun,
    startLevel,
    goHome,
    pauseGame,
    resumeGame,
    endRun,
    action,
    step,
    collide,
    finishRun,
    selectMode,
    selectLevel,
  };
}
