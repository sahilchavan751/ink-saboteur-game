import React from 'react';
import { Clock, ShieldAlert, Users, AlertCircle } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';
import { PlayerAvatar } from '../common/PlayerAvatar';

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
  const totalVotesCount = Object.keys(results.votes || {}).length;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-2 flex flex-col flex-1 h-full min-h-0 overflow-hidden space-y-2.5 animate-fadeIn">
      {/* Top Banner: 5-Second Results Countdown with Glassmorphism */}
      <div className="shrink-0 w-full bg-black/40 backdrop-blur-2xl border border-white/15 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shadow-lg relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 backdrop-blur shadow-inner shrink-0">
            <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white drop-shadow-sm flex items-center gap-2 flex-wrap">
              <span>Voting Results Revealed</span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-400/30 font-mono font-medium tracking-wide shadow-sm">
                Who Voted Whom
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-white/70 drop-shadow-sm">
              All votes have been tallied. Review accusations before ejection!
            </p>
          </div>
        </div>

        {/* 5-Second Wait Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 font-mono text-white text-sm shadow-sm shrink-0 self-end sm:self-center">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs text-white/60">Ejection in:</span>
          <span className="font-bold text-amber-300 font-mono text-base">
            {Math.max(0, timer?.timeRemaining ?? 0)}s
          </span>
        </div>
      </div>

      {/* Main Grid: Artwork Display (Left 3) + Vote Breakdown (Right 2) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch h-full overflow-hidden">
        {/* Finished Artwork Showcase */}
        <div className="lg:col-span-3 w-full h-full min-h-0 flex flex-col overflow-hidden">
          <CanvasBoard
            isInteractive={false}
            inkRemaining={0}
            setInkRemaining={() => {}}
          />
        </div>

        {/* Who Voted Whom Breakdown Panel with Glassmorphism */}
        <div
          className="lg:col-span-2 flex flex-col bg-black/40 backdrop-blur-2xl p-3.5 sm:p-4 rounded-2xl border border-white/15 shadow-lg overflow-hidden"
          style={{ height: '100%', minHeight: 0, maxHeight: '100%' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Tally & Accusations
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-white/60 bg-black/30 px-2 py-0.5 rounded-lg border border-white/10 backdrop-blur">
              {totalVotesCount} Total Votes Cast
            </span>
          </div>

          {/* Outcome Preview Notice */}
          <div
            className={`mt-2.5 shrink-0 p-2.5 sm:p-3 rounded-xl border text-xs flex items-center gap-2.5 backdrop-blur-md shadow-sm ${
              isSkipWon
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                : isTie
                ? 'bg-amber-500/15 border-amber-400/30 text-amber-200'
                : 'bg-rose-500/20 border-rose-400/40 text-rose-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <div className="leading-snug text-[11px] sm:text-xs">
              {isSkipWon ? (
                <span>
                  <strong className="font-semibold text-white">Skip Won!</strong> No one will be ejected. Round continues.
                </span>
              ) : isTie ? (
                <span>
                  <strong className="font-semibold text-white">Voting was a Tie!</strong> No majority. Round continues.
                </span>
              ) : (
                <span>
                  <strong className="font-semibold text-white">Suspect Chosen:</strong> {accusedPlayer?.name} received the most votes.
                </span>
              )}
            </div>
          </div>

          {/* Suspects & Their Voters (Scrollable) */}
          <div className="mt-2.5 flex-1 overflow-y-auto pr-1 space-y-2 min-h-0 overscroll-contain">
            {allPlayers.map((player) => {
              const count = voteCounts[player.id] || 0;
              const voters = votersByTarget[player.id] || [];
              const isAccused = player.id === accusedId && !isTie;

              return (
                <div
                  key={player.id}
                  className={`p-2.5 sm:p-3 rounded-xl border transition-all backdrop-blur-md ${
                    isAccused
                      ? 'bg-rose-500/20 border-rose-400/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-400/30'
                      : count > 0
                      ? 'bg-black/30 border-white/20 hover:border-white/30 text-white'
                      : 'bg-black/20 border-white/10 opacity-60 text-white/70'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center bg-black/40 border-2 overflow-hidden shrink-0 shadow-inner"
                        style={{ borderColor: player.color }}
                      >
                        <PlayerAvatar avatar={player.avatar} name={player.name} />
                      </div>
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-white flex items-center gap-1.5">
                          <span>{player.name}</span>
                          {isAccused && (
                            <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold tracking-wider animate-pulse">
                              Ejecting
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shadow-sm ${
                        count > 0 ? 'bg-white/15 border-white/25 text-white' : 'bg-black/30 border-white/10 text-white/40'
                      }`}
                    >
                      {count} {count === 1 ? 'Vote' : 'Votes'}
                    </span>
                  </div>

                  {/* Voters List */}
                  {voters.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-white/50 mr-0.5">Voted by:</span>
                      {voters.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/35 backdrop-blur border border-white/15 text-[11px] text-white/90 font-mono shadow-sm"
                        >
                          <span className="w-3.5 h-3.5 rounded-md overflow-hidden shrink-0 inline-flex items-center justify-center bg-black/40 border border-white/10">
                            <PlayerAvatar avatar={v.avatar} name={v.name} />
                          </span>
                          <span className="font-medium text-white/90">
                            {v.name}
                            {v.isSelf && <span className="text-white/50 text-[9px] ml-0.5">(Self)</span>}
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
              className={`p-2.5 sm:p-3 rounded-xl border transition-all backdrop-blur-md ${
                isSkipWon
                  ? 'bg-amber-500/20 border-amber-400/40 shadow-sm text-white'
                  : 'bg-black/20 border-white/10 text-white/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-black/30 border border-white/15 flex items-center justify-center text-xs shadow-inner">
                    ⏭️
                  </div>
                  <div>
                    <span className="font-semibold text-xs sm:text-sm text-white">Skipped Vote</span>
                    {isSkipWon && (
                      <span className="ml-2 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold tracking-wider">
                        No Ejection
                      </span>
                    )}
                  </div>
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg border shadow-sm ${
                    skipCount > 0 ? 'bg-white/15 border-white/25 text-white' : 'bg-black/30 border-white/10 text-white/40'
                  }`}
                >
                  {skipCount} {skipCount === 1 ? 'Vote' : 'Votes'}
                </span>
              </div>

              {skipVoters.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/10 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/50 mr-0.5">Voted by:</span>
                  {skipVoters.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/35 backdrop-blur border border-white/15 text-[11px] text-white/90 font-mono shadow-sm"
                    >
                      <span className="w-3.5 h-3.5 rounded-md overflow-hidden shrink-0 inline-flex items-center justify-center bg-black/40 border border-white/10">
                        <PlayerAvatar avatar={v.avatar} name={v.name} />
                      </span>
                      <span className="font-medium text-white/90">{v.name}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer Status */}
          <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/60 font-mono shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Stand by for Ejection
            </span>
            <span className="text-amber-300 font-bold font-mono">
              {Math.max(0, timer?.timeRemaining ?? 0)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
