import * as T from 'three';
import { riderColor } from './appearance.js';
import { createBicycleDrive } from './bicycle-drive.js';
import { buildExtraVehicle } from './rider-vehicle-extra.js';
import { addFootDetails } from './rider-details.js';

function wheelLayout(vehicle) {
  if (vehicle === 'tricycle')
    return [
      [0, -1.03, 0.52],
      [-0.69, 1.03, 0.52],
      [0.69, 1.03, 0.52],
    ];
  if (vehicle === 'car' || vehicle === 'truck')
    return [
      [-0.69, -0.92, 0.38],
      [0.69, -0.92, 0.38],
      [-0.69, 0.92, 0.38],
      [0.69, 0.92, 0.38],
    ];
  if (vehicle === 'plane')
    return [
      [-0.48, -0.44, 0.25],
      [0.48, -0.44, 0.25],
      [0, 1.13, 0.17],
    ];
  const radius = vehicle === 'scooter' ? 0.32 : vehicle === 'motorcycle' ? 0.61 : 0.52;
  return [
    [0, -1.03, radius],
    [0, 1.03, radius],
  ];
}

function buildPedalFrame(world, bike, color) {
  const { box, orb, rod } = world;
  const framePoints = [
    [0, 0.57, 1.03],
    [0, 1.42, 0.43],
    [0, 0.62, 0.03],
    [0, 0.57, 1.03],
    [0, 1.42, 0.43],
    [0, 1.39, -0.67],
    [0, 0.62, 0.03],
    [0, 1.39, -0.67],
    [0, 0.57, -1.03],
  ];
  for (let index = 0; index < framePoints.length - 1; index++)
    rod(color, framePoints[index], framePoints[index + 1], { radius: 0.06, parent: bike });
  rod(color, [0.015, 1.46, 0.37], [0.015, 1.43, -0.64], { radius: 0.022, parent: bike });
  rod('#254c48', [0, 1.33, 0.43], [0, 1.68, 0.46], { radius: 0.048, parent: bike });
  orb('#243f3d', [0, 1.68, 0.47], [0.31, 0.09, 0.3], bike);
  rod('#afc8be', [0, 1.39, -0.67], [0, 1.95, -0.88], { radius: 0.046, parent: bike });
  buildHandlebar(world, bike, false);
  box('#f2ead4', [0, 1.85, -0.99], [0.21, 0.18, 0.13], bike).name = 'front-lamp';
  orb('#ffe29c', [0, 1.85, -1.065], [0.08, 0.065, 0.035], bike);
  box('#c75140', [0, 1.29, 1.4], [0.21, 0.12, 0.04], bike).name = 'rear-reflector';
  rod('#254c48', [0, 0.8, -0.02], [0, 1.18, -0.32], { radius: 0.066, parent: bike });
  box('#fff0c6', [0, 1.03, -0.21], [0.15, 0.07, 0.14], bike).rotation.x = -0.65;
}

function buildFeet(world, bike) {
  const feet = [];
  for (const side of [-1, 1]) {
    const foot = world.box('#e7a343', [side * 0.3, 0.71, 0.05], [0.26, 0.1, 0.33], bike);
    foot.name = 'foot:' + feet.length;
    feet.push(foot);
    addFootDetails(world, foot);
  }
  return feet;
}

