import * as T from 'three';

export function addBirdDetails(world, { bird, head, palette }) {
  const { orb, rod, mesh } = world,
    eyes = [];
  for (const side of [-1, 1]) {
    const eye = new T.Group();
    eye.name = `eye:${side}`;
    eye.position.set(side * 0.36, 0.065, -0.235);
    head.add(eye);
    eyes.push(eye);
    orb(palette[2], [0, 0, 0], [0.075, 0.145, 0.15], eye);
    orb('#fffdf0', [side * 0.04, 0, -0.012], [0.043, 0.116, 0.12], eye);
    orb('#335b53', [side * 0.075, -0.012, -0.038], [0.025, 0.083, 0.071], eye);
    orb('#183c38', [side * 0.089, -0.012, -0.049], [0.016, 0.065, 0.047], eye);
    orb('#ffffff', [side * 0.101, 0.02, -0.063], [0.01, 0.024, 0.019], eye);
    rod(palette[2], [side * 0.416, 0.211, -0.34], [side * 0.428, 0.216, -0.17], {
      radius: 0.028,
      parent: head,
    }).name = `brow:${side}`;
    orb('#b67b37', [side * 0.239, 0.024, -0.72], [0.023, 0.016, 0.052], head).name =
      `nostril:${side}`;
    rod('#c7893c', [side * 0.239, -0.115, -0.52], [side * 0.15, -0.115, -1.28], {
      radius: 0.012,
      parent: head,
    }).name = `bill-seam:${side}`;
    const wing = new T.Group();
    wing.name = `wing:${side}`;
    bird.add(wing);
    const cover = mesh('ico', palette[4], {
      p: [side * 0.5, 0.19, -0.25],
      s: [0.2, 0.27, 0.61],
      r: [-0.31, 0, side * 0.14],
      parent: wing,
    });
    cover.name = 'wing-cover';
    for (let i = 0; i < 4; i++) {
      const feather = orb(
        i % 2 ? palette[4] : palette[5],
        [side * (0.44 + i * 0.058), -0.035 - i * 0.018, -0.66 + i * 0.025],
        [0.086, 0.076, 0.36],
        wing,
      );
      feather.rotation.set(-0.3, side * (0.04 + i * 0.025), side * 0.06);
      feather.name = `flight-feather:${i}`;
    }
    const shoulder = orb(palette[0], [side * 0.49, 0.28, 0.04], [0.175, 0.2, 0.29], wing);
    shoulder.rotation.x = -0.3;
  }
  mesh('cone', '#de9b39', {
    p: [0, -0.06, -1.715],
    s: [0.03, 0.1, 0.038],
    r: [0, 0, Math.PI],
    parent: head,
  }).name = 'bill-hook';
  for (let i = -2; i <= 2; i++) {
    const feather = orb(
      i % 2 ? palette[2] : palette[0],
      [i * 0.105, 0.055, 0.82 + Math.abs(i) * 0.02],
      [0.095, 0.105, 0.46],
      bird,
    );
    feather.rotation.set(-0.15, i * 0.16, 0);
    feather.name = `tail-feather:${i + 2}`;
  }
  return (time) => {
    const phase = time % 4.8,
      blink = phase > 4.56 ? Math.max(0.07, Math.abs(phase - 4.68) / 0.12) : 1;
    eyes.forEach((eye) => (eye.scale.y = blink));
  };
}

export function addFootDetails(world, foot) {
  for (const x of [-0.3, 0, 0.3]) {
    world.box('#f5c576', [x, 0.51, -0.12], [0.04, 0.025, 0.63], foot);
    world.mesh('cone', '#d08a38', {
      p: [x, 0.13, -0.59],
      s: [0.1, 0.22, 0.13],
      r: [-Math.PI / 2, 0, 0],
      parent: foot,
    });
  }
}
