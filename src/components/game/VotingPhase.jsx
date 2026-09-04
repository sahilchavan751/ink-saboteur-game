import React, { useState } from 'react';
import { Clock, ShieldAlert, Check, Users, Lock } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';
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
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-5 animate-fadeIn">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2 flex-wrap">
              <span>Accusation Phase</span>
              {roomState.isTieBreaker && (
                <span className="text-xs px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300 font-mono font-medium">
                  Tie-Breaker Vote
                </span>
              )}
              <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-normal">
                {totalVotesCast} of {allPlayers.length} voted
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              {roomState.isTieBreaker
                ? 'Previous vote tied! Strokes have been wiped for a fresh inspection. Cast your vote to break the tie.'
                : 'Inspect the whiteboard drawing. Who drew strokes inconsistent with the theme?'}
            </p>
          </div>
        </div>

        {/* Right Info: Role Badge & Voting Countdown Timer */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Your Role Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono">
            <span className="text-zinc-500 uppercase text-[10px]">Your Role:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-xs ${
                isSaboteur
                  ? 'bg-rose-950/70 border border-rose-800 text-rose-300'
                  : 'bg-indigo-950/70 border border-indigo-800 text-indigo-300'
              }`}
            >
              {isSaboteur ? 'Saboteur' : 'Citizen'}
            </span>
          </div>

          {/* Voting Countdown Timer */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-300 text-sm">
            <Clock className="w-4 h-4 text-zinc-500" />
            <span className="font-semibold">{Math.max(0, timer.timeRemaining)}s</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Artwork Display (Left 3) + Accusation Grid (Right 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Finished Artwork Showcase */}
        <div className="lg:col-span-3 space-y-2">
          <CanvasBoard
            isInteractive={false}
            inkRemaining={0}
            setInkRemaining={() => {}}
          />
        </div>

        {/* Accusation List Panel */}
        <div className="lg:col-span-2 bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-4">
          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Accuse Saboteur
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Cast your vote for who you think received the fake prompt.
              </p>
            </div>
          </div>

          {/* Active Vote Confirmation Status */}
          {hasAlreadyVoted && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-700/80 text-emerald-300 text-xs animate-fadeIn">
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
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 text-left ${
                    isSelected
                      ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/60 shadow-md scale-[1.01]'
                      : hasAlreadyVoted
                      ? 'bg-zinc-950/50 border-zinc-900 opacity-60 cursor-not-allowed'
                      : 'bg-zinc-950 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 cursor-pointer group'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-base bg-zinc-900 border"
                      style={{ borderColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-zinc-200 group-hover:text-white transition flex items-center gap-1.5">
                        <span>{player.name}</span>
                        {isMe && (
                          <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500">
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
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow">
                        <Lock className="w-3 h-3 stroke-[2.5]" />
                        Locked In
                      </span>
                    ) : hasAlreadyVoted ? (
                      <span className="px-3 py-1 rounded-lg bg-zinc-900 text-zinc-600 font-medium text-xs flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Locked
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-rose-600 group-hover:text-white font-medium text-xs transition">
                        Vote
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Skip Vote Option */}
            <div className="pt-2 border-t border-zinc-800/80">
              <button
                onClick={() => handleVote('SKIP')}
                disabled={isSubmitting || hasAlreadyVoted}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-150 text-left ${
                  myVotedTargetId === 'SKIP'
                    ? 'bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/60 shadow-md scale-[1.01]'
                    : hasAlreadyVoted
                    ? 'bg-zinc-950/50 border-zinc-900 opacity-60 cursor-not-allowed'
                    : 'bg-zinc-950/80 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 cursor-pointer group'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-base bg-zinc-900 border border-zinc-700 text-zinc-400 group-hover:text-zinc-200">
                    ⏭️
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-zinc-300 group-hover:text-white transition">
                      Skip Vote (Abstain)
                    </div>
                    <div className="text-xs text-zinc-500">
                      Continue drawing round if inconclusive
                    </div>
                  </div>
                </div>

                <div>
                  {myVotedTargetId === 'SKIP' ? (
                    <span className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1.5 shadow">
                      <Lock className="w-3 h-3 stroke-[2.5]" />
                      Locked In
                    </span>
                  ) : hasAlreadyVoted ? (
                    <span className="px-3 py-1 rounded-lg bg-zinc-900 text-zinc-600 font-medium text-xs flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white font-medium text-xs transition">
                      Skip
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
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
