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

  // Clean, minimal primary & secondary text
  let targetPrimaryText = '';
  let targetSecondaryText = '';

  if (isTie) {
    targetPrimaryText = results?.isSkipWon ? 'Voting was skipped.' : 'Voting tied.';
    targetSecondaryText = 'No one was ejected.';
  } else if (accusedPlayer) {
    targetPrimaryText = `${accusedPlayer.name} was ${isSaboteur ? 'the' : 'not the'} Saboteur.`;
    targetSecondaryText = isSaboteur ? '0 Saboteurs remain.' : '1 Saboteur remains.';
  } else {
    targetPrimaryText = 'No one was voted out.';
    targetSecondaryText = 'Drawing continues.';
  }

  const [displayedPrimary, setDisplayedPrimary] = useState('');
  const [displayedSecondary, setDisplayedSecondary] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // 1. White celestial drops / speed lines falling down canvas
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

    // 60 falling celestial streaks
    const drops = Array.from({ length: 60 }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 14 + 6,
      speed: Math.random() * 3.5 + 2,
      opacity: Math.random() * 0.6 + 0.2,
      radius: Math.random() * 1.4 + 0.6
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
        ctx.fillStyle = `rgba(255, 255, 255, ${drop.opacity})`;
        ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
        ctx.fill();

        // Droplet trail
        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 255, 255, ${drop.opacity * 0.35})`;
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

  // 2. Typewriter Effect (Fast, rhythmic, minimal)
  useEffect(() => {
    let charIndex = 0;
    let secIndex = 0;
    setDisplayedPrimary('');
    setDisplayedSecondary('');
    setIsTyping(true);

    const primaryInterval = setInterval(() => {
      if (charIndex < targetPrimaryText.length) {
        setDisplayedPrimary(targetPrimaryText.slice(0, charIndex + 1));
        playClick();
        charIndex++;
      } else {
        clearInterval(primaryInterval);

        // Start clean secondary text after slight pause
        setTimeout(() => {
          const secondaryInterval = setInterval(() => {
            if (secIndex < targetSecondaryText.length) {
              setDisplayedSecondary(targetSecondaryText.slice(0, secIndex + 1));
              secIndex++;
            } else {
              clearInterval(secondaryInterval);
              setIsTyping(false);
            }
          }, 45);
        }, 350);
      }
    }, 65);

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

      {/* Floating Center Subject (Avatar or Tie Icon) — Clean & Minimal */}
      {isTie ? (
        <div className="relative z-10 animate-float mb-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-3xl shadow-[0_0_35px_rgba(0,0,0,0.7)]">
            ⚖️
          </div>
        </div>
      ) : accusedPlayer ? (
        <div className="relative z-10 animate-float mb-6 flex flex-col items-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-black/40 backdrop-blur-xl border-2 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_35px_rgba(0,0,0,0.8)]"
            style={{
              borderColor: accusedPlayer.color,
              boxShadow: `0 0 30px ${accusedPlayer.color}40`
            }}
          >
            <PlayerAvatar avatar={accusedPlayer.avatar} name={accusedPlayer.name} />
          </div>
        </div>
      ) : null}

      {/* Typewriter Text Display */}
      <div className="relative z-10 text-center px-4 max-w-xl space-y-2.5">
        <h2 className="font-mono text-xl sm:text-2xl md:text-3xl font-bold tracking-wider text-white min-h-[36px] drop-shadow-md">
          {displayedPrimary}
          {isTyping && (
            <span className="animate-pulse inline-block w-2.5 h-5 sm:h-6 bg-white/80 ml-1.5 translate-y-0.5" />
          )}
        </h2>

        {displayedSecondary && (
          <p className="font-mono text-xs sm:text-sm text-white/50 tracking-widest uppercase font-medium animate-fadeIn">
            {displayedSecondary}
          </p>
        )}
      </div>
    </div>
  );
};
