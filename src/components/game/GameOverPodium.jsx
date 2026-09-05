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
        colors: ['#18181b', '#4f46e5', '#10b981', '#f59e0b', '#dc2626']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 45,
        origin: { x: 1 },
        colors: ['#18181b', '#4f46e5', '#10b981', '#f59e0b', '#dc2626']
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1.5">
        <span className="inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-mono font-medium uppercase tracking-wider">
          Match Concluded
        </span>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Tournament Results
        </h1>
        <p className="text-xs text-zinc-500">
          Final standings after {roomState.maxRounds} rounds of simultaneous drawing.
        </p>
      </div>

      {/* Clean Minimalist Podium */}
      <div className="bg-zinc-900 p-6 sm:p-8 rounded-2xl border border-zinc-800">
        <div className="flex items-end justify-center gap-3 sm:gap-6 pt-6 pb-2">
          {/* 2nd Place */}
          {secondPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[130px] space-y-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-zinc-950 border overflow-hidden shrink-0"
                style={{ borderColor: secondPlace.color }}
              >
                <PlayerAvatar avatar={secondPlace.avatar} name={secondPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-semibold text-xs text-zinc-200 truncate">{secondPlace.name}</div>
                <div className="font-mono text-[11px] text-zinc-500">{secondPlace.score} pts</div>
              </div>
              <div className="w-full h-20 bg-zinc-800 rounded-t-xl border-t border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                #2
              </div>
            </div>
          )}

          {/* 1st Place */}
          {firstPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[150px] space-y-2 -translate-y-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl bg-zinc-950 border-2 overflow-hidden shrink-0"
                style={{ borderColor: firstPlace.color }}
              >
                <PlayerAvatar avatar={firstPlace.avatar} name={firstPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-bold text-sm text-zinc-100 truncate">{firstPlace.name}</div>
                <div className="font-mono font-semibold text-xs text-emerald-400">{firstPlace.score} pts</div>
              </div>
              <div className="w-full h-28 bg-zinc-800 rounded-t-xl border-t border-zinc-600 flex items-center justify-center text-zinc-100 font-bold text-lg">
                👑 #1
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {thirdPlace && (
            <div className="flex flex-col items-center flex-1 max-w-[130px] space-y-2">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-zinc-950 border overflow-hidden shrink-0"
                style={{ borderColor: thirdPlace.color }}
              >
                <PlayerAvatar avatar={thirdPlace.avatar} name={thirdPlace.name} />
              </div>
              <div className="text-center truncate w-full">
                <div className="font-semibold text-xs text-zinc-200 truncate">{thirdPlace.name}</div>
                <div className="font-mono text-[11px] text-zinc-500">{thirdPlace.score} pts</div>
              </div>
              <div className="w-full h-16 bg-zinc-800 rounded-t-xl border-t border-zinc-700 flex items-center justify-center text-zinc-400 font-bold text-sm">
                #3
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rankings Table */}
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
          Rankings
        </h3>
        <div className="space-y-1.5">
          {sortedPlayers.map((player, idx) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-zinc-500 w-4 font-semibold">#{idx + 1}</span>
                <div
                  className="w-6 h-6 rounded-md overflow-hidden shrink-0 flex items-center justify-center bg-zinc-900 border"
                  style={{ borderColor: player.color }}
                >
                  <PlayerAvatar avatar={player.avatar} name={player.name} />
                </div>
                <span className="font-semibold text-zinc-200">{player.name}</span>
              </div>
              <span className="font-mono font-semibold text-zinc-300">
                {player.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again (Keep Room)
          </button>
        ) : (
          <div className="text-xs text-zinc-500 py-1">
            Waiting for host to restart match...
          </div>
        )}

        <button
          onClick={leaveRoom}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium text-xs border border-zinc-800 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          Return to Menu
        </button>
      </div>
    </div>
  );
};
