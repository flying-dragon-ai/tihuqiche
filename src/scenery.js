import * as T from 'three';
import { LEVELS } from './levels.js';
import { createCityScenery } from './city-scenery.js';
import { createSceneryProps } from './scenery-props.js';
import { createSceneryLife } from './scenery-life.js';

function createPalm(parent, x, z, scale, { orb, rod, mesh }) {
  const group = new T.Group();
  group.position.set(x, -1.2, z);
  group.scale.setScalar(scale);
  parent.add(group);
  orb('#e5d6ad', [0, -0.65, 0], [2.8, 0.75, 2.6], group);
  rod('#b28b5f', [0, 0, 0], [0.55, 5.3, 0.1], { radius: 0.18, parent: group });
  for (let index = 0; index < 6; index++) {
    const angle = (index * Math.PI) / 3;
    const leaf = mesh('sphere', index % 2 ? '#429a76' : '#2c805e', {
      p: [0.55 + Math.sin(angle) * 1.15, 5.14, 0.1 + Math.cos(angle) * 1.15],
      s: [0.4, 0.14, 1.65],
      parent: group,
    });
    leaf.rotation.set(0.2, angle, 0);
  }
  for (let index = 0; index < 3; index++)
    orb(
      '#9a7045',
      [0.5 + Math.cos(index * 2) * 0.25, 5, 0.1 + Math.sin(index * 2) * 0.25],
      [0.22, 0.22, 0.22],
      group,
    );
  for (let y = 1; y < 4.8; y += 0.8)
    mesh('torus', '#98764f', {
      p: [y * 0.1, y, 0.02],
      s: [0.18, 0.18, 0.18],
      r: [Math.PI / 2, 0, 0],
      parent: group,
    });
  return group;
}

function createTemple(parent, x, z, { box, mesh }) {
  const group = new T.Group();
  group.position.set(x, -1.45, z);
  parent.add(group);
  for (let index = 0; index < 4; index++)
    box(
      index % 2 ? '#c9b285' : '#d9c698',
      [0, index * 0.5, 0],
      [4.4 - index * 0.75, 0.52, 4.4 - index * 0.75],
      group,
    );
  for (const side of [-1, 1]) box('#dacba4', [side * 0.8, 3.15, 0], [0.55, 2.7, 0.6], group);
  box('#9a9e75', [0, 4.65, 0], [3, 0.45, 1.6], group);
  box('#ded2ac', [0, 4.95, 0], [2.45, 0.35, 1.3], group);
  for (const side of [-1, 1])
    for (const y of [2.5, 3.3, 4.1])
      box('#a18e68', [side * 0.8, y, 0.32], [0.58, 0.12, 0.06], group);
  mesh('ico', '#e79b54', { p: [0, 3.4, 0], s: [0.45, 0.55, 0.45], parent: group });
  return group;
}

function createCactus(parent, x, z, { rod }) {
  const group = new T.Group();
  group.position.set(x, -1.3, z);
  parent.add(group);
  rod('#638965', [0, 0, 0], [0, 4.7, 0], { radius: 0.38, parent: group });
  for (const side of [-1, 1]) {
    rod('#638965', [0, 2.2, 0], [side * 1.25, 2.2, 0], { radius: 0.26, parent: group });
    rod('#638965', [side * 1.25, 2.2, 0], [side * 1.25, 3.6, 0], {
      radius: 0.26,
      parent: group,
    });
  }
}

function createSkull(parent, x, z, { orb, mesh, box, rod }) {
  const group = new T.Group();
  group.position.set(x, 0.7, z);
  parent.add(group);
  orb('#d9d6bd', [0, 1, 0], [2.5, 2.1, 1.7], group);
  for (const side of [-1, 1]) orb('#354754', [side * 0.95, 1.4, 1.45], [0.65, 0.7, 0.28], group);
  mesh('cone', '#354754', {
    p: [0, 0.45, 1.65],
    s: [0.35, 0.55, 0.18],
    r: [0, 0, Math.PI],
    parent: group,
  });
  for (let index = 0; index < 5; index++)
    box('#d9d6bd', [(index - 2) * 0.55, -0.65, 1], [0.42, 0.7, 0.65], group);
  rod('#938f81', [-1.2, 2.2, 1.15], [-0.5, 1.8, 1.55], { radius: 0.04, parent: group });
  rod('#938f81', [-0.5, 1.8, 1.55], [-0.7, 1.35, 1.6], { radius: 0.04, parent: group });
  for (const side of [-1, 1])
    rod('#d9d6bd', [-2, -1.8, side * 0.65], [2, -1.8, -side * 0.65], {
      radius: 0.19,
      parent: group,
    });
}

