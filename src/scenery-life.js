import * as T from 'three';
import { LEVELS } from './levels.js';

function createBirdFlock({ scene, orb, mesh }) {
  const birds = [];
  const flock = new T.Group();
  flock.name = 'ambient-birds';
  scene.add(flock);
  let featherMaterial;
  let wingMaterial;

  function addBird(index) {
    const group = new T.Group();
    group.name = 'flying-bird';
    flock.add(group);
    const body = orb('#f8edcd', [0, 0, 0], [0.22, 0.22, 0.62], group);
    if (!featherMaterial) featherMaterial = body.material.clone();
    body.material = featherMaterial;
    const head = orb('#f8edcd', [0, 0.12, -0.53], [0.18, 0.18, 0.2], group);
    head.material = featherMaterial;
    mesh('cone', '#ddb56b', {
      p: [0, 0.1, -0.8],
      s: [0.09, 0.32, 0.09],
      r: [Math.PI / 2, 0, 0],
      parent: group,
    });
    const wings = [];
    for (const side of [-1, 1]) {
      const hinge = new T.Group();
      hinge.position.x = side * 0.13;
      group.add(hinge);
      const wing = orb('#d8e1d4', [side * 0.62, 0, 0.03], [0.85, 0.055, 0.28], hinge);
      if (!wingMaterial) wingMaterial = wing.material.clone();
      wing.material = wingMaterial;
      wings.push(hinge);
    }
    group.scale.setScalar(0.8 + (index % 3) * 0.2);
    group.rotation.y = -Math.PI / 2;
    group.traverse((node) => {
      if (node.isMesh) node.castShadow = false;
    });
    birds.push({
      g: group,
      wings,
      phase: index * 19.7,
      height: 9 + (index % 3) * 3,
      depth: -48 - (index % 4) * 18,
    });
  }

  for (let index = 0; index < 7; index++) addBird(index);

  function update(time) {
    for (let index = 0; index < birds.length; index++) {
      const bird = birds[index];
      const flap = Math.sin(time * 5 + index * 0.8);
      bird.g.position.set(
        ((time * (2.4 + (index % 2) * 0.6) + bird.phase) % 160) - 80,
        bird.height + Math.sin(time * 0.7 + index) * 0.7,
        bird.depth,
      );
      bird.wings[0].rotation.z = -0.18 - flap * 0.48;
      bird.wings[1].rotation.z = 0.18 + flap * 0.48;
      bird.g.rotation.z = Math.sin(time * 0.4 + index) * 0.07;
    }
  }

  function setTheme(index) {
    featherMaterial.color.set(
      index === 1 ? '#68a885' : index === 3 ? '#8d8169' : index === 4 ? '#85959a' : '#f8edcd',
    );
    wingMaterial.color.set(
      index === 1 ? '#619c6e' : index === 3 || index === 4 ? '#53645e' : '#d8e1d4',
    );
  }

  return { flock, update, setTheme };
}

function createPedestrian(parent, { x, z, phase, playing = false }, { box, orb, rod }) {
  const group = new T.Group();
  group.name = playing ? 'park-ball-player' : 'city-pedestrian';
  group.position.set(x, playing ? -1.25 : -1.45, z);
  parent.add(group);
  const shirt = ['#d78162', '#638db0', '#d3b866', '#79a684'][Math.floor(phase) % 4];
  box(shirt, [0, 1.05, 0], [0.55, 0.68, 0.33], group);
  orb('#d9ad83', [0, 1.64, 0], [0.24, 0.25, 0.23], group);
  orb('#554a40', [0, 1.79, 0.025], [0.25, 0.13, 0.24], group);
  box('#e6c294', [0, 1.58, -0.24], [0.11, 0.11, 0.1], group);
  const legs = [];
  const arms = [];
  for (const side of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(side * 0.15, 0.7, 0);
    group.add(leg);
    legs.push(leg);
    rod('#586575', [0, 0, 0], [0, -0.53, 0], { radius: 0.1, parent: leg });
    box('#514d44', [0, -0.61, -0.06], [0.22, 0.18, 0.38], leg);
    const arm = new T.Group();
    arm.position.set(side * 0.33, 1.31, 0);
    group.add(arm);
    arms.push(arm);
    rod(shirt, [0, 0, 0], [0, -0.31, 0], { radius: 0.095, parent: arm });
    orb('#d9ad83', [0, -0.46, 0], [0.09, 0.17, 0.09], arm);
  }
  return { g: group, legs, arms, x, z, phase, playing, kind: 'person' };
}

function createBench(parent, x, z, { box, rod }) {
  const group = new T.Group();
  group.name = 'park-bench';
  group.position.set(x, -1.25, z);
  parent.add(group);
  for (let plank = 0; plank < 3; plank++)
    box('#b68d60', [0, 0.62, (plank - 1) * 0.25], [2.8, 0.12, 0.19], group);
  for (const y of [0.95, 1.2]) box('#b68d60', [0, y, 0.42], [2.8, 0.19, 0.12], group);
  for (const x of [-1, 1]) {
    for (const z of [-0.25, 0.3])
      rod('#4d6765', [x, 0, z], [x, 0.65, z], { radius: 0.065, parent: group });
    rod('#4d6765', [x, 0.35, 0.4], [x, 1.35, 0.4], { radius: 0.06, parent: group });
  }
}

