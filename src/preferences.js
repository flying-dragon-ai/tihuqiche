import { computed, ref } from 'vue';
import { syncSeo } from './seo.js';

const LOCALES = Object.freeze(['zh', 'en']);
const THEMES = Object.freeze(['system', 'light', 'dark']);

function detectLocale() {
  const language = (navigator.languages?.[0] || navigator.language).toLowerCase();
  return language.startsWith('zh') ? 'zh' : 'en';
}

function readSavedPreferences(notify) {
  try {
    return {
      locale: localStorage.getItem('pelican-locale'),
      theme: localStorage.getItem('pelican-theme'),
    };
  } catch (error) {
    console.warn('Could not read preferences', error);
    notify('preferencesError');
    return { locale: null, theme: null };
  }
}

function updateAddress(locale) {
  if (location.protocol === 'file:') return;
  history.replaceState(
    null,
    '',
    `${locale === 'en' ? '/en/' : '/'}${location.search}${location.hash}`,
  );
}

export function createPreferences(initialLocale, notify) {
  const locale = ref(initialLocale);
  const theme = ref('system');
  const systemDark = ref(false);
  const dark = computed(() =>
    theme.value === 'system' ? systemDark.value : theme.value === 'dark',
  );
  let media;

  function persist(key, value) {
    try {
      localStorage.setItem(`pelican-${key}`, value);
    } catch (error) {
      console.warn('Could not save preferences', error);
      notify('preferencesError');
    }
  }

  function applyLocale(value) {
    locale.value = value;
    updateAddress(value);
    syncSeo(value);
  }

  function setLocale(value) {
    if (!LOCALES.includes(value)) throw new Error('Unsupported language');
    applyLocale(value);
    persist('locale', value);
  }

  function setTheme(value) {
    if (!THEMES.includes(value)) throw new Error('Unsupported appearance');
    theme.value = value;
    persist('theme', value);
  }

  const handleSystemTheme = (event) => {
    systemDark.value = event.matches;
  };

  function init() {
    media = matchMedia('(prefers-color-scheme: dark)');
    systemDark.value = media.matches;
    media.addEventListener('change', handleSystemTheme);
    const saved = readSavedPreferences(notify);
    if (THEMES.includes(saved.theme)) theme.value = saved.theme;
    // A shared English URL is explicit; on the root URL a saved choice precedes the device language.
    const initial = location.pathname.startsWith('/en/')
      ? 'en'
      : LOCALES.includes(saved.locale)
        ? saved.locale
        : detectLocale();
    applyLocale(initial);
  }

  return {
    locale,
    theme,
    dark,
    setLocale,
    setTheme,
    init,
    dispose: () => media?.removeEventListener('change', handleSystemTheme),
  };
}
