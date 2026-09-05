import React, { useState, useEffect } from 'react';
import { preloadAllAssets } from '../../utils/assetLoader';

export const Preloader = ({ minDuration = 800 }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing...');
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const startTime = Date.now();

    // Start preloading all assets (images, audio, fonts, code chunks)
    preloadAllAssets((percent, status) => {
      if (!isMounted) return;
      setProgress((prev) => Math.max(prev, percent));
      if (status) setStatusText(status);
    }).then(() => {
      if (!isMounted) return;
      setProgress(100);

      // Ensure minimum display time to prevent flashing
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDuration - elapsed);

      const finishTimer = setTimeout(() => {
        if (!isMounted) return;
        setFading(true);

        const unmountTimer = setTimeout(() => {
          if (!isMounted) return;
          setHidden(true);
        }, 650);

        return () => clearTimeout(unmountTimer);
      }, remainingTime + 250);

      return () => clearTimeout(finishTimer);
    });

    return () => {
      isMounted = false;
    };
  }, [minDuration]);

  if (hidden) return null;

  return (
    <aside
      aria-label="App loading screen"
      className={`fixed inset-0 z-[9999] flex flex-col justify-between items-center bg-zinc-950 p-6 sm:p-8 select-none transition-opacity duration-600 ease-out will-change-[opacity] ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Top spacer for vertical balance */}
      <div className="w-full h-8" aria-hidden="true" />

      {/* Center: Studio Attribution ABOVE Title, Shimmer Title & Smooth Progress Bar */}
      <div className="flex flex-col items-center justify-center text-center max-w-sm w-full my-auto">
        {/* Studio Attribution: Small, subtle uppercase font above main title */}
        <p className="text-[9px] sm:text-[10px] text-zinc-500 font-mono uppercase tracking-[0.22em] font-normal mb-1.5 opacity-70">
          from luxvore studio
        </p>

        {/* Main Title with Shimmer Effect */}
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight shimmer-text font-sans mb-4">
          InkSpy
        </h1>

        {/* Glowing Progress Bar */}
        <div className="w-48 sm:w-56 h-1 bg-zinc-800/80 rounded-full overflow-hidden p-[0.5px] shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] transition-all duration-300 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }}
          />
        </div>

        {/* Subtle Status Info */}
        <div className="flex items-center justify-between w-48 sm:w-56 mt-2 text-[10px] sm:text-[11px] font-mono text-zinc-500">
          <span className="truncate max-w-[140px]">{statusText}</span>
          <span className="text-zinc-400 font-medium">{progress}%</span>
        </div>
      </div>

      {/* Bottom spacer for vertical balance */}
      <div className="w-full h-8" aria-hidden="true" />
    </aside>
  );
};

export default Preloader;
