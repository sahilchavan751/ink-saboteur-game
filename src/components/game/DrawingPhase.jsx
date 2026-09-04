import React, { useState } from 'react';
import { Clock, Eye, EyeOff, Circle, CheckCircle2, User, ArrowRight, RotateCcw } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';
import { InkBatteryBar } from '../common/InkBatteryBar';
import { playClick } from '../../utils/sound';

export const DrawingPhase = () => {
  const { roomState, socket, passTurn } = useGameSocket();

  const [concealed, setConcealed] = useState(false);
  const [brushSize, setBrushSize] = useState(5);

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

  const isTimeCritical = (roomState.turnTimeRemaining ?? 10) <= 3;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      {/* Top HUD Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3.5 rounded-2xl">
        {/* Secret Prompt Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs">
            <span className="font-mono text-zinc-500 uppercase text-[11px]">Prompt:</span>
            {concealed ? (
              <span className="font-mono text-zinc-600 font-medium select-none">
                ••••••••••
              </span>
            ) : (
              <span className="font-semibold text-zinc-100">
                "{myRole?.prompt || 'Loading...'}"
              </span>
            )}
            <button
              onClick={() => {
                playClick();
                setConcealed(!concealed);
              }}
              className="ml-1 text-zinc-500 hover:text-zinc-200 transition cursor-pointer"
              title={concealed ? 'Reveal prompt' : 'Conceal prompt'}
            >
              {concealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400">
            <span>Category:</span>
            <span className="text-zinc-200 font-medium">{roomState.category}</span>
          </div>

          {roomState.isTieBreaker && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-800 text-amber-300 text-xs font-mono font-medium animate-pulse">
              <span>⚖️ Tie-Breaker: Round Continued</span>
            </div>
          )}
        </div>

        {/* Turn Status & Turn Countdown Timer */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Chance Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300 font-mono">
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            <span>Chance {roomState.currentChance || 1}/{roomState.drawChances || 2}</span>
          </div>

          {/* Active Player Turn Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${
              isMyTurn
                ? 'bg-emerald-950/40 border-emerald-600 text-emerald-300 font-semibold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-300'
            }`}
          >
            <span className="text-base">{activePlayer?.avatar || '🎨'}</span>
            <span>
              {isMyTurn ? (
                <span>Your Turn to Draw!</span>
              ) : (
                <span>{activePlayer?.name || 'Artist'}'s Turn</span>
              )}
            </span>
          </div>

          {/* Turn Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs border ${
              isTimeCritical
                ? 'bg-rose-950/50 text-rose-300 border-rose-800 font-bold'
                : 'bg-zinc-950 text-zinc-200 border-zinc-800 font-semibold'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-zinc-400" />
            <span>{roomState.turnTimeRemaining ?? 10}s</span>
          </div>

          {/* Early Done / Pass Turn Button (If it's my turn) */}
          {isMyTurn && (
            <button
              onClick={() => {
                playClick();
                passTurn();
              }}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium border border-zinc-700 transition cursor-pointer flex items-center gap-1"
              title="Finish turn early"
            >
              <span>Done</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Main Drawing Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Whiteboard + Tools (Left 3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <CanvasBoard
            playerColor={myColor}
            inkRemaining={turnRemainingMs}
            setInkRemaining={() => {}}
            isInteractive={isMyTurn && (roomState.turnTimeRemaining ?? 10) > 0}
            brushSize={brushSize}
          />

          {/* Controls: Brush selector (visible when your turn) & Turn Battery Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Brush Width Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800">
              <span className="text-[11px] font-mono text-zinc-400 uppercase mr-1">Brush:</span>
              {[
                { size: 3, label: 'Fine' },
                { size: 6, label: 'Med' },
                { size: 12, label: 'Bold' }
              ].map(({ size, label }) => (
                <button
                  key={size}
                  onClick={() => {
                    playClick();
                    setBrushSize(size);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                    brushSize === size
                      ? 'bg-zinc-100 text-zinc-900 font-semibold shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <Circle className="fill-current" style={{ width: size + 2, height: size + 2 }} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Turn Timer Battery Bar */}
            <div className="flex-1 w-full">
              <InkBatteryBar
                inkRemaining={turnRemainingMs}
                maxInk={turnDurationMs}
                playerColor={activePlayer?.color || myColor}
              />
            </div>
          </div>
        </div>

        {/* Turn Order & Player Queue Rail (Right 1 col) */}
        <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Drawing Queue
            </h3>
            <span className="text-[11px] font-mono text-zinc-400 font-medium bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              Pass {roomState.currentChance || 1} / {roomState.drawChances || 2}
            </span>
          </div>

          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
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
                        <span className="truncate max-w-[80px]">{player.name}</span>
                        {isMe && <span className="text-[10px] text-zinc-500 font-mono">(You)</span>}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: player.color }} />
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
                        Pass Done
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
