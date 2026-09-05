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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/20 rounded-3xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] space-y-5 sm:space-y-6 max-h-[92vh] overflow-y-auto my-auto">
        {/* Top Floating Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-white/15 text-xs">
          <div className="flex items-center gap-2 font-mono text-white/70">
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>Drawing starts in:</span>
            <span className="font-bold text-white bg-black/30 px-2 py-0.5 rounded-lg border border-white/15 backdrop-blur">
              {timer.timeRemaining}s
            </span>
          </div>

          <button
            onClick={() => setConcealed(!concealed)}
            className="flex items-center gap-1 text-white/70 hover:text-white px-2.5 py-1 rounded-xl bg-black/30 border border-white/15 cursor-pointer transition backdrop-blur"
            title="Conceal prompt"
          >
            {concealed ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{concealed ? 'Show' : 'Hide'}</span>
          </button>
        </div>

        {/* Role Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-black/30 border border-white/20 flex items-center justify-center text-2xl mx-auto shadow-inner backdrop-blur">
            {isSaboteur ? '🕵️‍♂️' : '🛡️'}
          </div>

          <div>
            <span className="text-[11px] uppercase font-mono tracking-widest text-white/60">
              Secret Assignment
            </span>
            <h2 className="text-xl font-bold text-white drop-shadow-sm mt-0.5">
              {isSaboteur ? 'You are the Saboteur' : 'You are a Citizen'}
            </h2>
          </div>
        </div>

        {/* Prompt Showcase Box */}
        <div className="bg-black/30 rounded-2xl p-5 border border-white/15 text-center space-y-1.5 backdrop-blur shadow-sm">
          <div className="text-[11px] font-mono text-white/60 uppercase tracking-wider">
            Category: {category || 'General'}
          </div>

          <div className="py-2">
            {concealed ? (
              <span className="text-white/30 font-mono tracking-widest text-base select-none">
                ••••••••••••••••
              </span>
            ) : (
              <div className="space-y-1">
                <span className="text-2xl font-bold text-white block drop-shadow-sm">
                  "{prompt}"
                </span>
                {hint && (
                  <p className="text-xs text-white/60">
                    Hint: {hint}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Objective description */}
        <div className="text-center text-xs text-white/80 leading-relaxed">
          {isSaboteur ? (
            <p>
              The Citizens have a real prompt related to yours. <strong className="text-white">Draw subtly to blend in, or misdirect without getting voted out.</strong>
            </p>
          ) : (
            <p>
              Draw this prompt on the shared whiteboard! <strong className="text-white">Watch closely for anyone drawing off-topic strokes.</strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
