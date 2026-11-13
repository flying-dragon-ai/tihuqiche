import * as T from 'three';

const FROZEN_MODES = Object.freeze(['paused', 'won', 'lost', 'ended']);

function applyPortraitPreview(camera) {
  // The mobile wardrobe leaves the top 250 CSS pixels for the complete rider.
  // Scale camera distance with viewport height, then move the optical centre up.
  const scale = innerHeight / 600;
  camera.position.set(8 * scale, 1.8 + 4 * scale, 10 * scale);
  camera.lookAt(0, 1.8, 0);
  camera.fov = 50;
  camera.setViewOffset(
    innerWidth,
    innerHeight,
    0,
    (innerHeight - 250) / 2,
    innerWidth,
    innerHeight,
  );
}

function computePose(game, app, mobile, stacked, desired, look) {
  const active = game.players.filter((player) => player.status === 'running');
  const players = active.length ? active : game.players;
  const spread =
    game.gameMode === 'duo'
      ? Math.max(...players.map((player) => player.distance)) -
        Math.min(...players.map((player) => player.distance))
      : 0;
  const x = players.reduce((total, player) => total + player.x, 0) / players.length;

  if (game.mode === 'home' && app.wardrobeOpen.value) {
    desired.set(6.4, 5.8, 10);
    look.set(-1.1, 1.8, 0);
    return {
      fov: 45,
      viewOffset: [innerWidth, innerHeight, innerWidth * 0.22, 0, innerWidth, innerHeight],
    };
  }
  if (game.mode === 'home') {
    desired.set(stacked ? 8 : 7.5, 5.8, stacked ? 10 : 8.6);
    look.set(stacked ? 0 : -3.7, stacked ? -0.35 : 1.35, stacked ? 0 : -0.6);
    return { fov: stacked ? 50 : 45 };
  }
  if (game.gameMode === 'duo') {
    desired.set(x * 0.15, 7.5 + spread * 0.08, 12.5 + spread);
    look.set(x * 0.1, 1, spread * 0.4 - 7);
    return { fov: 48 };
  }
  desired.set(x * (mobile ? 0.55 : 0.22), mobile ? 7 : 6.5, mobile ? 14 : 11.8);
  look.set(x * (mobile ? 0.45 : 0.13), 1, mobile ? -10 : -12);
  return { fov: mobile ? 60 : 52 };
}

export function createGameCamera(world, game, app) {
  const target = new T.Vector3();
  const desired = new T.Vector3();
  const look = new T.Vector3();

  function updateCamera(dt) {
    if (FROZEN_MODES.includes(game.mode)) return;
    const home = game.mode === 'home';
    const mobile = innerWidth < 701;
    const stacked = mobile && innerHeight > 500;
    const portraitPreview = home && app.wardrobeOpen.value && stacked && innerHeight > innerWidth;
    if (portraitPreview) {
      applyPortraitPreview(world.camera);
      return;
    }
    if (world.camera.view?.enabled) world.camera.clearViewOffset();
    const pose = computePose(game, app, mobile, stacked, desired, look);
    if (pose.viewOffset) world.camera.setViewOffset(...pose.viewOffset);
    world.camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
    target.lerp(look, 1 - Math.exp(-dt * 4));
    world.camera.lookAt(target);
    world.camera.fov = T.MathUtils.damp(world.camera.fov, pose.fov, 5, dt);
    world.camera.updateProjectionMatrix();
  }

  function markers(riders) {
    if (game.gameMode !== 'duo' || game.mode === 'home') return [];
    world.camera.updateMatrixWorld();
    return game.players.map((player) => {
      const position = new T.Vector3(
        riders[player.id].rider.position.x,
        4.8 + player.jumpY,
        riders[player.id].rider.position.z,
      ).project(world.camera);
      return {
        id: player.id,
        x: ((position.x + 1) * innerWidth) / 2,
        y: ((1 - position.y) * innerHeight) / 2,
        visible:
          player.status === 'running' &&
          position.z > -1 &&
          position.z < 1 &&
          Math.abs(position.x) < 1 &&
          Math.abs(position.y) < 1,
      };
    });
  }

  return { updateCamera, markers };
}
