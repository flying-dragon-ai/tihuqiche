import * as T from 'three';

function createGroup(parent, name, position) {
  const group = new T.Group();
  group.name = name;
  group.position.set(...position);
  parent.add(group);
  return group;
}

function createBoat(parent, x, z, wreck, { box, orb, rod, mesh }) {
  const group = createGroup(parent, wreck ? 'shipwreck' : 'moored-boat', [x, -2.05, z]);
  orb(wreck ? '#715847' : '#dfb478', [0, 0.12, 0], [1.45, 0.6, 3.5], group);
  box('#534e43', [0, 0.45, 0], [2.1, 0.17, 5.3], group);
  for (const y of [-1.4, 1.4]) box('#d7bb86', [0, 0.7, y], [2.15, 0.15, 0.55], group);
  for (const side of [-1, 1])
    rod('#aa7651', [side * 1.15, 0.5, -2.1], [side * 1.15, 0.5, wreck ? 0.9 : 2.1], {
      radius: 0.12,
      parent: group,
    });
  rod('#765d45', [0, 0.5, 0], [wreck ? 0.6 : 0, 4.2, 0], { radius: 0.1, parent: group });
  if (wreck) {
    box('#554e4e', [0.95, 3.7, 0], [1.5, 0.85, 0.06], group);
    for (const x of [0.35, 0.9])
      mesh('cone', '#ded4b5', { p: [x, 3.7, 0.07], s: [0.13, 0.3, 0.05], parent: group });
    rod('#d8cda4', [0, 0.5, 2], [0.6, 4.2, 0], { radius: 0.025, parent: group });
    return;
  }
  mesh('cone', '#fff1d6', {
    p: [0.65, 2.35, 0],
    s: [1.1, 3.2, 0.08],
    r: [0, 0, -0.18],
    parent: group,
  });
  mesh('torus', '#e67952', {
    p: [1.3, 0.65, 0.6],
    s: [0.48, 0.48, 0.48],
    r: [0, Math.PI / 2, 0],
    parent: group,
  });
}

function createDock(parent, index, { box, orb, rod, mesh }) {
  const group = createGroup(parent, 'coastal-dock', [-10, -1.45, 4]);
  for (let plank = 0; plank < 8; plank++)
    box(plank % 2 ? '#b99060' : '#cca675', [0, 0.3, plank * 0.7 - 2.5], [6, 0.22, 0.62], group);
  for (const x of [-2.5, 2.5])
    for (const z of [-2.4, 2.4]) {
      rod('#896c4e', [x, -1, z], [x, 1.3, z], { radius: 0.16, parent: group });
      mesh('torus', '#d9c69a', {
        p: [x, 0.9, z],
        s: [0.25, 0.25, 0.25],
        r: [Math.PI / 2, 0, 0],
        parent: group,
      });
    }
  rod('#d9c69a', [-2.5, 1, -2.4], [-2.5, 1, 2.4], { radius: 0.035, parent: group });
  createBoat(parent, -15.3, 4 + (index % 2), false, { box, orb, rod, mesh });
}

function createBeach(parent, index, { box, orb, rod, mesh }) {
  const group = createGroup(parent, 'beach-umbrella', [12, -1.45, 6]);
  rod('#b8956b', [0, 0, 0], [0, 3.8, 0], { radius: 0.09, parent: group });
  mesh('cone', index % 2 ? '#e98765' : '#78bcb0', {
    p: [0, 3.6, 0],
    s: [2.7, 1.1, 2.7],
    parent: group,
  });
  for (let spoke = 0; spoke < 6; spoke++) {
    const angle = (spoke * Math.PI) / 3;
    rod('#fff0cf', [0, 4.15, 0], [Math.cos(angle) * 2.55, 3.07, Math.sin(angle) * 2.55], {
      radius: 0.065,
      parent: group,
    });
  }
  for (const x of [-1, 1]) {
    box('#fff0cd', [x, 0.4, 0.1], [0.75, 0.13, 2.4], group);
    const back = box('#e59a74', [x, 0.86, -0.75], [0.7, 1.2, 0.11], group);
    back.rotation.x = -0.3;
    for (const z of [-0.8, 0.8]) box('#826d52', [x, 0.15, z], [0.65, 0.3, 0.09], group);
  }
  box('#e7b985', [2, 0.03, 1], [1.4, 0.05, 1.8], group);
  orb('#e98565', [2, 0.26, 1], [0.25, 0.25, 0.25], group);
}

function createFern(parent, x, z, { orb, rod }) {
  const group = createGroup(parent, 'rainforest-fern', [x, -1.45, z]);
  orb('#547e60', [0, -0.2, 0], [2.2, 0.45, 2], group);
  for (let index = 0; index < 7; index++) {
    const angle = (index * Math.PI * 2) / 7;
    rod('#59976c', [0, 0, 0], [Math.sin(angle) * 1.7, 1.5, Math.cos(angle) * 1.7], {
      radius: 0.04,
      parent: group,
    });
    const leaf = orb(
      index % 2 ? '#5da277' : '#327d5c',
      [Math.sin(angle), 1, Math.cos(angle)],
      [0.38, 0.12, 1.6],
      group,
    );
    leaf.rotation.set(-0.6, angle, 0);
  }
}

