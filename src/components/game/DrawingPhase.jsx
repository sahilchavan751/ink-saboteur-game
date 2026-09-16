import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Eye,
  EyeOff,
  RotateCcw,
  ArrowRight,
  PenTool,
  Check,
  ChevronDown,
  Radio,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  Palette,
  Volume2,
  VolumeX,
  Users,
  X
} from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { useProximity } from '../../context/ProximityContext';
import { CanvasBoard } from './CanvasBoard';
import { InkBatteryBar } from '../common/InkBatteryBar';
import { LiveChatPanel } from './LiveChatPanel';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { playClick } from '../../utils/sound';

const BRUSH_COLORS = [
  { hex: '#18181b', name: 'Ink Black' },
  { hex: '#ffffff', name: 'White' },
  { hex: '#ef4444', name: 'Crimson Red' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#eab308', name: 'Amber Yellow' },
  { hex: '#10b981', name: 'Emerald Green' },
  { hex: '#06b6d4', name: 'Cyan' },
  { hex: '#3b82f6', name: 'Royal Blue' },
  { hex: '#8b5cf6', name: 'Violet Purple' },
  { hex: '#ec4899', name: 'Hot Pink' },
  { hex: '#78350f', name: 'Brown' },
  { hex: '#64748b', name: 'Slate Gray' }
];

export const DrawingPhase = () => {
  const { roomState, socket, passTurn, timer, chatMessages = [] } = useGameSocket();
  const proximity = useProximity();

  const [concealed, setConcealed] = useState(false);
  const [brushSize, setBrushSize] = useState(6);
  const [brushMenuOpen, setBrushMenuOpen] = useState(false);
  const [brushColor, setBrushColor] = useState(null);
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileQueueOpen, setMobileQueueOpen] = useState(false);

  const brushRef = useRef(null);
  const colorRef = useRef(null);
  const whisperRef = useRef(null);
  const brushMenuRef = useRef(null);
  const colorMenuRef = useRef(null);
  const whisperMenuRef = useRef(null);

  const getBrushMenuPos = () => {
    if (!brushRef.current) return { top: 70, left: 16 };
    const rect = brushRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 6,
      left: Math.max(8, Math.min(rect.left, window.innerWidth - 160))
    };
  };

  const getColorMenuPos = () => {
    if (!colorRef.current) return { top: 70, right: 16 };
    const rect = colorRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right)
    };
  };

  const getWhisperMenuPos = () => {
    if (!whisperRef.current) return { top: 70, right: 16 };
    const rect = whisperRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right)
    };
  };

  // Close menus on outside click or resize
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        brushRef.current &&
        !brushRef.current.contains(e.target) &&
        (!brushMenuRef.current || !brushMenuRef.current.contains(e.target))
      ) {
        setBrushMenuOpen(false);
      }
      if (
        colorRef.current &&
        !colorRef.current.contains(e.target) &&
        (!colorMenuRef.current || !colorMenuRef.current.contains(e.target))
      ) {
        setColorMenuOpen(false);
      }
      if (
        whisperRef.current &&
        !whisperRef.current.contains(e.target) &&
        (!whisperMenuRef.current || !whisperMenuRef.current.contains(e.target))
      ) {
        setWhisperOpen(false);
      }
    };

    const handleResize = () => {
      setBrushMenuOpen(false);
      setColorMenuOpen(false);
      setWhisperOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!roomState) return null;

  const currentPlayer = roomState.players.find((p) => p.id === socket?.id);
  const myColor = currentPlayer?.color || '#18181b';
  const activeBrushColor = brushColor || myColor;
  const myRole = roomState.myRole;

  // Turn management
  const activePlayerId = roomState.activePlayerId;
  const isMyTurn = activePlayerId === socket?.id;
  const activePlayer = roomState.players.find((p) => p.id === activePlayerId);

  const turnDurationMs = (roomState.turnDuration || 10) * 1000;
  const turnRemainingMs = (roomState.turnTimeRemaining ?? roomState.turnDuration ?? 10) * 1000;

  const handleSendWhisper = (e) => {
    e.preventDefault();
    if (!whisperText.trim() || !proximity?.sendProximityMessage) return;
    proximity.sendProximityMessage(whisperText.trim());
    setWhisperText('');
    setWhisperOpen(false);
    playClick();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-5 py-1.5 sm:py-2 flex flex-col flex-1 h-full min-h-0 overflow-hidden space-y-2 sm:space-y-2.5">
      {/* Top Unified HUD Toolbar - Perfectly Centered & Aligned, Never Prematurely Wraps */}
      <div className="shrink-0 w-full bg-black/40 backdrop-blur-2xl border border-white/15 p-2 sm:px-3 sm:py-2.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-lg relative z-40">
        {/* Left: Secret Prompt, Role, Theme, Tie-Breaker */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink min-w-0">
          {/* Secret Prompt Pill */}
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-xs shrink-0 shadow-sm">
            <span className="font-mono text-white/50 uppercase text-[10px] sm:text-[11px]">Prompt:</span>
            {concealed ? (
              <span className="font-mono text-white/40 font-medium select-none tracking-widest text-[11px]">
                ••••••••••
              </span>
            ) : (
              <span className="font-semibold text-white max-w-[110px] sm:max-w-[170px] truncate text-xs drop-shadow-sm">
                "{myRole?.prompt || 'Loading...'}"
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playClick();
                setConcealed(!concealed);
              }}
              className="ml-0.5 text-white/60 hover:text-white transition cursor-pointer"
              title={concealed ? 'Reveal prompt & role' : 'Conceal prompt & role'}
            >
              {concealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-white/60" />}
            </button>
          </div>

          {/* Role Indicator Pill (Detective / Suspect) */}
          <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-xs font-mono shrink-0 shadow-sm">
            <span className="text-white/50 uppercase text-[10px] sm:text-[11px]">Role:</span>
            {concealed ? (
              <span className="text-white/40 font-medium select-none tracking-widest text-[10px] sm:text-[11px]">•••••</span>
            ) : (
              <span
                className={`font-semibold px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] ${
                  myRole?.isSaboteur
                    ? 'bg-rose-500/25 border border-rose-400/40 text-rose-200'
                    : 'bg-indigo-500/25 border border-indigo-400/40 text-indigo-200'
                }`}
              >
                {myRole?.isSaboteur ? 'Suspect' : 'Detective'}
              </span>
            )}
          </div>

          {/* Category Pill - Hidden when Tie-Breaker is active to save toolbar space */}
          {!roomState.isTieBreaker && (
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-xs text-white/80 shrink-0 shadow-sm">
              <span className="text-[10px] sm:text-[11px] text-white/50 font-mono uppercase">Theme:</span>
              <span className="text-white font-medium max-w-[110px] truncate">{roomState.category}</span>
            </div>
          )}

          {/* Sleek Tie-Breaker Draw Badge */}
          {roomState.isTieBreaker && (
            <div className="flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] sm:text-[11px] font-mono font-semibold shrink-0 animate-pulse shadow-sm">
              <span>⚡ Tie-Breaker</span>
            </div>
          )}
        </div>

        {/* Right: Controls (Turn Status, Battery, Brush dropdown, Color dropdown, Voice, Done, Mobile Chat) */}
        <div
          onScroll={() => {
            if (brushMenuOpen) setBrushMenuOpen(false);
            if (colorMenuOpen) setColorMenuOpen(false);
            if (whisperOpen) setWhisperOpen(false);
          }}
          className="flex items-center justify-start sm:justify-end gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar shrink min-w-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-white/15 relative overscroll-contain pr-2 sm:pr-0"
        >
          {/* Pass / Chance Indicator */}
          <div className="hidden lg:flex items-center gap-1 px-2 py-1 sm:py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-xs text-white/80 font-mono shrink-0 shadow-sm">
            <RotateCcw className="w-3 h-3 text-white/60" />
            <span className="text-[10px] sm:text-[11px]">Chance {roomState.currentChance || 1}/{roomState.drawChances || 2}</span>
          </div>

          {/* Normal Turn Indicator Pill (NO EMOJIS) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 sm:py-1.5 rounded-xl text-xs border transition shrink-0 shadow-sm ${
              isMyTurn
                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 font-semibold backdrop-blur'
                : 'bg-black/30 backdrop-blur border-white/15 text-white/80'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isMyTurn ? 'bg-emerald-400 animate-pulse' : 'bg-white/40'
              }`}
            />
            <span className="whitespace-nowrap font-medium text-[11px] sm:text-xs max-w-[85px] sm:max-w-none truncate">
              {isMyTurn ? 'Your Turn' : `${activePlayer?.name || 'Artist'}'s Turn`}
            </span>
          </div>

          {/* Small Ink Battery in Top Toolbar (Smooth Linear Animation) */}
          <div className="shrink-0">
            <InkBatteryBar
              inkRemaining={turnRemainingMs}
              maxInk={turnDurationMs}
              playerColor={activeBrushColor}
              compact={true}
            />
          </div>

          {/* Brush Thickness Dropdown Button in Top Toolbar */}
          <div ref={brushRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setBrushMenuOpen(!brushMenuOpen);
              }}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer shadow-sm ${
                brushMenuOpen
                  ? 'bg-white/20 text-white border-white/30 backdrop-blur'
                  : 'bg-black/30 backdrop-blur text-white/80 border-white/15 hover:border-white/30 hover:text-white'
              }`}
              title="Select brush thickness"
            >
              <PenTool className="w-3.5 h-3.5 text-white/80" />
              <span
                className="rounded-full bg-white inline-block shrink-0"
                style={{
                  width: brushSize <= 3 ? 4 : brushSize <= 6 ? 7 : 10,
                  height: brushSize <= 3 ? 4 : brushSize <= 6 ? 7 : 10
                }}
              />
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {/* Brush Popover Dropdown */}
            {brushMenuOpen &&
              createPortal(
                <div
                  ref={brushMenuRef}
                  style={{
                    position: 'fixed',
                    top: `${getBrushMenuPos().top}px`,
                    left: `${getBrushMenuPos().left}px`,
                    zIndex: 9999
                  }}
                  className="w-36 bg-black/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-1.5 shadow-2xl animate-fadeIn space-y-1"
                >
                  {[
                    { size: 3, label: 'Fine (3px)' },
                    { size: 6, label: 'Medium (6px)' },
                    { size: 12, label: 'Bold (12px)' }
                  ].map(({ size, label }) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        playClick();
                        setBrushSize(size);
                        setBrushMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer ${
                        brushSize === size
                          ? 'bg-white/20 text-white font-semibold border border-white/25'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full bg-current inline-block shrink-0"
                          style={{
                            width: size <= 3 ? 4 : size <= 6 ? 7 : 10,
                            height: size <= 3 ? 4 : size <= 6 ? 7 : 10
                          }}
                        />
                        <span>{label}</span>
                      </div>
                      {brushSize === size && <Check className="w-3 h-3 text-emerald-400" />}
                    </button>
                  ))}
                </div>,
                document.body
              )}
          </div>

          {/* Brush Color Horizontal Dropdown in Top Toolbar */}
          <div ref={colorRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                playClick();
                setColorMenuOpen(!colorMenuOpen);
              }}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer shadow-sm ${
                colorMenuOpen
                  ? 'bg-white/20 text-white border-white/30 backdrop-blur'
                  : 'bg-black/30 backdrop-blur text-white/80 border-white/15 hover:border-white/30 hover:text-white'
              }`}
              title="Select brush color"
            >
              <Palette className="w-3.5 h-3.5 text-white/80" />
              <span
                className="w-3.5 h-3.5 rounded-full inline-block shrink-0 border border-white/50 shadow-sm"
                style={{ backgroundColor: activeBrushColor }}
              />
              <ChevronDown className="w-3 h-3 text-white/50" />
            </button>

            {/* Horizontal Color Dropdown Palette */}
            {colorMenuOpen &&
              createPortal(
                <div
                  ref={colorMenuRef}
                  style={{
                    position: 'fixed',
                    top: `${getColorMenuPos().top}px`,
                    right: `${getColorMenuPos().right}px`,
                    zIndex: 9999
                  }}
                  className="bg-black/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-2.5 shadow-2xl animate-fadeIn"
                >
                  <div className="text-[10px] font-mono uppercase text-white/60 font-semibold mb-1.5 px-0.5 flex items-center justify-between">
                    <span>Ink Palette</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border border-white/60"
                      style={{ backgroundColor: activeBrushColor }}
                    />
                  </div>
                  <div className="grid grid-cols-6 sm:flex sm:flex-nowrap items-center gap-1.5">
                    {BRUSH_COLORS.map(({ hex, name }) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          playClick();
                          setBrushColor(hex);
                          setColorMenuOpen(false);
                        }}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full shrink-0 transition-transform hover:scale-125 cursor-pointer border ${
                          activeBrushColor === hex
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black/80 border-white scale-110 shadow-md'
                            : 'border-white/30 hover:border-white'
                        }`}
                        title={name}
                      />
                    ))}
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* Proximity Short Voice UI in Top Toolbar */}
          {proximity && (
            <div ref={whisperRef} className="relative flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  proximity.toggleProximity();
                }}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer shadow-sm ${
                  proximity.isProximityEnabled
                    ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200 backdrop-blur'
                    : 'bg-black/30 backdrop-blur border-white/15 text-white/70 hover:text-white hover:border-white/30'
                }`}
                title="Toggle proximity voice chat"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    proximity.isProximityEnabled ? 'animate-pulse text-emerald-400' : 'text-white/50'
                  }`}
                />
                <span className="font-mono text-[10px] uppercase hidden sm:inline">
                  {proximity.isProximityEnabled ? 'Voice ON' : 'Voice'}
                </span>
              </button>

              {/* Voice Chat Audio Sound Mute Button (Always next to Voice button) */}
              <button
                type="button"
                onClick={() => {
                  playClick();
                  proximity.toggleVoiceAudioMute();
                }}
                className={`p-1 sm:p-1.5 rounded-xl border text-xs transition cursor-pointer backdrop-blur shadow-sm ${
                  proximity.isVoiceAudioMuted
                    ? 'bg-rose-500/25 border-rose-400/40 text-rose-200'
                    : proximity.isProximityEnabled
                    ? 'bg-black/30 border-white/15 text-white/80 hover:text-white hover:border-white/30'
                    : 'bg-black/30 border-white/15 text-white/50 hover:text-white/80'
                }`}
                title={proximity.isVoiceAudioMuted ? 'Unmute voice chat audio' : 'Mute voice chat audio'}
              >
                {proximity.isVoiceAudioMuted ? (
                  <VolumeX className="w-3.5 h-3.5 text-rose-300" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-white/80" />
                )}
              </button>

              {proximity.isProximityEnabled && (
                <>
                  {/* Mic Mute/Unmute */}
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      proximity.toggleMute();
                    }}
                    className={`p-1 sm:p-1.5 rounded-xl border text-xs transition cursor-pointer backdrop-blur shadow-sm ${
                      proximity.isMuted
                        ? 'bg-rose-500/25 border-rose-400/40 text-rose-200'
                        : proximity.isSpeaking
                        ? 'bg-emerald-500/35 border-emerald-400 text-white animate-pulse'
                        : 'bg-black/30 border-white/15 text-white/80 hover:border-white/30'
                    }`}
                    title={proximity.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {proximity.isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-300" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-300" />
                    )}
                  </button>

                  {/* Whisper Chat Bubble Popover Button */}
                  <button
                    type="button"
                    onClick={() => setWhisperOpen(!whisperOpen)}
                    className="p-1 sm:p-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 hover:border-white/30 text-white/70 hover:text-white transition cursor-pointer shadow-sm"
                    title="Send cursor whisper speech bubble"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Whisper Input Popover */}
                  {whisperOpen &&
                    createPortal(
                      <div
                        ref={whisperMenuRef}
                        style={{
                          position: 'fixed',
                          top: `${getWhisperMenuPos().top}px`,
                          right: `${getWhisperMenuPos().right}px`,
                          zIndex: 9999
                        }}
                        className="w-64 bg-black/85 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl animate-fadeIn"
                      >
                        <form onSubmit={handleSendWhisper} className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={whisperText}
                            onChange={(e) => setWhisperText(e.target.value)}
                            placeholder="Whisper nearby (shows on canvas)..."
                            maxLength={65}
                            autoFocus
                            className="flex-1 bg-black/40 border border-white/15 focus:border-white/35 px-2.5 py-1 rounded-xl text-xs text-white placeholder:text-white/40 focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={!whisperText.trim()}
                            className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 disabled:opacity-30 text-white border border-white/20 transition cursor-pointer"
                          >
                            <Send className="w-3 h-3" />
                          </button>
                        </form>
                      </div>,
                      document.body
                    )}
                </>
              )}
            </div>
          )}

          {/* Early Done Button (If it's your turn) */}
          {isMyTurn && (
            <button
              type="button"
              onClick={() => {
                playClick();
                passTurn();
              }}
              className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 text-xs font-bold shadow transition cursor-pointer flex items-center gap-1 shrink-0"
              title="Finish drawing early"
            >
              <span>Done</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Interactive Action Bar: Full Queue & Live Chat Access */}
      <div className="shrink-0 lg:hidden bg-black/40 backdrop-blur-2xl border border-white/15 px-2.5 py-1.5 rounded-2xl flex items-center justify-between gap-1.5 shadow-sm relative z-30">
        {/* Left: Queue Button with Pass Counter */}
        <button
          type="button"
          onClick={() => {
            playClick();
            setMobileQueueOpen(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold shrink-0 shadow-sm active:scale-95 transition cursor-pointer"
          title="Open Drawing Queue details"
        >
          <Users className="w-3.5 h-3.5 text-indigo-300" />
          <span className="text-[11px]">Queue</span>
          <span className="text-[10px] font-mono text-white/80 bg-black/40 px-1.5 py-0.2 rounded border border-white/10 font-bold">
            {roomState.currentChance || 1}/{roomState.drawChances || 2}
          </span>
        </button>

        {/* Center: Scrollable Live Queue Mini-Avatar Preview (Tapping opens Queue Drawer) */}
        <div
          onClick={() => {
            playClick();
            setMobileQueueOpen(true);
          }}
          className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 px-1 cursor-pointer"
          title="Tap to see queue & player scores"
        >
          {(roomState.turnOrder || []).map((pid, idx) => {
            const player = roomState.players?.find((p) => p.id === pid);
            if (!player) return null;

            const turnOrderLen = (roomState.turnOrder || []).length || 1;
            const activeIndexInLap = (roomState.currentTurnIndex ?? 0) % turnOrderLen;
            const isCurrent = idx === activeIndexInLap;
            const hasCompleted = idx < activeIndexInLap;
            const isMe = pid === socket?.id;

            return (
              <div
                key={pid}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] shrink-0 transition ${
                  isCurrent
                    ? 'bg-white/20 border-white/40 text-white shadow-sm ring-1 ring-emerald-400/50'
                    : hasCompleted
                    ? 'bg-black/20 border-white/10 opacity-50 text-white/50'
                    : 'bg-black/30 border-white/15 text-white/80'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-md flex items-center justify-center bg-black/30 border overflow-hidden shrink-0"
                  style={{ borderColor: player.color }}
                >
                  <PlayerAvatar avatar={player.avatar} name={player.name} />
                </div>
                <span className="truncate max-w-[55px] font-medium">{player.name}</span>
                {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
                {hasCompleted && <CheckCircle2 className="w-2.5 h-2.5 text-white/60 shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* Right: Dedicated Live Chat Button with Count Badge */}
        <button
          type="button"
          onClick={() => {
            playClick();
            setMobileChatOpen(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/50 text-white text-xs font-semibold shrink-0 shadow-sm active:scale-95 transition cursor-pointer backdrop-blur"
          title="Open Live Chat"
        >
          <MessageSquare className="w-3.5 h-3.5 text-sky-300" />
          <span className="text-[11px]">Chat</span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-indigo-500 text-white font-mono shadow-sm">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Drawing Area: Maximized Whiteboard & Desktop Queue + Live Chat Rails */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 items-stretch h-full overflow-hidden">
        {/* Whiteboard Hero (3 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-3 w-full h-full min-h-0 flex flex-col overflow-hidden">
          <CanvasBoard
            playerColor={activeBrushColor}
            brushColor={activeBrushColor}
            inkRemaining={turnRemainingMs}
            setInkRemaining={() => {}}
            isInteractive={isMyTurn && (roomState.turnTimeRemaining ?? 10) > 0}
            brushSize={brushSize}
          />
        </div>

        {/* Desktop Right Rail: Stacked Drawing Queue & Live Chat */}
        <div className="hidden lg:flex flex-col gap-3 overflow-hidden" style={{ height: '100%', minHeight: 0, maxHeight: '100%' }}>
          {/* Top: Drawing Queue Panel with Inner Scroll */}
          <div className="shrink-0 max-h-[46%] min-h-[140px] flex flex-col bg-black/40 backdrop-blur-2xl p-3 rounded-2xl border border-white/15 shadow-lg overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-white/15 shrink-0">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Drawing Queue
              </h3>
              <span className="text-[11px] font-mono text-white/80 font-medium bg-black/25 px-2 py-0.5 rounded-lg border border-white/15 backdrop-blur">
                Pass {roomState.currentChance || 1} / {roomState.drawChances || 2}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto pr-1 min-h-0 mt-2">
              {(roomState.turnOrder || []).map((pid, idx) => {
                const player = roomState.players.find((p) => p.id === pid);
                if (!player) return null;

                const turnOrderLen = (roomState.turnOrder || []).length || 1;
                const activeIndexInLap = (roomState.currentTurnIndex ?? 0) % turnOrderLen;
                const isCurrent = idx === activeIndexInLap;
                const hasCompletedInLap = idx < activeIndexInLap;
                const isMe = pid === socket?.id;

                return (
                  <div
                    key={pid}
                    className={`flex items-center justify-between p-2 rounded-xl border text-xs transition backdrop-blur ${
                      isCurrent
                        ? 'bg-white/15 border-white/35 shadow-sm text-white'
                        : hasCompletedInLap
                        ? 'bg-black/15 border-white/10 opacity-60 text-white/60'
                        : 'bg-black/25 border-white/15 text-white/90 hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-white/50 w-3 font-semibold">
                        {idx + 1}
                      </span>
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center bg-black/30 border overflow-hidden shrink-0 shadow-inner"
                        style={{ borderColor: player.color }}
                      >
                        <PlayerAvatar avatar={player.avatar} name={player.name} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-medium text-white">
                          <span className="truncate max-w-[80px] text-[11px] drop-shadow-sm">{player.name}</span>
                          {isMe && <span className="text-[9px] text-white/60 font-mono">(You)</span>}
                        </div>
                        <div className="flex items-center gap-1 text-[9px] text-white/60 font-mono">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: player.color }}
                          />
                          <span>{player.score} pts</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span className="text-[9px] font-mono text-emerald-300 font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Drawing
                        </span>
                      ) : hasCompletedInLap ? (
                        <span className="text-[9px] font-mono text-white/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-white/50" />
                          Done
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-white/50">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Live Chat Panel — flex-1 with strict min/max to never overflow */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <LiveChatPanel />
          </div>
        </div>
      </div>

      {/* DRAWING INTERMISSION BLURRED OVERLAY WITH COUNTDOWN & ARTIST NAMES */}
      {roomState.phase === 'DRAWING_INTERMISSION' && (
        <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-lg w-full bg-black/45 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.5)] space-y-5 text-center overflow-hidden">
            {/* Top Specular Edge Glow */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent pointer-events-none" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono text-amber-300 backdrop-blur-md shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Artists Done Drawing</span>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
                Review the Masterpiece
              </h2>
              <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto leading-relaxed">
                Take a moment to inspect all strokes on the whiteboard. Who drew inconsistent with the theme?
              </p>
            </div>

            {/* Countdown display */}
            <div>
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/[0.07] backdrop-blur-md border border-white/15 text-white shadow-inner">
                <Clock className="w-4 h-4 text-amber-300 animate-pulse" />
                <span className="text-xs text-white/60 font-mono">Voting begins in:</span>
                <span className="text-xl font-bold font-mono text-amber-300">
                  {Math.max(0, timer?.timeRemaining ?? 5)}s
                </span>
              </div>
            </div>

            {/* Grid of all players so names are already clearly visible! */}
            <div className="space-y-2 text-left pt-3 border-t border-white/15">
              <div className="flex items-center justify-between text-[11px] text-white/60 font-mono px-1">
                <span>Artists in this match:</span>
                <span>{roomState.players?.length || 0} Suspects</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[180px] overflow-y-auto pr-1">
                {roomState.players?.map((p) => {
                  const isSelf = p.id === socket?.id;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] backdrop-blur-md border border-white/15 text-xs text-white transition shadow-sm"
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center bg-black/40 border overflow-hidden shrink-0 shadow-inner"
                        style={{ borderColor: p.color }}
                      >
                        <PlayerAvatar avatar={p.avatar} name={p.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate flex items-center gap-1">
                          <span>{p.name}</span>
                          {isSelf && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white font-semibold border border-white/20">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-white/60 font-mono">
                          <span
                            className="w-1.5 h-1.5 rounded-full inline-block"
                            style={{ backgroundColor: p.color }}
                          />
                          <span>{p.score} pts</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Live Chat Drawer Modal */}
      {mobileChatOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileChatOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md h-[72vh] max-h-[520px]">
            <LiveChatPanel isMobileDrawer={true} onCloseMobile={() => setMobileChatOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile Drawing Queue Drawer Modal */}
      {mobileQueueOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileQueueOpen(false);
          }}
          className="lg:hidden fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-end sm:items-center justify-center p-2 sm:p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-zinc-950/90 backdrop-blur-2xl border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col max-h-[82vh] overflow-hidden space-y-3">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-white/15 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    Drawing Queue
                  </h3>
                  <span className="text-[10px] font-mono text-white/50">
                    Turn order & artist status
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-semibold text-white/80 bg-white/10 px-2.5 py-1 rounded-xl border border-white/15">
                  Pass {roomState.currentChance || 1} / {roomState.drawChances || 2}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setMobileQueueOpen(false);
                  }}
                  className="flex items-center gap-1 text-xs font-mono text-white/80 hover:text-white px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 cursor-pointer shadow-sm active:scale-95 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Modal Body: List of all players in turn order */}
            <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
              {(roomState.turnOrder || []).map((pid, idx) => {
                const player = roomState.players?.find((p) => p.id === pid);
                if (!player) return null;

                const turnOrderLen = (roomState.turnOrder || []).length || 1;
                const activeIndexInLap = (roomState.currentTurnIndex ?? 0) % turnOrderLen;
                const isCurrent = idx === activeIndexInLap;
                const hasCompleted = idx < activeIndexInLap;
                const isMe = pid === socket?.id;

                return (
                  <div
                    key={pid}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border transition backdrop-blur ${
                      isCurrent
                        ? 'bg-emerald-500/15 border-emerald-400/40 text-white shadow-md ring-1 ring-emerald-400/30'
                        : hasCompleted
                        ? 'bg-black/20 border-white/10 opacity-60 text-white/60'
                        : 'bg-white/[0.06] border-white/15 text-white/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Number Rank */}
                      <span className="font-mono text-xs font-bold text-white/40 w-4 shrink-0 text-center">
                        #{idx + 1}
                      </span>

                      {/* Avatar */}
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-black/40 border-2 overflow-hidden shrink-0 shadow-inner"
                        style={{ borderColor: player.color }}
                      >
                        <PlayerAvatar avatar={player.avatar} name={player.name} />
                      </div>

                      {/* Player Details */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-medium text-white">
                          <span className="truncate max-w-[120px] text-xs font-semibold">{player.name}</span>
                          {isMe && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-white/60 font-mono mt-0.5">
                          <div className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full inline-block border border-white/40 shadow-xs"
                              style={{ backgroundColor: player.color }}
                            />
                            <span className="truncate max-w-[60px]">{player.inkName || 'Ink'}</span>
                          </div>
                          <span>•</span>
                          <span className="text-white/80 font-semibold">{player.score || 0} pts</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {isCurrent ? (
                        <span className="text-[10px] font-mono text-emerald-200 font-bold px-2 py-1 rounded-xl bg-emerald-500/25 border border-emerald-400/50 flex items-center gap-1.5 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Drawing Now
                        </span>
                      ) : hasCompleted ? (
                        <span className="text-[10px] font-mono text-white/50 px-2 py-1 rounded-xl bg-black/30 border border-white/10 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-white/60" />
                          Completed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-white/40 px-2 py-1 rounded-xl bg-black/20 border border-white/10">
                          Waiting Turn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Tip Card */}
            <div className="pt-2 border-t border-white/10 text-center shrink-0">
              <p className="text-[10px] text-white/50 font-mono">
                🕵️ Spot the Suspect by analyzing drawing strokes in real-time!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
