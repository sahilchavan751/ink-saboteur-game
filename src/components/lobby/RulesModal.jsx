import React from 'react';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';
import { playClick } from '../../utils/sound';

export const RulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleClose = () => {
    playClick();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[500px] bg-gradient-to-b from-black/60 via-zinc-950/75 to-black/85 backdrop-blur-2xl rounded-3xl p-5 sm:p-6 border-2 border-white/20 shadow-[0_8px_0_#0f172a,0_24px_48px_rgba(0,0,0,0.5)] space-y-4 animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Back Navigation */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-xs font-bold tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-4 h-4 text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            {/* ---lined out the blue dot cause of looking like a ai slop--- */}
            {/* <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" /> */}
            <h2 className="text-xs font-black text-white uppercase tracking-wider font-sans">
              How to Play InkSpy
            </h2>
          </div>
        </div>

        {/* 4 Clean Game Rule Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Rule 1 */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/15 backdrop-blur space-y-1 hover:border-white/25 transition">
            <div className="flex items-center gap-2">
              <span className="text-base">🎭</span>
              <h3 className="font-bold text-xs text-white">1. Secret Prompts</h3>
            </div>
            <p className="text-white/75 text-[11px] leading-relaxed">
              Detectives get the real prompt. The Suspect gets a similar fake decoy!
            </p>
          </div>

          {/* Rule 2 */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/15 backdrop-blur space-y-1 hover:border-white/25 transition">
            <div className="flex items-center gap-2">
              <span className="text-base">🎨</span>
              <h3 className="font-bold text-xs text-white">2. Live Whiteboard</h3>
            </div>
            <p className="text-white/75 text-[11px] leading-relaxed">
              Everyone draws together on the same canvas in real time.
            </p>
          </div>

          {/* Rule 3 */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/15 backdrop-blur space-y-1 hover:border-white/25 transition">
            <div className="flex items-center gap-2">
              <span className="text-base">🔋</span>
              <h3 className="font-bold text-xs text-white">3. Ink Battery</h3>
            </div>
            <p className="text-white/75 text-[11px] leading-relaxed">
              Each player has only 5s of active drawing time. Make every dot count!
            </p>
          </div>

          {/* Rule 4 */}
          <div className="p-3.5 rounded-2xl bg-black/25 border border-white/15 backdrop-blur space-y-1 hover:border-white/25 transition">
            <div className="flex items-center gap-2">
              <span className="text-base">🗳️</span>
              <h3 className="font-bold text-xs text-white">4. Deduce & Accuse</h3>
            </div>
            <p className="text-white/75 text-[11px] leading-relaxed">
              Vote out the Suspect. If caught, they get one final shot to guess the word!
            </p>
          </div>
        </div>

        {/* Tactical Pro-Tip Banner */}
        <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-200 text-xs flex items-start gap-2.5 backdrop-blur">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-[11px] text-white/85 leading-relaxed">
            <span className="font-bold text-amber-300">Pro-Tip:</span> Blend in! Draw subtle hints that only true Detectives recognize without revealing the whole answer to the Suspect.
          </p>
        </div>

        {/* 3D Tactile Action Button */}
        <button
          type="button"
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer mt-3 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_5px_0_#b45309,0_12px_24px_rgba(0,0,0,0.4)] hover:shadow-[0_3px_0_#b45309,0_8px_16px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[5px] active:shadow-none"
        >
          <span>GOT IT, LET'S PLAY!</span>
          <Check className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
