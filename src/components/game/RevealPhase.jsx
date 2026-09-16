import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, Skull, Clock, Frame, Download } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { playClick } from '../../utils/sound';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { FramedMasterpieceModal } from './FramedMasterpieceModal';
import { downloadFramedMasterpiece } from '../../utils/frameExporter';

export const RevealPhase = () => {
  const { roomState, timer, socket, nextRound, strokes, roundGallery } = useGameSocket();
  const [advancing, setAdvancing] = useState(false);
  const [showFrameModal, setShowFrameModal] = useState(false);

  if (!roomState || !roomState.roundResults) return null;

  const results = roomState.roundResults;
  const saboteurPlayer = roomState.players.find((p) => p.id === results.saboteurId);
  const currentPlayer = roomState.players.find((p) => p.id === socket?.id);
  const isHost = currentPlayer?.isHost;
  const isFinalRound = roomState.currentRound >= roomState.maxRounds;

  const handleNextRound = async () => {
    if (advancing) return;
    setAdvancing(true);
    playClick();
    try {
      await nextRound();
    } catch (err) {
      alert(err.message || 'Failed to advance');
      setAdvancing(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 sm:py-4 space-y-3.5 flex-1 h-full min-h-0 overflow-y-auto pr-1 sm:pr-2 no-scrollbar animate-fadeIn">
      {/* Top Banner: Round Results & Saboteur Reveal */}
      <div className="relative bg-black/40 backdrop-blur-2xl border border-white/15 p-5 sm:p-6 rounded-3xl text-center space-y-4 shadow-xl overflow-hidden">
        {/* Top Edge Ambient Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none" />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase backdrop-blur-md shadow-sm">
          {results.isSaboteurCaught ? (
            <span className="text-emerald-300 flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 px-3 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Suspect Identified
            </span>
          ) : (
            <span className="text-rose-300 flex items-center gap-1.5 bg-rose-500/15 border border-rose-400/30 px-3 py-0.5 rounded-full">
              <Skull className="w-3.5 h-3.5" />
              Suspect Escaped
            </span>
          )}
        </div>

        {/* Revealed Saboteur Avatar & Name */}
        <div className="space-y-2">
          <span className="text-[10px] sm:text-[11px] uppercase font-mono tracking-widest text-white/50 block">
            The Suspect Was
          </span>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl bg-black/40 border-2 overflow-hidden shrink-0 shadow-lg"
              style={{ borderColor: saboteurPlayer?.color }}
            >
              <PlayerAvatar avatar={saboteurPlayer?.avatar} name={saboteurPlayer?.name} />
            </div>
            <div className="text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-sm">
                {saboteurPlayer?.name}
              </h2>
              <span className="text-xs font-mono text-white/60 flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: saboteurPlayer?.color }}
                />
                Drew in this ink pigment
              </span>
            </div>
          </div>
        </div>

        {/* Prompt Comparison Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
          <div className="bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 text-left space-y-1 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-emerald-300/90 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Detectives' Real Prompt
            </span>
            <div className="text-base sm:text-lg font-bold text-white tracking-wide">
              "{results.citizenPrompt}"
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-white/15 text-left space-y-1 shadow-sm">
            <span className="text-[10px] sm:text-[11px] font-mono uppercase tracking-wider text-rose-300/90 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5" />
              Suspect's Fake Prompt
            </span>
            <div className="text-base sm:text-lg font-bold text-white tracking-wide">
              "{results.saboteurPrompt}"
            </div>
          </div>
        </div>
      </div>

      {/* Per-Round Masterpiece Download Banner */}
      <div className="relative bg-black/40 bg-gradient-to-br from-amber-500/15 via-black/30 to-amber-950/20 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-amber-400/25 shadow-xl overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/35 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-400/25 flex items-center justify-center shrink-0">
            <Frame className="w-4 h-4 text-amber-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-white tracking-tight">Round {roomState.currentRound} Masterpiece</h4>
            <p className="text-[10px] text-white/60 font-mono truncate">"{results.citizenPrompt}"</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => {
                playClick();
                // Use gallery snapshot if available, otherwise live strokes
                const galleryRound = (roundGallery || []).find((r) => r.roundNumber === roomState.currentRound);
                const options = {
                  strokes: galleryRound?.strokes || strokes || [],
                  players: galleryRound?.players || roomState.players || [],
                  title: results.citizenPrompt || roomState.citizenPrompt || 'Masterpiece',
                  roomCode: galleryRound?.roomCode || roomState.code || '????',
                  date: galleryRound?.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                  frameStyle: 'gold',
                  roundNumber: roomState.currentRound || 1,
                };
                downloadFramedMasterpiece(options);
              }}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-[11px] flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-amber-500/15 active:scale-95"
            >
              <Download className="w-3 h-3" />
              Quick Save
            </button>
            <button
              onClick={() => {
                playClick();
                setShowFrameModal(true);
              }}
              className="px-3 py-2 rounded-lg bg-black/40 hover:bg-white/10 text-white font-semibold text-[11px] border border-white/10 backdrop-blur flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Frame className="w-3 h-3" />
              Frame Studio
            </button>
          </div>
        </div>
      </div>

      {/* Framed Masterpiece Modal */}
      <FramedMasterpieceModal
        isOpen={showFrameModal}
        onClose={() => setShowFrameModal(false)}
        initialRoundNumber={roomState.currentRound}
      />



      {/* Standings Breakdown */}
      <div className="bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/15 space-y-3 shadow-lg">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-white/80 pb-2 border-b border-white/10 flex items-center justify-between">
          <span>Round Standings</span>
          <span className="text-[10px] font-mono text-white/50">{roomState.players.length} Players</span>
        </h3>

        <div className="space-y-2">
          {roomState.players
            .sort((a, b) => b.score - a.score)
            .map((player, rank) => {
              const isSab = player.id === results.saboteurId;
              const roundGain = results.playerScoresThisRound?.[player.id] || 0;
              const votedFor = results.votes?.[player.id];
              const votedTarget = roomState.players.find((p) => p.id === votedFor);

              return (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 hover:border-white/20 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/50 w-4 font-semibold">
                      #{rank + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base bg-black/30 border overflow-hidden shrink-0 shadow-inner"
                      style={{ borderColor: player.color }}
                    >
                      <PlayerAvatar avatar={player.avatar} name={player.name} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {player.name}
                        </span>
                        {isSab && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-400/30 font-medium">
                            Suspect
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-white/50 font-mono">
                        {isSab ? (
                          <span>Survival bonus</span>
                        ) : (
                          <span>Voted: {votedTarget ? votedTarget.name : 'None'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {roundGain > 0 && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-medium">
                        +{roundGain} pts
                      </span>
                    )}
                    <span className="font-mono font-bold text-sm text-white">
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Advance Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-black/40 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-white/15 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-mono text-white/70">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Auto-advancing in: <strong className="text-amber-300 font-mono">{Math.max(0, timer?.timeRemaining ?? 0)}s</strong></span>
        </div>

        {isHost ? (
          <button
            onClick={handleNextRound}
            disabled={advancing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md active:scale-95"
          >
            <span>{isFinalRound ? 'View Final Results' : 'Next Round'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs text-white/50 font-mono">
            Waiting for host to advance...
          </span>
        )}
      </div>
    </div>
  );
};
