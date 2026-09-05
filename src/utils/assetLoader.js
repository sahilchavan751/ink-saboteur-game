// Centralized Asset Preloader & Caching Engine for InkSpy

const IMAGE_ASSETS = [
  // Backgrounds & Brand
  '/background.webp',
  '/background-game.webp',
  '/logo.webp',

  // All 12 Animal Avatars
  '/avatar/crocodile.webp',
  '/avatar/dino.webp',
  '/avatar/orange-cat.webp',
  '/avatar/frog.webp',
  '/avatar/shark.webp',
  '/avatar/tiger.webp',
  '/avatar/lion.webp',
  '/avatar/buffalo.webp',
  '/avatar/cow.webp',
  '/avatar/goat.webp',
  '/avatar/rabbit.webp',
  '/avatar/sea-horse.webp'
];

const AUDIO_ASSETS = [
  '/music/ink-score-1.mp3',
  '/music/ink-score-2.mp3'
];

// In-memory references to prevent garbage collection of pre-decoded assets
const preloadedImages = new Map();
const preloadedAudio = new Map();

/**
 * Preloads and decodes an image onto the GPU memory
 */
const preloadImage = (src) => {
  return new Promise((resolve) => {
    if (preloadedImages.has(src)) {
      resolve(src);
      return;
    }

    const img = new Image();
    img.src = src;

    // Use decode() API for async GPU rasterization if supported
    if ('decode' in img) {
      img
        .decode()
        .then(() => {
          preloadedImages.set(src, img);
          resolve(src);
        })
        .catch(() => {
          // Fallback if decode() rejects on some formats
          img.onload = () => {
            preloadedImages.set(src, img);
            resolve(src);
          };
          img.onerror = () => resolve(src);
        });
    } else {
      img.onload = () => {
        preloadedImages.set(src, img);
        resolve(src);
      };
      img.onerror = () => resolve(src);
    }
  });
};

/**
 * Pre-buffers an audio file with HTML5 Audio
 */
const preloadAudio = (src) => {
  return new Promise((resolve) => {
    if (preloadedAudio.has(src)) {
      resolve(src);
      return;
    }

    try {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.src = src;

      const onCanPlay = () => {
        preloadedAudio.set(src, audio);
        cleanup();
        resolve(src);
      };

      const onError = () => {
        cleanup();
        resolve(src);
      };

      const cleanup = () => {
        audio.removeEventListener('canplaythrough', onCanPlay);
        audio.removeEventListener('loadeddata', onCanPlay);
        audio.removeEventListener('error', onError);
      };

      audio.addEventListener('canplaythrough', onCanPlay, { once: true });
      audio.addEventListener('loadeddata', onCanPlay, { once: true });
      audio.addEventListener('error', onError, { once: true });

      // Start loading
      audio.load();

      // Audio safety timeout (1.5s max for audio buffer)
      setTimeout(() => {
        cleanup();
        preloadedAudio.set(src, audio);
        resolve(src);
      }, 1500);
    } catch (e) {
      resolve(src);
    }
  });
};

/**
 * Pre-loads Google Web Fonts
 */
const preloadFonts = () => {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    return document.fonts.ready.catch(() => {});
  }
  return Promise.resolve();
};

/**
 * Pre-fetches heavy code chunks (RoomLobby and GameView)
 */
const preloadChunks = () => {
  return Promise.allSettled([
    import('../components/lobby/RoomLobby'),
    import('../components/game/GameView')
  ]);
};

/**
 * Master preloader orchestrator
 * @param {Function} onProgress - callback receiving percentage (0-100) and current task label
 * @returns {Promise<void>}
 */
export const preloadAllAssets = (onProgress = () => {}) => {
  return new Promise((resolve) => {
    const totalItems = IMAGE_ASSETS.length + AUDIO_ASSETS.length + 2; // +1 for fonts, +1 for chunks
    let completedItems = 0;

    const notifyProgress = (label = '') => {
      completedItems++;
      const percent = Math.min(100, Math.round((completedItems / totalItems) * 100));
      onProgress(percent, label);
    };

    // Global safety timeout: guarantee resolution within 4.5 seconds under all network conditions
    const safetyTimer = setTimeout(() => {
      onProgress(100, 'Ready');
      resolve();
    }, 4500);

    const taskPromises = [
      // 1. All images
      ...IMAGE_ASSETS.map((src) =>
        preloadImage(src).then(() => {
          notifyProgress('Loading visual assets...');
        })
      ),

      // 2. All audio tracks
      ...AUDIO_ASSETS.map((src) =>
        preloadAudio(src).then(() => {
          notifyProgress('Buffering soundscape...');
        })
      ),

      // 3. Web fonts
      preloadFonts().then(() => {
        notifyProgress('Configuring typography...');
      }),

      // 4. Code chunks
      preloadChunks().then(() => {
        notifyProgress('Warming game engine...');
      })
    ];

    Promise.allSettled(taskPromises).then(() => {
      clearTimeout(safetyTimer);
      onProgress(100, 'Ready');
      resolve();
    });
  });
};