function buildBasket(world, bike, tricycle, color) {
  const { box, rod } = world;
  const basket = box('#f5cc85', [0, 1.18, 1.16], [tricycle ? 1.24 : 0.53, 0.37, 0.45], bike);
  basket.name = 'basket';
  for (const x of tricycle ? [-0.5, -0.25, 0, 0.25, 0.5] : [-0.19, 0, 0.19])
    box('#cc9460', [x, 1.18, 1.397], [0.022, 0.35, 0.018], bike);
  if (!tricycle) return;
  rod('#536361', [-0.69, 0.52 * 1.13, 1.03], [0.69, 0.52 * 1.13, 1.03], {
    radius: 0.075,
    parent: bike,
  }).name = 'rear-axle';
  for (const x of [-0.59, 0.59])
    rod(color, [0, 0.62, 0.03], [x, 0.65, 1.03], { radius: 0.055, parent: bike });
  for (const z of [0.94, 1.38])
    rod('#845d3c', [-0.6, 1.39, z], [0.6, 1.39, z], { radius: 0.026, parent: bike });
  for (const x of [-0.6, 0.6])
    rod('#845d3c', [x, 1.39, 0.94], [x, 1.39, 1.38], { radius: 0.026, parent: bike });
  for (const x of [-0.38, 0.38]) box('#845d3c', [x, 1.19, 1.403], [0.05, 0.31, 0.025], bike);
  box('#f6e1aa', [0, 1.4, 1.14], [0.49, 0.06, 0.22], bike).name = 'basket-lid';
}

export function createVehicle(world, parent, config) {
  const color = riderColor(config.vehicleColor);
  const bike = new T.Group();
  parent.add(bike);
  bike.name = 'vehicle:' + config.vehicle;
  const pedalVehicle = ['bicycle', 'tricycle'].includes(config.vehicle);
  const extraVehicle = ['car', 'truck', 'plane'].includes(config.vehicle);
  const layout = wheelLayout(config.vehicle);
  const wheels = layout.map(([x, z, radius], index) =>
    buildWheel(world, bike, {
      x,
      z,
      radius,
      index,
      vehicle: config.vehicle,
      axleEnd: pedalVehicle && z > 0 ? 0.215 : 0.1,
    }),
  );
  if (config.vehicle !== 'plane')
    layout.forEach(([x, z, radius]) =>
      addMudguard(world, bike, { x, z, radius, color, pedalVehicle }),
    );
  if (pedalVehicle) buildPedalFrame(world, bike, color);
  else if (!extraVehicle) buildMotorBody(world, bike, config, color);
  const extra = extraVehicle ? buildExtraVehicle(world, bike, config) : {};
  const feet = buildFeet(world, bike);
  if (pedalVehicle) buildBasket(world, bike, config.vehicle === 'tricycle', color);
  const drive = pedalVehicle ? createBicycleDrive(world, bike, wheels) : null;
  const handlebar = bike.getObjectByName('handlebar');
  const steeringWheel = bike.getObjectByName('steering-wheel');

  function setSteering(angle) {
    const turn = T.MathUtils.clamp(angle, -0.3, 0.3);
    wheels.forEach((wheel) => {
      wheel.rotation.y = wheel.position.z < 0 ? turn : 0;
    });
    if (handlebar) handlebar.rotation.y = turn;
    if (steeringWheel) steeringWheel.rotation.z = -turn * 2;
  }

  return {
    bike,
    wheels,
    feet,
    drive,
    setSteering,
    exhaust: { x: 0, y: 0.65, z: 1.52, scale: 1 },
    ...extra,
  };
}

