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
    <header className="w-full bg-zinc-950/90 backdrop-blur border-b border-zinc-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Minimal Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100 text-sm font-semibold">
            <PenTool className="w-4 h-4 text-zinc-200" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight">
              Ink Saboteur
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
              Whiteboard
            </span>
          </div>
        </div>

        {/* Center: Room Info & Round Tracker */}
        {roomState && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Room Code Badge */}
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-xs transition cursor-pointer"
              title="Click to copy room code"
            >
              <span className="font-mono text-[11px] text-zinc-500 uppercase">Room</span>
              <span className="font-mono font-semibold text-zinc-100 tracking-wider text-xs">
                {roomState.code}
              </span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-zinc-400 hover:text-zinc-200" />
              )}
            </button>

            {/* Round Tracker */}
            {roomState.currentRound > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 font-mono">
                <span className="text-zinc-500">Round</span>
                <span className="text-zinc-100 font-semibold">{roomState.currentRound}</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">{roomState.maxRounds}</span>
                {roomState.isTieBreaker && (
                  <span className="ml-1 text-[10px] text-amber-400 font-semibold uppercase bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/60">
                    Tie-Breaker
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Right Utility Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
            title={muted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {muted ? <VolumeX className="w-4 h-4 text-zinc-500" /> : <Volume2 className="w-4 h-4 text-zinc-300" />}
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
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
