import { V } from './world.js';

export function createParticles({ scene, mesh }) {
  const particles = [];

  function burst(position, color, count = 10) {
    for (let index = 0; index < count; index++) {
      const particleMesh = mesh('ico', color, {
        p: position.toArray(),
        s: [0.06, 0.06, 0.06],
        shadow: false,
      });
      particles.push({
        mesh: particleMesh,
        velocity: V((Math.random() - 0.5) * 4, 2 + Math.random() * 3, (Math.random() - 0.5) * 4),
        life: 0.65,
      });
    }
  }

  function update(dt) {
    for (let index = particles.length - 1; index >= 0; index--) {
      const particle = particles[index];
      particle.life -= dt;
      particle.velocity.y -= 8 * dt;
      particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.scale.setScalar(Math.max(0, particle.life) * 0.14);
      if (particle.life <= 0) {
        scene.remove(particle.mesh);
        particles.splice(index, 1);
      }
    }
  }

  function clear() {
    particles.forEach((particle) => scene.remove(particle.mesh));
    particles.length = 0;
  }

  return { burst, update, clear };
}
