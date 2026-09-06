// Procedural Web Audio API Sound Generator for Ink Saboteur
// Zero external mp3/wav files needed!

let audioCtx = null;
let isMuted = localStorage.getItem('ink_saboteur_muted') === 'true';

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const MUSIC_TRACKS = [
  '/music/ink-score-1.mp3',
  '/music/ink-score-2.mp3'
];

let bgMusicAudio = null;
let currentTrackIndex = Math.floor(Math.random() * MUSIC_TRACKS.length);
let muteListeners = new Set();

const notifyMuteListeners = (muted) => {
  muteListeners.forEach((fn) => {
    try {
      fn(muted);
    } catch (e) {}
  });
};

let currentMusicVolume = (() => {
  const saved = localStorage.getItem('ink_saboteur_music_volume');
  return saved !== null ? Number(saved) : 0.15;
})();

export const subscribeMuteChange = (callback) => {
  muteListeners.add(callback);
  return () => muteListeners.delete(callback);
};

export const getMusicVolume = () => currentMusicVolume;

export const setMusicVolume = (vol) => {
  const safeVol = Math.max(0, Math.min(1, vol));
  currentMusicVolume = safeVol;
  localStorage.setItem('ink_saboteur_music_volume', safeVol.toString());
  if (bgMusicAudio && !isMuted) {
    bgMusicAudio.volume = safeVol;
  }
};

let interactionListenersAttached = false;
const INTERACTION_EVENTS = ['click', 'touchend', 'touchstart', 'keydown'];

const cleanupInteractionListeners = () => {
  if (!interactionListenersAttached || typeof window === 'undefined') return;
  interactionListenersAttached = false;
  INTERACTION_EVENTS.forEach((evt) => {
    window.removeEventListener(evt, handleFirstInteraction, true);
  });
};

const handleFirstInteraction = () => {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }

  if (isMuted) {
    cleanupInteractionListeners();
    return;
  }

  if (!bgMusicAudio) {
    startBackgroundMusic();
    return;
  }

  if (!bgMusicAudio.paused) {
    cleanupInteractionListeners();
    return;
  }

  bgMusicAudio.volume = currentMusicVolume;
  const playPromise = bgMusicAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        cleanupInteractionListeners();
      })
      .catch(() => {
        // Keep listeners active so subsequent touch or click can retry
      });
  }
};

const attachInteractionListeners = () => {
  if (interactionListenersAttached || typeof window === 'undefined') return;
  interactionListenersAttached = true;
  INTERACTION_EVENTS.forEach((evt) => {
    window.addEventListener(evt, handleFirstInteraction, { capture: true, passive: true });
  });
};

export const startBackgroundMusic = () => {
  if (typeof window === 'undefined') return;

  if (!bgMusicAudio) {
    bgMusicAudio = new Audio();
    bgMusicAudio.preload = 'auto';
    bgMusicAudio.volume = currentMusicVolume;

    // When current song ends, alternate to the other song
    bgMusicAudio.addEventListener('ended', () => {
      currentTrackIndex = (currentTrackIndex + 1) % MUSIC_TRACKS.length;
      bgMusicAudio.src = MUSIC_TRACKS[currentTrackIndex];
      bgMusicAudio.load();
      if (!isMuted) {
        bgMusicAudio.play().catch(() => {});
      }
    });

    bgMusicAudio.src = MUSIC_TRACKS[currentTrackIndex];
    bgMusicAudio.load();
  } else if (!isMuted) {
    bgMusicAudio.volume = currentMusicVolume;
  }

  if (isMuted) {
    bgMusicAudio.pause();
    cleanupInteractionListeners();
    return;
  }

  bgMusicAudio.volume = currentMusicVolume;
  const playPromise = bgMusicAudio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        cleanupInteractionListeners();
      })
      .catch(() => {
        // Autoplay blocked by mobile browser - start on first user interaction anywhere
        attachInteractionListeners();
      });
  }
};

export const toggleMute = () => {
  isMuted = !isMuted;
  localStorage.setItem('ink_saboteur_muted', isMuted ? 'true' : 'false');

  if (bgMusicAudio) {
    if (isMuted) {
      bgMusicAudio.pause();
      cleanupInteractionListeners();
    } else {
      bgMusicAudio.volume = currentMusicVolume;
      const playPromise = bgMusicAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            cleanupInteractionListeners();
          })
          .catch(() => {
            attachInteractionListeners();
          });
      }
    }
  } else if (!isMuted) {
    startBackgroundMusic();
  }

  notifyMuteListeners(isMuted);
  return isMuted;
};

export const getIsMuted = () => isMuted;

// Subtle drawing scratch
export const playStrokeSound = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160 + Math.random() * 40, ctx.currentTime);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600 + Math.random() * 200, ctx.currentTime);
    filter.Q.setValueAtTime(3, ctx.currentTime);

    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Audio context issue
  }
};

// Ink Depleted Warning (buzzy low buzz)
export const playInkEmpty = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

// Dramatic clock tick for last seconds
export const playTick = (isUrgent = false) => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 520, ctx.currentTime);

    gain.gain.setValueAtTime(isUrgent ? 0.08 : 0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch (e) {}
};

// Vote cast click / thud
export const playVote = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {}
};

// Dramatic Reveal Suspense Gong
export const playReveal = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const freqs = [180, 225, 270];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.1 / (idx + 1), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    });
  } catch (e) {}
};

// Victory Fanfare
export const playFanfare = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, i) => {
      const startTime = ctx.currentTime + i * 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.1, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  } catch (e) {}
};

// Subtle button click
export const playClick = () => {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch (e) {}
};
