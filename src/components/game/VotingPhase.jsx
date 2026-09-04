import React, { useState } from 'react';
import { Clock, ShieldAlert, Check, Users } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { CanvasBoard } from './CanvasBoard';
import { playVote } from '../../utils/sound';

export const VotingPhase = () => {
  const { roomState, timer, socket, submitVote } = useGameSocket();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!roomState) return null;

  const myPlayerId = socket?.id;
  const currentPlayer = roomState.players.find((p) => p.id === myPlayerId);
  const myVotedTargetId = currentPlayer?.voteTargetId;
  const hasAlreadyVoted = Boolean(currentPlayer?.hasVoted && myVotedTargetId);
  const allPlayers = roomState.players || [];
  const myVotedPlayer = allPlayers.find((p) => p.id === myVotedTargetId);
  const totalVotesCast = allPlayers.filter((p) => p.hasVoted).length;

  const handleVote = async (targetPlayerId) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    playVote();

    try {
      await submitVote(targetPlayerId);
    } catch (err) {
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
            <h2 className="text-base sm:text-lg font-bold text-zinc-100 flex items-center gap-2">
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
                ? 'Previous vote tied! Re-inspect all strokes on the whiteboard and cast your vote to break the tie.'
                : 'Inspect the finished whiteboard drawing. Who drew strokes inconsistent with the theme?'}
            </p>
          </div>
        </div>

        {/* Voting Countdown Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-300 text-sm">
          <Clock className="w-4 h-4 text-zinc-500" />
          <span className="font-semibold">{Math.max(0, timer.timeRemaining)}s</span>
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
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 text-emerald-300 text-xs animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Your Vote:{' '}
                  <strong className="text-white">
                    {myVotedTargetId === 'SKIP'
                      ? 'Skip Vote (Abstain)'
                      : myVotedPlayer
                      ? `${myVotedPlayer.name} ${myVotedPlayer.id === myPlayerId ? '(Self)' : ''}`
                      : 'Recorded'}
                  </strong>
                </span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Click to change</span>
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
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer group text-left ${
                    isSelected
                      ? 'bg-emerald-950/40 border-emerald-600/80 shadow-sm ring-1 ring-emerald-500/40'
                      : 'bg-zinc-950 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
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
                      <span className="px-3 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-emerald-300 font-medium text-xs flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Voted
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-rose-600 group-hover:text-white font-medium text-xs transition">
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
                disabled={isSubmitting}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition cursor-pointer group text-left ${
                  myVotedTargetId === 'SKIP'
                    ? 'bg-emerald-950/40 border-emerald-600/80 shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/80 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700'
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
                    <span className="px-3 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-emerald-300 font-medium text-xs flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Skipped
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-white font-medium text-xs transition">
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
            <span>{hasAlreadyVoted ? 'Status: Vote Submitted' : 'Action: Select a Suspect'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