function createJungle(parent, index, { orb, rod, mesh }) {
  createFern(parent, 9, 7, { orb, rod });
  createFern(parent, -11, -8, { orb, rod });
  const group = createGroup(parent, 'jungle-fallen-log', [13, -1.45, -5]);
  rod('#785c40', [-2.4, 0.5, 0], [2.4, 0.5, 0], { radius: 0.55, parent: group });
  mesh('cylinder', '#c7a779', {
    p: [-2.42, 0.5, 0],
    s: [0.47, 0.04, 0.47],
    r: [0, 0, Math.PI / 2],
    parent: group,
  });
  for (let mushroom = 0; mushroom < 3; mushroom++) {
    const x = mushroom - 1;
    rod('#e4cf9a', [x, 0.85, 0.15], [x, 1.2 + mushroom * 0.1, 0.15], {
      radius: 0.07,
      parent: group,
    });
    orb('#d98558', [x, 1.2 + mushroom * 0.1, 0.15], [0.32, 0.12, 0.28], group);
  }
  if (index % 2 !== 0) return;
  const vines = createGroup(parent, 'hanging-vines', [-12, -1.45, 1]);
  orb('#65845f', [0, -0.35, 0], [3.4, 0.35, 2.2], vines);
  rod('#796344', [-2.5, 0, 0], [-2.5, 6.3, 0], { radius: 0.23, parent: vines });
  rod('#796344', [-2.5, 6.1, 0], [2.5, 6.1, 0], { radius: 0.15, parent: vines });
  for (const x of [-2, 0, 2]) {
    rod('#497b4e', [x, 6, 0], [x + 0.4, 3.1, 0.2], { radius: 0.045, parent: vines });
    for (const y of [3.2, 4.2, 5.2]) orb('#558f60', [x + 0.3, y, 0.2], [0.26, 0.12, 0.47], vines);
  }
}

function createTempleDetail(parent, index, { box, orb, rod, mesh }) {
  const group = createGroup(parent, 'temple-carved-shrine', [12, -1.45, 6]);
  for (let tier = 0; tier < 3; tier++)
    box(
      tier % 2 ? '#c6a775' : '#ddc496',
      [0, tier * 0.3 + 0.15, 0],
      [4.4 - tier * 0.7, 0.3, 3.6 - tier * 0.5],
      group,
    );
  box('#b39972', [0, 2.1, 0], [1.4, 2.5, 1.5], group);
  box('#e0c697', [0, 3.55, 0], [2.2, 0.4, 2.2], group);
  for (const x of [-0.35, 0.35]) box('#756e55', [x, 2.35, 0.77], [0.22, 0.22, 0.05], group);
  box('#8c7658', [0, 1.75, 0.79], [0.65, 0.13, 0.07], group);
  for (const side of [-1, 1]) {
    mesh('cylinder', '#857459', {
      p: [side * 1.65, 1.4, 0],
      s: [0.35, 1.5, 0.35],
      parent: group,
    });
    mesh('cone', '#cf985a', {
      p: [side * 1.65, 2.2, 0],
      s: [0.55, 0.5, 0.55],
      r: [0, 0, Math.PI],
      parent: group,
    });
    const flame = mesh('ico', '#ffbb66', {
      p: [side * 1.65, 2.65, 0],
      s: [0.23, 0.6, 0.23],
      parent: group,
    });
    flame.material = flame.material.clone();
    flame.material.emissive.set('#f09640');
    flame.material.emissiveIntensity = 0.8;
  }
  if (index % 2 !== 0) return;
  const flags = createGroup(parent, 'temple-prayer-flags', [-10.5, -1.45, 7]);
  orb('#c5b18b', [0, -0.35, 0], [3, 0.35, 2], flags);
  for (const x of [-2, 2]) rod('#927455', [x, 0, 0], [x, 3.6, 0], { radius: 0.08, parent: flags });
  rod('#d7b990', [-2, 3.3, 0], [2, 3.3, 0], { radius: 0.025, parent: flags });
  for (let flag = 0; flag < 5; flag++)
    box(
      ['#d0825d', '#d8ba70', '#668f83'][flag % 3],
      [flag * 0.7 - 1.4, 2.95, 0],
      [0.48, 0.65, 0.06],
      flags,
    );
}

