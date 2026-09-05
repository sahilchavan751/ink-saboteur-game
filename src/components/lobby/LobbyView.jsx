import React, { useState, useEffect } from 'react';
import { Dices, ArrowRight, PlusCircle, LogIn, Paintbrush, HelpCircle, AlertTriangle, X } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { INK_COLORS, AVATARS, getRandomColor, getRandomAvatar } from '../../utils/colors';
import { playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';

const COOL_NAMES = [
  'DaVinci', 'Picasso', 'Bandit', 'Doodler', 
  'ShadowBrush', 'Rebel', 'Monet', 'Phantom',
  'Rogue', 'CanvasSneak', 'SplatMaster', 'Echo'
];

export const LobbyView = () => {
  const { createRoom, joinRoom, error, setError, firebaseRuleAlert } = useGameSocket();

  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('ink_saboteur_name') || COOL_NAMES[Math.floor(Math.random() * COOL_NAMES.length)];
  });
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedColor, setSelectedColor] = useState(() => getRandomColor());
  const [selectedAvatar, setSelectedAvatar] = useState(() => getRandomAvatar());
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setActiveTab('join');
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
    <div className="w-full flex-1 flex flex-col justify-center items-center px-4 py-2 sm:py-4 animate-fadeIn">
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

      {/* Main Glassmorphic Interaction Card */}
      <div className="w-full max-w-[480px] bg-black/30 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] space-y-3.5 sm:space-y-4">
        {/* Tab Toggle: Create vs Join */}
        <div className="flex bg-black/25 backdrop-blur-md p-1 rounded-xl border border-white/15">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('create');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-white/30 text-white font-semibold shadow-sm backdrop-blur border border-white/30'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Create Room
          </button>
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('join');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
              activeTab === 'join'
                ? 'bg-white/30 text-white font-semibold shadow-sm backdrop-blur border border-white/30'
                : 'text-white/80 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Join Room
          </button>
        </div>

        {/* Error notification if any */}
        {error && !firebaseRuleAlert && (
          <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-400/40 text-white text-xs flex items-center gap-2 backdrop-blur">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={activeTab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-3.5">
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

          {/* If Join Tab: Room Code Input */}
          {activeTab === 'join' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-white drop-shadow-sm">
                4-Letter Room Code
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="e.g. 7KNP"
                className="w-full px-3 py-2 bg-black/25 backdrop-blur border border-white/20 rounded-xl text-white font-mono text-base font-bold tracking-widest text-center uppercase placeholder:text-white/50 focus:outline-none focus:border-white/50 transition"
                required
              />
            </div>
          )}

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
            className="w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer bg-white hover:bg-zinc-100 text-zinc-950 shadow-xl disabled:opacity-50 active:scale-[0.99]"
          >
            <span>{loading ? 'Entering...' : activeTab === 'create' ? 'Create Game Room' : 'Join Game Room'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Minimal Game Rules Trigger */}
        <div className="flex items-center justify-center pt-0.5">
          <button
            type="button"
            onClick={() => setShowRules(true)}
            className="text-[11px] text-white/90 hover:text-white flex items-center gap-1.5 transition cursor-pointer bg-black/15 hover:bg-black/30 px-3 py-1 rounded-full border border-white/20 backdrop-blur shadow-sm"
          >
            <HelpCircle className="w-3 h-3 text-white/80" />
            <span>How to Play & Game Rules</span>
          </button>
        </div>
      </div>

      {/* Game Rules Modal */}
      {showRules && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fadeIn"
          onClick={() => setShowRules(false)}
        >
          <div
            className="bg-black/40 backdrop-blur-2xl border border-white/20 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.45)] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                How to Play Ink Saboteur
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
