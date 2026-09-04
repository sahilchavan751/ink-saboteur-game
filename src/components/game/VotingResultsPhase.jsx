import React from 'react';
import { Clock, ShieldAlert, Users, Check, AlertCircle } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';

export const VotingResultsPhase = () => {
  const { roomState, timer } = useGameSocket();

  if (!roomState) return null;

  const results = roomState.roundResults || {};
  const allPlayers = roomState.players || [];
  const voteCounts = results.voteCounts || {};
  const votersByTarget = results.votersByTarget || {};
  const skipCount = results.skipCount || 0;
  const skipVoters = votersByTarget['SKIP'] || [];

  const isTie = results.isTie;
  const isSkipWon = results.isSkipWon;
  const accusedId = results.accusedPlayerId;
  const accusedPlayer = allPlayers.find((p) => p.id === accusedId);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-5 animate-fadeIn">
      {/* Top Banner: 5-Second Results Countdown */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-950/60 border border-amber-800 text-amber-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>Voting Results Revealed</span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800 font-mono font-medium">
                Who Voted Whom
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              All votes have been tallied. Review accusations before ejection!
            </p>
          </div>
        </div>

        {/* 5-Second Wait Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-200 text-sm">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs text-zinc-400">Ejection in:</span>
          <span className="font-bold text-amber-300 text-base">{Math.max(0, timer.timeRemaining)}s</span>
        </div>
      </div>

      {/* Main Grid: Artwork Display (Left 3) + Vote Breakdown (Right 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Finished Artwork Showcase */}
        <div className="lg:col-span-3 space-y-2">
          <CanvasBoard
            isInteractive={false}
            inkRemaining={0}
            setInkRemaining={() => {}}
          />
        </div>

        {/* Who Voted Whom Breakdown Panel */}
        <div className="lg:col-span-2 bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Tally & Accusations
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">
              {Object.keys(results.votes || {}).length} Total Votes Cast
            </span>
          </div>

          {/* Outcome Preview Notice */}
          <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
            isSkipWon
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : isTie
              ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
              : 'bg-rose-950/40 border-rose-800 text-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div>
              {isSkipWon ? (
                <span><strong>Skip Won!</strong> No one will be ejected. Round continues.</span>
              ) : isTie ? (
                <span><strong>Voting was a Tie!</strong> No majority. Round continues.</span>
              ) : (
                <span><strong>Suspect Chosen:</strong> {accusedPlayer?.name} received the most votes.</span>
              )}
            </div>
          </div>

          {/* Suspects & Their Voters */}
          <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
            {allPlayers.map((player) => {
              const count = voteCounts[player.id] || 0;
              const voters = votersByTarget[player.id] || [];
              const isAccused = player.id === accusedId && !isTie;

              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl border transition ${
                    isAccused
                      ? 'bg-rose-950/30 border-rose-600/80 shadow-sm ring-1 ring-rose-500/40'
                      : count > 0
                      ? 'bg-zinc-950 border-zinc-700'
                      : 'bg-zinc-950/50 border-zinc-850 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-zinc-900 border"
                        style={{ borderColor: player.color }}
                      >
                        {player.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-zinc-200 flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {isAccused && (
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold">
                              Ejecting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                        count > 0 ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-600'
                      }`}>
                        {count} {count === 1 ? 'Vote' : 'Votes'}
                      </span>
                    </div>
                  </div>

                  {/* Voters List */}
                  {voters.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-500 mr-1">Voted by:</span>
                      {voters.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-[11px] text-zinc-300 font-mono"
                        >
                          <span>{v.avatar}</span>
                          <span className="font-medium text-zinc-200">
                            {v.name}
                            {v.isSelf && ' (Self)'}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Skip Vote Breakdown */}
            <div
              className={`p-3 rounded-xl border transition ${
                isSkipWon
                  ? 'bg-amber-950/30 border-amber-600 shadow-sm ring-1 ring-amber-500/40'
                  : skipCount > 0
                  ? 'bg-zinc-950 border-zinc-700'
                  : 'bg-zinc-950/50 border-zinc-850 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm bg-zinc-900 border border-zinc-700 text-zinc-300">
                    ⏭️
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-zinc-300">
                      Skip Vote (Abstain)
                    </span>
                  </div>
                </div>

                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  skipCount > 0 ? 'bg-zinc-800 text-white' : 'bg-zinc-900 text-zinc-600'
                }`}>
                  {skipCount} {skipCount === 1 ? 'Vote' : 'Votes'}
                </span>
              </div>

              {skipVoters.length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500 mr-1">Voted by:</span>
                  {skipVoters.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-750 text-[11px] text-zinc-300 font-mono"
                    >
                      <span>{v.avatar}</span>
                      <span className="font-medium text-zinc-200">{v.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Stand by for Ejection</span>
            <span>{Math.max(0, timer.timeRemaining)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};