function buildWheel({ mesh, rod, box }, bike, { x, z, radius, index, axleEnd, vehicle }) {
  const wheel = new T.Group();
  wheel.name = 'wheel:' + index;
  wheel.rotation.order = 'YXZ';
  wheel.position.set(x, radius * 1.13, z);
  bike.add(wheel);
  const capped = vehicle === 'car' || vehicle === 'truck';
  const wire = vehicle === 'bicycle' || vehicle === 'tricycle';
  const depth = capped ? 0.95 : vehicle === 'motorcycle' ? 0.75 : radius;
  mesh('torus', '#263f40', {
    s: [radius, radius, depth],
    r: [0, Math.PI / 2, 0],
    parent: wheel,
  }).name = 'tire';
  mesh('torus', '#a8b9ac', {
    s: [radius * 0.79, radius * 0.79, radius * 0.38],
    r: [0, Math.PI / 2, 0],
    parent: wheel,
  }).name = 'rim';
  const count = wire ? 8 : vehicle === 'plane' ? 3 : 5;
  if (!capped)
    for (let spokeIndex = 0; spokeIndex < count; spokeIndex++) {
      const angle = (spokeIndex * 2 * Math.PI) / count;
      rod(
        '#bdcbbb',
        [0, 0, 0],
        [0, Math.sin(angle) * radius * 0.8, Math.cos(angle) * radius * 0.8],
        {
          radius: wire ? 0.012 : 0.028,
          parent: wheel,
        },
      ).name = 'spoke:' + spokeIndex;
    }
  for (const side of [-1, 1]) {
    const face = side * (depth * 0.13 + 0.012);
    mesh('cylinder', capped ? '#e7dec5' : '#536f69', {
      p: [face, 0, 0],
      s: [radius * (capped ? 0.66 : 0.2), 0.035, radius * (capped ? 0.66 : 0.2)],
      r: [0, 0, Math.PI / 2],
      parent: wheel,
    }).name = 'hub:' + side;
    if (!capped) continue;
    mesh('cylinder', vehicle === 'truck' ? '#536f69' : '#98aba1', {
      p: [face + side * 0.023, 0, 0],
      s: [radius * 0.27, 0.025, radius * 0.27],
      r: [0, 0, Math.PI / 2],
      parent: wheel,
    });
    for (let ventIndex = 0; ventIndex < 5; ventIndex++) {
      const angle = (ventIndex * 2 * Math.PI) / 5;
      const vent = box(
        '#536f69',
        [face + side * 0.021, Math.sin(angle) * radius * 0.46, Math.cos(angle) * radius * 0.46],
        [0.017, radius * 0.1, radius * 0.19],
        wheel,
      );
      vent.rotation.x = -angle;
      vent.name = 'hub-vent:' + side + ':' + ventIndex;
    }
  }
  rod('#d6c8a6', [-0.1, 0, 0], [axleEnd, 0, 0], { radius: 0.07, parent: wheel });
  return wheel;
}

function addMudguard({ box }, bike, { x, z, radius, color, pedalVehicle }) {
  const arch = radius * 1.18;
  const baseY = radius * 1.13;
  for (let index = 0; index < 5; index++) {
    const a = Math.PI * (0.15 + index * 0.14);
    const b = a + Math.PI * 0.14;
    const ay = Math.sin(a) * arch;
    const az = Math.cos(a) * arch;
    const by = Math.sin(b) * arch;
    const bz = Math.cos(b) * arch;
    const panel = box(
      color,
      [x, baseY + (ay + by) / 2, z + (az + bz) / 2],
      [pedalVehicle ? 0.17 : 0.34, 0.065, Math.hypot(by - ay, bz - az) + 0.015],
      bike,
    );
    panel.rotation.x = -Math.atan2(by - ay, bz - az);
    panel.name = 'mudguard';
  }
}

function buildHandlebar({ rod, orb, box }, bike, mirrors) {
  const bar = new T.Group();
  bar.name = 'handlebar';
  bar.position.set(0, 1.98, -0.91);
  bike.add(bar);
  rod('#284e48', [-0.49, 0, 0], [0.49, 0, 0], { radius: 0.055, parent: bar });
  for (const side of [-1, 1]) {
    orb('#243f3d', [side * 0.45, 0, 0], [0.15, 0.075, 0.08], bar);
    rod('#bdcbbb', [side * 0.39, -0.015, -0.1], [side * 0.55, -0.04, -0.06], {
      radius: 0.018,
      parent: bar,
    });
    if (!mirrors) continue;
    rod('#afc8be', [side * 0.39, 0.02, 0], [side * 0.58, 0.3, -0.1], {
      radius: 0.018,
      parent: bar,
    });
    orb('#243f3d', [side * 0.59, 0.34, -0.11], [0.105, 0.085, 0.035], bar).name = 'mirror-back';
    orb('#a9ced1', [side * 0.59, 0.34, -0.073], [0.085, 0.065, 0.01], bar).name = 'mirror-glass';
  }
  box('#ddd6bb', [0, 0.03, -0.01], [0.13, 0.08, 0.12], bar);
}

