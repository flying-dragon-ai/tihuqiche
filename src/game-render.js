import * as T from 'three';
import { createPlayer } from './rules.js';

const LANE_WIDTH = 3.4;
const DUO_SEPARATION = 3;
const DUO_OFFSET = 0.55;

function homeRiderX(app, viewport) {
  const { width, height } = viewport();
  const stacked = width < 701 && height > 500;
  if (stacked && (!app.wardrobeOpen.value || height > width)) return 0;
  return app.wardrobeOpen.value ? -1.1 : 1.1;
}

function duoOffset(player, other, index, home) {
  const sharingLane =
    !home &&
    other?.status === 'running' &&
    player.lane === other.lane &&
    Math.abs(player.distance - other.distance) < DUO_SEPARATION;
  if (!sharingLane) return 0;
  return index === 0 ? -DUO_OFFSET : DUO_OFFSET;
}

export function createRenderLoop({
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
  step,
  settleReady,
  viewport,
}) {
  const fallbackPlayers = [];
  let previous = performance.now();
  let clockTime = 0;
  let menuDistance = 0;
  let hudTick = 0;

  function renderPlayers(dt, homePreviewVisible) {
    if (game.mode === 'paused') dt = 0;
    const home = game.mode === 'home';
    const seat = app.wardrobeOpen.value ? preview.seat : 0;
    riders.forEach((model, index) => {
      const player = game.players[index] ?? (fallbackPlayers[index] ??= createPlayer(index));
      const visible = home ? index === seat && !homePreviewVisible : player.status === 'running';
      model.rider.visible =
        visible && (home || player.invincible <= 0 || Math.floor(player.invincible * 12) % 2 === 0);
      model.shieldBubble.visible = !home && Boolean(player.shield);
      if (!visible) return;
      const other = game.players[1 - index];
      const offset = duoOffset(player, other, index, home);
      model.rider.position.set(
        home ? homeRiderX(app, viewport) : player.x + offset,
        home ? 0 : player.jumpY,
        home ? 0 : game.distance - player.distance,
      );
      model.rider.rotation.y = home
        ? -0.28
        : T.MathUtils.damp(
            model.rider.rotation.y,
            -((player.lane - 1) * LANE_WIDTH - player.x) * 0.07,
            12,
            dt,
          );
      model.rider.rotation.z = home
        ? Math.sin(clockTime * 1.1) * 0.025
        : T.MathUtils.damp(
            model.rider.rotation.z,
            -((player.lane - 1) * LANE_WIDTH - player.x) * 0.1,
            12,
            dt,
          );
      if (game.mode !== 'paused')
        model.animateRider({
          dt,
          time: clockTime,
          moving: home || game.mode === 'playing',
          jumpY: home ? 0 : player.jumpY,
          duck: !home && player.duck > 0,
          speed: home ? 4 : player.speed,
          boosting: !home && player.boosting,
          steering: home ? 0 : model.rider.rotation.y,
        });
    });
  }

  function renderFrame(now) {
    const dt = Math.min((now - previous) / 1000, 0.05);
    previous = now;
    if (game.mode === 'playing' || game.mode === 'home') clockTime += dt;
    if (game.mode === 'playing') {
      step(dt);
      world.updateWorld(game.distance, clockTime);
      course.updateEntities(clockTime);
      app.hitFlash.value = Math.max(
        ...game.players.map((player) =>
          player.invincible > 1.5 ? (player.invincible - 1.5) * 0.28 : 0,
        ),
      );
    } else if (game.mode === 'home') {
      menuDistance += dt * 4;
      world.updateWorld(menuDistance, clockTime);
    }
    const previewFrame = preview.render({ dt, time: clockTime });
    renderPlayers(dt, previewFrame.visible);
    if (game.mode !== 'paused') course.updateParticles(dt);
    cameraControl.updateCamera(dt);
    game.markers = cameraControl.markers(riders);
    hudTick += dt;
    if (hudTick > 0.09) {
      updateHUD();
      hudTick = 0;
    }
    renderer.render(scene, camera);
    if (!previewFrame.destination || previewFrame.visible) settleReady();
  }

  function resetClock() {
    previous = performance.now();
  }

  return { renderFrame, renderPlayers, resetClock };
}
