import React, { useState } from 'react';
import { CheckCircle2, XCircle, ArrowRight, ShieldCheck, Skull, Send, Clock, Sparkles } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { playClick } from '../../utils/sound';

export const RevealPhase = () => {
  const { roomState, timer, socket, submitSaboteurGuess, nextRound } = useGameSocket();
  const [guessInput, setGuessInput] = useState('');
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  if (!roomState || !roomState.roundResults) return null;

  const results = roomState.roundResults;
  const isMeSaboteur = results.saboteurId === socket?.id;
  const saboteurPlayer = roomState.players.find((p) => p.id === results.saboteurId);
  const currentPlayer = roomState.players.find((p) => p.id === socket?.id);
  const isHost = currentPlayer?.isHost;
  const isFinalRound = roomState.currentRound >= roomState.maxRounds;

  const handleSaboteurGuess = async (e) => {
    e.preventDefault();
    if (!guessInput.trim() || guessSubmitted) return;
    setGuessSubmitted(true);
    playClick();

    try {
      await submitSaboteurGuess(guessInput.trim());
    } catch (err) {
      alert(err.message || 'Guess failed');
    }
  };

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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Top Banner: Round Results & Saboteur Reveal */}
      <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase bg-zinc-950 border border-zinc-800">
          {results.isSaboteurCaught ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saboteur Identified
            </span>
          ) : (
            <span className="text-rose-400 flex items-center gap-1.5">
              <Skull className="w-3.5 h-3.5" />
              Saboteur Escaped
            </span>
          )}
        </div>

        {/* Revealed Saboteur Avatar & Name */}
        <div className="space-y-2">
          <span className="text-[11px] uppercase font-mono tracking-widest text-zinc-500">
            The Saboteur Was
          </span>
          <div className="flex items-center justify-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl bg-zinc-950 border-2"
              style={{ borderColor: saboteurPlayer?.color }}
            >
              {saboteurPlayer?.avatar}
            </div>
            <div className="text-left">
              <h2 className="text-xl font-bold text-white">
                {saboteurPlayer?.name}
              </h2>
              <span className="text-xs font-mono text-zinc-400">
                Drew in this ink pigment
              </span>
            </div>
          </div>
        </div>

        {/* Prompt Comparison Side-by-Side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-800">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-left space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" />
              Citizens' Real Prompt
            </span>
            <div className="text-lg font-bold text-zinc-100">
              "{results.citizenPrompt}"
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-left space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1">
              <Skull className="w-3.5 h-3.5 text-zinc-300" />
              Saboteur's Fake Prompt
            </span>
            <div className="text-lg font-bold text-zinc-100">
              "{results.saboteurPrompt}"
            </div>
          </div>
        </div>
      </div>

      {/* Saboteur Guess Section */}
      {results.isSaboteurCaught && (
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">
                Saboteur's Guess (+50 Bonus Points)
              </h3>
              <p className="text-xs text-zinc-500">
                If the Saboteur correctly guesses the Citizens' real prompt, they receive 50 bonus points.
              </p>
            </div>
          </div>

          {isMeSaboteur ? (
            results.saboteurGuessedPrompt ? (
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                <span>
                  You guessed: <strong>"{results.saboteurGuessedPrompt}"</strong>
                </span>
                <span className={results.saboteurGuessCorrect ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {results.saboteurGuessCorrect ? '✓ Correct (+50 pts)' : '✗ Incorrect'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleSaboteurGuess} className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Guess the Citizens' real prompt..."
                  className="flex-1 px-3.5 py-2 bg-zinc-950 rounded-xl border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-zinc-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  Submit
                </button>
              </form>
            )
          ) : (
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-center justify-between">
              <span>
                Saboteur's Guess: {results.saboteurGuessedPrompt ? `"${results.saboteurGuessedPrompt}"` : 'Waiting for Saboteur...'}
              </span>
              {results.saboteurGuessedPrompt && (
                <span className={results.saboteurGuessCorrect ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                  {results.saboteurGuessCorrect ? '✓ Correct (+50 pts)' : '✗ Incorrect'}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Standings Breakdown */}
      <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800">
          Round Standings
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
                  className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800/80"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-zinc-500 w-4">
                      #{rank + 1}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-base bg-zinc-900 border"
                      style={{ borderColor: player.color }}
                    >
                      {player.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-200">
                          {player.name}
                        </span>
                        {isSab && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-rose-400 border border-zinc-700">
                            Saboteur
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {isSab ? (
                          <span>Survival bonus</span>
                        ) : (
                          <span>Voted: {votedTarget ? votedTarget.name : 'None'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {roundGain > 0 && (
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-800 text-emerald-400 border border-zinc-700 font-medium">
                        +{roundGain} pts
                      </span>
                    )}
                    <span className="font-mono font-bold text-sm text-zinc-100">
                      {player.score} pts
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Advance Footer Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Clock className="w-3.5 h-3.5 text-zinc-500" />
          <span>Auto-advancing in: <strong>{Math.max(0, timer.timeRemaining)}s</strong></span>
        </div>

        {isHost ? (
          <button
            onClick={handleNextRound}
            disabled={advancing}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <span>{isFinalRound ? 'View Final Results' : 'Next Round'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-xs text-zinc-500">
            Waiting for host to advance...
          </span>
        )}
      </div>
    </div>
  );
};
