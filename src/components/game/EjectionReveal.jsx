import React, { useEffect, useState, useRef } from 'react';
import { useGameSocket } from '../../context/SocketContext';
import { playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';

export const EjectionReveal = () => {
  const { roomState } = useGameSocket();
  const canvasRef = useRef(null);

  const results = roomState?.roundResults;
  const isTie = results?.isTie;
  const accusedId = results?.accusedPlayerId;
  const accusedPlayer = roomState?.players?.find((p) => p.id === accusedId);
  const isSaboteur = accusedId === results?.saboteurId;

  // Primary typewriter text
  let targetPrimaryText = '';
  let targetSecondaryText = '';

  if (isTie) {
    targetPrimaryText = results?.isSkipWon ? 'Voting was skipped.' : 'Voting resulted in a tie.';
    targetSecondaryText = 'No one was ejected. Drawing continues on the whiteboard...';
  } else if (accusedPlayer) {
    targetPrimaryText = `${accusedPlayer.name} was ${isSaboteur ? 'the' : 'not the'} Saboteur.`;
    targetSecondaryText = isSaboteur ? '0 Saboteurs remain.' : '1 Saboteur remains.';
  } else {
    targetPrimaryText = 'No one was voted out.';
    targetSecondaryText = 'Drawing continues on the whiteboard...';
  }

  const [displayedPrimary, setDisplayedPrimary] = useState('');
  const [displayedSecondary, setDisplayedSecondary] = useState('');

  // 1. White drops falling down canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Create 70 falling white drops
    const drops = Array.from({ length: 70 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 12 + 6,
      speed: Math.random() * 4 + 2,
      opacity: Math.random() * 0.7 + 0.3,
      radius: Math.random() * 1.5 + 0.8
    }));

    const render = () => {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);

      drops.forEach((drop) => {
        drop.y += drop.speed;
        if (drop.y > height) {
          drop.y = -20;
          drop.x = Math.random() * width;
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(244, 244, 245, ${drop.opacity})`;
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // Droplet trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(244, 244, 245, ${drop.opacity * 0.4})`;
        ctx.lineWidth = drop.radius;
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y - drop.length);
        ctx.stroke();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  // 2. Typewriter Effect
  useEffect(() => {
    let charIndex = 0;
    let secIndex = 0;
    setDisplayedPrimary('');
    setDisplayedSecondary('');

    const primaryInterval = setInterval(() => {
      if (charIndex < targetPrimaryText.length) {
        setDisplayedPrimary(targetPrimaryText.slice(0, charIndex + 1));
        playClick();
        charIndex++;
      } else {
        clearInterval(primaryInterval);
        // Start secondary subtitle after brief pause
        setTimeout(() => {
          const secondaryInterval = setInterval(() => {
            if (secIndex < targetSecondaryText.length) {
              setDisplayedSecondary(targetSecondaryText.slice(0, secIndex + 1));
              secIndex++;
            } else {
              clearInterval(secondaryInterval);
            }
          }, 60);
        }, 500);
      }
    }, 80);

    return () => {
      clearInterval(primaryInterval);
    };
  }, [targetPrimaryText, targetSecondaryText]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950 select-none overflow-hidden animate-fadeIn">
      {/* Falling White Drops Background Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Tie State or Floating Ejected Player in Space */}
      {isTie ? (
        <div className="relative z-10 mb-8 flex flex-col items-center animate-fadeIn">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-4xl shadow-popover">
            ⚖️
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-amber-400 mt-3 font-semibold bg-zinc-900/90 px-3 py-1 rounded-full border border-amber-500/30">
            {results?.isSkipWon ? 'Vote Skipped • Round Continues' : 'Vote Tied • Round Continues'}
          </span>
        </div>
      ) : accusedPlayer ? (
        <div className="relative z-10 animate-float mb-8 flex flex-col items-center">
          <div
            className="w-20 h-20 rounded-2xl bg-zinc-900 border-2 flex items-center justify-center text-4xl shadow-popover overflow-hidden shrink-0"
            style={{ borderColor: accusedPlayer.color }}
          >
            <PlayerAvatar avatar={accusedPlayer.avatar} name={accusedPlayer.name} />
          </div>
          <span className="font-mono text-xs text-zinc-400 mt-2 font-medium">
            {accusedPlayer.name}
          </span>
        </div>
      ) : null}

      {/* Typewriter Text Display */}
      <div className="relative z-10 text-center px-4 max-w-xl space-y-3">
        <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-wider text-zinc-100 min-h-[36px]">
          {displayedPrimary}
          <span className="animate-pulse inline-block w-2.5 h-5 bg-zinc-400 ml-1 translate-y-0.5" />
        </h2>

        {displayedSecondary && (
          <p className="font-mono text-sm text-zinc-400 tracking-wide animate-fadeIn">
            ({displayedSecondary})
          </p>
        )}
      </div>

      {/* Subtle timer badge */}
      <div className="absolute bottom-8 text-center text-xs font-mono text-zinc-500">
        {isTie ? 'Returning to whiteboard drawing in a few seconds...' : 'Reviewing results...'}
      </div>
    </div>
  );
};
