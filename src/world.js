import { createModelPrimitives } from './rider-primitives.js';
import * as T from 'three';
import { LEVELS } from './levels.js';
import { createScenery } from './scenery.js';

export const V = (x = 0, y = 0, z = 0) => new T.Vector3(x, y, z);

function createRenderer(canvas) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
    throw new Error(
      `Shader compilation failed: ${gl.getProgramInfoLog(program)}\n${gl.getShaderInfoLog(vertex)}\n${gl.getShaderInfoLog(fragment)}`,
    );
  };
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  return renderer;
}

function createLighting(scene) {
  const ambientLight = new T.HemisphereLight(0xfff7dc, 0x508c87, 2.3);
  scene.add(ambientLight);
  const sunLight = new T.DirectionalLight(0xffe6c2, 3.0);
  sunLight.position.set(-24, 40, 10);
  sunLight.castShadow = true;
  Object.assign(sunLight.shadow.camera, {
    left: -17,
    right: 17,
    top: 28,
    bottom: -18,
    near: 1,
    far: 100,
  });
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.bias = -0.0006;
  sunLight.shadow.normalBias = 0.035;
  scene.add(sunLight);
  return { ambientLight, sunLight };
}

function createInstances(scene, material, defaultGeometry) {
  return (color, items, geometry = defaultGeometry) => {
    const mesh = new T.InstancedMesh(geometry, material(color), items.length);
    const dummy = new T.Object3D();
    items.forEach((item, index) => {
      dummy.position.set(...item.p);
      dummy.scale.set(...item.s);
      dummy.rotation.set(...(item.r || [0, 0, 0]));
      dummy.updateMatrix();
      mesh.setMatrixAt(index, dummy.matrix);
    });
    mesh.receiveShadow = true;
    mesh.castShadow = false;
    scene.add(mesh);
    return mesh;
  };
}

function createRoad(box, instances) {
  const road = box('#577674', [0, -0.22, -120], [10.2, 0.4, 300]);
  box('#d8c3a0', [0, -1, -120], [11.1, 1.2, 300]);
  const stripes = [];
  const curbs = [];
  const posts = [];
  for (let index = 0; index < 68; index++) {
    for (const x of [-1.7, 1.7])
      stripes.push({ p: [x, 0.011, 18 - index * 4], s: [0.055, 0.022, 1.5] });
    for (const x of [-5.27, 5.27]) curbs.push({ p: [x, 0.02, 18 - index * 4], s: [0.26, 0.36, 2] });
    if (index % 3 === 0)
      for (const x of [-5.6, 5.6])
        posts.push({ p: [x, 0.44, 18 - index * 4], s: [0.16, 1.05, 0.16] });
  }
  const laneMarks = instances('#f4efd0', stripes);
  const curbMarks = instances('#e78665', curbs);
  const railPosts = instances('#fff4d7', posts);
  instances(
    '#fff1cf',
    [-5.27, 5.27].map((x) => ({ p: [x, -0.02, -120], s: [0.27, 0.26, 300] })),
  );
  for (const x of [-5.6, 5.6]) box('#eee4c8', [x, 0.86, -120], [0.12, 0.12, 300]);
  return { road, laneMarks, curbMarks, railPosts };
}

function createSea(box, instances, orb) {
  const sea = box('#60c5b6', [0, -2.15, -105], [650, 0.2, 620]);
  sea.castShadow = false;
  const sand = box('#e5d6ad', [31, -1.75, -130], [49.5, 0.6, 320]);
  const promenade = box('#a2a59b', [-12.3, -1.9, -120], [12, 0.9, 300]);
  promenade.name = 'city-river-promenade';
  const waterLines = [];
  for (let index = 0; index < 110; index++)
    waterLines.push({
      p: [((index * 19.31) % 175) - 95, -2.02, 20 - ((index * 9.81) % 280)],
      s: [1.3 + (index % 5), 0.01, 0.09],
    });
  const seaLines = instances('#97e1cf', waterLines);
  const sun = orb('#ffdd92', [-75, 42, -205], [15, 15, 15]);
  sun.material = new T.MeshBasicMaterial({ color: '#ffe4a3', fog: false });
  return { sea, sand, promenade, seaLines, sun };
}

