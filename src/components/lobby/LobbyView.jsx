import React, { useState, useEffect } from 'react';
import {
  Dices,
  ArrowRight,
  PlusCircle,
  LogIn,
  Paintbrush,
  HelpCircle,
  AlertTriangle,
  X,
  Play,
  Sliders,
  ChevronLeft,
  Crown,
  Sparkles
} from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { INK_COLORS, AVATARS, getRandomColor, getRandomAvatar } from '../../utils/colors';
import { playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { MenuSettingsModal } from './MenuSettingsModal';

const COOL_NAMES = [
  'DaVinci', 'Picasso', 'Bandit', 'Doodler',
  'ShadowBrush', 'Rebel', 'Monet', 'Phantom',
  'Rogue', 'CanvasSneak', 'SplatMaster', 'Echo'
];

export const LobbyView = () => {
  const { createRoom, joinRoom, error, setError, firebaseRuleAlert } = useGameSocket();

  // Navigation mode: 'menu' | 'choice' | 'host' | 'join'
  const [viewMode, setViewMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('room') ? 'join' : 'menu';
  });

  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ink_saboteur_name') || COOL_NAMES[Math.floor(Math.random() * COOL_NAMES.length)];
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());
  const [selectedAvatar, setSelectedAvatar] = useState(() => getRandomAvatar());
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Auto-detect invite link with ?room=XXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setViewMode('join');
    }
  }, []);

  const randomizeName = () => {
    playClick();
    const random = COOL_NAMES[Math.floor(Math.random() * COOL_NAMES.length)];
    setPlayerName(random);
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || loading) return;
    setLoading(true);
    setError(null);
    playClick();
    localStorage.setItem('ink_saboteur_name', playerName.trim());

    try {
      await createRoom(playerName.trim(), selectedColor.hex, selectedAvatar);
    } catch (err) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim() || loading) return;
    setLoading(true);
    setError(null);
    playClick();
    localStorage.setItem('ink_saboteur_name', playerName.trim());

    try {
      await joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim(), selectedColor.hex, selectedAvatar);
    } catch (err) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center px-4 py-3 sm:py-6 animate-fadeIn">
      {/* Firebase Permission Denied Guidance Banner */}
      {firebaseRuleAlert && (
        <div className="max-w-md w-full mb-3 p-3 rounded-xl bg-zinc-900/95 backdrop-blur border border-amber-500/50 text-amber-200 space-y-2 shadow-xl">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-semibold text-xs text-white">
                Firebase Realtime Database Rules Required
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Paste into Firebase Console &gt; Realtime Database &gt; Rules:
              </p>
            </div>
          </div>
          <pre className="bg-zinc-950 p-2 rounded-lg text-[10px] font-mono text-zinc-300 border border-zinc-800">
{`{ "rules": { ".read": true, ".write": true } }`}
          </pre>
        </div>
      )}

      {/* VIEW 1: MAIN START MENU - SLEEK MINIMAL GAME TITLE SCREEN */}
      {viewMode === 'menu' && (
        <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fadeIn select-none my-auto">
          {/* Heroic Floating Game Title */}
          <div className="space-y-2">
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)] font-sans">
              Ink<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300">Spy</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-wide">
              Draw subtly. Blend in. Unmask the secret Saboteur.
            </p>
          </div>

          {/* Game Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            {/* Big Tactile Game Play Button */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('choice');
              }}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-b from-white via-zinc-100 to-zinc-200 hover:from-white hover:to-zinc-100 text-zinc-950 font-black text-lg tracking-wider uppercase shadow-[0_6px_0_#94a3b8,0_16px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_#94a3b8,0_10px_24px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all duration-150 cursor-pointer flex items-center justify-center gap-3 group"
            >
              <Play className="w-5 h-5 fill-zinc-950 text-zinc-950 group-hover:scale-110 transition-transform" />
              <span>PLAY</span>
            </button>

            {/* Floating Minimal Game HUD Buttons: Settings & Rules */}
            <div className="flex items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowSettings(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white text-xs font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playClick();
                  setShowRules(true);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-2xl border border-white/20 hover:border-white/40 text-white text-xs font-semibold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-300" />
                <span>Rules</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: HOST VS JOIN CHOICE SELECTION */}
      {viewMode === 'choice' && (
        <div className="w-full max-w-[460px] bg-black/35 backdrop-blur-2xl rounded-3xl p-5 sm:p-7 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] space-y-5 animate-fadeIn">
          {/* Header with Back Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('menu');
              }}
              className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Main Menu</span>
            </button>
            <span className="text-[11px] font-mono text-white/50 uppercase">Select Mode</span>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-white tracking-tight">Choose How to Play</h2>
            <p className="text-xs text-white/60">Create a private room or enter an existing match</p>
          </div>

          {/* Two Big Options: Host vs Join */}
          <div className="grid grid-cols-1 gap-3 pt-1">
            {/* Host Room Option Card */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('host');
              }}
              className="group p-4 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/15 hover:border-white/35 transition-all text-left flex items-start gap-3.5 cursor-pointer backdrop-blur shadow-sm active:scale-[0.99]"
            >
              <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <Crown className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-amber-200 transition-colors">
                    Host a Room
                  </h3>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-400/25">
                    Create
                  </span>
                </div>
                <p className="text-xs text-white/65 mt-1 leading-snug">
                  Create a new game lobby, customize match rules, choose canvas styles, and invite friends.
                </p>
              </div>
            </button>

            {/* Join Room Option Card */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('join');
              }}
              className="group p-4 rounded-2xl bg-black/30 hover:bg-black/50 border border-white/15 hover:border-white/35 transition-all text-left flex items-start gap-3.5 cursor-pointer backdrop-blur shadow-sm active:scale-[0.99]"
            >
              <div className="p-3 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-300 shrink-0 group-hover:scale-105 transition-transform">
                <LogIn className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-sky-200 transition-colors">
                    Join with Code
                  </h3>
                  <span className="text-[10px] font-mono text-sky-300/80 bg-sky-500/15 px-2 py-0.5 rounded-md border border-sky-400/25">
                    Enter
                  </span>
                </div>
                <p className="text-xs text-white/65 mt-1 leading-snug">
                  Have a 4-letter room code from your friends? Jump straight into their room.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: HOST ROOM SCREEN OR JOIN ROOM SCREEN */}
      {(viewMode === 'host' || viewMode === 'join') && (
        <div className="w-full max-w-[480px] bg-black/35 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] space-y-4 animate-fadeIn">
          {/* Top Bar with Back Navigation */}
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('choice');
              }}
              className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                {viewMode === 'host' ? 'Host New Room' : 'Join Game Room'}
              </h2>
            </div>
          </div>

          {/* Error notification if any */}
          {error && !firebaseRuleAlert && (
            <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-400/40 text-white text-xs flex items-center gap-2 backdrop-blur">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={viewMode === 'host' ? handleCreateRoom : handleJoinRoom} className="space-y-3.5">
            {/* If Join Mode: Prominent 4-Letter Room Code Input */}
            {viewMode === 'join' && (
              <div className="space-y-1 p-3 rounded-2xl bg-black/25 border border-white/15">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-white flex items-center gap-1.5">
                    <span>4-Letter Room Code</span>
                  </label>
                  <span className="text-[10px] text-white/50 font-mono">Ask the host for code</span>
                </div>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="e.g. 7KNP"
                  className="w-full px-3 py-2 bg-black/40 backdrop-blur border border-white/20 rounded-xl text-white font-mono text-lg font-bold tracking-widest text-center uppercase placeholder:text-white/40 focus:outline-none focus:border-white/50 transition shadow-inner"
                  required
                  autoFocus
                />
              </div>
            )}

            {/* Player Nickname Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-white drop-shadow-sm">
                  Artist Name
                </label>
                <button
                  type="button"
                  onClick={randomizeName}
                  className="text-white/80 hover:text-white flex items-center gap-1 text-[11px] transition cursor-pointer drop-shadow-sm"
                >
                  <Dices className="w-3 h-3" />
                  Random
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-9 h-9 rounded-full overflow-hidden shrink-0 border-2 bg-black/20 backdrop-blur flex items-center justify-center shadow-inner"
                  style={{ borderColor: selectedColor.hex }}
                  title="Active Avatar"
                >
                  <PlayerAvatar avatar={selectedAvatar} name={playerName} />
                </div>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  maxLength={16}
                  placeholder="Your name..."
                  className="flex-1 px-3 py-2 bg-black/25 backdrop-blur border border-white/20 rounded-xl text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-white/50 transition"
                  required
                />
              </div>
            </div>

            {/* Cartoon Avatar Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-white drop-shadow-sm">
                  Choose Your Avatar
                </label>
                <span className="font-mono text-white/80 text-[11px]">
                  {AVATARS.find((a) => a.src === selectedAvatar)?.name || 'Custom'}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 bg-black/25 backdrop-blur p-2 rounded-xl border border-white/15">
                {AVATARS.map((a) => {
                  const isSelected = selectedAvatar === a.src;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedAvatar(a.src);
                      }}
                      className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? 'border-white ring-2 ring-white/70 scale-105 shadow-md shadow-white/20'
                          : 'border-white/25 hover:border-white/70 hover:scale-105 opacity-90 hover:opacity-100'
                      }`}
                      title={a.name}
                    >
                      <img
                        src={a.src}
                        alt={a.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-white ring-1 ring-black/40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ink Color Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-medium text-white drop-shadow-sm flex items-center gap-1.5">
                  <Paintbrush className="w-3 h-3 text-white/80" />
                  Ink Pigment Color
                </label>
                <span className="font-mono text-white/80 text-[11px]">
                  {selectedColor.name}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1.5 bg-black/25 backdrop-blur p-2 rounded-xl border border-white/15">
                {INK_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setSelectedColor(color);
                    }}
                    style={{ backgroundColor: color.hex }}
                    className={`w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full transition-transform cursor-pointer border border-white/30 relative mx-auto ${
                      selectedColor.id === color.id
                        ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-black/40 z-10 shadow-md'
                        : 'hover:scale-105 opacity-90 hover:opacity-100'
                    }`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer bg-white hover:bg-zinc-100 text-zinc-950 shadow-xl disabled:opacity-50 active:scale-[0.99] mt-2"
            >
              <span>{loading ? 'Connecting...' : viewMode === 'host' ? 'Create Game Room' : 'Join Game Room'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Menu Settings Modal */}
      <MenuSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        playerName={playerName}
        onSaveName={(name) => {
          setPlayerName(name);
          localStorage.setItem('ink_saboteur_name', name);
        }}
      />

      {/* Game Rules Tutorial Modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                How to Play InkSpy
              </h3>
              <button
                type="button"
                onClick={() => setShowRules(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-black/25 backdrop-blur p-3.5 rounded-xl border border-white/15 space-y-1 text-xs">
                <div className="text-lg">🎭</div>
                <h4 className="font-semibold text-white">1. Secret Prompts</h4>
                <p className="text-white/80 text-[11px] leading-normal">
                  Citizens get the real prompt. The Saboteur gets a similar fake one.
                </p>
              </div>

              <div className="bg-black/25 backdrop-blur p-3.5 rounded-xl border border-white/15 space-y-1 text-xs">
                <div className="text-lg">🎨</div>
                <h4 className="font-semibold text-white">2. Whiteboard</h4>
                <p className="text-white/80 text-[11px] leading-normal">
                  Everyone draws together on the same white canvas simultaneously.
                </p>
              </div>

              <div className="bg-black/25 backdrop-blur p-3.5 rounded-xl border border-white/15 space-y-1 text-xs">
                <div className="text-lg">🔋</div>
                <h4 className="font-semibold text-white">3. Ink Battery</h4>
                <p className="text-white/80 text-[11px] leading-normal">
                  Each player has only 5s of active drawing time. Make every dot count.
                </p>
              </div>

              <div className="bg-black/25 backdrop-blur p-3.5 rounded-xl border border-white/15 space-y-1 text-xs">
                <div className="text-lg">🗳️</div>
                <h4 className="font-semibold text-white">4. Deduce & Guess</h4>
                <p className="text-white/80 text-[11px] leading-normal">
                  Vote out the Saboteur. If caught, the Saboteur can guess the real prompt!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
