import React from 'react';
import { Clock, Eye, Sparkles } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';

export const DrawingIntermission = () => {
  const { roomState, timer } = useGameSocket();

  if (!roomState) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 animate-fadeIn">
      {/* Intermission Header */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>All Artists Done Drawing</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-100">
            Review the Masterpiece
          </h2>
          <p className="text-xs text-zinc-400">
            Take a moment to inspect all strokes. Who drew off-topic?
          </p>
        </div>

        {/* Countdown Badge */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-200">
          <Clock className="w-4 h-4 text-zinc-400" />
          <span className="text-xs text-zinc-400">Voting begins in:</span>
          <span className="text-base font-bold text-white">{Math.max(0, timer.timeRemaining)}s</span>
        </div>
      </div>

      {/* Full-width Canvas Display */}
      <div className="max-w-4xl mx-auto">
        <CanvasBoard
          isInteractive={false}
          inkRemaining={0}
          setInkRemaining={() => {}}
        />
      </div>
    </div>
  );
};
