import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Home } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { playFanfare, playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';

export const GameOverPodium = () => {
  const { roomState, playAgain, leaveRoom, socket } = useGameSocket();

  useEffect(() => {
    playFanfare();

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 45,
        origin: { x: 0 },
        colors: ['#ffffff', '#6366f1', '#10b981', '#f59e0b', '#ec4899']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 45,
        origin: { x: 1 },
        colors: ['#ffffff', '#6366f1', '#10b981', '#f59e0b', '#ec4899']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  if (!roomState) return null;

  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
  const firstPlace = sortedPlayers[0];
  const secondPlace = sortedPlayers[1];
  const thirdPlace = sortedPlayers[2];

  const currentPlayer = roomState.players.find((p) => p.id === socket?.id);
  const isHost = currentPlayer?.isHost;

  const handlePlayAgain = async () => {
    playClick();
    try {
      await playAgain();
    } catch (err) {
      alert(err.message || 'Failed to restart');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-6 space-y-5 flex-1 h-full min-h-0 overflow-y-auto no-scrollbar animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
          Tournament Results
        </h1>
        <p className="text-xs text-white/60">
          Final standings after {roomState.maxRounds} rounds of simultaneous drawing.
        </p>
      </div>

      {/* Clean Minimalist Podium with Glassmorphism */}
      <div className="relative bg-black/40 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-white/15 shadow-xl overflow-hidden">
        {/* Top Specular Edge Glow */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="flex items-end justify-center gap-3 sm:gap-6 pt-4 pb-1">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[130px] space-y-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-black/40 border-2 overflow-hidden shrink-0 shadow-lg"
                style={{ borderColor: secondPlace.color }}
              >
                <PlayerAvatar avatar={secondPlace.avatar} name={secondPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-semibold text-xs text-white truncate">{secondPlace.name}</div>
                <div className="font-mono text-[11px] text-white/50">{secondPlace.score} pts</div>
              </div>
              <div className="w-full h-20 bg-white/[0.07] backdrop-blur-md rounded-t-2xl border-t border-white/20 flex items-center justify-center text-white/80 font-bold text-sm shadow-inner">
                #2
              </div>
            </div>
          )}

          {/* 1st Place */}
          {firstPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[150px] space-y-2 -translate-y-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-black/40 border-2 overflow-hidden shrink-0 shadow-xl ring-2 ring-amber-400/40"
                style={{ borderColor: firstPlace.color }}
              >
                <PlayerAvatar avatar={firstPlace.avatar} name={firstPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-bold text-sm text-white truncate">{firstPlace.name}</div>
                <div className="font-mono font-semibold text-xs text-amber-300">{firstPlace.score} pts</div>
              </div>
              <div className="w-full h-28 bg-gradient-to-b from-amber-500/20 to-white/[0.08] backdrop-blur-md rounded-t-2xl border-t border-amber-400/40 flex items-center justify-center text-amber-300 font-bold text-lg shadow-inner">
                👑 #1
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[130px] space-y-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-black/40 border-2 overflow-hidden shrink-0 shadow-lg"
                style={{ borderColor: thirdPlace.color }}
              >
                <PlayerAvatar avatar={thirdPlace.avatar} name={thirdPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-semibold text-xs text-white truncate">{thirdPlace.name}</div>
                <div className="font-mono text-[11px] text-white/50">{thirdPlace.score} pts</div>
              </div>
              <div className="w-full h-16 bg-white/[0.05] backdrop-blur-md rounded-t-2xl border-t border-white/15 flex items-center justify-center text-white/60 font-bold text-sm shadow-inner">
                #3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/15 space-y-3 shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80 pb-2 border-b border-white/10">
          Rankings
        </h3>
        <div className="space-y-1.5">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 hover:border-white/20 transition text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-white/50 w-4 font-semibold">#{idx + 1}</span>
                <div
                  className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-black/30 border shadow-inner"
                  style={{ borderColor: player.color }}
                >
                  <PlayerAvatar avatar={player.avatar} name={player.name} />
                </div>
                <span className="font-semibold text-white">{player.name}</span>
              </div>
              <span className="font-mono font-semibold text-white/80">
                {player.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again (Keep Room)
          </button>
        ) : (
          <div className="text-xs text-white/50 py-1 font-mono">
            Waiting for host to restart match...
          </div>
        )}

        <button
          onClick={leaveRoom}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-black/40 hover:bg-white/10 text-white font-medium text-xs border border-white/15 backdrop-blur flex items-center justify-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
        >
          <Home className="w-4 h-4" />
          Return to Menu
        </button>
      </div>
    </div>
  );
};