function createBuilding(parent, x, z, index, { box, mesh, rod, orb }) {
  const group = new T.Group();
  group.position.set(x, -1.4, z);
  parent.add(group);
  const height = 5 + (index % 4) * 1.5;
  box(index % 2 ? '#bbae93' : '#b8a393', [0, height / 2, 0], [4, height, 4], group);
  box('#e2ceb0', [0, height, 0], [4.5, 0.4, 4.5], group);
  box('#58645e', [0, 1, 2.04], [0.85, 1.9, 0.12], group);
  for (const side of [-1.9, 1.9])
    box('#d8c5a4', [side, height / 2, 2.09], [0.18, height, 0.17], group);
  for (let y = 1; y < height; y += 1.5)
    for (const offset of [-1.2, 0, 1.2]) {
      const window = box('#ffd98e', [offset, y, 2.02], [0.6, 0.75, 0.06], group);
      window.material = window.material.clone();
      window.material.emissive.set('#ffaf52');
      window.material.emissiveIntensity = 0.3;
    }
  if (index % 3 === 0)
    mesh('cone', '#596d70', { p: [0, height + 1, 0], s: [2, 2, 2], parent: group });
  rod('#455d61', [3, 0, 1], [3, 6, 1], { radius: 0.09, parent: group });
  orb('#ffdfa2', [3, 6, 1], [0.35, 0.45, 0.35], group);
}

function createDecorSegment(index, { scene, box, orb, rod, mesh, props, cities, life }) {
  const segment = new T.Group();
  segment.position.z = -index * 25 + 15;
  scene.add(segment);
  const themes = LEVELS.map((level) => {
    const group = new T.Group();
    group.name = level.id;
    segment.add(group);
    return group;
  });
  for (let theme = 0; theme < 3; theme++) {
    const group = themes[theme];
    createPalm(group, 8 + (index % 3) * 2, 0, 0.82 + (index % 3) * 0.13, { orb, rod, mesh });
    if (index % 2 === 0) createPalm(group, -10 - (index % 3), 8, 0.85, { orb, rod, mesh });
    mesh('ico', '#b7c7a0', {
      p: [-16 - (index % 4) * 4, -1.2, -4],
      s: [4 + (index % 3), 2.2 + (index % 2), 3.5],
      parent: group,
    });
    orb('#7fb495', [18, -0.5, 6], [4.3, 1.5, 4], group);
    mesh('ico', '#49836c', { p: [7, -0.1, -8], s: [1.4, 1.1, 1.5], parent: group });
    if (theme === 1) createPalm(group, -8, 0, 1.45, { orb, rod, mesh });
    if (theme > 0 && index % 3 === 0) createTemple(group, -12, -5, { box, mesh });
  }
  createCactus(themes[3], 8 + (index % 3) * 2, 0, { rod });
  mesh('ico', '#c39761', { p: [-15, -0.8, -4], s: [6, 3 + (index % 3), 8], parent: themes[3] });
  orb('#e1bf84', [18, -1.4, 6], [8, 3, 10], themes[3]);
  createSkull(themes[4], index % 2 ? -10 : 11, -2, { orb, mesh, box, rod });
  mesh('ico', '#586771', { p: [-18, -0.8, -7], s: [5, 5 + (index % 3), 6], parent: themes[4] });
  rod('#665f53', [8, -1, 4], [8, 5, 4], { radius: 0.18, parent: themes[4] });
  rod('#665f53', [8, 3, 4], [10, 4, 4], { radius: 0.12, parent: themes[4] });
  createBuilding(themes[5], 9, 0, index, { box, mesh, rod, orb });
  createBuilding(themes[5], -11, -7, index + 1, { box, mesh, rod, orb });
  for (let theme = 0; theme < 5; theme++) props.addNature(themes[theme], LEVELS[theme].id, index);
  for (let theme = 6; theme < LEVELS.length; theme++)
    cities.roadside(themes[theme], LEVELS[theme].id, index);
  for (let theme = 5; theme < LEVELS.length; theme++) life.addCity(themes[theme], theme, index);
  segment.userData.themes = themes;
  return segment;
}

function createSkyline({ scene, box, orb, rod, mesh, cities }) {
  const skyline = new T.Group();
  scene.add(skyline);
  const themes = LEVELS.map((level) => {
    const group = new T.Group();
    group.name = level.id;
    skyline.add(group);
    return group;
  });
  const shanghai = themes[5];
  for (let index = 0; index < 8; index++)
    box(
      '#7e9296',
      [-45 + index * 13, 3 + (index % 3) * 3, -170],
      [7, 10 + (index % 3) * 6, 8],
      shanghai,
    );
  rod('#9daaad', [4, -2, -160], [4, 35, -160], { radius: 0.55, parent: shanghai });
  for (const y of [12, 26]) orb('#b07883', [4, y, -160], [3.4, 3.4, 3.4], shanghai);
  for (const x of [-1, 1])
    rod('#afbab7', [4 + x * 5, -1, -160], [4, 13, -160], { radius: 0.7, parent: shanghai });
  for (const y of [12, 26])
    mesh('torus', '#d5b0ad', {
      p: [4, y, -160],
      s: [3.45, 3.45, 3.45],
      r: [Math.PI / 2, 0, 0],
      parent: shanghai,
    });
  for (let theme = 6; theme < LEVELS.length; theme++)
    cities.skyline(themes[theme], LEVELS[theme].id);
  skyline.userData.themes = themes;
  return skyline;
}

export function createScenery({ scene, box, orb, rod, mesh }) {
  const cities = createCityScenery({ box, orb, rod, mesh });
  const props = createSceneryProps({ box, orb, rod, mesh });
  const life = createSceneryLife({ scene, box, orb, rod, mesh });
  const decor = [];
  for (let index = 0; index < 11; index++)
    decor.push(createDecorSegment(index, { scene, box, orb, rod, mesh, props, cities, life }));
  const skyline = createSkyline({ scene, box, orb, rod, mesh, cities });
  return { decor, skyline, life };
}
