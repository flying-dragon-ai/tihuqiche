import * as T from 'three';
import { defaultRiderConfig, validateRiderConfig } from './appearance.js';
import { createVehicle } from './rider-vehicle.js';
import { addAccessories, SKIN_COLORS } from './rider-accessories.js';
import { createRiderEffects } from './rider-effects.js';
import { addBirdDetails } from './rider-details.js';

export function createRider(world, initialConfig = defaultRiderConfig()) {
  const { scene } = world;
  let config = validateRiderConfig(initialConfig);
  let model;
  let disposed = false;
  const rider = new T.Group();
  rider.name = 'rider';
  scene.add(rider);
  const effects = createRiderEffects(world, rider);
  const { shieldBubble } = effects;

  function applyConfig(nextConfig) {
    if (disposed) throw new Error('Rider has been disposed');
    const next = validateRiderConfig(nextConfig);
    const replacement = buildModel(world, next);
    if (model) rider.remove(model.root);
    model = replacement;
    config = next;
    rider.add(model.root);
    effects.attach(model.bike, model.exhaust, config.vehicle);
  }

  function animateRider(frame) {
    if (disposed) throw new Error('Rider has been disposed');
    model.animate(frame);
    effects.animate(frame);
    rider.position.y = frame.jumpY;
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    effects.dispose();
    rider.removeFromParent();
    rider.clear();
    model = null;
  }

  applyConfig(config);
  return {
    rider,
    shieldBubble,
    animateRider,
    applyConfig,
    getConfig: () => ({ ...config }),
    dispose,
  };
}

function buildBird(world, root, config, palette) {
  const { mesh, orb } = world;
  const bird = new T.Group();
  bird.position.set(0, 1.83, 0.25);
  root.add(bird);
  bird.name = 'bird';
  orb(palette[0], [0, 0.13, 0.04], [0.61, 0.65, 0.83], bird);
  orb(palette[1], [0, -0.1, 0.23], [0.59, 0.43, 0.67], bird);
  const neck = orb(palette[0], [0, 0.65, -0.3], [0.31, 0.64, 0.32], bird);
  neck.rotation.x = -0.29;
  const head = new T.Group();
  head.position.set(0, 1.22, -0.44);
  head.rotation.y = -0.22;
  bird.add(head);
  orb(palette[3], [0, 0, 0], [0.39, 0.4, 0.43], head);
  mesh('cone', '#f6bb52', {
    p: [0, -0.02, -1.02],
    s: [0.31, 1.52, 0.13],
    r: [-Math.PI / 2, 0, 0],
    parent: head,
  });
  orb('#eea443', [0, -0.27, -0.78], [0.28, 0.33, 0.68], head);
  orb('#ffd06f', [0, -0.01, -0.87], [0.29, 0.075, 0.73], head);
  const animateFace = addBirdDetails(world, { bird, head, palette });
  const scarfTail = addAccessories(world, bird, head, config);
  return { bird, head, animateFace, scarfTail };
}

function buildLegs(world, root) {
  const { rod } = world;
  const legs = [];
  for (const side of [-1, 1]) {
    const upper = rod('#eca84e', [side * 0.31, 1.67, 0.25], [side * 0.32, 1.17, -0.15], {
      radius: 0.055,
      parent: root,
    });
    const lower = rod('#eca84e', [side * 0.32, 1.17, -0.15], [side * 0.3, 0.7, 0], {
      radius: 0.05,
      parent: root,
    });
    upper.name = 'leg-upper:' + legs.length;
    lower.name = 'leg-lower:' + legs.length;
    legs.push({ upper, lower });
  }
  return legs;
}

