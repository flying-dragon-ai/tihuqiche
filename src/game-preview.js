export function createPreviewController({ game, app, homePreview, riders, updateHUD }) {
  let seat = 0;
  let homeCanvas = null;
  let wardrobeCanvas = null;
  let destination = null;

  function attachHomePreview(canvas) {
    homeCanvas = canvas;
  }

  function attachWardrobePreview(canvas) {
    wardrobeCanvas = canvas;
  }

  function previewRider({ playerId, config }) {
    if (game.mode !== 'home' || !Number.isInteger(playerId) || !riders[playerId])
      throw new Error('Rider preview is only available at home');
    seat = playerId;
    riders[playerId].applyConfig(config);
  }

  function restoreRiders() {
    app.appearance.players.forEach((config, index) => riders[index].applyConfig(config));
    seat = 0;
  }

  function setHomePreviewPlayer(playerId) {
    if (playerId !== 0 && playerId !== 1) throw new RangeError('Unknown preview player');
    game.homePreviewPlayer = playerId;
    updateHUD();
  }

  function setHomePreviewAuto(enabled) {
    if (typeof enabled !== 'boolean') throw new TypeError('Preview auto rotation must be boolean');
    game.homePreviewAuto = enabled;
    updateHUD();
  }

  function rotateHomePreview(delta) {
    homePreview.rotate(delta);
    game.homePreviewAuto = false;
    updateHUD();
  }

  function rotateWardrobePreview(delta) {
    homePreview.rotate(delta);
    app.wardrobeAuto.value = false;
  }

  function render({ dt, time }) {
    const wardrobe = app.wardrobeOpen.value;
    const nextDestination =
      game.mode !== 'home'
        ? null
        : wardrobe
          ? app.wardrobeScene.value
            ? null
            : wardrobeCanvas
          : homeCanvas;
    if (nextDestination !== destination) {
      homePreview.attach(nextDestination);
      destination = nextDestination;
    }
    const visible = homePreview.render({
      active: game.mode === 'home',
      config: wardrobe ? app.wardrobeDraft.value : app.appearance.players[game.homePreviewPlayer],
      auto: wardrobe ? app.wardrobeAuto.value : game.homePreviewAuto,
      dt,
      time,
      transparent: wardrobe,
    });
    return { destination, visible };
  }

  return {
    attachHomePreview,
    attachWardrobePreview,
    previewRider,
    restoreRiders,
    setHomePreviewPlayer,
    setHomePreviewAuto,
    rotateHomePreview,
    rotateWardrobePreview,
    render,
    get seat() {
      return seat;
    },
  };
}
