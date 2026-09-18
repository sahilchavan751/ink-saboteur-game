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
  Sparkles,
  Lock,
  Check,
  Globe,
  Radio,
  Users,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { INK_COLORS, AVATARS, getRandomColor, getRandomAvatar } from '../../utils/colors';
import { playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { MenuSettingsModal } from './MenuSettingsModal';
import { RulesModal } from './RulesModal';

const COOL_NAMES = [
  'DaVinci', 'Picasso', 'Bandit', 'Doodler',
  'ShadowBrush', 'Rebel', 'Monet', 'Phantom',
  'Rogue', 'CanvasSneak', 'SplatMaster', 'Echo'
];

export const LobbyView = () => {
  const { createRoom, joinRoom, getRoomTakenAvatars, error, setError, firebaseRuleAlert, subscribePublicRooms, joinRandomQueue, loadingRoom } = useGameSocket();

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

  // Taken avatars in the target room (for Join mode)
  const [takenAvatars, setTakenAvatars] = useState([]);
  const [avatarTakenModal, setAvatarTakenModal] = useState({
    isOpen: false,
    avatar: '',
    takenByName: ''
  });

  // Public rooms for matchmaking
  const [publicRooms, setPublicRooms] = useState([]);
  const [isPublicRoom, setIsPublicRoom] = useState(false);

  // Query taken avatars when typing room code in Join mode
  useEffect(() => {
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (viewMode === 'join' && cleanCode.length === 4 && getRoomTakenAvatars) {
      getRoomTakenAvatars(cleanCode).then((taken) => {
        setTakenAvatars(taken || []);
      });
    } else if (viewMode !== 'join') {
      setTakenAvatars([]);
    }
  }, [viewMode, roomCodeInput, getRoomTakenAvatars]);

  // Auto-detect invite link with ?room=XXXX
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomCodeInput(roomParam.toUpperCase());
      setViewMode('join');
    }
  }, []);

  // Subscribe to public rooms when in online view
  useEffect(() => {
    if (viewMode !== 'online') return;
    const unsubscribe = subscribePublicRooms((rooms) => {
      setPublicRooms(rooms);
    });
    return () => unsubscribe();
  }, [viewMode, subscribePublicRooms]);

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
      await createRoom(playerName.trim(), selectedColor.hex, selectedAvatar, isPublicRoom);
    } catch (err) {
      // Handled by context
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!playerName.trim() || !roomCodeInput.trim() || loading) return;

    // Check if the avatar is known to be taken in this room
    const conflicting = takenAvatars.find((t) => t.avatar === selectedAvatar);
    if (conflicting) {
      playClick();
      setAvatarTakenModal({
        isOpen: true,
        avatar: selectedAvatar,
        takenByName: conflicting.name || 'Another artist'
      });
      return;
    }

    setLoading(true);
    setError(null);
    playClick();
    localStorage.setItem('ink_saboteur_name', playerName.trim());

    try {
      await joinRoom(roomCodeInput.trim().toUpperCase(), playerName.trim(), selectedColor.hex, selectedAvatar);
    } catch (err) {
      if (err.code === 'AVATAR_TAKEN') {
        playClick();
        setAvatarTakenModal({
          isOpen: true,
          avatar: selectedAvatar,
          takenByName: err.conflictingPlayerName || 'Another artist'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col justify-center items-center px-4 py-3 sm:py-6 pb-12 sm:pb-6 animate-fadeIn">
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
            <h1 className="text-6xl sm:text-8xl font-black tracking-tight text-white font-sans">
              Ink<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300">Spy</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm tracking-wide">
              Draw subtly. Blend in. Unmask the secret Suspect.
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

            {/* Play Online - Public Matchmaking Queue */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('online');
              }}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-b from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-zinc-950 font-black text-lg tracking-wider uppercase shadow-[0_6px_0_#047857,0_16px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_4px_0_#047857,0_10px_24px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all duration-150 cursor-pointer flex items-center justify-center gap-3 group"
            >
              <Globe className="w-5 h-5 text-zinc-950 group-hover:scale-110 transition-transform" />
              <span>PLAY ONLINE</span>
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
      {/* VIEW 2: HOST VS JOIN CHOICE SELECTION - ARCADE 3D GAME MODE SELECT */}
      {viewMode === 'choice' && (
        <div className="w-full max-w-2xl my-auto space-y-6 animate-fadeIn select-none px-4">
          {/* Top Bar with Floating Arcade Back Button */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('menu');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
              <span>MAIN MENU</span>
            </button>
          </div>

          {/* Section Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow font-sans">
              Choose How to Play
            </h2>
            <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">
              Start your own private drawing room or join an existing match
            </p>
          </div>

          {/* Two Big Heroic 3D Game Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-1">
            {/* Card 1: Host Room */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('host');
              }}
              className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-black/55 via-zinc-950/70 to-black/80 backdrop-blur-2xl border-2 border-amber-400/40 hover:border-amber-300 shadow-[0_8px_0_#b45309,0_20px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_0_#b45309,0_10px_24px_rgba(0,0,0,0.5)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all duration-150 text-left flex flex-col justify-between cursor-pointer min-h-[220px]"
            >
              {/* Subtle radiant background glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-400/15 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-400/25 transition-all" />

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-amber-200 transition-colors tracking-tight font-sans">
                  Host a Room
                </h3>
                <p className="text-xs sm:text-sm text-white/75 mt-2 leading-relaxed">
                  Create a custom room, set drawing rules, pick canvas styles & invite friends.
                </p>
              </div>

              {/* Tactile 3D Action Pill */}
              <div className="mt-8 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 group-hover:from-amber-300 group-hover:to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all">
                <span>CREATE LOBBY</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* Card 2: Join Room */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('join');
              }}
              className="group relative overflow-hidden rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-black/55 via-zinc-950/70 to-black/80 backdrop-blur-2xl border-2 border-sky-400/40 hover:border-sky-300 shadow-[0_8px_0_#0369a1,0_20px_40px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_0_#0369a1,0_10px_24px_rgba(0,0,0,0.5)] hover:translate-y-[2px] active:translate-y-[6px] active:shadow-none transition-all duration-150 text-left flex flex-col justify-between cursor-pointer min-h-[220px]"
            >
              {/* Subtle radiant background glow */}
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-400/15 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-400/25 transition-all" />

              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white group-hover:text-sky-200 transition-colors tracking-tight font-sans">
                  Join with Code
                </h3>
                <p className="text-xs sm:text-sm text-white/75 mt-2 leading-relaxed">
                  Got a 4-letter room code from your friends? Jump straight into their match.
                </p>
              </div>

              {/* Tactile 3D Action Pill */}
              <div className="mt-8 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-400 to-sky-500 group-hover:from-sky-300 group-hover:to-sky-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all">
                <span>ENTER ROOM</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* VIEW: ONLINE MATCHMAKING QUEUE */}
      {viewMode === 'online' && (
        <div className="w-full max-w-2xl my-auto space-y-6 animate-fadeIn select-none px-4">
          {/* Top Bar with Floating Back Button */}
          <div className="flex items-center justify-start">
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('menu');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-emerald-300 group-hover:-translate-x-0.5 transition-transform" />
              <span>MAIN MENU</span>
            </button>
          </div>

          {/* Section Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow font-sans">
              Play Online
            </h2>
            <p className="text-xs sm:text-sm font-medium text-white/90 drop-shadow-sm">
              Join a random queue or browse open public lobbies
            </p>
          </div>

          {/* Error notification if any */}
          {error && !firebaseRuleAlert && (
            <div className="p-3 rounded-2xl bg-rose-950/70 border border-rose-400/50 text-white text-xs flex items-center justify-between gap-3 backdrop-blur animate-fadeIn">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                <span className="font-medium truncate">{error}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  playClick();
                  setError(null);
                  setIsPublicRoom(true);
                  setViewMode('host');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-[11px] shrink-0 transition cursor-pointer shadow-sm"
              >
                Host a Room
              </button>
            </div>
          )}

          {/* Quick Match Card */}
          <button
            type="button"
            onClick={async () => {
              if (loading || loadingRoom) return;
              playClick();
              setLoading(true);
              setError(null);
              localStorage.setItem('ink_saboteur_name', playerName.trim());
              try {
                await joinRandomQueue(playerName.trim() || 'Artist', selectedColor.hex, selectedAvatar);
              } catch (err) {
                setError(err.message || 'No public rooms are available right now.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading || loadingRoom}
            className="w-full group relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-b from-emerald-500/20 via-black/50 to-black/70 backdrop-blur-2xl border-2 border-emerald-400/50 hover:border-emerald-300 shadow-[0_6px_0_#047857,0_16px_32px_rgba(0,0,0,0.5)] hover:shadow-[0_4px_0_#047857,0_10px_24px_rgba(0,0,0,0.5)] hover:translate-y-[1px] active:translate-y-[4px] active:shadow-none transition-all duration-150 text-left cursor-pointer disabled:opacity-60"
          >
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-400/25 transition-all" />
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-white group-hover:text-emerald-200 transition-colors tracking-tight font-sans flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  Quick Match
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Instantly join an open public room waiting for players.
                </p>
              </div>
              <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shrink-0">
                {(loading || loadingRoom) ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Joining...</>
                ) : (
                  <><Play className="w-3.5 h-3.5 fill-zinc-950" /> GO</>
                )}
              </div>
            </div>
          </button>

          {/* Ongoing Public Rooms */}
          {/* Ongoing Public Rooms */}
          <div className="bg-black/40 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-white/20 shadow-lg flex flex-col h-[280px]">
            <div className="flex items-center justify-between pb-2.5 border-b border-white/15 shrink-0">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Public Lobbies</h3>
              </div>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-black/30 text-white/80 border border-white/15">
                {publicRooms.length} {publicRooms.length === 1 ? 'Room' : 'Rooms'}
              </span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto mt-2.5 pr-1 space-y-2 glass-scrollbar">
              {publicRooms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-3 py-2">
                  <div className="w-14 h-14 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-white/25" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/70">No public lobbies waiting right now</p>
                    <p className="text-xs text-white/40 mt-0.5">Start a public room and invite others to join!</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setError(null);
                      setIsPublicRoom(true);
                      setViewMode('host');
                    }}
                    className="mt-1 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md transition cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-zinc-950" />
                    Host a Public Room
                  </button>
                </div>
              ) : (
                publicRooms.map((room) => (
                  <div
                    key={room.code}
                    className="flex items-center justify-between p-3 rounded-xl bg-black/30 backdrop-blur border border-white/15 hover:border-white/30 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Host Avatar */}
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 border border-white/15 shrink-0 flex items-center justify-center">
                        <PlayerAvatar avatar={room.hostAvatar} name={room.hostName} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-white/80">#{room.code}</span>
                          <span className="text-[10px] text-white/50">by</span>
                          <span className="text-xs font-semibold text-white truncate max-w-[100px]">{room.hostName}</span>
                        </div>
                        {/* Player avatar bubbles */}
                        <div className="flex items-center gap-1 mt-1">
                          <div className="flex -space-x-1.5">
                            {room.players.slice(0, 5).map((p) => (
                              <div
                                key={p.id}
                                className="w-4 h-4 rounded-md overflow-hidden border border-black/60 bg-black/40"
                                title={p.name}
                              >
                                <PlayerAvatar avatar={p.avatar} name={p.name} />
                              </div>
                            ))}
                            {room.players.length > 5 && (
                              <span className="text-[9px] font-mono text-white/50 ml-1">+{room.players.length - 5}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-white/50 ml-1">{room.playerCount}/{room.maxPlayers}</span>
                          {/* Capacity progress bar */}
                          <div className="w-12 h-1 rounded-full bg-white/10 overflow-hidden ml-1">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all"
                              style={{ width: `${(room.playerCount / room.maxPlayers) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (loading || loadingRoom) return;
                        playClick();
                        setLoading(true);
                        setError(null);
                        localStorage.setItem('ink_saboteur_name', playerName.trim());
                        try {
                          await joinRoom(room.code, playerName.trim() || 'Artist', selectedColor.hex, selectedAvatar);
                        } catch (err) {
                          // handled by context
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading || loadingRoom}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      Join
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: HOST ROOM SCREEN OR JOIN ROOM SCREEN */}
      {(viewMode === 'host' || viewMode === 'join') && (
        <div className="w-full max-w-[480px] bg-gradient-to-b from-black/60 via-zinc-950/75 to-black/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border-2 border-white/20 shadow-[0_8px_0_#0f172a,0_24px_48px_rgba(0,0,0,0.5)] space-y-4 animate-fadeIn my-auto">
          {/* Top Bar with Back Navigation */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
            <button
              type="button"
              onClick={() => {
                playClick();
                setError(null);
                setViewMode('choice');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            >
              <ChevronLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              {/* lined out the pulse dot again for looking like ai slop XD.. */}
              {/* <span className={`w-2 h-2 rounded-full ${viewMode === 'host' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]'}`} /> */}
              <h2 className="text-xs font-black text-white uppercase tracking-wider font-sans">
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
                  const takenInfo = viewMode === 'join' ? takenAvatars.find((t) => t.avatar === a.src) : null;
                  const isTaken = !!takenInfo;

                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        if (isTaken) {
                          setAvatarTakenModal({
                            isOpen: true,
                            avatar: a.src,
                            takenByName: takenInfo?.name || 'Another artist'
                          });
                          return;
                        }
                        setSelectedAvatar(a.src);
                      }}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150 cursor-pointer ${isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/70 scale-105 shadow-md shadow-amber-400/20 z-10'
                        : isTaken
                          ? 'border-rose-500/40 opacity-50 hover:opacity-75'
                          : 'border-white/25 hover:border-white/70 hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                      title={isTaken ? `${a.name} (Taken by ${takenInfo?.name})` : a.name}
                    >
                      <PlayerAvatar
                        avatar={a.src}
                        name={a.name}
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                      {isTaken && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                          <div className="p-1 rounded-full bg-rose-600/90 text-white shadow-sm">
                            <Lock className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        </div>
                      )}
                      {isSelected && !isTaken && (
                        <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-black/60 shadow" />
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
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-2.5 sm:gap-1.5 bg-black/30 backdrop-blur-md p-2.5 sm:p-2 rounded-xl border border-white/15 justify-items-center">
                {INK_COLORS.map((color) => {
                  const isSelected = selectedColor.id === color.id;
                  return (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => {
                        playClick();
                        setSelectedColor(color);
                      }}
                      style={{
                        backgroundColor: color.hex,
                        width: '24px',
                        height: '24px',
                        minWidth: '24px',
                        minHeight: '24px'
                      }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer border border-white/40 relative shrink-0 flex items-center justify-center ${isSelected
                        ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-black/50 z-10 shadow-md'
                        : 'hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                      title={color.name}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white drop-shadow stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lobby Privacy Toggle (Host only) */}
            {viewMode === 'host' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-white drop-shadow-sm flex items-center gap-1.5">
                    <Globe className="w-3 h-3 text-white/80" />
                    Lobby Visibility
                  </label>
                  <span className="font-mono text-white/80 text-[11px]">
                    {isPublicRoom ? 'Public' : 'Private'}
                  </span>
                </div>
                <div className="flex gap-2 bg-black/30 backdrop-blur-md p-2 rounded-xl border border-white/15">
                  <button
                    type="button"
                    onClick={() => { playClick(); setIsPublicRoom(false); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      !isPublicRoom
                        ? 'bg-white/15 border border-white/30 text-white shadow-inner'
                        : 'text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                  >
                    <Lock className="w-3 h-3" />
                    Private
                  </button>
                  <button
                    type="button"
                    onClick={() => { playClick(); setIsPublicRoom(true); }}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isPublicRoom
                        ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-inner'
                        : 'text-white/50 hover:text-white/80 border border-transparent'
                    }`}
                  >
                    <Globe className="w-3 h-3" />
                    Public
                  </button>
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  {isPublicRoom
                    ? 'Anyone can find and join your room from the Play Online queue.'
                    : 'Only players with your room code can join.'}
                </p>
              </div>
            )}

            {/* Submit Action Button - 3D Tactile Game Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 disabled:opacity-50 disabled:cursor-not-allowed ${viewMode === 'host'
                ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_5px_0_#b45309,0_12px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_#b45309,0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[5px] active:shadow-none'
                : 'bg-gradient-to-r from-sky-400 via-cyan-300 to-sky-400 hover:from-sky-300 hover:to-sky-400 text-zinc-950 shadow-[0_5px_0_#0369a1,0_12px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_#0369a1,0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[5px] active:shadow-none'
                }`}
            >
              <span>{loading ? 'Connecting...' : viewMode === 'host' ? 'Create Game Room' : 'Join Game Room'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
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
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />

      {/* Avatar Already Taken Popup Modal */}
      {avatarTakenModal.isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn"
          onClick={() => setAvatarTakenModal({ isOpen: false, avatar: '', takenByName: '' })}
        >
          <div
            className="bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-6 sm:p-7 rounded-3xl border-2 border-amber-400/50 shadow-[0_16px_48px_rgba(0,0,0,0.8)] max-w-sm w-full text-center space-y-4 animate-scaleUp relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top radiant glow */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

            {/* Taken Avatar with Lock Stamp */}
            <div className="relative w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-amber-400/50 shadow-2xl bg-black/40 flex items-center justify-center p-1.5">
              <PlayerAvatar avatar={avatarTakenModal.avatar} className="w-full h-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center gap-1">
                <div className="p-2 rounded-xl bg-rose-500/90 text-white shadow-lg">
                  <Lock className="w-5 h-5 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 bg-rose-950/90 px-2.5 py-0.5 rounded-full border border-rose-500/50 shadow">
                  TAKEN
                </span>
              </div>
            </div>

            {/* Text Notice */}
            <div className="space-y-1.5">
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight font-sans">
                Avatar is Taken!
              </h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                This avatar is already taken by{' '}
                <span className="text-amber-300 font-bold">{avatarTakenModal.takenByName}</span> in this room.
              </p>
              <p className="text-[11px] text-zinc-400">
                Every artist in the room needs a unique avatar. Please pick another one!
              </p>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  // Auto pick next available avatar
                  const available = AVATARS.filter(
                    (a) => !takenAvatars.some((t) => t.avatar === a.src)
                  );
                  if (available.length > 0) {
                    setSelectedAvatar(available[0].src);
                  }
                  setAvatarTakenModal({ isOpen: false, avatar: '', takenByName: '' });
                }}
                className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_5px_0_#b45309,0_12px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_#b45309] hover:translate-y-[2px] active:translate-y-[5px] active:shadow-none transition-all cursor-pointer"
              >
                Choose Another Avatar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