function footPose({ drive, standing, moving, jumpY, duck, pose, config, pedalAngle, index }) {
  const side = index === 0 ? -1 : 1;
  const angle = pedalAngle + index * Math.PI;
  if (drive?.pedals) {
    return {
      y: drive.pedals[index].position.y + 0.08,
      z: drive.pedals[index].position.z,
      knee: [side * 0.33, 1.22 + Math.sin(angle) * 0.09, -0.22 + Math.cos(angle) * 0.1],
    };
  }
  if (standing) {
    const pushing = index === 1 && moving && jumpY === 0 && !duck;
    const z = pushing ? 0.2 + Math.cos(pedalAngle) * 0.5 : 0.2;
    return {
      y: pushing ? 0.24 + Math.max(0, Math.sin(pedalAngle)) * 0.35 : 0.63,
      z,
      knee: [side * 0.32, 1.12, z * 0.5],
    };
  }
  return {
    y: pose?.footY ?? (config.vehicle === 'motorcycle' ? 0.83 : 0.77),
    z: pose?.footZ ?? (config.vehicle === 'motorcycle' ? 0.13 : -0.32),
    knee: [side * 0.39, pose?.kneeY ?? 1.2, pose?.kneeZ ?? -0.33],
  };
}

function buildModel(world, config) {
  const palette = SKIN_COLORS[config.skin];
  const root = new T.Group();
  root.name = 'rider-model';
  const {
    bike,
    wheels,
    feet,
    drive,
    pose,
    animate: animateVehicle,
    exhaust,
    setSteering,
  } = createVehicle(world, root, config);
  const { bird, head, animateFace, scarfTail } = buildBird(world, root, config, palette);
  const legs = buildLegs(world, root);
  let pedalAngle = 0;

  function animate({ dt, time, moving, jumpY, duck, speed, boosting, steering = 0 }) {
    const standing = config.vehicle === 'scooter';
    if (moving) pedalAngle += (dt * Math.max(0, speed)) / 1.8;
    if (drive) drive.animate(pedalAngle);
    else wheels.forEach((wheel) => (wheel.rotation.x = -pedalAngle));
    if (animateVehicle) animateVehicle({ dt, time, moving, boosting });
    setSteering(steering);
    animateFace(time);
    bike.rotation.x = jumpY > 0 ? Math.sin(jumpY) * 0.06 : 0;
    bike.updateMatrix();
    feet.forEach((foot, index) => {
      const side = index === 0 ? -1 : 1;
      const { y, z, knee } = footPose({
        drive,
        standing,
        moving,
        jumpY,
        duck,
        pose,
        config,
        pedalAngle,
        index,
      });
      foot.position.set(side * 0.3, y, z);
      const hipY = duck ? 1.48 : (pose?.hipY ?? (standing ? 1.88 : 1.73));
      alignRod(legs[index].upper, [side * 0.31, hipY, 0.25], knee, 0.055);
      const ankle = foot.position.clone().applyMatrix4(bike.matrix).toArray();
      alignRod(legs[index].lower, knee, ankle, 0.048);
    });
    bird.scale.y = T.MathUtils.damp(bird.scale.y, duck ? 0.42 : 1, 18, dt);
    bird.position.y =
      (pose?.birdY ?? (standing ? 1.98 : 1.83)) + (moving ? Math.sin(pedalAngle * 2) * 0.025 : 0);
    head.rotation.y = -0.22 + Math.sin(time * 1.2) * 0.09;
    scarfTail.rotation.set(
      Math.sin(time * (boosting ? 14 : 9)) * 0.13,
      -0.2 + Math.sin(time * 6) * 0.2,
      0,
    );
    bird.rotation.x = T.MathUtils.damp(bird.rotation.x, boosting ? -0.12 : 0, 12, dt);
  }

  animate({ dt: 0, time: 0, moving: false, jumpY: 0, duck: false, speed: 0, boosting: false });
  return { root, bike, exhaust, animate };
}

function alignRod(object, a, b, radius) {
  const start = new T.Vector3(...a);
  const end = new T.Vector3(...b);
  const direction = end.clone().sub(start);
  object.position.copy(start.add(end).multiplyScalar(0.5));
  object.scale.set(radius, direction.length(), radius);
  object.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), direction.normalize());
}
