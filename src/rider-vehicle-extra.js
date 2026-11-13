import * as T from 'three';
import { riderColor } from './appearance.js';

export function buildExtraVehicle(world, bike, config) {
  const color = riderColor(config.vehicleColor);
  if (config.vehicle === 'plane') return buildPlane(world, bike, color);
  return buildCar(world, bike, { color, truck: config.vehicle === 'truck' });
}

function buildCar({ box, orb, rod, mesh }, bike, { color, truck }) {
  const part = (name, obj) => {
    obj.name = name;
    return obj;
  };
  part('chassis', box('#263f40', [0, 0.65, 0], [1.38, 0.27, 2.7], bike));
  box(color, [0, truck ? 0.92 : 0.86, -1], [1.42, truck ? 0.61 : 0.5, 0.72], bike);
  part('hood', orb(color, [0, 1.13, -0.99], [0.69, 0.12, 0.37], bike));
  for (const x of [-0.69, 0.69]) {
    box(color, [x, 1.03, 0.06], [0.13, 0.65, 1.36], bike);
    box('#afc8be', [x * 1.02, 1.24, -0.02], [0.025, 0.06, 0.25], bike);
  }
  part('seat', box('#243f3d', [0, 1.29, 0.42], [0.96, 0.43, 0.23], bike));
  box('#243f3d', [0, 1.08, 0.12], [0.92, 0.18, 0.7], bike);
  const screenY = truck ? 1.61 : 1.47;
  part('windshield', box('#8dbbc0', [0, screenY, -0.64], [1.17, 0.34, 0.055], bike));
  for (const x of [-0.63, 0.63])
    rod('#f3e6ca', [x, 1.23, -0.65], [x, screenY + 0.2, -0.64], { radius: 0.035, parent: bike });
  rod('#f3e6ca', [-0.63, screenY + 0.2, -0.64], [0.63, screenY + 0.2, -0.64], {
    radius: 0.035,
    parent: bike,
  });
  part(
    'steering-wheel',
    mesh('torus', '#243f3d', {
      p: [0, 1.54, -0.44],
      s: [0.2, 0.2, 0.2],
      r: [-0.35, 0, 0],
      parent: bike,
    }),
  );
  for (const z of [-1.4, 1.4]) box('#afc8be', [0, 0.69, z], [1.53, 0.13, 0.11], bike);
  part('grille', box('#243f3d', [0, 0.88, -1.37], [0.69, 0.17, 0.03], bike));
  for (const x of [-0.49, 0.49]) {
    orb('#ffe4a3', [x, 1.02, -1.38], [0.16, 0.12, 0.05], bike);
  }
  if (truck) buildCargo({ box, rod }, bike, color);
  else {
    part('trunk', box(color, [0, 1.01, 1.01], [1.42, 0.51, 0.71], bike));
    box('#f3e6ca', [0, 1.28, 1.03], [0.22, 0.04, 0.67], bike);
  }
  addCarTrim({ box, orb, rod }, bike, { truck, screenY });
  return {
    pose: truck
      ? { birdY: 2, hipY: 1.9, footY: 1.04, footZ: -0.28, kneeY: 1.4, kneeZ: -0.4 }
      : { birdY: 1.83, hipY: 1.73, footY: 0.88, footZ: -0.32, kneeY: 1.25, kneeZ: -0.36 },
    exhaust: { x: 0, y: truck ? 0.7 : 0.6, z: truck ? 1.64 : 1.55, scale: 1.05 },
  };
}

