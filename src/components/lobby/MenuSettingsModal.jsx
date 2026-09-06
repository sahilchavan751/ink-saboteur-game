import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Volume2, VolumeX, Check, User, Music, Dices } from 'lucide-react';
import {
  toggleMute,
  getIsMuted,
  subscribeMuteChange,
  getMusicVolume,
  setMusicVolume,
  getSfxVolume,
  setSfxVolume,
  playClick
} from '../../utils/sound';

const NICKNAMES = [
  'DaVinci', 'Picasso', 'Bandit', 'Doodler',
  'ShadowBrush', 'Rebel', 'Monet', 'Phantom',
  'Rogue', 'CanvasSneak', 'SplatMaster', 'Echo',
  'PixelFox', 'InkNinja', 'Vortex', 'Chameleon'
];

export const MenuSettingsModal = ({ isOpen, onClose, playerName, onSaveName }) => {
  const [isMuted, setIsMuted] = useState(getIsMuted());
  const [musicVolume, setMusicVolumeState] = useState(Math.round(getMusicVolume() * 100));
  const [sfxVolume, setSfxVolumeState] = useState(Math.round(getSfxVolume() * 100));
  const [tempName, setTempName] = useState(playerName || '');
  const sfxThrottleRef = useRef(0);

  useEffect(() => {
    return subscribeMuteChange((newMuted) => setIsMuted(newMuted));
  }, []);

  useEffect(() => {
    setTempName(playerName || '');
  }, [playerName]);

  if (!isOpen) return null;

  const handleToggleMasterMute = () => {
    playClick();
    const nextMuted = toggleMute();
    setIsMuted(nextMuted);
  };

  const handleMusicChange = (e) => {
    const val = Number(e.target.value);
    setMusicVolumeState(val);
    setMusicVolume(val / 100);
  };

  const toggleMusicQuickMute = () => {
    playClick();
    if (musicVolume > 0) {
      setMusicVolumeState(0);
      setMusicVolume(0);
    } else {
      setMusicVolumeState(40);
      setMusicVolume(0.4);
    }
  };

  const handleSfxChange = (e) => {
    const val = Number(e.target.value);
    setSfxVolumeState(val);
    setSfxVolume(val / 100);

    const now = Date.now();
    if (now - sfxThrottleRef.current > 120 && val > 0 && !isMuted) {
      sfxThrottleRef.current = now;
      playClick();
    }
  };

  const handleSfxRelease = () => {
    if (sfxVolume > 0 && !isMuted) {
      playClick();
    }
  };

  const toggleSfxQuickMute = () => {
    playClick();
    if (sfxVolume > 0) {
      setSfxVolumeState(0);
      setSfxVolume(0);
    } else {
      setSfxVolumeState(70);
      setSfxVolume(0.7);
    }
  };

  const handleRandomizeName = () => {
    playClick();
    const random = NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)];
    setTempName(random);
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[440px] bg-gradient-to-b from-black/60 via-zinc-950/75 to-black/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border-2 border-white/20 shadow-[0_8px_0_#0f172a,0_24px_48px_rgba(0,0,0,0.5)] space-y-4 animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Back Navigation */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center">
            <h2 className="text-xs font-black text-white uppercase tracking-wider font-sans">
              Game Settings
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Artist Nickname Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-white drop-shadow-sm flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-300" />
                <span>Artist Name</span>
              </label>
              <button
                type="button"
                onClick={handleRandomizeName}
                className="text-white/80 hover:text-white flex items-center gap-1 text-[11px] transition cursor-pointer drop-shadow-sm"
              >
                <Dices className="w-3.5 h-3.5 text-amber-300" />
                <span>Random</span>
              </button>
            </div>
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              maxLength={16}
              placeholder="Your name..."
              className="w-full px-3.5 py-2 bg-black/25 backdrop-blur border border-white/20 rounded-xl text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/50 transition"
              required
            />
          </div>

          {/* Master Sound Mute Row */}
          <div className="flex items-center justify-between p-2.5 rounded-2xl bg-black/25 border border-white/15 backdrop-blur">
            <div>
              <div className="text-xs font-medium text-white">Master Sound</div>
              <div className="text-[10px] text-white/50">Mute all game sound & music</div>
            </div>

            <button
              type="button"
              onClick={handleToggleMasterMute}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold tracking-wide transition cursor-pointer flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 ${
                isMuted
                  ? 'bg-rose-500/25 border-rose-400/40 text-rose-200'
                  : 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
              }`}
              title={isMuted ? 'Unmute game audio' : 'Mute game audio'}
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                  <span className="uppercase font-mono text-[10px]">MUTED</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="uppercase font-mono text-[10px]">ACTIVE</span>
                </>
              )}
            </button>
          </div>

          {/* Minimal Music Volume Slider */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleMusicQuickMute}
                className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm cursor-pointer hover:text-indigo-200 transition"
                title="Click to toggle music mute"
              >
                <Music className="w-3.5 h-3.5 text-indigo-400" />
                <span>Music Soundtrack</span>
              </button>
              <span className="font-mono text-white/80 text-[11px]">{musicVolume}%</span>
            </div>
            <div className="pt-1">
              <input
                type="range"
                min="0"
                max="100"
                step="2"
                value={musicVolume}
                onChange={handleMusicChange}
                className="w-full h-2 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-indigo-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
          </div>

          {/* Minimal UI & Sound Effects Slider */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={toggleSfxQuickMute}
                className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm cursor-pointer hover:text-amber-200 transition"
                title="Click to toggle SFX mute"
              >
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                <span>UI & Sound Effects</span>
              </button>
              <span className="font-mono text-white/80 text-[11px]">{sfxVolume}%</span>
            </div>
            <div className="pt-1">
              <input
                type="range"
                min="0"
                max="100"
                step="2"
                value={sfxVolume}
                onChange={handleSfxChange}
                onPointerUp={handleSfxRelease}
                className="w-full h-2 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-amber-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
          </div>

          {/* Submit Action Button - 3D Tactile Game Button matching image 1 */}
          <button
            type="button"
            onClick={handleSave}
            className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_5px_0_#b45309,0_12px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_#b45309,0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[5px] active:shadow-none"
          >
            <span>SAVE SETTINGS</span>
            <Check className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
