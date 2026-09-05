import React from 'react';
import { getAvatarSrc } from '../../utils/colors';

export const PlayerAvatar = ({ avatar, name = 'Player', className = '' }) => {
  const src = getAvatarSrc(avatar);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`w-full h-full object-cover select-none pointer-events-none rounded-[inherit] ${className}`}
        loading="eager"
        decoding="async"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }

  // Fallback for legacy emoji strings
  return (
    <span className={`select-none font-normal leading-none ${className}`}>
      {avatar || '👤'}
    </span>
  );
};
