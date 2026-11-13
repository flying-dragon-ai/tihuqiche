export function createThemeController(world, app) {
  let index = -1;

  function setTheme(nextIndex) {
    index = nextIndex;
    world.setTheme(nextIndex, app.dark.value);
  }

  return {
    setTheme,
    get index() {
      return index;
    },
  };
}
