import { watch } from 'vue';
import { DEFAULT_GAME_SETTINGS } from './game-settings.js';

const NOTES = {
  fish: [740, 1100, 0.09],
  jump: [280, 650, 0.15],
  duck: [350, 150, 0.12],
  hit: [140, 45, 0.25],
  shield: [580, 1300, 0.3],
  win: [520, 1040, 0.55],
  move: [210, 280, 0.04],
};
const PROFILES = {
  classic: { wave: 'sine', pitch: 1, attack: 0.008, duration: 1, gain: 1, partials: [1] },
  arcade: { wave: 'square', pitch: 1, attack: 0.002, duration: 0.75, gain: 0.55, partials: [1] },
  bell: { wave: 'sine', pitch: 1, attack: 0.002, duration: 1.8, gain: 0.65, partials: [1, 2.76] },
  soft: { wave: 'triangle', pitch: 0.6, attack: 0.03, duration: 1.3, gain: 0.7, partials: [1] },
};

export function createToneVoices(kind, style = 'classic') {
  if (!Object.hasOwn(NOTES, kind)) throw new RangeError(`Unknown sound: ${kind}`);
  if (!Object.hasOwn(PROFILES, style)) throw new RangeError(`Unknown sound style: ${style}`);
  const [from, to, length] = NOTES[kind],
    profile = PROFILES[style];
  return profile.partials.map((partial, index) => {
    const duration = length * profile.duration * (index ? 0.75 : 1),
      pitch = profile.pitch * partial;
    return {
      type: kind === 'hit' && style === 'classic' ? 'sawtooth' : profile.wave,
      from: from * pitch,
      to: to * pitch,
      duration,
      attack: Math.min(profile.attack, duration * 0.3),
      peak: (0.095 * profile.gain) / (index + 1),
      transition: style === 'arcade' ? 'step' : style === 'bell' ? 'hold' : 'slide',
      attackCurve: style === 'soft' ? 'linear' : 'exponential',
    };
  });
}

export function createSound({ enabled, settings = DEFAULT_GAME_SETTINGS, notify }) {
  let audio = null,
    master = null,
    disposed = false;
  const voices = new Map();
  function syncGain() {
    if (!master) return;
    master.gain.setValueAtTime(enabled.value ? settings.volume : 0, audio.currentTime);
  }
  const stopWatching = watch(() => [enabled.value, settings.volume], syncGain, { flush: 'sync' });
  function createAudioContext() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const gain = context.createGain();
    gain.connect(context.destination);
    return { context, gain };
  }

  function handleAudioFailure(error) {
    console.warn('Audio initialization failed', error);
    master?.disconnect();
    const failed = audio;
    audio = null;
    master = null;
    failed?.close().catch((cause) => console.warn('Audio cleanup failed', cause));
    enabled.value = false;
    notify('audioError');
  }

  function resumeAudio() {
    audio.resume().catch((error) => {
      console.warn('Audio resume failed', error);
      notify('audioResume');
    });
  }

  function prepare() {
    if (!audio) {
      try {
        const created = createAudioContext();
        audio = created.context;
        master = created.gain;
        syncGain();
      } catch (error) {
        handleAudioFailure(error);
        return false;
      }
    }
    if (audio.state === 'suspended') resumeAudio();
    return true;
  }
  function playVoice({ type, from, to, duration, attack, peak, transition, attackCurve }) {
    const time = audio.currentTime;
    const oscillator = audio.createOscillator(),
      envelope = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(from, time);
    if (transition === 'step') oscillator.frequency.setValueAtTime(to, time + duration * 0.45);
    else if (transition === 'slide')
      oscillator.frequency.exponentialRampToValueAtTime(to, time + duration);
    envelope.gain.setValueAtTime(0.0001, time);
    if (attackCurve === 'linear') envelope.gain.linearRampToValueAtTime(peak, time + attack);
    else envelope.gain.exponentialRampToValueAtTime(peak, time + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    const release = () => {
      oscillator.onended = null;
      oscillator.disconnect();
      envelope.disconnect();
      voices.delete(oscillator);
    };
    voices.set(oscillator, release);
    oscillator.onended = release;
    oscillator.start(time);
    oscillator.stop(time + duration + 0.02);
  }
  function tone(kind) {
    if (disposed) throw new Error('Sound has been disposed');
    const sequence = createToneVoices(kind, settings.soundStyle);
    if (!enabled.value || settings.volume === 0 || !prepare()) return;
    sequence.forEach(playVoice);
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    stopWatching();
    voices.forEach((release, oscillator) => {
      oscillator.stop();
      release();
    });
    master?.disconnect();
    return audio?.close();
  }
  return {
    tone,
    preview: () => tone('shield'),
    get audio() {
      return audio;
    },
    dispose,
  };
}
