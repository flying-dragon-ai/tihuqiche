import * as T from 'three';

function createMaterial(materials, color, opacity) {
  const material = new T.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: T.AdditiveBlending,
  });
  materials.push(material);
  return material;
}

function createMesh(world, geometry, material, parent, scale) {
  const object = world.mesh(geometry, '#ffe4a3', { s: scale, parent, shadow: false });
  object.material = material;
  return object;
}

function createShieldBubble(world, rider, materials) {
  const gold = createMaterial(materials, '#ffc642', 0.13);
  const ringGold = createMaterial(materials, '#ffd35a', 0.8);
  const sparkGold = createMaterial(materials, '#fff3b0', 0.95);
  ringGold.blending = T.NormalBlending;
  const shieldBubble = createMesh(world, 'sphere', gold, rider, [1.23, 2.04, 1.9]);
  shieldBubble.position.set(0, 1.94, 0);
  shieldBubble.name = 'shield';
  shieldBubble.visible = false;
  const rings = [];
  for (let index = 0; index < 3; index++) {
    const ring = createMesh(world, 'torus', ringGold, shieldBubble, [0.95, 0.95, 0.24]);
    ring.name = 'shield-ring:' + index;
    ring.rotation.set(Math.PI / 2 + (index - 1) * 0.52, index * 0.65, 0);
    rings.push(ring);
  }
  const stars = Array.from({ length: 8 }, (_, index) => {
    const star = createMesh(world, 'ico', sparkGold, shieldBubble, [0.04, 0.04, 0.04]);
    star.name = 'shield-spark:' + index;
    return star;
  });
  return { shieldBubble, gold, ringGold, rings, stars };
}

function createBoostFlame(world, materials) {
  const fire = new T.Group();
  fire.name = 'boost-flame';
  fire.visible = false;
  const orange = createMaterial(materials, '#ff641f', 0.85);
  const yellow = createMaterial(materials, '#ffdb45', 0.95);
  const white = createMaterial(materials, '#fff4b8', 0.95);
  const glow = createMaterial(materials, '#ff7b24', 0.18);
  orange.blending = T.NormalBlending;
  yellow.blending = T.NormalBlending;
  white.blending = T.NormalBlending;
  const halo = createMesh(world, 'sphere', glow, fire, [0.35, 0.3, 0.72]);
  halo.position.z = 0.43;
  const layers = [
    ['flame-outer', orange, 0.28, 1.22],
    ['flame-core', yellow, 0.18, 0.91],
    ['flame-hotspot', white, 0.1, 0.48],
  ].map(([name, material, width, length], index) => {
    const cone = createMesh(world, 'cone', material, fire, [width, length, width]);
    cone.name = name;
    cone.rotation.x = Math.PI / 2;
    cone.position.z = length / 2;
    cone.renderOrder = index + 1;
    return { cone, width, length };
  });
  const embers = Array.from({ length: 6 }, (_, index) => {
    const ember = createMesh(world, 'ico', index % 2 ? yellow : orange, fire, [0.035, 0.035, 0.12]);
    ember.name = 'flame-ember:' + index;
    return ember;
  });
  return { fire, layers, embers };
}

// Keep the persistent effect nodes and their owned materials together for one disposal path.
export function createRiderEffects(world, rider) {
  const materials = [];
  const shield = createShieldBubble(world, rider, materials);
  const flame = createBoostFlame(world, materials);

  function attach(bike, exhaust = { x: 0, y: 0.72, z: 1.32, scale: 1 }, vehicle) {
    bike.add(flame.fire);
    flame.fire.position.set(exhaust.x, exhaust.y, exhaust.z);
    flame.fire.scale.setScalar(exhaust.scale);
    shield.shieldBubble.scale.x = vehicle === 'plane' ? 1.72 : 1.23;
  }

  function animate({ time, moving, boosting }) {
    if (shield.shieldBubble.visible) {
      shield.gold.opacity = 0.12 + Math.sin(time * 5) * 0.035;
      shield.ringGold.opacity = 0.7 + Math.sin(time * 8) * 0.2;
      shield.rings.forEach((ring, index) => {
        ring.rotation.z = time * (0.65 + index * 0.22);
        ring.rotation.y = index * 0.65 + time * (index % 2 ? -0.5 : 0.5);
      });
      shield.stars.forEach((star, index) => {
        const angle = time * (index % 2 ? 1.2 : -1) + (index * Math.PI) / 4;
        const height = Math.sin(angle * 0.8 + index) * 0.76;
        const radius = Math.sqrt(1 - height * height);
        star.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
        star.scale.setScalar(0.025 + 0.03 * (0.5 + 0.5 * Math.sin(time * 10 + index * 2)));
      });
    }
    flame.fire.visible = Boolean(moving && boosting);
    if (!flame.fire.visible) return;
    flame.layers.forEach(({ cone, width, length }, index) => {
      const flicker =
        1 + Math.sin(time * 35 + index * 2) * 0.16 + Math.sin(time * 53 + index) * 0.08;
      cone.scale.set(width * (1.1 - 0.13 * flicker), length * flicker, width);
      cone.position.z = (length * flicker) / 2;
      cone.rotation.z = Math.sin(time * 19 + index) * 0.09;
    });
    flame.embers.forEach((ember, index) => {
      const travel = (time * 2.8 + index / flame.embers.length) % 1;
      const spread = 0.05 + travel * 0.3;
      ember.position.set(
        Math.sin(index * 2.4) * spread,
        Math.cos(index * 2.4) * spread,
        0.45 + travel * 1.12,
      );
      ember.scale.set(0.045 * (1 - travel), 0.045 * (1 - travel), 0.14 * (1 - travel));
    });
  }

  return {
    shieldBubble: shield.shieldBubble,
    attach,
    animate,
    dispose: () => {
      flame.fire.removeFromParent();
      materials.forEach((material) => material.dispose());
    },
  };
}
