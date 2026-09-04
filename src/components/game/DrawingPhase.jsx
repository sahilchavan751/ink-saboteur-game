import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, RotateCcw, ArrowRight, PenTool, Check, ChevronDown, Radio, Mic, MicOff, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { useProximity } from '../../context/ProximityContext';
import { CanvasBoard } from './CanvasBoard';
import { InkBatteryBar } from '../common/InkBatteryBar';
import { playClick } from '../../utils/sound';

export const DrawingPhase = () => {
  const { roomState, socket, passTurn } = useGameSocket();
  const proximity = useProximity();

  const [concealed, setConcealed] = useState(false);
  const [brushSize, setBrushSize] = useState(6);
  const [brushMenuOpen, setBrushMenuOpen] = useState(false);
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [whisperText, setWhisperText] = useState('');

  const brushRef = useRef(null);
  const whisperRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (brushRef.current && !brushRef.current.contains(e.target)) {
        setBrushMenuOpen(false);
      }
      if (whisperRef.current && !whisperRef.current.contains(e.target)) {
        setWhisperOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!roomState) return null;

  const currentPlayer = roomState.players.find((p) => p.id === socket?.id);
  const myColor = currentPlayer?.color || '#18181b';
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
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-2 flex flex-col flex-1 h-full min-h-0 space-y-2.5">
      {/* Top Unified HUD Toolbar - Perfectly Centered & Aligned */}
      <div className="shrink-0 w-full bg-zinc-900 border border-zinc-800 p-2.5 sm:p-3 rounded-2xl flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
        {/* Left: Secret Prompt & Category */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Secret Prompt Pill */}
          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="font-mono text-zinc-500 uppercase text-[10px] sm:text-[11px]">Prompt:</span>
            {concealed ? (
              <span className="font-mono text-zinc-600 font-medium select-none tracking-widest">
                ••••••••••
              </span>
            ) : (
              <span className="font-semibold text-zinc-100 max-w-[140px] sm:max-w-[200px] truncate">
                "{myRole?.prompt || 'Loading...'}"
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                playClick();
                setConcealed(!concealed);
              }}
              className="ml-0.5 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
              title={concealed ? 'Reveal prompt' : 'Conceal prompt'}
            >
              {concealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-zinc-400" />}
            </button>
          </div>

          {/* Category Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
            <span className="text-[11px] text-zinc-500 font-mono uppercase">Theme:</span>
            <span className="text-zinc-200 font-medium">{roomState.category}</span>
          </div>

          {roomState.isTieBreaker && (
            <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs font-mono font-medium animate-pulse">
              <span>Tie-Breaker Draw</span>
            </div>
          )}
        </div>

        {/* Right: Controls (Turn Status, Battery, Brush dropdown, Voice, Done) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Pass / Chance Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <RotateCcw className="w-3 h-3 text-zinc-400" />
            <span className="text-[11px]">Chance {roomState.currentChance || 1}/{roomState.drawChances || 2}</span>
          </div>

          {/* Normal Turn Indicator Pill (NO EMOJIS) */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border transition ${
              isMyTurn
                ? 'bg-emerald-950/50 border-emerald-500/80 text-emerald-300 font-semibold shadow-sm'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMyTurn ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'
              }`}
            />
            <span className="whitespace-nowrap font-medium text-xs">
              {isMyTurn ? 'Your Turn to Draw' : `${activePlayer?.name || 'Artist'}'s Turn`}
            </span>
          </div>

          {/* Small Ink Battery in Top Toolbar (Smooth Linear Animation) */}
          <div className="shrink-0">
            <InkBatteryBar
              inkRemaining={turnRemainingMs}
              maxInk={turnDurationMs}
              playerColor={activePlayer?.color || myColor}
              compact={true}
            />
          </div>

          {/* Brush Dropdown Button in Top Toolbar */}
          <div ref={brushRef} className="relative">
            <button
              type="button"
              onClick={() => {
                playClick();
                setBrushMenuOpen(!brushMenuOpen);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                brushMenuOpen
                  ? 'bg-zinc-800 text-white border-zinc-600'
                  : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
              title="Select brush thickness"
            >
              <PenTool className="w-3.5 h-3.5 text-zinc-300" />
              <span
                className="rounded-full bg-zinc-100 inline-block shrink-0"
                style={{
                  width: brushSize <= 3 ? 4 : brushSize <= 6 ? 7 : 10,
                  height: brushSize <= 3 ? 4 : brushSize <= 6 ? 7 : 10
                }}
              />
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {/* Brush Popover Dropdown */}
            {brushMenuOpen && (
              <div className="absolute top-full mt-1.5 right-0 z-50 w-36 bg-zinc-900 border border-zinc-700 rounded-xl p-1.5 shadow-elevated animate-fadeIn space-y-1">
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      brushSize === size
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-800/60 hover:text-white'
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
              </div>
            )}
          </div>

          {/* Proximity Short Voice UI in Top Toolbar */}
          {proximity && (
            <div ref={whisperRef} className="relative flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  playClick();
                  proximity.toggleProximity();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  proximity.isProximityEnabled
                    ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
                title="Toggle proximity voice chat"
              >
                <Radio
                  className={`w-3.5 h-3.5 ${
                    proximity.isProximityEnabled ? 'animate-pulse text-emerald-400' : 'text-zinc-500'
                  }`}
                />
                <span className="font-mono text-[10px] uppercase hidden sm:inline">
                  {proximity.isProximityEnabled ? 'Voice ON' : 'Voice'}
                </span>
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
                    className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                      proximity.isMuted
                        ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                        : proximity.isSpeaking
                        ? 'bg-emerald-950/80 border-emerald-500 text-white animate-pulse'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                    title={proximity.isMuted ? 'Unmute microphone' : 'Mute microphone'}
                  >
                    {proximity.isMuted ? (
                      <MicOff className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Mic className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </button>

                  {/* Whisper Chat Bubble Popover Button */}
                  <button
                    type="button"
                    onClick={() => setWhisperOpen(!whisperOpen)}
                    className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    title="Send cursor whisper speech bubble"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>

                  {/* Whisper Input Popover */}
                  {whisperOpen && (
                    <div className="absolute top-full mt-1.5 right-0 z-50 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-elevated animate-fadeIn">
                      <form onSubmit={handleSendWhisper} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={whisperText}
                          onChange={(e) => setWhisperText(e.target.value)}
                          placeholder="Whisper nearby (shows on canvas)..."
                          maxLength={65}
                          autoFocus
                          className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 px-2.5 py-1 rounded-lg text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!whisperText.trim()}
                          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 border border-zinc-700 transition cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                      </form>
                    </div>
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
              className="px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold shadow transition cursor-pointer flex items-center gap-1"
              title="Finish drawing early"
            >
              <span>Done</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Queue Horizontal Strip (Visible on mobile screens) */}
      <div className="shrink-0 lg:hidden bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-mono uppercase text-zinc-500 shrink-0">Queue:</span>
        {(roomState.turnOrder || []).map((pid, idx) => {
          const player = roomState.players.find((p) => p.id === pid);
          if (!player) return null;

          const turnOrderLen = (roomState.turnOrder || []).length || 1;
          const activeIndexInLap = (roomState.currentTurnIndex ?? 0) % turnOrderLen;
          const isCurrent = idx === activeIndexInLap;
          const hasCompleted = idx < activeIndexInLap;
          const isMe = pid === socket?.id;

          return (
            <div
              key={pid}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs shrink-0 transition ${
                isCurrent
                  ? 'bg-zinc-800 border-zinc-600 shadow-sm text-white'
                  : hasCompleted
                  ? 'bg-zinc-950/40 border-zinc-900 text-zinc-500'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center text-[10px] bg-zinc-900 border"
                style={{ borderColor: player.color }}
              >
                {player.avatar}
              </div>
              <span className="text-[11px] font-medium truncate max-w-[70px]">
                {player.name} {isMe && '(You)'}
              </span>
              {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
              {hasCompleted && <CheckCircle2 className="w-3 h-3 text-zinc-500" />}
            </div>
          );
        })}
      </div>

      {/* Main Drawing Area: Maximized Whiteboard & Desktop Queue Rail */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-3 items-stretch h-full">
        {/* Whiteboard Hero (3 cols on desktop, full width on mobile) */}
        <div className="lg:col-span-3 w-full h-full min-h-0 flex flex-col">
          <CanvasBoard
            playerColor={myColor}
            inkRemaining={turnRemainingMs}
            setInkRemaining={() => {}}
            isInteractive={isMyTurn && (roomState.turnTimeRemaining ?? 10) > 0}
            brushSize={brushSize}
          />
        </div>

        {/* Turn Order & Player Queue Rail (Hidden on mobile, 1 col on desktop) */}
        <div className="hidden lg:flex flex-col bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3 h-full min-h-0">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 shrink-0">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Drawing Queue
            </h3>
            <span className="text-[11px] font-mono text-zinc-400 font-medium bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              Pass {roomState.currentChance || 1} / {roomState.drawChances || 2}
            </span>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto pr-1 min-h-0">
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
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                    isCurrent
                      ? 'bg-zinc-800 border-zinc-600 shadow-sm'
                      : hasCompletedInLap
                      ? 'bg-zinc-950/40 border-zinc-850 opacity-60'
                      : 'bg-zinc-950/70 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-zinc-500 w-3 font-semibold">
                      {idx + 1}
                    </span>
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-sm bg-zinc-900 border"
                      style={{ borderColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                        <span className="truncate max-w-[85px]">{player.name}</span>
                        {isMe && <span className="text-[10px] text-zinc-500 font-mono">(You)</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
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
                      <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Drawing
                      </span>
                    ) : hasCompletedInLap ? (
                      <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-zinc-500" />
                        Done
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-zinc-500">
                        Waiting
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
