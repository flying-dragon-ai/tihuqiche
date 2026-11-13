import { computed, ref } from 'vue';

export function useToast(getT, getLevelName) {
  const toastData = ref(null);
  const toastElement = ref(null);
  const toastHeight = ref(0);
  let toastTimer;

  const toastMessage = computed(() => {
    if (!toastData.value) return '';
    const { key, values, tip } = toastData.value;
    const t = getT();
    const current =
      key === 'stageToast' ? { ...values, name: getLevelName()(values.number - 1) } : values;
    return t(key, current) + (tip ? `\n${t(tip)}` : '');
  });

  function clearToast() {
    clearTimeout(toastTimer);
    toastData.value = null;
  }

  function notify(key, values = {}, tip) {
    clearTimeout(toastTimer);
    toastData.value = { key, values, tip };
    toastTimer = setTimeout(clearToast, key.endsWith('Error') ? 4500 : 3500);
  }

  return { toastData, toastElement, toastHeight, toastMessage, clearToast, notify };
}
