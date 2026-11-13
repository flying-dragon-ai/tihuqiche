import { nextTick } from 'vue';
import { createWorld, V } from './world.js';
import { createRider } from './rider.js';
import { createCourse } from './course.js';
import { createSound } from './sound.js';
import { bindInput } from './input.js';
import { createGameCamera } from './game-camera.js';
import { createHomePreview } from './home-preview.js';
import { initialGameState } from './rules.js';
import { createThemeController } from './game-theme.js';
import { createPreviewController } from './game-preview.js';
import { createRenderLoop } from './game-render.js';
import { createSession } from './game-session.js';

export { initialGameState } from './rules.js';

const FOCUS_TARGETS = Object.freeze({
  paused: 'resume',
  home: 'start',
  won: 'next',
  lost: 'next',
  ended: 'next',
});

export function createGame(canvas, app) {
  const game = initialGameState();
  const save = app.save;
  const notify = app.notify;
  const world = createWorld(canvas);
  const riders = app.appearance.players.map((config) => createRider(world, config));
  const rider = riders[0].rider;
  const course = createCourse(world, game);
  const { scene, camera, renderer, finish, updateWorld } = world;
  const homePreview = createHomePreview(world);
  const sound = createSound({ enabled: app.soundEnabled, settings: app.settings, notify });
  const tone = sound.tone;
  const cameraControl = createGameCamera(world, game, app);
  const theme = createThemeController(world, app);

  let disposed = false;
  let frameId;
  let readySettled = false;
  let resolveReady;
  let rejectReady;
  const ready = new Promise((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  function settleReady(error) {
    if (readySettled) return;
    readySettled = true;
    if (error) rejectReady(error);
    else resolveReady();
    resolveReady = null;
    rejectReady = null;
  }

  function updateHUD() {
    Object.assign(app.state, {
      ...game,
      players: game.players.map((player) => ({ ...player })),
      markers: game.markers.map((marker) => ({ ...marker })),
    });
  }

  function setMode(mode) {
    game.mode = mode;
    updateHUD();
    const target = FOCUS_TARGETS[mode];
    if (target) nextTick(() => document.getElementById(target)?.focus({ preventScroll: true }));
  }

  function applySettings() {
    world.setSettings(app.settings);
    course.setAssistMarkers(app.settings.assistMarkers);
  }

  const preview = createPreviewController({ game, app, homePreview, riders, updateHUD });
  let session;
  const renderLoop = createRenderLoop({
    game,
    app,
    world,
    course,
    riders,
    preview,
    cameraControl,
    renderer,
    scene,
    camera,
    updateHUD,
    step: (dt) => session.step(dt),
    settleReady,
    viewport: () => ({ width: innerWidth, height: innerHeight }),
  });
  session = createSession({
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
    restoreRiders: preview.restoreRiders,
    resetClock: renderLoop.resetClock,
    V,
  });

  function frame(now) {
    if (disposed) return;
    if (app.error.value) {
      settleReady(new Error(app.error.value.detail || app.error.value.title));
      api.dispose();
      return;
    }
    try {
      renderLoop.renderFrame(now);
    } catch (error) {
      app.error.value = { title: 'errorTitle', description: 'errorHelp', detail: error.message };
      console.error('Game frame failed', error);
      settleReady(error);
      api.dispose();
      return;
    }
    frameId = requestAnimationFrame(frame);
  }

  const api = {
    whenReady: () => ready,
    game,
    save,
    world,
    scene,
    camera,
    renderer,
    rider,
    riders,
    V,
    app,
    startRun: session.startRun,
    startLevel: session.startLevel,
    goHome: session.goHome,
    pauseGame: session.pauseGame,
    resumeGame: session.resumeGame,
    endRun: session.endRun,
    action: session.action,
    step: session.step,
    collide: session.collide,
    updateCamera: cameraControl.updateCamera,
    updateWorld,
    updateEntities: course.updateEntities,
    selectMode: session.selectMode,
    selectLevel: session.selectLevel,
    previewRider: preview.previewRider,
    restoreRiders: preview.restoreRiders,
    attachHomePreview: preview.attachHomePreview,
    attachWardrobePreview: preview.attachWardrobePreview,
    rotateWardrobePreview: preview.rotateWardrobePreview,
    setHomePreviewPlayer: preview.setHomePreviewPlayer,
    rotateHomePreview: preview.rotateHomePreview,
    setHomePreviewAuto: preview.setHomePreviewAuto,
    applySettings,
    previewSound: () => sound.preview(),
    get entities() {
      return course.entities;
    },
    get soundEnabled() {
      return app.soundEnabled.value;
    },
    get audio() {
      return sound.audio;
    },
    toggleSound() {
      app.setSetting('soundEnabled', !app.soundEnabled.value);
      if (app.soundEnabled.value) tone('fish');
      if (game.mode === 'playing') canvas.focus();
    },
    setAppearance() {
      theme.setTheme(game.mode === 'home' ? app.selected.value : theme.index);
    },
    setLanguage() {
      world.setLanguage(app.locale.value);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      settleReady(new Error('Game disposed before first frame'));
      cancelAnimationFrame(frameId);
      unbind();
      course.dispose();
      homePreview.dispose();
      riders.forEach((model) => model.dispose());
      world.dispose();
      sound.dispose()?.catch((error) => console.warn('Audio cleanup failed', error));
    },
  };

  const unbind = bindInput(canvas, api);
  theme.setTheme(app.selected.value);
  api.setLanguage();
  applySettings();
  updateHUD();
  cameraControl.updateCamera(10);
  frameId = requestAnimationFrame(frame);
  return api;
}
