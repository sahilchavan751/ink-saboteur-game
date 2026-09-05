import React, { useState, useEffect } from 'react';
import { Dices, ArrowRight, PlusCircle, LogIn, Paintbrush, HelpCircle, AlertTriangle } from 'lucide-react';
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
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-10 animate-fadeIn">
      {/* Title & Tagline */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white">
          Ink Saboteur
        </h1>
        <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
          One shared whiteboard. Everyone draws simultaneously with limited ink. Citizens draw the prompt, the Saboteur draws a fake one. Find the impostor.
        </p>
      </div>

      {/* Firebase Permission Denied Guidance Banner */}
      {firebaseRuleAlert && (
        <div className="max-w-xl mx-auto p-4 rounded-xl bg-zinc-900 border border-amber-500/50 text-amber-200 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-xs text-white">
                Firebase Realtime Database Rules Required
              </h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Your database currently has locked rules. In your <strong>Firebase Console &gt; Realtime Database &gt; Rules</strong> tab, paste:
              </p>
            </div>
          </div>

          <pre className="bg-zinc-950 p-2.5 rounded-lg text-[11px] font-mono text-zinc-300 border border-zinc-800">
{`{
  "rules": {
    ".read": true,
    ".write": true
  }
}`}
          </pre>
        </div>
      )}

      {/* Main Interaction Card */}
      <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 border border-zinc-800 max-w-xl mx-auto shadow-subtle space-y-6">
        {/* Tab Toggle: Create vs Join */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              playClick();
              setActiveTab('create');
              setError(null);
            }}
            className={`flex-1 py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
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
            className={`flex-1 py-2.5 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'join'
                ? 'bg-zinc-800 text-white font-semibold'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Join Room
          </button>
        </div>

        {/* Error notification if any */}
        {error && !firebaseRuleAlert && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={activeTab === 'create' ? handleCreateRoom : handleJoinRoom} className="space-y-5">
          {/* Player Nickname Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300">
                Artist Name
              </label>
              <button
                type="button"
                onClick={randomizeName}
                className="text-zinc-400 hover:text-zinc-200 flex items-center gap-1 text-[11px] transition cursor-pointer"
              >
                <Dices className="w-3 h-3" />
                Random
              </button>
            </div>
            <div className="flex items-center gap-2.5">
              <div
                className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border-2 bg-zinc-950 flex items-center justify-center shadow-inner"
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
                className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                required
              />
            </div>
          </div>

          {/* If Join Tab: Room Code Input */}
          {activeTab === 'join' && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                4-Letter Room Code
              </label>
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                maxLength={4}
                placeholder="e.g. 7KNP"
                className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 font-mono text-base font-bold tracking-widest text-center uppercase placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition"
                required
              />
            </div>
          )}

          {/* Cartoon Avatar Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300">
                Choose Your Avatar
              </label>
              <span className="font-mono text-zinc-400 text-[11px]">
                {AVATARS.find((a) => a.src === selectedAvatar)?.name || 'Custom'}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 bg-zinc-950 p-3 rounded-2xl border border-zinc-800">
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
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/40 scale-105 shadow-md shadow-indigo-500/20'
                        : 'border-zinc-800/80 hover:border-zinc-600 hover:scale-102 opacity-75 hover:opacity-100'
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
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-zinc-950" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ink Color Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Paintbrush className="w-3 h-3 text-zinc-400" />
                Ink Pigment Color
              </label>
              <span className="font-mono text-zinc-400 text-[11px]">
                {selectedColor.name}
              </span>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 bg-zinc-950 p-3 rounded-xl border border-zinc-800">
              {INK_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setSelectedColor(color);
                  }}
                  style={{ backgroundColor: color.hex }}
                  className={`w-7 h-7 rounded-full transition-transform cursor-pointer border border-zinc-800 relative ${
                    selectedColor.id === color.id
                      ? 'scale-110 ring-2 ring-zinc-300 ring-offset-2 ring-offset-zinc-950 z-10'
                      : 'hover:scale-105 opacity-80 hover:opacity-100'
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
            className="w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer bg-zinc-100 hover:bg-white text-zinc-900 disabled:opacity-50"
          >
            <span>{loading ? 'Entering...' : activeTab === 'create' ? 'Create Game Room' : 'Join Game Room'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* How to Play Primer Cards */}
      <div className="space-y-3 max-w-3xl mx-auto">
        <h3 className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Game Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs">
            <div className="text-lg">🎭</div>
            <h4 className="font-semibold text-zinc-200">1. Secret Prompts</h4>
            <p className="text-zinc-500 text-[11px] leading-normal">
              Citizens get the real prompt. The Saboteur gets a similar fake one.
            </p>
          </div>

          <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs">
            <div className="text-lg">🎨</div>
            <h4 className="font-semibold text-zinc-200">2. Whiteboard</h4>
            <p className="text-zinc-500 text-[11px] leading-normal">
              Everyone draws together on the same white canvas simultaneously.
            </p>
          </div>

          <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs">
            <div className="text-lg">🔋</div>
            <h4 className="font-semibold text-zinc-200">3. Ink Battery</h4>
            <p className="text-zinc-500 text-[11px] leading-normal">
              Each player has only 5s of active drawing time. Make every dot count.
            </p>
          </div>

          <div className="bg-zinc-900 p-3.5 rounded-xl border border-zinc-800 space-y-1 text-xs">
            <div className="text-lg">🗳️</div>
            <h4 className="font-semibold text-zinc-200">4. Deduce & Guess</h4>
            <p className="text-zinc-500 text-[11px] leading-normal">
              Vote out the Saboteur. If caught, the Saboteur can guess the real prompt!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
