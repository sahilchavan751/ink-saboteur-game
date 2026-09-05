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
    <header className="w-full backdrop-blur-2xl border-b border-white/15 bg-black/25 sticky top-0 z-50 transition-colors shadow-sm">
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
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 backdrop-blur border border-white/15 hover:border-white/30 hover:bg-black/40 text-xs transition cursor-pointer shadow-sm"
              title="Click to copy room code"
            >
              <span className="font-mono text-[10px] sm:text-[11px] text-white/60 uppercase">Room</span>
              <span className="font-mono font-semibold text-white tracking-wider text-[11px] sm:text-xs">
                {roomState.code}
              </span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/60 hover:text-white" />
              )}
            </button>

            {/* Round Tracker */}
            {roomState.currentRound > 0 && (
              <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-[11px] sm:text-xs text-white/90 font-mono shadow-sm">
                <span className="text-white/60 hidden sm:inline">Round</span>
                <span className="text-white/60 sm:hidden">R</span>
                <span className="text-white font-semibold">{roomState.currentRound}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/70">{roomState.maxRounds}</span>
                {roomState.isTieBreaker && (
                  <span className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] text-amber-300 font-semibold uppercase bg-amber-500/20 px-1.5 py-0.5 rounded-md border border-amber-400/40">
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
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer backdrop-blur shadow-sm"
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
              className="p-1.5 rounded-xl bg-white/10 hover:bg-rose-500/20 text-white/70 hover:text-rose-300 border border-white/15 hover:border-rose-400/40 transition cursor-pointer backdrop-blur shadow-sm"
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
