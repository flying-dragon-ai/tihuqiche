import * as T from 'three';

function drawMarkerTexture(glyph, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = color;
  context.beginPath();
  context.arc(64, 64, 51, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#fff8e5';
  context.lineWidth = 5;
  context.stroke();
  const [width, height, , , path] = glyph.icon;
  const scale = 64 / Math.max(width, height);
  context.save();
  context.translate((128 - width * scale) / 2, (128 - height * scale) / 2);
  context.scale(scale, scale);
  context.fillStyle = '#fff8e5';
  context.fill(new Path2D(path));
  context.restore();
  return new T.CanvasTexture(canvas);
}

export function createMarkerFactory({ isAssistEnabled }) {
  const textures = new Map();

  function marker(glyph, color, assistMarker = true) {
    const key = glyph.iconName + color;
    if (!textures.has(key)) {
      textures.set(
        key,
        new T.SpriteMaterial({ map: drawMarkerTexture(glyph, color), depthTest: true }),
      );
    }
    const sprite = new T.Sprite(textures.get(key));
    sprite.name = `course-marker:${glyph.iconName}`;
    sprite.scale.set(0.85, 0.85, 1);
    sprite.userData.courseMarker = true;
    sprite.userData.assistMarker = assistMarker;
    sprite.visible = !assistMarker || isAssistEnabled();
    return sprite;
  }

  function dispose() {
    textures.forEach((material) => {
      material.map.dispose();
      material.dispose();
    });
    textures.clear();
  }

  return { marker, dispose };
}
