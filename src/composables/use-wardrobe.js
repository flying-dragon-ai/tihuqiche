import { ref } from 'vue';
import { writeAppearance } from '../storage.js';

export function useWardrobe({ appearance, getEngine, notify }) {
  const wardrobeOpen = ref(false);
  const wardrobeSeat = ref(0);
  const wardrobeDraft = ref(null);
  const wardrobeScene = ref(false);
  const wardrobeAuto = ref(true);

  function openWardrobe(seat) {
    wardrobeSeat.value = seat;
    wardrobeDraft.value = { ...appearance.players[seat] };
    wardrobeScene.value = false;
    wardrobeAuto.value = true;
    wardrobeOpen.value = true;
    getEngine().previewRider({ playerId: seat, config: wardrobeDraft.value });
  }

  function cancelWardrobe() {
    getEngine().restoreRiders();
    wardrobeOpen.value = false;
    wardrobeDraft.value = null;
  }

  function saveWardrobe() {
    const next = {
      version: 1,
      players: appearance.players.map((config, seat) => ({
        ...(seat === wardrobeSeat.value ? wardrobeDraft.value : config),
      })),
    };
    if (!writeAppearance(next, notify)) return false;
    Object.assign(appearance, next);
    getEngine().restoreRiders();
    wardrobeOpen.value = false;
    wardrobeDraft.value = null;
    notify('appearanceSaved');
    return true;
  }

  return {
    wardrobeOpen,
    wardrobeSeat,
    wardrobeDraft,
    wardrobeScene,
    wardrobeAuto,
    openWardrobe,
    cancelWardrobe,
    saveWardrobe,
  };
}