function createClouds(scene, orb) {
  const cloudGroup = new T.Group();
  scene.add(cloudGroup);
  for (let index = 0; index < 8; index++) {
    const group = new T.Group();
    group.position.set(-85 + index * 24, 21 + (index % 3) * 7, -140 - (index % 2) * 45);
    cloudGroup.add(group);
    for (let puff = 0; puff < 3; puff++)
      orb(
        '#fff5df',
        [puff * 3, Math.sin(puff * 2) * 1.2, 0],
        [4.5, 1.7 + (puff % 2), 2],
        group,
      ).castShadow = false;
  }
  return cloudGroup;
}

function createIslands(scene, mesh) {
  const islands = new T.Group();
  scene.add(islands);
  for (let index = 0; index < 7; index++) {
    mesh('ico', '#8eb8a2', {
      p: [-58 + index * 20, -2, -170 - (index % 3) * 24],
      s: [16, 12 + (index % 3) * 5, 14],
      parent: islands,
      shadow: false,
    });
  }
  return islands;
}

function createFinishGate(scene, box) {
  const finish = new T.Group();
  scene.add(finish);
  finish.visible = false;
  for (const x of [-4.8, 4.8]) {
    box('#faf0d1', [x, 3.2, 0], [0.28, 6.4, 0.35], finish);
    box('#ed7753', [x, 3.4, 0], [0.32, 0.3, 0.38], finish);
  }
  box('#fff1cd', [0, 5.8, 0], [9.9, 0.85, 0.25], finish);
  for (let index = 0; index < 16; index++)
    box(
      index % 2 ? '#1f594f' : '#fff4d9',
      [-4.4 + index * 0.59, 5.5, 0],
      [0.59, 0.24, 0.28],
      finish,
    );
  const bannerCanvas = document.createElement('canvas');
  bannerCanvas.width = 512;
  bannerCanvas.height = 80;
  const bannerCtx = bannerCanvas.getContext('2d');
  bannerCtx.fillStyle = '#fff1cd';
  bannerCtx.fillRect(0, 0, 512, 80);
  bannerCtx.fillStyle = '#285d50';
  bannerCtx.font = 'bold 40px sans-serif';
  bannerCtx.textAlign = 'center';
  bannerCtx.fillText('FINISH  /  终点', 256, 55);
  const banner = new T.Mesh(
    new T.PlaneGeometry(6.5, 0.65),
    new T.MeshBasicMaterial({ map: new T.CanvasTexture(bannerCanvas), side: T.DoubleSide }),
  );
  banner.position.set(0, 5.9, 0.15);
  finish.add(banner);
  return { finish, banner, bannerCtx };
}

function createThemeController({
  scene,
  sea,
  road,
  sand,
  promenade,
  seaLines,
  islands,
  skyline,
  ambientLight,
  sunLight,
  sun,
  decor,
  life,
  material,
}) {
  let darkMode = false;
  return function setTheme(index, dark = darkMode) {
    darkMode = dark;
    const level = LEVELS[index];
    const sky = dark ? level.night : level.sky;
    scene.background = new T.Color(sky);
    scene.fog = new T.Fog(sky, 55, 200);
    sea.material = material(level.sea);
    road.material = material(level.road);
    sand.material = material(
      level.ground ??
        (index === 3 ? '#e1bf84' : index === 4 ? '#778687' : index === 5 ? '#a2a59b' : '#e5d6ad'),
    );
    promenade.visible = index >= 5;
    promenade.material = sand.material;
    seaLines.visible = index !== 3;
    islands.visible = index < 5;
    skyline.visible = index >= 5;
    skyline.userData.themes.forEach((theme, themeIndex) => (theme.visible = themeIndex === index));
    ambientLight.intensity = dark ? 1.1 : 2.3;
    sunLight.intensity = dark ? 1.4 : 3;
    sunLight.color.set(dark ? '#b4cced' : index === 2 ? '#ffd1a0' : '#ffedcd');
    sun.material.color.set(dark ? '#dce7ee' : '#ffe4a3');
    sun.scale.setScalar(dark ? 9 : 15);
    sun.position.y = index === 2 && !dark ? 16 : 42;
    decor.forEach((segment) =>
      segment.userData.themes.forEach(
        (theme, themeIndex) => (theme.visible = themeIndex === index),
      ),
    );
    life.setTheme(index);
  };
}

