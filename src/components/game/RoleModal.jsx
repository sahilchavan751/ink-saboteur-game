import React, { useState } from 'react';
import { Eye, EyeOff, Clock } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';

export const RoleModal = () => {
  const { roomState, timer } = useGameSocket();
  const [concealed, setConcealed] = useState(false);

  if (!roomState?.myRole) return null;

  const isSaboteur = roomState.myRole.isSaboteur;
  const prompt = roomState.myRole.prompt;
  const category = roomState.category;
  const hint = roomState.hint;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 sm:p-6 shadow-elevated space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto my-auto">
        {/* Top Floating Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-xs">
          <div className="flex items-center gap-2 font-mono text-zinc-400">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Drawing starts in:</span>
            <span className="font-bold text-zinc-100 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
              {timer.timeRemaining}s
            </span>
          </div>

          <button
            onClick={() => setConcealed(!concealed)}
            className="flex items-center gap-1 text-zinc-400 hover:text-white px-2 py-1 rounded bg-zinc-950 border border-zinc-800 cursor-pointer"
            title="Conceal prompt"
          >
            {concealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{concealed ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* Role Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl mx-auto">
            {isSaboteur ? '🕵️‍♂️' : '🛡️'}
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-500">
              Secret Assignment
            </span>
            <h2 className="text-xl font-bold text-zinc-100 mt-0.5">
              {isSaboteur ? 'You are the Saboteur' : 'You are a Citizen'}
            </h2>
          </div>
        </div>

        {/* Prompt Showcase Box */}
        <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-800 text-center space-y-1.5">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
            Category: {category || 'General'}
          </div>

          <div className="py-2">
            {concealed ? (
              <span className="text-zinc-600 font-mono tracking-widest text-base select-none">
                ••••••••••••••••
              </span>
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-bold text-zinc-100 block">
                  "{prompt}"
                </span>
                {hint && (
                  <p className="text-xs text-zinc-500">
                    Hint: {hint}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Objective description */}
        <div className="text-center text-xs text-zinc-400 leading-relaxed">
          {isSaboteur ? (
            <p>
              The Citizens have a real prompt related to yours. <strong>Draw subtly to blend in, or misdirect without getting voted out.</strong>
            </p>
          ) : (
            <p>
              Draw this prompt on the shared whiteboard! <strong>Watch closely for anyone drawing off-topic strokes.</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