function createCactus(parent, index, { orb, rod, mesh }) {
  const group = createGroup(parent, 'desert-spiny-cactus', [-12, -1.45, -4]);
  orb('#dcb676', [0, -0.45, 0], [4.7, 0.45, 4], group);
  rod('#527b51', [0, 0, 0], [0, 5.4 + (index % 2), 0], { radius: 0.48, parent: group });
  orb('#719358', [0, 5.4 + (index % 2), 0], [0.48, 0.48, 0.48], group);
  for (const side of [-1, 1]) {
    const height = side === 1 ? 3.1 : 2.1;
    rod('#638657', [0, height, 0], [side * 1.6, height, 0], { radius: 0.3, parent: group });
    rod('#638657', [side * 1.6, height, 0], [side * 1.6, height + 1.7, 0], {
      radius: 0.3,
      parent: group,
    });
    orb('#789963', [side * 1.6, height + 1.7, 0], [0.3, 0.3, 0.3], group);
  }
  for (let spine = 0; spine < 5; spine++)
    for (const side of [-1, 1]) {
      rod(
        '#e6d49a',
        [side * 0.38, 1 + spine * 0.8, 0.26],
        [side * 0.65, 1.18 + spine * 0.8, 0.34],
        { radius: 0.025, parent: group },
      );
    }
  mesh('ico', '#d98273', {
    p: [0, 5.8 + (index % 2), 0],
    s: [0.3, 0.22, 0.3],
    parent: group,
  });
}

function createBoots(parent, { box, orb }) {
  const group = createGroup(parent, 'lost-desert-boots', [8.2, -1.45, 8]);
  for (const x of [-0.4, 0.4]) {
    box('#574c40', [x, 0.1, 0.1], [0.55, 0.18, 1], group);
    box('#a8794d', [x, 0.55, -0.15], [0.5, 0.9, 0.55], group);
    orb('#ba925d', [x, 0.3, 0.26], [0.28, 0.23, 0.55], group);
    box('#674f3c', [x, 1.01, -0.15], [0.39, 0.05, 0.4], group);
    for (const y of [0.4, 0.58, 0.76]) box('#d5bd83', [x, y, 0.14], [0.3, 0.035, 0.045], group);
  }
}

function createScorpion(parent, { orb, rod, mesh }) {
  const group = createGroup(parent, 'desert-scorpion', [8, -1.45, -8]);
  orb('#765138', [0, 0.2, 0], [0.45, 0.23, 0.75], group);
  for (const side of [-1, 1]) {
    for (let leg = 0; leg < 3; leg++)
      rod('#8b633e', [side * 0.25, 0.15, leg * 0.35 - 0.25], [side * 0.9, 0.05, leg * 0.5 - 0.4], {
        radius: 0.055,
        parent: group,
      });
    rod('#8b633e', [side * 0.25, 0.2, -0.4], [side * 0.65, 0.25, -1], {
      radius: 0.09,
      parent: group,
    });
    orb('#765138', [side * 0.65, 0.25, -1.15], [0.19, 0.14, 0.26], group);
  }
  for (let segment = 0; segment < 4; segment++)
    orb(
      '#986c42',
      [0, 0.3 + segment * 0.25, 0.6 + Math.sin(segment * 0.8) * 0.45],
      [0.17 - segment * 0.02, 0.2, 0.17],
      group,
    );
  mesh('cone', '#624c37', {
    p: [0, 1.15, 0.55],
    s: [0.1, 0.45, 0.1],
    r: [Math.PI / 3, 0, 0],
    parent: group,
  });
}

function createTreasure(parent, { box, orb, rod }) {
  const group = createGroup(parent, 'pirate-treasure', [8.5, -1.45, 7]);
  box('#75503a', [0, 0.45, 0], [1.8, 0.9, 1.3], group);
  const lid = box('#956d42', [0, 1.2, -0.5], [1.8, 0.2, 1.3], group);
  lid.rotation.x = -0.7;
  for (const x of [-0.6, 0.6]) box('#c79c58', [x, 0.48, 0.67], [0.16, 0.96, 0.09], group);
  for (let coin = 0; coin < 5; coin++)
    orb(
      '#eac56b',
      [((coin % 3) - 1) * 0.4, 0.86 + (coin % 2) * 0.08, 0.2],
      [0.22, 0.09, 0.22],
      group,
    );
  for (const x of [-1.3, 1.4]) {
    rod('#d8cfb0', [x, 0.08, -0.5], [x + 0.3, 0.08, 1.1], { radius: 0.12, parent: group });
    orb('#e1d7b6', [x + 0.3, 0.08, 1.1], [0.2, 0.17, 0.17], group);
  }
}

function addNature(parent, id, index, deps) {
  if (id === 'coast') {
    if (index % 2 === 0) createDock(parent, index, deps);
    else createBeach(parent, index, deps);
  }
  if (id === 'jungle') createJungle(parent, index, deps);
  if (id === 'temple') createTempleDetail(parent, index, deps);
  if (id === 'desert') {
    if (index % 2 === 0) createCactus(parent, index, deps);
    if (index % 3 === 0) createBoots(parent, deps);
    if (index % 3 === 1) createScorpion(parent, deps);
    deps.orb('#e2c58e', [9.4, -1.75, 8], [2.8, 0.3, 2.5], parent);
  }
  if (id === 'skull') {
    if (index % 2 === 0) createBoat(parent, -12, 5, true, deps);
    else createTreasure(parent, deps);
  }
}

// Scattered details use the existing primitive pool, with solid props outside the railings.
export function createSceneryProps({ box, orb, rod, mesh }) {
  const deps = { box, orb, rod, mesh };
  return {
    addNature: (parent, id, index) => addNature(parent, id, index, deps),
  };
}
