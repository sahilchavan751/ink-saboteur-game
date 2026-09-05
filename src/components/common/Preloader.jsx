import React, { useState, useEffect } from 'react';

export const Preloader = ({ minDuration = 1600 }) => {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Initiate fade-out transition after minDuration
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, minDuration);

    // Fully unmount from DOM after transition completes (700ms)
    const removeTimer = setTimeout(() => {
      setHidden(true);
    }, minDuration + 700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [minDuration]);

  if (hidden) return null;

  return (
    <aside
      aria-label="App loading screen"
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-zinc-950 px-4 py-10 select-none transition-opacity duration-700 ease-out will-change-[opacity] ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top balancing spacer */}
      <div className="w-full h-8" aria-hidden="true" />

      {/* Center: App Name with Shimmer Effect */}
      <div className="flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight shimmer-text font-sans">
          Ink Saboteur
        </h1>
      </div>

      {/* Bottom: Studio Attribution */}
      <div className="w-full flex justify-center items-center pb-2">
        <p className="text-xs sm:text-[13px] text-zinc-500 font-mono tracking-wider">
          from luxvore studio
        </p>
      </div>
    </aside>
  );
};

export default Preloader;
