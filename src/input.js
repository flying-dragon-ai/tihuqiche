const P1_KEYS = { KeyA: 'left', KeyD: 'right', KeyW: 'jump', KeyS: 'duck', Space: 'boost' };
const P2_KEYS = {
  Numpad4: 'left',
  Numpad6: 'right',
  Numpad8: 'jump',
  Numpad2: 'duck',
  Numpad0: 'boost',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'jump',
  ArrowDown: 'duck',
  ShiftRight: 'boost',
};
const SWIPE_THRESHOLD = 23;

export function keyboardAction(code, gameMode) {
  if (P1_KEYS[code]) return { playerId: 0, type: P1_KEYS[code] };
  if (P2_KEYS[code]) return { playerId: gameMode === 'duo' ? 1 : 0, type: P2_KEYS[code] };
  if (code === 'KeyE' && gameMode === 'items') return { playerId: 0, type: 'item' };
  return null;
}

export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

function trapFocus(event, overlay) {
  if (event.code !== 'Tab' || !overlay) return;
  const controls = [
    ...overlay.querySelectorAll('button,a[href],input,select,textarea,[tabindex]'),
  ].filter(
    (element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length,
  );
  if (!controls.length) return;
  const active = document.activeElement;
  if (event.shiftKey && (active === controls[0] || !overlay.contains(active))) {
    event.preventDefault();
    controls.at(-1).focus();
  } else if (!event.shiftKey && (active === controls.at(-1) || !overlay.contains(active))) {
    event.preventDefault();
    controls[0].focus();
  }
}

function openOverlay() {
  return [...document.querySelectorAll('.overlay,[role="dialog"]')].find(
    (element) => !element.hidden && element.getClientRects().length,
  );
}

function isTextEntry(target) {
  return (
    target.closest('input,select,textarea,[contenteditable="true"],[contenteditable=""]') ||
    target.isContentEditable
  );
}

function handleKeydown(event, api) {
  const { game, app, action, pauseGame, resumeGame } = api;
  if (app.error.value) return;
  const overlay = openOverlay();
  trapFocus(event, overlay);
  if (event.repeat) return;
  if (app.helpOpen.value) {
    if (event.code === 'Escape') app.closeHelp();
    return;
  }
  if (app.wardrobeOpen.value || app.settingsOpen.value) return;
  const target = event.target;
  if (isTextEntry(target)) return;
  if (event.code === 'KeyP' || event.code === 'Escape') {
    if (['playing', 'paused'].includes(game.mode)) {
      event.preventDefault();
      game.mode === 'paused' ? resumeGame() : pauseGame();
    }
    return;
  }
  if (overlay) return;
  if (['Space', 'Enter'].includes(event.code) && target.closest('button,a,[role="button"]')) return;
  const command = keyboardAction(event.code, game.gameMode);
  if (game.mode === 'playing' && command) {
    event.preventDefault();
    action(command);
  }
  if (game.mode === 'home' && ['Enter', 'Space'].includes(event.code)) {
    event.preventDefault();
    api.startLevel(app.selected.value);
  }
}

function swipeAction(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'duck' : 'jump';
}

function handlePointerDown(event, api, touch) {
  const { game, app } = api;
  const canSwipe =
    game.mode === 'playing' &&
    !app.helpOpen.value &&
    !app.wardrobeOpen.value &&
    !app.settingsOpen.value;
  if (!canSwipe) return;
  touch.start = { x: event.clientX, y: event.clientY, id: event.pointerId };
}

function handlePointerUp(event, api, touch) {
  if (!touch.start || touch.start.id !== event.pointerId) return;
  const dx = event.clientX - touch.start.x;
  const dy = event.clientY - touch.start.y;
  touch.start = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return;
  api.action({ playerId: 0, type: swipeAction(dx, dy) });
}

export function bindInput(canvas, api) {
  const { app, pauseGame } = api;
  const controller = new AbortController();
  const options = { signal: controller.signal };
  const touch = { start: null };

  document.addEventListener('keydown', (event) => handleKeydown(event, api), options);
  canvas.addEventListener('pointerdown', (event) => handlePointerDown(event, api, touch), options);
  window.addEventListener('pointerup', (event) => handlePointerUp(event, api, touch), options);
  window.addEventListener('pointercancel', () => (touch.start = null), options);
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.hidden) pauseGame();
    },
    options,
  );
  window.addEventListener('blur', pauseGame, options);
  window.addEventListener('resize', api.world.resize, options);
  canvas.addEventListener(
    'webglcontextlost',
    (event) => {
      event.preventDefault();
      pauseGame();
      app.error.value = { title: 'contextLost', description: 'contextHelp' };
    },
    options,
  );
  return () => controller.abort();
}
