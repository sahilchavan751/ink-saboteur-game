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
  '🦊', '🐱', '🐙', '🐼', '🦉', '🐸', '🦁', '🐨', '🦄', '🐯', '🐺', '🐲'
];

export const getRandomAvatar = () => {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
};
