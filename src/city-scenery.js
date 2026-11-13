import * as T from 'three';
import { LEVELS } from './levels.js';

function createSailGeometry() {
  const vertices = [-0.55, 1, -0.1];
  const indices = [];
  const segments = 8;
  const rows = 4;
  for (let row = 1; row <= rows; row++) {
    const t = row / rows;
    for (let index = 0; index <= segments; index++) {
      const angle = (index * Math.PI) / segments;
      vertices.push(
        -0.55 * (1 - t) + Math.cos(angle) * t,
        1 - t + Math.sin(t * Math.PI) * 0.12,
        -0.1 + Math.sin(angle) * 0.9 * t,
      );
    }
  }
  for (let index = 0; index < segments; index++) indices.push(0, index + 1, index + 2);
  for (let row = 0; row < rows - 1; row++)
    for (let index = 0; index < segments; index++) {
      const a = 1 + row * (segments + 1) + index;
      const b = a + segments + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  const geometry = new T.BufferGeometry();
  geometry.name = 'pointed-city-sail';
  geometry.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTokyoTower(group, { box, rod }) {
  group.name = 'tokyo-tower';
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      rod('#d95645', [x * 5, 0, z * 4], [x * 1.2, 20, z], { radius: 0.45, parent: group });
      rod('#f6e6cb', [x * 1.2, 20, z], [0, 31, 0], { radius: 0.24, parent: group });
    }
  for (let y = 4; y < 22; y += 4) {
    const width = 5 - y * 0.17;
    box(y % 8 ? '#f6e6cb' : '#d95645', [0, y, 0], [width * 2, 0.65, width * 1.6], group);
    for (const side of [-1, 1])
      rod(
        '#d95645',
        [-width, y, side * width * 0.8],
        [width - 0.65, y + 4, side * (width - 0.65) * 0.8],
        { radius: 0.16, parent: group },
      );
  }
  box('#d95645', [0, 15, 0], [7, 2, 5.5], group);
  box('#f5edcf', [0, 15.2, 2.8], [5.8, 0.8, 0.15], group);
  for (const x of [-2.2, -1.1, 0, 1.1, 2.2])
    box('#748b8c', [x, 15.2, 2.91], [0.65, 0.5, 0.07], group);
  box('#f3d9b2', [0, 6.8, 0], [9, 0.35, 6.6], group);
  rod('#d95645', [0, 27, 0], [0, 35, 0], { radius: 0.15, parent: group });
}

function createEiffelTower(group, { box, rod, mesh }) {
  group.name = 'eiffel-tower';
  for (const x of [-1, 1])
    for (const z of [-1, 1]) {
      rod('#89715c', [x * 6, 0, z * 4], [x * 2.7, 10, z * 1.9], { radius: 0.55, parent: group });
      rod('#89715c', [x * 2.7, 10, z * 1.9], [x * 1.1, 20, z * 0.8], {
        radius: 0.35,
        parent: group,
      });
      rod('#89715c', [x * 1.1, 20, z * 0.8], [0, 30, 0], { radius: 0.22, parent: group });
    }
  for (const [y, width] of [
    [9, 8],
    [18, 4.5],
    [27, 2],
  ])
    box('#b7966d', [0, y, 0], [width, 0.8, width * 0.7], group);
  for (let y = 10; y < 25; y += 3) {
    const width = 3.3 - y * 0.1;
    for (const side of [-1, 1])
      rod(
        '#89715c',
        [-width, y, side * width * 0.7],
        [width - 0.3, y + 3, side * (width - 0.3) * 0.7],
        { radius: 0.12, parent: group },
      );
  }
  rod('#89715c', [0, 29, 0], [0, 33, 0], { radius: 0.13, parent: group });
  mesh('torus', '#a08463', { p: [0, 3.3, 2.1], s: [3.4, 2.7, 0.7], parent: group });
  box('#89715c', [0, 0.35, 0], [13, 0.7, 9], group);
}

function createBigBen(group, { box, rod, mesh }) {
  group.name = 'big-ben';
  box('#b9a47e', [0, 11, 0], [5, 22, 5], group);
  for (const x of [-2.25, 2.25]) box('#ddc59a', [x, 11, 2.6], [0.45, 22, 0.5], group);
  for (let y = 3; y < 18; y += 3)
    for (const x of [-1.1, 1.1]) box('#655e52', [x, y, 2.55], [0.5, 1.6, 0.12], group);
  box('#ddc59a', [0, 20, 0], [6.2, 4.5, 6.2], group);
  const clock = mesh('cylinder', '#fff0c9', {
    p: [0, 20, 3.2],
    s: [1.7, 0.12, 1.7],
    r: [Math.PI / 2, 0, 0],
    parent: group,
  });
  clock.name = 'clock-face';
  rod('#4b5554', [0, 20, 3.3], [0, 21.2, 3.3], { radius: 0.085, parent: group });
  rod('#4b5554', [0, 20, 3.3], [1, 19.5, 3.3], { radius: 0.085, parent: group });
  mesh('torus', '#d4b982', { p: [0, 20, 3.3], s: [1.78, 1.78, 0.5], parent: group });
  for (let index = 0; index < 12; index++) {
    const angle = (index * Math.PI) / 6;
    rod(
      '#776e57',
      [Math.sin(angle) * 1.27, 20 + Math.cos(angle) * 1.27, 3.32],
      [Math.sin(angle) * 1.5, 20 + Math.cos(angle) * 1.5, 3.32],
      { radius: 0.04, parent: group },
    );
  }
  mesh('cone', '#577471', {
    p: [0, 26, 0],
    s: [4, 7, 4],
    r: [0, Math.PI / 4, 0],
    parent: group,
  });
  rod('#d9ba73', [0, 28, 0], [0, 32, 0], { radius: 0.17, parent: group });
}

function createStatueOfLiberty(group, { box, orb, rod, mesh }) {
  group.name = 'statue-of-liberty';
  box('#b9a48b', [0, 3, 0], [7, 6, 6], group);
  box('#cbb999', [0, 6, 0], [8, 1, 7], group);
  box('#bba988', [0, 0.3, 0], [9, 0.6, 8], group);
  for (const x of [-2.2, 0, 2.2]) box('#887f6d', [x, 3, 3.05], [0.8, 2.6, 0.1], group);
  mesh('cone', '#73a99b', { p: [0, 12, 0], s: [3.2, 12, 2.8], parent: group });
  orb('#73a99b', [0, 19, 0], [1.55, 2, 1.35], group);
  for (let index = 0; index < 7; index++) {
    const angle = (index - 3) * 0.4;
    rod(
      '#73a99b',
      [Math.sin(angle), 20, 0.3],
      [Math.sin(angle) * 2.8, 20 + Math.cos(angle) * 2, 0.3],
      { radius: 0.13, parent: group },
    );
  }
  rod('#73a99b', [1.2, 16, 0], [4, 24, 0], { radius: 0.65, parent: group });
  rod('#73a99b', [-1.2, 16, 0], [-2.1, 12, 1], { radius: 0.65, parent: group });
  box('#558c83', [-1.8, 12, 1.5], [2.2, 3.2, 0.6], group);
  for (const x of [-1.4, -0.6, 0.3, 1.1])
    rod('#589083', [x * 1.5, 6.8, 1.4], [x * 0.65, 15.1, 1], { radius: 0.1, parent: group });
  box('#c39753', [4, 24.5, 0], [2.2, 1, 2.2], group);
  const flame = orb('#ffd376', [4, 26, 0], [0.85, 1.5, 0.85], group);
  flame.material = flame.material.clone();
  flame.material.emissive.set('#e8b347');
  flame.material.emissiveIntensity = 0.65;
}

function createSydneyOperaHouse(group, { box, mesh, sailGeometry }) {
  group.name = 'sydney-opera-house';
  box('#c4a17c', [0, 1, 0], [22, 2, 11], group);
  for (let row = 0; row < 3; row++)
    box('#d4bd97', [0, 0.2 + row * 0.35, 6.2 - row * 0.45], [23 - row * 0.5, 0.35, 0.9], group);
  for (let index = 0; index < 5; index++) {
    const height = 7 + (2 - Math.abs(index - 2)) * 3;
    const sail = mesh(sailGeometry, index % 2 ? '#faf3dc' : '#e4e8de', {
      p: [(index - 2) * 3.5, 2, index % 2 ? -1.5 : 1],
      s: [4.5, height, 6],
      parent: group,
    });
    // The open shell is visible from both sides as the camera moves along the harbour.
    sail.material = sail.material.clone();
    sail.material.side = T.DoubleSide;
    box('#4f737d', [(index - 2) * 3.5, 2.8, 4], [2.8, 1.5, 0.2], group);
    for (const x of [-0.8, 0, 0.8])
      box('#d4d7c2', [(index - 2) * 3.5 + x, 2.8, 4.15], [0.06, 1.5, 0.08], group);
  }
}

function createBurjKhalifa(group, { box, rod, mesh, sailGeometry }) {
  group.name = 'burj-khalifa';
  for (let index = 0; index < 7; index++) {
    const width = 8 - index;
    box(
      index % 2 ? '#8aacb6' : '#aec7ca',
      [(index % 2) * 0.7, 2.5 + index * 5, 0],
      [width, 5.2, width * 0.75],
      group,
    );
    box(
      '#d4ddd5',
      [(index % 2) * 0.7, 5 + index * 5, 0],
      [width + 0.25, 0.35, width * 0.75 + 0.25],
      group,
    );
    for (const x of [-0.3, 0.3])
      box(
        '#648b9c',
        [(index % 2) * 0.7 + x * width, 2.5 + index * 5, width * 0.375 + 0.04],
        [0.15, 4.7, 0.08],
        group,
      );
  }
  rod('#dce2d8', [0, 34, 0], [0, 45, 0], { radius: 0.2, parent: group });
  box('#d1bd9d', [13, 0.5, 0], [9, 1, 9], group);
  const sail = mesh(sailGeometry, '#f4ead7', {
    p: [11, 1, 0],
    s: [6, 19, 4],
    r: [0, 0, -0.13],
    parent: group,
  });
  sail.material = sail.material.clone();
  sail.material.side = T.DoubleSide;
  rod('#b3c6cb', [11, 1, 0], [11, 23, 0], { radius: 0.3, parent: group });
  for (const y of [4, 7, 10, 13]) box('#779ea5', [12.5, y, 1.4], [3.6, 0.18, 0.2], group);
  mesh('cylinder', '#c8d6ca', { p: [10.2, 18, 1], s: [2, 0.22, 2], parent: group });
}

function createParkedVehicle(group, id, x, { box, mesh }) {
  const bus = id === 'london';
  const height = bus ? 3.7 : 1.6;
  const platform = box(
    LEVELS.find((level) => level.id === id).ground,
    [x, -1.9, 0],
    [4.4, 0.9, 8],
    group,
  );
  platform.name = 'vehicle-platform';
  const vehicle = new T.Group();
  vehicle.name = bus ? 'roadside-bus' : 'roadside-taxi';
  group.add(vehicle);
  box(bus ? '#ca4949' : '#edbc46', [x, height / 2, 0], [2.8, height, 6], vehicle);
  for (const y of bus ? [1.4, 2.9] : [1.25]) {
    box('#83b1ba', [x, y, 3.04], [2.3, 0.7, 0.1], vehicle);
    for (const z of [-1.9, 0, 1.9])
      box('#83b1ba', [x - Math.sign(x) * 1.43, y, z], [0.1, 0.7, 1.1], vehicle);
  }
  for (const z of [-1.8, 1.8])
    for (const side of [-1, 1])
      mesh('cylinder', '#3e4d55', {
        p: [x + side * 1.35, 0.1, z],
        s: [0.5, 0.25, 0.5],
        r: [0, 0, Math.PI / 2],
        parent: vehicle,
      });
  if (!bus) box('#fff0a1', [x, 2, 0], [0.9, 0.35, 0.7], vehicle);
  box('#536064', [x, 0.15, 3.07], [2.4, 0.2, 0.16], vehicle);
  for (const side of [-1, 1])
    box('#ffe4b0', [x + side * 0.95, 0.52, 3.08], [0.38, 0.25, 0.08], vehicle);
  box('#f2ddb8', [x, 0.6, 3.09], [0.55, 0.22, 0.05], vehicle);
  vehicle.position.y =
    new T.Box3().setFromObject(platform).max.y - new T.Box3().setFromObject(vehicle).min.y;
}

function createRoadside(group, id, index, { box, orb, rod, mesh, roofGeometry }) {
  const x = index % 2 ? -10 : 10;
  if (id === 'tokyo') {
    rod('#826651', [x, -1.4, 0], [x, 4, 0], { radius: 0.22, parent: group });
    for (const side of [-1, 1])
      rod('#826651', [x, 2.5, 0], [x + side * 1.7, 4, 0], { radius: 0.12, parent: group });
    for (const side of [-1, 0, 1])
      orb(
        side ? '#efa9bd' : '#f7c3d0',
        [x + side * 1.6, 4 + (side === 0 ? 1 : 0), 0],
        [2.2, 1.7, 2],
        group,
      );
    for (const side of [-1, 1])
      rod('#c45749', [-x + side * 1.5, -1.4, -4], [-x + side * 1.5, 4.5, -4], {
        radius: 0.2,
        parent: group,
      });
    box('#d86754', [-x, 4.5, -4], [4.4, 0.5, 0.65], group);
    box('#454a50', [-x, 5, -4], [5, 0.25, 0.8], group);
    box('#a95344', [-x, 3.6, -4], [3.7, 0.22, 0.45], group);
    for (const side of [-1, 1]) {
      box('#776d5c', [-x + side * 1.5, -1.25, -4], [0.75, 0.4, 0.75], group);
      rod('#564d48', [-x + side * 0.8, 3.65, -4], [-x + side * 0.8, 2.9, -4], {
        radius: 0.035,
        parent: group,
      });
      orb('#e88e75', [-x + side * 0.8, 2.65, -4], [0.29, 0.46, 0.29], group);
    }
    return;
  }
  if (id === 'london' || id === 'newyork') {
    createParkedVehicle(group, id, x, { box, mesh });
    return;
  }
  if (id === 'paris') {
    box('#cfbca5', [x, 2.6, 0], [4, 8, 4], group);
    mesh(roofGeometry, '#697a84', {
      p: [x, 7.4, 0],
      s: [3.1, 1.6, 3.1],
      r: [0, Math.PI / 4, 0],
      parent: group,
    });
    box('#988974', [x + 1.1, 8.4, -0.5], [0.55, 1.6, 0.65], group);
    box('#6a7776', [x, -0.35, 2.04], [0.9, 2.1, 0.1], group);
    for (const y of [2.5, 4.3, 6])
      for (const offset of [-1.1, 1.1]) {
        box('#76939c', [x + offset, y, 2.05], [0.75, 1.2, 0.1], group);
        box('#dfcaa9', [x + offset, y + 0.67, 2.12], [0.95, 0.13, 0.2], group);
      }
    for (let flag = 0; flag < 3; flag++)
      box(['#537a9c', '#eee7d4', '#c96962'][flag], [x + flag - 1, 1.3, 2.3], [1, 0.35, 1.5], group);
    rod('#4d6261', [-x, -1.4, 0], [-x, 5.5, 0], { radius: 0.13, parent: group });
    orb('#ffdc91', [-x, 5.5, 0], [0.6, 0.85, 0.6], group);
    return;
  }
  box(id === 'dubai' ? '#c6b299' : '#d2bb94', [x, -0.6, 0], [5, 1.4, 5], group);
  rod('#ac8960', [x, 0, 0], [x + 0.5, 5, 0], { radius: 0.2, parent: group });
  for (let leaf = 0; leaf < 5; leaf++)
    mesh('sphere', '#52987b', {
      p: [x + 0.5, 5, 0],
      s: [0.4, 0.18, 2.7],
      r: [0.15, (leaf * Math.PI) / 5, 0],
      parent: group,
    });
  if (id === 'sydney') {
    box('#f4e4c3', [-x, -1.5, 0], [1.8, 0.5, 4], group);
    rod('#8c755b', [-x, -1.3, 0], [-x, 3.5, 0], { radius: 0.07, parent: group });
    mesh('cone', '#fff1d7', { p: [-x + 0.55, 1, 0], s: [1.25, 4, 0.1], parent: group });
    return;
  }
  box('#9eb5ba', [-x, 4, 0], [4, 11, 4], group);
  for (const y of [0, 2, 4, 6, 8]) box('#698b95', [-x, y, 2.04], [3.6, 0.2, 0.1], group);
  for (const offset of [-1, 1]) box('#c0cecb', [-x + offset, 4, 2.1], [0.1, 10.8, 0.1], group);
}

function createSkyline(parent, id, { box, landmarks }) {
  const group = new T.Group();
  group.position.set(id === 'sydney' ? -24 : -21, -1.4, -115);
  parent.add(group);
  landmarks[id](group);
  if (id === 'sydney') group.scale.setScalar(1.25);
  if (id === 'dubai') group.scale.setScalar(0.72);
  for (let index = 0; index < 6; index++) {
    const x = 13 + index * 9;
    const height = 9 + (index % 3) * 4;
    box(
      id === 'dubai' ? '#9cb5ba' : '#879ca2',
      [x, 3 + (index % 3) * 2, -145],
      [5, height, 6],
      parent,
    );
    for (const offset of [-1.3, 1.3])
      box('#b4c2be', [x + offset, 3 + (index % 3) * 2, -141.95], [0.17, height - 1, 0.08], parent);
    box('#b5c3bb', [x, 7.7 + (index % 3) * 4, -145], [4, 0.35, 5], parent);
  }
}

// Static city scenery shares the world's primitives and is disposed with the world.
export function createCityScenery({ box, orb, rod, mesh }) {
  const roofGeometry = new T.CylinderGeometry(0.62, 1, 1, 4);
  const sailGeometry = createSailGeometry();
  const landmarks = {
    tokyo: (group) => createTokyoTower(group, { box, rod }),
    paris: (group) => createEiffelTower(group, { box, rod, mesh }),
    london: (group) => createBigBen(group, { box, rod, mesh }),
    newyork: (group) => createStatueOfLiberty(group, { box, orb, rod, mesh }),
    sydney: (group) => createSydneyOperaHouse(group, { box, mesh, sailGeometry }),
    dubai: (group) => createBurjKhalifa(group, { box, rod, mesh, sailGeometry }),
  };

  function roadside(group, id, index) {
    createRoadside(group, id, index, { box, orb, rod, mesh, roofGeometry });
  }

  function skyline(parent, id) {
    createSkyline(parent, id, { box, landmarks });
  }

  return { roadside, skyline };
}
