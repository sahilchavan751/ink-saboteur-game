import React, { useState } from 'react';
import { Volume2, VolumeX, Copy, Check, LogOut, PenTool } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { toggleMute, getIsMuted, playClick } from '../../utils/sound';

export const Header = () => {
  const { roomState, leaveRoom } = useGameSocket();
  const [muted, setMuted] = useState(getIsMuted());
  const [copied, setCopied] = useState(false);

  const handleToggleSound = () => {
    const isNowMuted = toggleMute();
    setMuted(isNowMuted);
  };

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className={`w-full backdrop-blur-md border-b sticky top-0 z-50 transition-colors ${roomState ? 'bg-zinc-950/90 border-zinc-800/80' : 'bg-black/15 border-white/10'}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between relative">
        {/* Minimal Brand Title */}
        <div className="flex items-center shrink-0 z-10">
          <span className="font-bold text-sm sm:text-base text-white drop-shadow-sm tracking-tight whitespace-nowrap">
            Ink Saboteur
          </span>
        </div>

        {/* Center: Room Info & Round Tracker - Perfectly Centered */}
        {roomState && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2.5 pointer-events-auto">
            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-xs transition cursor-pointer"
              title="Click to copy room code"
            >
              <span className="font-mono text-[10px] sm:text-[11px] text-zinc-500 uppercase">Room</span>
              <span className="font-mono font-semibold text-zinc-100 tracking-wider text-[11px] sm:text-xs">
                {roomState.code}
              </span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400 hover:text-zinc-200" />
              )}
            </button>

            {/* Round Tracker */}
            {roomState.currentRound > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] sm:text-xs text-zinc-300 font-mono">
                <span className="text-zinc-500 hidden sm:inline">Round</span>
                <span className="text-zinc-500 sm:hidden">R</span>
                <span className="text-zinc-100 font-semibold">{roomState.currentRound}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">{roomState.maxRounds}</span>
                {roomState.isTieBreaker && (
                  <span className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] text-amber-400 font-semibold uppercase bg-amber-950/60 px-1 py-0.5 rounded border border-amber-800/60">
                    Tie
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0 z-10">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer backdrop-blur"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/50" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />}
          </button>

          {/* Leave Room Button */}
          {roomState && (
            <button
              onClick={() => {
                if (window.confirm('Leave this room and return to the main menu?')) {
                  leaveRoom();
                }
              }}
              className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-500 hover:text-rose-400 border border-transparent hover:border-zinc-800 transition cursor-pointer"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
