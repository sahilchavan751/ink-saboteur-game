import React, { useState } from 'react';
import { Clock, ShieldAlert, Check, Users, Lock } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { playVote } from '../../utils/sound';

export const VotingPhase = () => {
  const { roomState, timer, socket, submitVote } = useGameSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState(null);

  if (!roomState) return null;

  const myPlayerId = socket?.id;
  const currentPlayer = roomState.players.find((p) => p.id === myPlayerId);
  const myVotedTargetId = selectedTargetId || currentPlayer?.voteTargetId;
  const hasAlreadyVoted = Boolean(currentPlayer?.hasVoted || selectedTargetId);
  const allPlayers = roomState.players || [];
  const myVotedPlayer = allPlayers.find((p) => p.id === myVotedTargetId);
  const totalVotesCast = allPlayers.filter((p) => p.hasVoted).length;
  const isSaboteur = roomState.myRole?.isSaboteur || currentPlayer?.isSaboteur;

  // Vote Lock System: One person can vote one time only
  const handleVote = async (targetPlayerId) => {
    if (isSubmitting || hasAlreadyVoted) return;
    setSelectedTargetId(targetPlayerId);
    setIsSubmitting(true);
    playVote();

    try {
      await submitVote(targetPlayerId);
    } catch (err) {
      setSelectedTargetId(currentPlayer?.voteTargetId || null);
      alert(err.message || 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 py-2 flex flex-col flex-1 h-full min-h-0 overflow-hidden space-y-2.5 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-black/40 backdrop-blur-2xl border border-white/15 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-black/30 border border-white/15 text-white/80 backdrop-blur shadow-inner">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white drop-shadow-sm flex items-center gap-2 flex-wrap">
              <span>Accusation Phase</span>
              {roomState.isTieBreaker && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-medium">
                  Tie-Breaker Vote
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded-md bg-black/30 border border-white/15 text-white/80 font-mono font-normal">
                {totalVotesCast} of {allPlayers.length} voted
              </span>
            </h2>
            <p className="text-xs text-white/70">
              {roomState.isTieBreaker
                ? 'Previous vote tied! Strokes have been wiped for a fresh inspection. Cast your vote to break the tie.'
                : 'Inspect the whiteboard drawing. Who drew strokes inconsistent with the theme?'}
            </p>
          </div>
        </div>

        {/* Right Info: Role Badge & Voting Countdown Timer */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Your Role Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 text-xs font-mono shadow-sm">
            <span className="text-white/50 uppercase text-[10px]">Your Role:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-xs ${
                isSaboteur
                  ? 'bg-rose-500/25 border border-rose-400/40 text-rose-200'
                  : 'bg-indigo-500/25 border border-indigo-400/40 text-indigo-200'
              }`}
            >
              {isSaboteur ? 'Saboteur' : 'Citizen'}
            </span>
          </div>

          {/* Voting Countdown Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/30 backdrop-blur border border-white/15 font-mono text-white text-sm shadow-sm">
            <Clock className="w-4 h-4 text-white/60" />
            <span className="font-semibold">{Math.max(0, timer.timeRemaining)}s</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Artwork Display (Left 3) + Accusation Grid (Right 2) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-5 gap-3 items-stretch h-full overflow-hidden">
        {/* Finished Artwork Showcase */}
        <div className="lg:col-span-3 w-full h-full min-h-0 flex flex-col overflow-hidden">
          <CanvasBoard
            isInteractive={false}
            inkRemaining={0}
            setInkRemaining={() => {}}
          />
        </div>

        {/* Accusation List Panel */}
        <div className="lg:col-span-2 flex flex-col bg-black/40 backdrop-blur-2xl p-4 sm:p-5 rounded-2xl border border-white/15 shadow-lg overflow-hidden h-full min-h-0">
          <div className="pb-3 border-b border-white/15 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white/90">
                Accuse Saboteur
              </h3>
              <p className="text-xs text-white/60 mt-0.5">
                Cast your vote for who you think received the fake prompt.
              </p>
            </div>
          </div>

          {/* Active Vote Confirmation Status */}
          {hasAlreadyVoted && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs backdrop-blur animate-fadeIn shadow-sm">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Vote Locked:{' '}
                  <strong className="text-white">
                    {myVotedTargetId === 'SKIP'
                      ? 'Skip Vote (Abstain)'
                      : myVotedPlayer
                      ? `${myVotedPlayer.name} ${myVotedPlayer.id === myPlayerId ? '(Self)' : ''}`
                      : 'Recorded'}
                  </strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" /> Locked
              </span>
            </div>
          )}

          {/* List of ALL Players (including yourself) */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {allPlayers.map((player) => {
              const isSelected = myVotedTargetId === player.id;
              const isMe = player.id === myPlayerId;

              return (
                <button
                  key={player.id}
                  onClick={() => handleVote(player.id)}
                  disabled={isSubmitting || hasAlreadyVoted}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 text-left backdrop-blur ${
                    isSelected
                      ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]'
                      : hasAlreadyVoted
                      ? 'bg-black/15 border-white/10 opacity-50 cursor-not-allowed'
                      : 'bg-black/25 hover:bg-white/15 border-white/15 hover:border-white/30 cursor-pointer group'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/30 border overflow-hidden shrink-0 shadow-inner"
                      style={{ borderColor: player.color }}
                    >
                      <PlayerAvatar avatar={player.avatar} name={player.name} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-white group-hover:text-white transition flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white/20 text-white border border-white/10">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-white/60">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: player.color }}
                        />
                        <span className="text-[11px] font-mono">
                          {isMe ? 'Vote yourself' : 'Ink Pigment'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow">
                        <Lock className="w-3 h-3 stroke-[2.5]" />
                        Locked In
                      </span>
                    ) : hasAlreadyVoted ? (
                      <span className="px-3 py-1 rounded-xl bg-black/30 text-white/40 font-medium text-xs flex items-center gap-1 border border-white/10">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-white/15 text-white group-hover:bg-rose-500 group-hover:text-white font-medium text-xs transition border border-white/15">
                        Vote
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Skip Vote Option */}
            <div className="pt-2 border-t border-white/15">
              <button
                onClick={() => handleVote('SKIP')}
                disabled={isSubmitting || hasAlreadyVoted}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 text-left backdrop-blur ${
                  myVotedTargetId === 'SKIP'
                    ? 'bg-emerald-500/25 border-emerald-400 ring-2 ring-emerald-400/50 shadow-md scale-[1.01]'
                    : hasAlreadyVoted
                    ? 'bg-black/15 border-white/10 opacity-50 cursor-not-allowed'
                    : 'bg-black/25 hover:bg-white/15 border-white/15 hover:border-white/30 cursor-pointer group'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base bg-black/30 border border-white/15 text-white/70 group-hover:text-white shadow-inner">
                    ⏭️
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white group-hover:text-white transition">
                      Skip Vote (Abstain)
                    </div>
                    <div className="text-xs text-white/60">
                      Continue drawing round if inconclusive
                    </div>
                  </div>
                </div>

                <div>
                  {myVotedTargetId === 'SKIP' ? (
                    <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow">
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                      Locked In
                    </span>
                  ) : hasAlreadyVoted ? (
                    <span className="px-3 py-1 rounded-xl bg-black/30 text-white/40 font-medium text-xs flex items-center gap-1 border border-white/10">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-white/15 text-white group-hover:bg-white/25 group-hover:text-white font-medium text-xs transition border border-white/15">
                      Skip
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-white/15 flex items-center justify-between text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              {allPlayers.length} Players in match
            </span>
            <span>{hasAlreadyVoted ? 'Status: Vote Locked (Final)' : 'Action: Select a Suspect'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
