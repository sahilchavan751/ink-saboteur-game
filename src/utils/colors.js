// Professional solid ink palette designed for a clean white whiteboard
export const INK_COLORS = [
  { id: 'black', name: 'Ink Black', hex: '#18181b' },
  { id: 'navy', name: 'Deep Navy', hex: '#1d4ed8' },
  { id: 'crimson', name: 'Crimson', hex: '#dc2626' },
  { id: 'forest', name: 'Forest Pine', hex: '#15803d' },
  { id: 'violet', name: 'Royal Violet', hex: '#7c3aed' },
  { id: 'amber', name: 'Burnt Amber', hex: '#d97706' },
  { id: 'teal', name: 'Deep Teal', hex: '#0f766e' },
  { id: 'burgundy', name: 'Burgundy', hex: '#9f1239' },
  { id: 'cobalt', name: 'Classic Blue', hex: '#2563eb' },
  { id: 'indigo', name: 'Slate Indigo', hex: '#4f46e5' },
  { id: 'sienna', name: 'Rust Sienna', hex: '#c2410c' },
  { id: 'slate', name: 'Graphite', hex: '#475569' },
];

export const getRandomColor = () => {
  return INK_COLORS[Math.floor(Math.random() * INK_COLORS.length)];
};

export const getColorById = (id) => {
  return INK_COLORS.find(c => c.id === id) || INK_COLORS[0];
};

export const AVATARS = [
  { id: 'crocodile', name: 'Crocodile', src: '/avatar/crocodile.webp' },
  { id: 'dino', name: 'Dino', src: '/avatar/dino.webp' },
  { id: 'orange-cat', name: 'Cat', src: '/avatar/orange-cat.webp' },
  { id: 'frog', name: 'Frog', src: '/avatar/frog.webp' },
  { id: 'shark', name: 'Shark', src: '/avatar/shark.webp' },
  { id: 'tiger', name: 'Tiger', src: '/avatar/tiger.webp' },
  { id: 'lion', name: 'Lion', src: '/avatar/lion.webp' },
  { id: 'buffalo', name: 'Buffalo', src: '/avatar/buffalo.webp' },
  { id: 'cow', name: 'Cow', src: '/avatar/cow.webp' },
  { id: 'goat', name: 'Goat', src: '/avatar/goat.webp' },
  { id: 'rabbit', name: 'Rabbit', src: '/avatar/rabbit.webp' },
  { id: 'sea-horse', name: 'Sea Horse', src: '/avatar/sea-horse.webp' }
];

export const getRandomAvatar = () => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)].src;
};

export const getAvatarSrc = (avatar) => {
  if (!avatar) return '/avatar/dino.webp';
  if (typeof avatar === 'string') {
    const normalized = avatar.startsWith('/avatar/')
      ? avatar.replace(/\.png$/i, '.webp')
      : avatar;

    if (
      normalized.startsWith('/') ||
      normalized.startsWith('http') ||
      normalized.includes('.webp') ||
      normalized.includes('.png') ||
      normalized.includes('.jpg')
    ) {
      return normalized.replace(/\.png$/i, '.webp');
    }
    const match = AVATARS.find(
      (a) => a.id === avatar.toLowerCase() || a.name.toLowerCase() === avatar.toLowerCase()
    );
    if (match) return match.src;
  }
  if (typeof avatar === 'object' && avatar?.src) {
    return avatar.src.replace(/\.png$/i, '.webp');
  }
  return null;
};
