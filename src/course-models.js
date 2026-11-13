// Geometry belongs to the world pool; course teardown only detaches these nodes.
export function addEntityDetails(world, group, type) {
  switch (type) {
    case 'fish':
      return fishDetails(world, group);
    case 'shield':
      return shieldDetails(world, group);
    case 'item':
      return itemDetails(world, group);
    case 'hurdle':
      return hurdleDetails(world, group);
    case 'gate':
      return gateDetails(world, group);
    case 'crate':
      return crateDetails(world, group);
    default:
      throw new RangeError(`Unknown course model: ${type}`);
  }
}

function fishDetails({ mesh, orb, rod }, group) {
  group.children[0].name = 'fish-body';
  group.children[1].name = 'fish-tail';
  group.children[2].name = 'fish-eye:front';
  mesh('cone', '#df952c', {
    p: [0.035, 0.205, 0],
    s: [0.115, 0.17, 0.035],
    r: [0, 0, -0.4],
    parent: group,
  }).name = 'fish-dorsal-fin';
  mesh('cone', '#e8a434', {
    p: [0.07, -0.18, 0],
    s: [0.085, 0.1, 0.03],
    r: [0, 0, Math.PI + 0.4],
    parent: group,
  });
  orb('#5a5434', [-0.16, 0.045, -0.122], [0.031, 0.036, 0.021], group).name = 'fish-eye:back';
  for (const side of [-1, 1])
    rod('#d08a2b', [-0.075, 0.095, side * 0.125], [-0.035, -0.075, side * 0.125], {
      radius: 0.012,
      parent: group,
    });
  rod('#ffe7a1', [0.035, 0.105, 0.1], [0.19, 0.08, 0.08], { radius: 0.014, parent: group });
}

function shieldDetails({ material, rod, orb }, group) {
  const [ring, crest] = group.children;
  ring.name = 'shield-medallion';
  ring.material = material('#d7a13b');
  crest.name = 'shield-crest';
  crest.material = material('#f1c45a');
  crest.scale.set(0.29, 0.36, 0.09);
  for (const side of [-1, 1]) {
    rod('#fff3c2', [-0.13, 0.11, side * 0.14], [0, -0.13, side * 0.14], {
      radius: 0.028,
      parent: group,
    });
    rod('#fff3c2', [0, -0.13, side * 0.14], [0.13, 0.11, side * 0.14], {
      radius: 0.028,
      parent: group,
    });
  }
  orb('#fff2b1', [0, 0.465, 0], [0.055, 0.055, 0.055], group).name = 'shield-crown';
}

function itemDetails({ box, rod, orb }, group) {
  group.children[0].name = 'item-box';
  box('#245b5c', [0, 1.35, 0.415], [0.59, 0.59, 0.024], group).name = 'item-question-panel';
  const path = [
    [-0.11, 1.48],
    [-0.05, 1.55],
    [0.09, 1.53],
    [0.12, 1.44],
    [0, 1.35],
    [0, 1.29],
  ];
  for (let i = 0; i < path.length - 1; i++)
    rod('#fff0ba', [...path[i], 0.443], [...path[i + 1], 0.443], {
      radius: 0.027,
      parent: group,
    }).name = 'item-question-stroke';
  orb('#fff0ba', [0, 1.19, 0.444], [0.034, 0.034, 0.02], group).name = 'item-question-dot';
  for (const x of [-0.34, 0.34])
    for (const y of [1.01, 1.69]) box('#b8d5ce', [x, y, 0.416], [0.115, 0.115, 0.045], group);
}

function hurdleDetails({ box, orb }, group) {
  group.children[2].name = 'hurdle-crossbar';
  for (const stripe of group.children.slice(3, 6)) stripe.rotation.z = -0.3;
  for (const x of [-0.98, 0.98]) {
    box('#536d60', [x, 0.075, 0], [0.42, 0.15, 0.68], group).name = 'hurdle-foot';
    box('#6f6e4f', [x, 0.53, 0], [0.21, 0.43, 0.28], group);
    for (const y of [0.72, 0.94]) orb('#5c6552', [x, y, 0.175], [0.036, 0.036, 0.015], group);
  }
  box('#f6d597', [0, 1.079, 0], [2.37, 0.043, 0.29], group);
}

function gateDetails({ box, rod, orb }, group) {
  group.children[2].name = 'gate-crossbar';
  for (const side of [-1, 1]) {
    const x = side * 1.18;
    box('#355f5e', [x, 0.065, 0], [0.39, 0.13, 0.59], group).name = 'gate-foot';
    box('#c3d1bc', [x, 0.44, 0], [0.225, 0.66, 0.26], group);
    rod('#86aba0', [x, 2.6, -0.06], [side * 0.7, 2.96, -0.06], { radius: 0.035, parent: group });
    orb('#e1deba', [x, 3.03, 0.206], [0.045, 0.045, 0.022], group);
  }
  for (const x of [-0.6, -0.2, 0.2, 0.6]) {
    const stripe = box('#e9d69b', [x, 3.03, 0.194], [0.15, 0.42, 0.026], group);
    stripe.rotation.z = -0.3;
  }
}

function crateDetails({ box, orb }, group) {
  group.children[0].name = 'crate-body';
  for (let i = 0; i < 4; i++)
    box(
      i % 2 ? '#d3a76c' : '#c69a60',
      [-0.8 + i * 0.53, 2.805, 0],
      [0.49, 0.045, 1.58],
      group,
    ).name = 'crate-top-plank';
  for (const side of [-1, 1]) {
    for (const y of [0.48, 1.4, 2.32])
      box('#c99b65', [side * 1.113, y, 0], [0.035, 0.85, 1.56], group).name = 'crate-side-plank';
    for (const z of [-0.77, 0.77])
      box('#766d56', [side * 1.13, 1.4, z], [0.045, 2.74, 0.085], group).name = 'crate-corner';
    for (const y of [0.17, 2.64])
      orb('#72684f', [side * 0.97, y, 0.976], [0.042, 0.042, 0.02], group).name = 'crate-rivet';
  }
}