function buildMotorBody({ box, orb, rod }, bike, config, color) {
  const scooter = config.vehicle === 'scooter';
  const motorcycle = config.vehicle === 'motorcycle';
  const part = (name, object) => {
    object.name = name;
    return object;
  };
  if (scooter) {
    part('deck', box(color, [0, 0.48, 0.05], [0.54, 0.16, 1.75], bike));
    rod(color, [0, 0.42, -1.03], [0, 2.0, -0.88], { radius: 0.07, parent: bike });
    box('#f3e6ca', [0, 0.57, 0.12], [0.36, 0.025, 1.22], bike);
  } else {
    part('seat', orb('#243f3d', [0, 1.64, 0.45], [0.36, 0.13, 0.65], bike));
    if (motorcycle) {
      box('#263f40', [0, 1.08, 0.18], [0.3, 0.19, 1.3], bike);
      for (const side of [-1, 1]) {
        orb(color, [side * 0.23, 1.27, 0.58], [0.11, 0.19, 0.38], bike).name = 'side-fairing';
        rod(color, [side * 0.23, 0.63, 0.76], [side * 0.23, 0.62, -0.42], {
          radius: 0.055,
          parent: bike,
        });
        rod(color, [side * 0.23, 0.62, -0.42], [side * 0.23, 1.26, -0.69], {
          radius: 0.055,
          parent: bike,
        });
        rod(color, [side * 0.23, 0.63, 0.76], [side * 0.23, 1.28, 0.5], {
          radius: 0.055,
          parent: bike,
        });
      }
      part('fuel-tank', orb(color, [0, 1.5, -0.43], [0.4, 0.35, 0.57], bike));
      rod('#243f3d', [-0.48, 0.74, 0.13], [0.48, 0.74, 0.13], { radius: 0.04, parent: bike });
      part('engine', box('#536361', [0, 0.84, 0.1], [0.65, 0.42, 0.65], bike));
      for (let index = 0; index < 4; index++)
        box('#afc8be', [0, 0.72 + index * 0.09, 0.1], [0.68, 0.035, 0.68], bike);
      rod('#afc8be', [0.4, 0.75, 0.1], [0.4, 0.75, 1.3], { radius: 0.09, parent: bike });
    } else {
      part('rear-fairing', orb(color, [0, 1.11, 0.64], [0.31, 0.34, 0.52], bike));
      part('battery', box(color, [0, 1.18, -0.57], [0.65, 0.85, 0.3], bike));
      part('floorboard', box('#243f3d', [0, 0.65, -0.2], [0.75, 0.13, 0.9], bike));
      box('#f3e6ca', [0, 1.8, 1.04], [0.65, 0.43, 0.5], bike);
    }
    for (const z of [-1.03, 1.03])
      rod('#afc8be', [0, 0.6, z], [0, 1.4, z * 0.7], { radius: 0.055, parent: bike });
    rod('#afc8be', [0, 1.25, -0.7], [0, 2, -0.88], { radius: 0.07, parent: bike });
    part('headlight', orb('#ffe4a3', [0, 1.74, -1.03], [0.24, 0.2, 0.12], bike));
  }
  buildHandlebar({ rod, orb, box }, bike, !scooter);
  box('#b94336', [0, scooter ? 0.54 : 1.41, 1.35], [scooter ? 0.22 : 0.34, 0.12, 0.07], bike).name =
    'rear-lamp';
  if (scooter) return;
  box('#f3e6ca', [0, 1.1, 1.37], [0.29, 0.16, 0.025], bike).name = 'rear-plate';
  for (const z of [-0.3, 0.05, 0.4]) box('#345b53', [0, 1.646, z], [0.58, 0.028, 0.025], bike);
}