function buildCargo({ box, rod }, bike, color) {
  box(color, [0, 0.9, 1.0], [1.49, 0.33, 1.16], bike).name = 'cargo-bed';
  for (const x of [-0.71, 0.71]) {
    box(color, [x, 1.16, 1.01], [0.1, 0.5, 1.16], bike);
    rod('#536f69', [x, 1.435, 0.46], [x, 1.435, 1.57], { radius: 0.035, parent: bike });
  }
  box(color, [0, 1.16, 1.55], [1.49, 0.5, 0.08], bike).name = 'tailgate';
  const crate = box('#b88c58', [-0.24, 1.39, 1.18], [0.62, 0.68, 0.63], bike);
  crate.name = 'cargo-crate';
  box('#dbb77b', [0.4, 1.29, 1.19], [0.49, 0.48, 0.63], bike);
  for (const x of [-0.44, -0.04, 0.25, 0.54])
    box('#edd19a', [x, 1.4, x < 0 ? 1.505 : 1.515], [0.065, x < 0 ? 0.63 : 0.4, 0.025], bike);
  for (const [x, y] of [
    [-0.24, 1.78],
    [0.4, 1.55],
  ])
    rod('#365d51', [x, y, 0.89], [x, y, 1.5], { radius: 0.022, parent: bike });
  box('#e7c995', [-0.24, 1.74, 1.18], [0.66, 0.045, 0.66], bike);
  box('#365d51', [-0.24, 1.77, 1.18], [0.09, 0.025, 0.68], bike);
  for (const x of [-0.43, 0.43]) box('#536f69', [x, 1.0, 1.6], [0.15, 0.07, 0.035], bike);
}

function addCarTrim({ box, orb, rod }, bike, { truck, screenY }) {
  for (const side of [-1, 1]) {
    rod('#afc8be', [side * 0.67, 1.37, -0.57], [side * 0.82, 1.43, -0.63], {
      radius: 0.024,
      parent: bike,
    });
    box('#274e49', [side * 0.85, 1.46, -0.65], [0.15, 0.13, 0.08], bike).name = 'mirror-back';
    box('#aad0d0', [side * 0.85, 1.46, -0.602], [0.11, 0.09, 0.012], bike);
    box('#f3e6ca', [side * 0.735, 0.84, 0.04], [0.025, 0.06, 1.35], bike).name = 'door-trim';
    box('#7caaa9', [side * 0.24, screenY, -0.679], [0.045, 0.3, 0.012], bike).rotation.z = -0.12;
    box('#284e48', [side * 0.71, 1.12, -0.37], [0.024, 0.31, 0.018], bike).name = 'door-seam';
    box('#a33f33', [side * 0.5, 0.94, truck ? 1.604 : 1.384], [0.27, 0.17, 0.036], bike).name =
      'tail-lamp';
    box('#ffd070', [side * 0.58, 0.97, truck ? 1.627 : 1.409], [0.065, 0.11, 0.016], bike);
  }
  for (const x of [-0.25, -0.125, 0, 0.125, 0.25])
    box('#c4d1bf', [x, 0.88, -1.39], [0.03, 0.145, 0.018], bike);
  box('#fff0cd', [0, 0.76, truck ? 1.608 : 1.458], [0.31, 0.13, 0.025], bike).name =
    'license-plate';
  box('#345b53', [0, 0.78, truck ? 1.624 : 1.474], [0.13, 0.02, 0.008], bike);
  orb('#e9ca84', [0, 1.266, -1.05], [0.08, 0.025, 0.11], bike).name = 'hood-badge';
}