function createSettingsController({ renderer, scene, mats, life }) {
  return function setSettings({ ambientLife, shadows }) {
    if (typeof ambientLife !== 'boolean' || typeof shadows !== 'boolean')
      throw new TypeError('Invalid world settings');
    life.setEnabled(ambientLife);
    if (renderer.shadowMap.enabled === shadows) return;
    renderer.shadowMap.enabled = shadows;
    const materials = new Set(mats.values());
    scene.traverse((node) => {
      if (node.material) materials.add(node.material);
    });
    materials.forEach((material) => {
      material.needsUpdate = true;
    });
  };
}

function createLanguageController({ bannerCtx, banner }) {
  return function setLanguage(locale) {
    bannerCtx.fillStyle = '#fff1cd';
    bannerCtx.fillRect(0, 0, 512, 80);
    bannerCtx.fillStyle = '#285d50';
    bannerCtx.fillText(locale === 'en' ? 'FINISH' : '终点', 256, 55);
    banner.material.map.needsUpdate = true;
  };
}

function createWorldUpdater({
  laneMarks,
  curbMarks,
  railPosts,
  seaLines,
  decor,
  cloudGroup,
  life,
}) {
  return function updateWorld(distance, time) {
    laneMarks.position.z = distance % 4;
    curbMarks.position.z = distance % 4;
    railPosts.position.z = distance % 12;
    seaLines.position.z = (distance * 0.3) % 10;
    seaLines.position.y = Math.sin(time * 0.9) * 0.025;
    decor.forEach((segment, index) => {
      segment.position.z = ((distance - index * 25 + 275) % 275) - 248;
    });
    cloudGroup.position.x = Math.sin(time * 0.03) * 3;
    life.update(time);
  };
}

function disposeWorld({ scene, geos, mats, sunLight, renderer }) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  scene.traverse((object) => {
    if (object.isInstancedMesh) object.dispose();
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) materials.add(object.material);
  });
  Object.values(geos).forEach((geometry) => geometries.add(geometry));
  mats.forEach((material) => materials.add(material));
  materials.forEach((material) => {
    if (material.map) textures.add(material.map);
    material.dispose();
  });
  textures.forEach((texture) => texture.dispose());
  geometries.forEach((geometry) => geometry.dispose());
  sunLight.shadow.dispose();
  renderer.dispose();
}

// One factory owns the existing scene setup and GPU resources through teardown.
export function createWorld(canvas) {
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 340);
  const renderer = createRenderer(canvas);
  const { ambientLight, sunLight } = createLighting(scene);
  const { mesh, box, orb, rod, material, geos, mats } = createModelPrimitives(scene);
  const instances = createInstances(scene, material, geos.box);
  const { road, laneMarks, curbMarks, railPosts } = createRoad(box, instances);
  const { sea, sand, promenade, seaLines, sun } = createSea(box, instances, orb);
  const cloudGroup = createClouds(scene, orb);
  const { decor, skyline, life } = createScenery({ scene, box, orb, rod, mesh });
  const islands = createIslands(scene, mesh);
  const { finish, banner, bannerCtx } = createFinishGate(scene, box);
  const setTheme = createThemeController({
    scene,
    sea,
    road,
    sand,
    promenade,
    seaLines,
    islands,
    skyline,
    ambientLight,
    sunLight,
    sun,
    decor,
    life,
    material,
  });
  const setSettings = createSettingsController({ renderer, scene, mats, life });
  const setLanguage = createLanguageController({ bannerCtx, banner });
  const updateWorld = createWorldUpdater({
    laneMarks,
    curbMarks,
    railPosts,
    seaLines,
    decor,
    cloudGroup,
    life,
  });

  function resize() {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  }

  function dispose() {
    disposeWorld({ scene, geos, mats, sunLight, renderer });
  }

  return {
    scene,
    camera,
    renderer,
    mesh,
    box,
    orb,
    rod,
    material,
    finish,
    decor,
    skyline,
    setTheme,
    setSettings,
    setLanguage,
    updateWorld,
    resize,
    dispose,
  };
}
