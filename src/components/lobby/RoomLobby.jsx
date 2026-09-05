import React, { useState } from 'react';
import { Copy, Check, Sliders, Play, Users, Clock, Flame, ShieldAlert, Share2, Hourglass, Grid } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { SettingsModal } from './SettingsModal';
import { PlayerGridSkeleton } from '../common/SkeletonLoader';
import { PlayerAvatar } from '../common/PlayerAvatar';
import { playClick } from '../../utils/sound';

export const RoomLobby = () => {
  const { roomState, startGame, socket, loadingRoom } = useGameSocket();
  const [copied, setCopied] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  if (!roomState && loadingRoom) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
        <PlayerGridSkeleton count={4} />
      </div>
    );
  }

  if (!roomState) return null;

  const currentPlayer = roomState.players.find(p => p.id === socket?.id);
  const isHost = currentPlayer?.isHost;
  const canStart = roomState.players.length >= 2;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.code);
    setCopied(true);
    playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = () => {
    const shareUrl = `${window.location.origin}?room=${roomState.code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = async () => {
    if (!canStart || starting) return;
    setStarting(true);
    playClick();
    try {
      await startGame();
    } catch (err) {
      alert(err.message || 'Failed to start game');
      setStarting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Hero Header Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-mono font-medium uppercase tracking-wider text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
              Lobby Active
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Waiting for Artists
            </h1>
            <p className="text-zinc-400 text-xs max-w-md">
              Share the 4-letter room code with players to take turns drawing on the shared whiteboard.
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex flex-col items-start sm:items-end gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <span className="text-[11px] uppercase font-mono tracking-wider text-zinc-500">
              Room Code
            </span>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-3xl font-bold text-zinc-100 tracking-widest">
                {roomState.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-700 transition cursor-pointer"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-300" />}
              </button>
            </div>
            <button
              onClick={handleShareLink}
              className="text-[11px] flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              Copy Direct Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* Players List & Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Joined Players */}
        <div className="lg:col-span-2 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-semibold text-zinc-200">
                Connected Players
              </h2>
            </div>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
              {roomState.players.length} / {roomState.maxPlayers}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roomState.players.map((player) => {
              const isMe = player.id === socket?.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition ${
                    isMe
                      ? 'bg-zinc-800/80 border-zinc-700'
                      : 'bg-zinc-950/70 border-zinc-800/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-900 border overflow-hidden shrink-0"
                      style={{ borderColor: player.color }}
                    >
                      <PlayerAvatar avatar={player.avatar} name={player.name} />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-zinc-200 truncate max-w-[120px]">
                          {player.name}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-zinc-700 text-zinc-300">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: player.color }} />
                        {player.isHost ? 'Host' : 'Artist'}
                      </div>
                    </div>
                  </div>

                  <span className="w-2 h-2 rounded-full bg-emerald-400" title="Connected" />
                </div>
              );
            })}
          </div>

          {roomState.players.length < 2 && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 text-xs">
              <ShieldAlert className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>
                At least <strong>2 players</strong> are required to start. Open another browser tab with code <strong className="font-mono text-zinc-200">{roomState.code}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Match Settings & Launch */}
        <div className="space-y-4">
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Match Rules
              </h3>
              {isHost && (
                <button
                  onClick={() => {
                    playClick();
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize
                </button>
              )}
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Turn Draw Time:
                </span>
                <span className="text-zinc-200 font-medium">{roomState.turnDuration}s per player</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5" />
                  Review Intermission:
                </span>
                <span className="text-zinc-200 font-medium">{roomState.intermissionDuration}s</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  Voting Time:
                </span>
                <span className="text-zinc-200 font-medium">{roomState.votingDuration}s</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-zinc-800/60">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Total Rounds:
                </span>
                <span className="text-zinc-200 font-medium">{roomState.maxRounds} Rounds</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5" />
                  Whiteboard Paper:
                </span>
                <span className="text-zinc-200 font-medium capitalize">
                  {roomState.whiteboardPattern || 'Dotted'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 text-center space-y-3">
            {isHost ? (
              <div className="space-y-2">
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || starting}
                  className={`w-full py-3 rounded-xl font-semibold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    canStart && !starting
                      ? 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-sm'
                      : 'bg-zinc-950 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {starting ? 'Starting...' : canStart ? 'Start Game' : 'Waiting for Players'}
                </button>
                <p className="text-[11px] text-zinc-500">
                  {canStart ? 'All players ready. Each artist draws in turn.' : 'Need at least 2 players to start.'}
                </p>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <h4 className="font-semibold text-xs text-zinc-300">
                  Waiting for Host
                </h4>
                <p className="text-[11px] text-zinc-500">
                  The host will start the match once players have assembled.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
