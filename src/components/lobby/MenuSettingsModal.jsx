import React, { useState, useEffect } from 'react';
import { X, Volume2, VolumeX, Sliders, Check, User, Music } from 'lucide-react';
import { toggleMute, getIsMuted, subscribeMuteChange, getMusicVolume, setMusicVolume, playClick } from '../../utils/sound';

export const MenuSettingsModal = ({ isOpen, onClose, playerName, onSaveName }) => {
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [volume, setVolume] = useState(Math.round(getMusicVolume() * 100));
  const [tempName, setTempName] = useState(playerName || '');

  useEffect(() => {
    return subscribeMuteChange((newMuted) => setIsMuted(newMuted));
  }, []);

  useEffect(() => {
    setTempName(playerName || '');
  }, [playerName]);

  if (!isOpen) return null;

  const handleToggleMute = () => {
    playClick();
    const nextMuted = toggleMute();
    setIsMuted(nextMuted);
  };

  const handleVolumeChange = (e) => {
    const val = Number(e.target.value);
    setVolume(val);
    setMusicVolume(val / 100);
  };

  const handleSave = () => {
    playClick();
    if (tempName.trim() && onSaveName) {
      onSaveName(tempName.trim());
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] flex flex-col overflow-hidden animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between bg-black/20 backdrop-blur">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-400" />
            <h2 className="text-sm font-semibold text-white drop-shadow-sm">Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs">
          {/* Audio Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-white/90 font-semibold uppercase tracking-wider text-[11px]">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>Audio & Music</span>
            </div>

            {/* Master Sound Mute Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-black/30 border border-white/15 backdrop-blur">
              <div>
                <div className="text-white font-medium">Master Sound</div>
                <div className="text-white/50 text-[10px]">Mute all game sound effects and soundtrack</div>
              </div>
              <button
                type="button"
                onClick={handleToggleMute}
                className={`p-2 rounded-xl border text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  isMuted
                    ? 'bg-rose-500/25 border-rose-400/40 text-rose-200'
                    : 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                }`}
                title={isMuted ? 'Unmute game audio' : 'Mute game audio'}
              >
                {isMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                    <span className="font-mono text-[10px] uppercase">Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="font-mono text-[10px] uppercase">Active</span>
                  </>
                )}
              </button>
            </div>

            {/* Music Volume Slider */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/15 backdrop-blur space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">Soundtrack Volume</span>
                <span className="font-mono text-white/80 text-[11px] bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                  {volume}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <div className="flex justify-between text-[9px] text-white/40 font-mono">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="space-y-2 pt-1 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-white/90 font-semibold uppercase tracking-wider text-[11px]">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Player Nickname</span>
            </div>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={16}
              placeholder="Enter your artist name..."
              className="w-full px-3 py-2 bg-black/30 backdrop-blur border border-white/20 rounded-xl text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white/50 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-white/15 flex items-center justify-end gap-2 bg-black/20 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-xs transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
