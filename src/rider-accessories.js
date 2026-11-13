import * as T from 'three';
import { riderColor } from './appearance.js';

export const SKIN_COLORS = Object.freeze({
  cream: ['#fff9e8', '#e3e9dc', '#d8e1d5', '#fffdf0', '#eaf0e4', '#dce7db'],
  silver: ['#d9e0e5', '#adbcc7', '#99aab9', '#edf1f5', '#c2ced8', '#aabcc9'],
  brown: ['#d9b99a', '#b8977b', '#a8876a', '#efdbc5', '#cfaf91', '#bda184'],
  pink: ['#f4d2d7', '#dbafb9', '#c798a6', '#ffe8e9', '#ebc3cf', '#d8abba'],
});

function createGroup(parent, name) {
  const group = new T.Group();
  group.name = name;
  parent.add(group);
  return group;
}

function addHat(head, config, { orb, box, rod, mesh }) {
  const hat = createGroup(head, 'hat:' + config.hat);
  const color = riderColor(config.hatColor);
  if (config.hat === 'none') return;
  orb(color, [0, 0.28, 0.015], [0.407, 0.226, 0.407], hat);
  if (config.hat === 'helmet') {
    mesh('torus', '#345b53', {
      p: [0, 0.245, 0.015],
      s: [0.388, 0.388, 0.085],
      r: [Math.PI / 2, 0, 0],
      parent: hat,
    }).name = 'helmet-rim';
    box('#ffdab1', [0, 0.507, 0.015], [0.09, 0.013, 0.27], hat);
    for (const side of [-1, 1]) {
      box('#345b53', [side * 0.18, 0.468, 0.015], [0.057, 0.016, 0.19], hat).rotation.z =
        -side * 0.33;
      rod('#345b53', [side * 0.35, 0.12, -0.06], [side * 0.26, -0.25, 0.08], {
        radius: 0.022,
        parent: hat,
      });
      box('#f3e6ca', [side * 0.275, -0.2, 0.06], [0.055, 0.055, 0.04], hat);
    }
    box('#fff1c7', [0, 0.32, 0.396], [0.19, 0.075, 0.027], hat).name = 'helmet-reflector';
    return;
  }
  orb(color, [0, 0.285, -0.43], [0.355, 0.037, 0.31], hat).name = 'cap-visor';
  orb('#d6b48a', [0, 0.255, -0.465], [0.32, 0.012, 0.265], hat);
  orb(color, [0, 0.507, 0.015], [0.055, 0.033, 0.055], hat);
  box('#fff2d3', [0, 0.37, -0.366], [0.16, 0.09, 0.019], hat).name = 'cap-patch';
}

function addScarf(bird, config, { orb, box, mesh }) {
  const scarf = createGroup(bird, 'scarf:' + config.scarf);
  const color = riderColor(config.scarfColor);
  const scarfTail = createGroup(scarf, 'scarf-tail');
  scarfTail.position.set(0.2, 0.68, 0.01);
  if (config.scarf === 'none') return scarfTail;
  mesh('torus', color, {
    p: [0, 0.66, -0.29],
    s: [0.31, 0.31, 0.31],
    r: [Math.PI / 2, 0, 0],
    parent: scarf,
  });
  const length = config.scarf === 'long' ? 0.91 : 0.38;
  orb(color, [0.18, 0.66, -0.45], [0.1, 0.105, 0.11], scarf);
  for (const side of [-1, 1]) {
    const tailLength = length - (side === 1 ? 0.1 : 0);
    box(color, [side * 0.063, 0, tailLength / 2], [0.116, 0.06, tailLength], scarfTail);
    box('#F3E6CA', [side * 0.063, 0.001, tailLength - 0.05], [0.12, 0.067, 0.065], scarfTail);
  }
  return scarfTail;
}

function addGlasses(head, config, { orb, rod, mesh }) {
  const glasses = createGroup(head, 'glasses:' + config.glasses);
  const color = riderColor(config.glassesColor);
  if (config.glasses === 'none') return;
  for (const side of [-1, 1]) {
    const lens = createGroup(glasses, 'lens');
    lens.position.set(side * 0.48, 0.065, -0.23);
    lens.rotation.y = (side * Math.PI) / 2;
    mesh('torus', color, { s: [0.16, 0.18, 0.12], parent: lens });
    if (config.glasses === 'sunglasses') orb('#233e3d', [0, 0, 0.016], [0.145, 0.165, 0.025], lens);
    rod(color, [side * 0.48, 0.12, -0.2], [side * 0.36, 0.13, 0.18], {
      radius: 0.025,
      parent: glasses,
    });
  }
  rod(color, [-0.48, 0.17, -0.32], [0.48, 0.17, -0.32], { radius: 0.02, parent: glasses });
}

function addClothes(bird, config, { orb, box }) {
  const clothes = createGroup(bird, 'clothes:' + config.clothes);
  const color = riderColor(config.clothesColor);
  if (config.clothes === 'none') return;
  orb(color, [0, -0.03, 0.08], [0.62, 0.48, 0.82], clothes);
  box('#f3e6ca', [0, 0.09, -0.737], [0.03, 0.52, 0.025], clothes);
  if (config.clothes === 'jersey')
    for (const side of [-1, 1]) {
      const sleeve = orb(color, [side * 0.47, 0.19, -0.29], [0.22, 0.285, 0.34], clothes);
      sleeve.rotation.x = -0.35;
    }
  const number = createGroup(clothes, 'riding-number');
  number.position.set(0, 0.1, 0.902);
  box('#fff2d3', [0, 0, 0], [0.27, 0.26, 0.02], number);
  box('#345b53', [0, 0.075, 0.015], [0.12, 0.033, 0.012], number);
  const stroke = box('#345b53', [0.008, -0.012, 0.016], [0.032, 0.16, 0.012], number);
  stroke.rotation.z = -0.3;
  for (const side of [-1, 1])
    box('#f3e6ca', [side * 0.28, -0.09, 0.842], [0.13, 0.04, 0.025], clothes);
}

function addIdentity(head, config, { orb, rod }) {
  if (config.identity !== 'mm') return;
  for (const side of [-1, 1]) {
    const blush = orb('#e4a0a0', [side * 0.366, -0.15, -0.24], [0.035, 0.07, 0.085], head);
    blush.name = 'identity:mm';
    rod('#233e3d', [side * 0.4, 0.17, -0.23], [side * 0.46, 0.23, -0.24], {
      radius: 0.013,
      parent: head,
    });
  }
}

export function addAccessories(world, bird, head, config) {
  const { orb, box, rod, mesh } = world;
  addHat(head, config, { orb, box, rod, mesh });
  const scarfTail = addScarf(bird, config, { orb, box, mesh });
  addGlasses(head, config, { orb, rod, mesh });
  addClothes(bird, config, { orb, box });
  addIdentity(head, config, { orb, rod });
  return scarfTail;
}