function createPark(parent, index, i, { box, orb, rod, pedestrian }) {
  const lawn = box('#8ba779', [12.8, -1.35, 8], [10, 0.2, 7], parent);
  lawn.name = 'city-pocket-park';
  createBench(parent, 15.7, 8.3, { box, rod });
  for (const z of [5.6, 10.4]) {
    box('#bd9b77', [17, -0.92, z], [1.2, 0.66, 1.2], parent);
    orb('#5d9469', [17, -0.36, z], [0.8, 0.55, 0.8], parent);
    for (const x of [16.6, 17.3])
      orb(i % 2 ? '#eaa488' : '#eacb6e', [x, -0.03, z], [0.16, 0.18, 0.16], parent);
  }
  pedestrian(parent, { index, x: 10.7, z: 6.3, phase: i + 0.4, playing: true });
  const second = pedestrian(parent, {
    index,
    x: 10.7,
    z: 9.7,
    phase: i + Math.PI,
    playing: true,
  });
  second.g.rotation.y = Math.PI;
  const ball = orb('#e5ad63', [10.7, -0.9, 8], [0.28, 0.28, 0.28], parent);
  ball.name = 'park-bouncing-ball';
  return { kind: 'ball', g: ball, phase: i };
}

function setSignal(signal, active) {
  if (signal.active === active) return;
  signal.active = active;
  signal.g.userData.active = active;
  for (let index = 0; index < signal.bulbs.length; index++) {
    const bulb = signal.bulbs[index];
    const on = index === active;
    bulb.material.color.setHex(on ? signal.colors[index] : 0x384845);
    bulb.material.emissiveIntensity = on ? 1.25 : 0;
  }
}

function createTrafficLight(parent, i, { box, orb, rod }) {
  const x = i % 2 ? -6.85 : 6.85;
  const group = new T.Group();
  group.name = 'traffic-light';
  group.position.set(x, -1.45, -9);
  parent.add(group);
  box('#8c9991', [0, 0.13, 0], [0.6, 0.26, 0.6], group);
  rod('#4d605b', [0, 0.2, 0], [0, 3.8, 0], { radius: 0.09, parent: group });
  box('#344c49', [0, 3.02, 0.05], [0.63, 1.72, 0.5], group);
  const colors = [0xe36455, 0xeab64b, 0x70c786];
  const bulbs = [];
  for (let index = 0; index < 3; index++) {
    const bulb = orb(colors[index], [0, 3.56 - index * 0.54, 0.33], [0.19, 0.19, 0.08], group);
    bulb.name = ['traffic-red', 'traffic-yellow', 'traffic-green'][index];
    bulb.material = bulb.material.clone();
    bulb.material.emissive.setHex(colors[index]);
    bulbs.push(bulb);
    box('#344c49', [0, 3.79 - index * 0.54, 0.35], [0.53, 0.07, 0.37], group);
  }
  const signal = { g: group, colors, bulbs, phase: i * 0.7, active: -1 };
  setSignal(signal, 2);
  return signal;
}

function updatePeople(actors, themeIndex, time) {
  const current = actors[themeIndex];
  for (const actor of current) {
    const phase = time * 3 + actor.phase;
    if (actor.kind === 'ball') {
      actor.g.position.y = -1 + Math.abs(Math.sin(phase)) * 1.1;
      actor.g.position.z = 8 + Math.sin(phase * 0.5) * 1.1;
      actor.g.rotation.x = phase;
      continue;
    }
    const stride = actor.playing ? Math.sin(phase) * 0.1 : Math.sin(phase) * 0.45;
    actor.legs[0].rotation.x = stride;
    actor.legs[1].rotation.x = -stride;
    actor.arms[0].rotation.x = actor.playing ? -0.7 + Math.sin(phase) * 0.45 : -stride;
    actor.arms[1].rotation.x = actor.playing ? -0.7 - Math.sin(phase) * 0.45 : stride;
    if (actor.playing) continue;
    actor.g.position.z = actor.z + Math.sin(time * 0.4 + actor.phase) * 2;
    actor.g.rotation.y = Math.cos(time * 0.4 + actor.phase) > 0 ? Math.PI : 0;
  }
}

function updateSignals(signals, themeIndex, time) {
  const current = signals[themeIndex];
  for (const signal of current) {
    const phase = (time + signal.phase) % 12;
    setSignal(signal, phase < 6 ? 2 : phase < 8 ? 1 : 0);
  }
}

export function createSceneryLife({ scene, box, orb, rod, mesh }) {
  const actors = LEVELS.map(() => []);
  const signals = LEVELS.map(() => []);
  const birds = createBirdFlock({ scene, orb, mesh });
  let enabled = true;
  let themeIndex = 0;
  let lastTime = -1;

  function pedestrian(parent, options) {
    const actor = createPedestrian(parent, options, { box, orb, rod });
    actors[options.index].push(actor);
    return actor;
  }

  function addCity(parent, index, i) {
    if (i % 4 === 0) pedestrian(parent, { index, x: i % 8 ? -7.3 : 7.3, z: 6, phase: i });
    if (i % 4 === 1) signals[index].push(createTrafficLight(parent, i, { box, orb, rod }));
    if (i % 4 === 2) {
      const ball = createPark(parent, index, i, { box, orb, rod, pedestrian });
      actors[index].push(ball);
    }
  }

  function update(time) {
    if (!enabled || time === lastTime) return;
    lastTime = time;
    birds.update(time);
    updatePeople(actors, themeIndex, time);
    updateSignals(signals, themeIndex, time);
  }

  function setEnabled(value) {
    if (typeof value !== 'boolean') throw new TypeError('Ambient life setting must be boolean');
    if (value === enabled) return;
    enabled = value;
    birds.flock.visible = value;
    lastTime = -1;
    for (let theme = 0; theme < actors.length; theme++) {
      for (const actor of actors[theme]) actor.g.visible = value;
      if (!value) for (const signal of signals[theme]) setSignal(signal, 2);
    }
  }

  function setTheme(index) {
    themeIndex = index;
    lastTime = -1;
    birds.setTheme(index);
  }

  update(0);
  return { addCity, update, setEnabled, setTheme, flock: birds.flock };
}
