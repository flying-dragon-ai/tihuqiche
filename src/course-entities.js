import {
  faArrowUp,
  faArrowDown,
  faArrowsLeftRight,
  faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { addEntityDetails } from './course-models.js';

export function createEntityMesh(type, group, world, marker, height = 1.35) {
  const { mesh, orb, box } = world;
  switch (type) {
    case 'fish':
      orb('#ffc447', [0, 0, 0], [0.32, 0.2, 0.13], group);
      mesh('cone', '#f3ac2b', {
        p: [0.38, 0, 0],
        s: [0.21, 0.3, 0.08],
        r: [0, 0, Math.PI / 2],
        parent: group,
      });
      orb('#5a5434', [-0.16, 0.045, 0.115], [0.029, 0.034, 0.021], group);
      group.position.y = height;
      break;
    case 'shield':
      mesh('torus', '#73f0cf', { s: [0.46, 0.46, 0.46], parent: group });
      mesh('ico', '#b5ffe6', { s: [0.23, 0.29, 0.14], parent: group });
      group.position.y = 1.7;
      break;
    case 'item': {
      box('#4B83A6', [0, 1.35, 0], [0.8, 0.8, 0.8], group);
      const itemMarker = marker(faQuestion, '#338878', false);
      itemMarker.position.y = 2.1;
      group.add(itemMarker);
      break;
    }
    case 'hurdle': {
      for (const x of [-0.98, 0.98]) box('#a57c53', [x, 0.62, 0], [0.17, 1.2, 0.25], group);
      box('#eb8960', [0, 0.83, 0], [2.35, 0.46, 0.27], group);
      for (const x of [-0.8, 0, 0.8]) box('#ffefc4', [x, 0.83, 0.145], [0.27, 0.45, 0.035], group);
      const hurdleMarker = marker(faArrowUp, '#d77848');
      hurdleMarker.position.y = 1.7;
      group.add(hurdleMarker);
      break;
    }
    case 'gate': {
      for (const x of [-1.18, 1.18]) box('#427c7b', [x, 1.6, 0], [0.16, 3.2, 0.23], group);
      box('#348f90', [0, 3.03, 0], [2.62, 0.5, 0.36], group);
      for (const x of [-0.94, 0.94]) box('#d1f0d8', [x, 3.03, 0.195], [0.15, 0.48, 0.03], group);
      const gateMarker = marker(faArrowDown, '#337978');
      gateMarker.position.y = 3.78;
      group.add(gateMarker);
      break;
    }
    default: {
      box('#bf8c5c', [0, 1.4, 0], [2.2, 2.8, 1.65], group);
      for (const y of [0.17, 1.4, 2.64]) box('#dfb57e', [0, y, 0.85], [2.23, 0.16, 0.1], group);
      for (const x of [-0.97, 0.97]) box('#e9c28b', [x, 1.4, 0.88], [0.15, 2.75, 0.13], group);
      const diagonal = box('#d9ab70', [0, 1.4, 0.9], [0.15, 3.1, 0.12], group);
      diagonal.rotation.z = 0.61;
      const crateMarker = marker(faArrowsLeftRight, '#8a6b4a');
      crateMarker.position.y = 3.48;
      group.add(crateMarker);
      break;
    }
  }
  addEntityDetails(world, group, type);
}