function buildPlane(world, bike, color) {
  const { box, orb, rod } = world;
  const part = (name, obj) => {
    obj.name = name;
    return obj;
  };
  part('fuselage', orb(color, [0, 0.94, 0.12], [0.57, 0.38, 1.43], bike));
  orb('#f3e6ca', [0, 0.97, -1.26], [0.41, 0.31, 0.45], bike);
  part('cockpit', orb('#243f3d', [0, 1.25, 0.12], [0.4, 0.1, 0.58], bike));
  part('wings', box(color, [0, 0.89, -0.1], [2.82, 0.13, 0.69], bike));
  for (const x of [-1.29, 1.29]) box('#f3e6ca', [x, 0.963, -0.1], [0.21, 0.025, 0.69], bike);
  for (const x of [-0.48, 0.48])
    rod('#afc8be', [x, 0.25 * 1.13, -0.44], [x * 0.5, 0.83, -0.1], { radius: 0.055, parent: bike });
  rod('#afc8be', [0, 0.17 * 1.13, 1.13], [0, 0.76, 1.15], { radius: 0.04, parent: bike });
  part('tailplane', box(color, [0, 1.11, 1.25], [1.3, 0.11, 0.54], bike));
  part('tail-fin', box(color, [0, 1.36, 1.24], [0.13, 0.62, 0.53], bike)).rotation.x = -0.2;
  box('#f3e6ca', [0, 1.48, 1.27], [0.145, 0.1, 0.43], bike);
  part('windscreen', orb('#8dbbc0', [0, 1.35, -0.43], [0.34, 0.18, 0.09], bike));
  const propeller = new T.Group();
  propeller.name = 'propeller';
  propeller.position.set(0, 0.99, -1.74);
  bike.add(propeller);
  for (const rotation of [0, Math.PI / 2]) {
    const blade = box('#f3e6ca', [0, 0, 0], [0.13, 1.09, 0.06], propeller);
    blade.rotation.z = rotation;
    for (const tip of [-0.49, 0.49]) {
      const mark = box('#d78a43', [0, tip, 0], [0.135, 0.1, 0.068], propeller);
      mark.rotation.z = rotation;
      mark.position.set(-Math.sin(rotation) * tip, Math.cos(rotation) * tip, 0);
    }
  }
  orb('#e7a343', [0, 0, -0.055], [0.13, 0.13, 0.11], propeller);
  addPlaneTrim(world, bike);
  return {
    pose: { birdY: 1.9, hipY: 1.8, footY: 0.98, footZ: -0.45, kneeY: 1.29, kneeZ: -0.42 },
    exhaust: { x: 0, y: 0.83, z: 1.62, scale: 0.9 },
    animate: ({ dt, moving, boosting }) => {
      if (moving) propeller.rotation.z += dt * (boosting ? 60 : 36);
    },
  };
}

function addPlaneTrim({ box, orb, rod, mesh }, bike) {
  for (const side of [-1, 1]) {
    box('#ca9e63', [side * 0.84, 0.968, 0.18], [0.88, 0.025, 0.035], bike).name = 'flap-seam';
    box('#fff0cf', [side * 0.7, 0.95, -0.43], [1.34, 0.033, 0.035], bike).name = 'leading-edge';
    rod('#e7d3aa', [side * 0.32, 1.16, 0.2], [side * 1.03, 0.96, -0.1], {
      radius: 0.026,
      parent: bike,
    });
    mesh('cylinder', '#fff0cf', {
      p: [side * 1.01, 0.975, -0.1],
      s: [0.145, 0.018, 0.145],
      parent: bike,
    }).name = 'wing-roundel';
    mesh('cylinder', '#39726b', {
      p: [side * 1.01, 0.986, -0.1],
      s: [0.075, 0.018, 0.075],
      parent: bike,
    });
    orb(
      side < 0 ? '#bd5140' : '#5aaf87',
      [side * 1.4, 0.92, -0.09],
      [0.036, 0.045, 0.06],
      bike,
    ).name = 'navigation-lamp';
    rod('#afc8be', [side * 0.08, 0.83, 1.16], [side * 0.52, 1.1, 1.33], {
      radius: 0.022,
      parent: bike,
    });
    box('#fff0cf', [side * 0.573, 1.0, 0.55], [0.02, 0.075, 0.38], bike).name = 'fuselage-stripe';
  }
  const rudder = box('#eddbad', [0, 1.39, 1.45], [0.145, 0.4, 0.11], bike);
  rudder.rotation.x = -0.2;
  rudder.name = 'rudder';
  for (const side of [-1, 1])
    orb('#fff0cf', [side * 0.585, 0.98, 0.52], [0.018, 0.105, 0.12], bike);
}
