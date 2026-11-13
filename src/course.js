import * as T from 'three';
import { LEVELS } from './levels.js';
import { campaignLayout, createEndlessLayout } from './course-layout.js';
import { createEntityMesh } from './course-entities.js';
import { createMarkerFactory } from './course-markers.js';
import { createParticles } from './course-particles.js';

export function createCourse(world, state) {
  const { scene, finish } = world;
  let entities = [];
  let nextId = 0;
  let stream = null;
  let assistMarkers = true;
  const obstacleRoot = new T.Group();
  scene.add(obstacleRoot);
  const markers = createMarkerFactory({ isAssistEnabled: () => assistMarkers });
  const particles = createParticles({ scene, mesh: world.mesh });

  function setAssistMarkers(enabled) {
    if (typeof enabled !== 'boolean') throw new TypeError('Assist markers must be boolean');
    if (assistMarkers === enabled) return;
    assistMarkers = enabled;
    for (const entity of entities)
      for (const child of entity.mesh.children)
        if (child.userData.assistMarker) child.visible = enabled;
  }

  function makeEntity(type, lane, at, height = 1.35) {
    const group = new T.Group();
    group.position.set((lane - 1) * 3.4, 0, -at);
    obstacleRoot.add(group);
    createEntityMesh(type, group, world, markers.marker, height);
    const entity = {
      id: nextId++,
      type,
      lane,
      at,
      height,
      mesh: group,
      resolved: false,
      resolvedBy: [],
    };
    entities.push(entity);
    return entity;
  }

  function addEntry(entry) {
    const entity = makeEntity(entry.type, entry.lane, entry.at, entry.height);
    if (entry.item) entity.item = entry.item;
  }

  function generateCourse(index) {
    clearCourse();
    if (state.gameMode === 'endless') {
      stream = createEndlessLayout(state.seed);
      for (let count = 0; count < 7; count++)
        addEntry({ type: 'fish', lane: 1, at: 18 + count * 4 });
      streamCourse();
      finish.visible = false;
      return;
    }
    campaignLayout(index, state.gameMode === 'items', state.seed).forEach(addEntry);
    finish.visible = true;
    finish.position.z = -LEVELS[index].length;
  }

  function streamCourse() {
    if (!stream) return;
    stream.through(state.distance + 240).forEach(addEntry);
    const active = state.players.filter((player) => player.status === 'running');
    const behind =
      Math.min(...(active.length ? active : state.players).map((player) => player.distance)) - 20;
    entities = entities.filter((entity) => {
      if (entity.at >= behind) return true;
      obstacleRoot.remove(entity.mesh);
      return false;
    });
  }

  const markerPosition = new T.Vector3();

  function updateEntities(time) {
    world.camera.updateMatrixWorld();
    for (const entity of entities) {
      entity.mesh.position.z = state.distance - entity.at;
      entity.mesh.visible =
        !entity.resolved && entity.mesh.position.z > -240 && entity.mesh.position.z < 45;
      if (entity.mesh.visible)
        for (const child of entity.mesh.children)
          if (child.visible && child.userData.courseMarker) {
            child.getWorldPosition(markerPosition).applyMatrix4(world.camera.matrixWorldInverse);
            const size = Math.max(
              0.85,
              (-markerPosition.z * 2 * Math.tan((world.camera.fov * Math.PI) / 360) * 32) /
                innerHeight,
            );
            child.scale.set(size, size, 1);
          }
      if (entity.type === 'fish' || entity.type === 'shield') {
        entity.mesh.rotation.y = time * 2;
        entity.mesh.position.y = entity.height + Math.sin(time * 3 + entity.at) * 0.12;
      }
    }
    finish.position.z = state.distance - LEVELS[state.level].length;
    finish.visible =
      state.gameMode !== 'endless' && finish.position.z > -170 && finish.position.z < 45;
  }

  function clearCourse() {
    obstacleRoot.clear();
    entities = [];
    nextId = 0;
    stream = null;
  }

  function dispose() {
    clearCourse();
    particles.clear();
    markers.dispose();
  }

  return {
    get entities() {
      return entities;
    },
    generateCourse,
    streamCourse,
    updateEntities,
    setAssistMarkers,
    burst: particles.burst,
    updateParticles: particles.update,
    clearParticles: particles.clear,
    clearCourse,
    dispose,
  };
}
