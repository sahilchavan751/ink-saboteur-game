import React, { useState } from 'react';
import { Copy, Check, Sliders, Play, Users, Clock, Flame, ShieldAlert, Share2, Hourglass, Grid, Globe, Lock } from 'lucide-react';
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
    <div className="max-w-5xl mx-auto px-4 py-4 sm:py-6 space-y-4 animate-fadeIn pb-12 sm:pb-6">
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Hero Header Card */}
      <div className="bg-black/30 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="inline-block text-[11px] font-mono font-medium uppercase tracking-wider text-white/90 bg-white/10 px-2.5 py-0.5 rounded-md border border-white/15 backdrop-blur">
              Lobby Active
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">
              Waiting for Artists
            </h1>
            <p className="text-white/80 text-xs max-w-md drop-shadow-sm">
              Share the 4-letter room code with players to take turns drawing on the shared whiteboard.
            </p>
          </div>

          {/* Room Code Card */}
          <div className="flex flex-col items-start sm:items-end gap-1.5 bg-black/25 backdrop-blur p-3.5 rounded-xl border border-white/15 shadow-inner">
            <span className="text-[11px] uppercase font-mono tracking-wider text-white/70">
              Room Code
            </span>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-3xl font-bold text-white tracking-widest drop-shadow">
                {roomState.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition cursor-pointer backdrop-blur"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white" />}
              </button>
            </div>
            <button
              onClick={handleShareLink}
              className="text-[11px] flex items-center gap-1 text-white/80 hover:text-white transition cursor-pointer"
            >
              <Share2 className="w-3 h-3" />
              Copy Direct Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* Players List & Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Joined Players */}
        <div className="lg:col-span-2 bg-black/30 backdrop-blur-2xl rounded-2xl p-5 sm:p-6 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] space-y-3.5">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/15">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-white/80" />
              <h2 className="text-sm font-semibold text-white drop-shadow-sm">
                Connected Players
              </h2>
              {roomState.isPublic ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-400/30 flex items-center gap-0.5">
                  <Globe className="w-2.5 h-2.5" /> Public
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/15 flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Private
                </span>
              )}
            </div>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-black/25 text-white/80 border border-white/15">
              {roomState.players.length} / {roomState.maxPlayers}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roomState.players.map((player) => {
              const isMe = player.id === socket?.id;
              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-xl border backdrop-blur transition ${
                    isMe
                      ? 'bg-white/15 border-white/35 shadow-sm'
                      : 'bg-black/25 border-white/15 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-black/20 border overflow-hidden shrink-0 shadow-inner"
                      style={{ borderColor: player.color }}
                    >
                      <PlayerAvatar avatar={player.avatar} name={player.name || 'Artist'} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-white truncate max-w-[120px] drop-shadow-sm min-w-0">
                          {player.name || 'Artist'}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/20 text-white font-medium border border-white/10">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-white/70 font-mono">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: player.color }} />
                        {player.isHost ? 'Host' : 'Artist'}
                      </div>
                    </div>
                  </div>

                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" title="Connected" />
                </div>
              );
            })}
          </div>

          {roomState.players.length < 2 && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-black/25 border border-white/15 text-white/80 text-xs backdrop-blur">
              <ShieldAlert className="w-4 h-4 text-amber-300 shrink-0" />
              <span>
                At least <strong>2 players</strong> are required to start. Open another browser tab with code <strong className="font-mono text-white">{roomState.code}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Match Settings & Launch */}
        <div className="space-y-4">
          <div className="bg-black/30 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/15">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-white drop-shadow-sm">
                Match Rules
              </h3>
              {isHost && (
                <button
                  onClick={() => {
                    playClick();
                    setIsSettingsOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition font-medium cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  Customize
                </button>
              )}
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-white/60" />
                  Turn Draw Time:
                </span>
                <span className="text-white font-medium">{roomState.turnDuration}s per player</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Hourglass className="w-3.5 h-3.5 text-white/60" />
                  Review Intermission:
                </span>
                <span className="text-white font-medium">{roomState.intermissionDuration}s</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-white/60" />
                  Voting Time:
                </span>
                <span className="text-white font-medium">{roomState.votingDuration}s</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/10">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-white/60" />
                  Total Rounds:
                </span>
                <span className="text-white font-medium">{roomState.maxRounds} Rounds</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-white/70 flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-white/60" />
                  Whiteboard Paper:
                </span>
                <span className="text-white font-medium capitalize">
                  {roomState.whiteboardPattern || 'Dotted'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-2xl rounded-2xl p-4 sm:p-5 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.35)] text-center space-y-2.5">
            {isHost ? (
              <div className="space-y-2">
                <button
                  onClick={handleStartGame}
                  disabled={!canStart || starting}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer ${
                    canStart && !starting
                      ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-xl active:scale-[0.99]'
                      : 'bg-black/25 text-white/40 border border-white/10 cursor-not-allowed'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {starting ? 'Starting...' : canStart ? 'Start Game' : 'Waiting for Players'}
                </button>
                <p className="text-[11px] text-white/70">
                  {canStart ? 'All players ready. Each artist draws in turn.' : 'Need at least 2 players to start.'}
                </p>
              </div>
            ) : (
              <div className="py-2 space-y-1">
                <h4 className="font-semibold text-xs text-white drop-shadow-sm">
                  Waiting for Host
                </h4>
                <p className="text-[11px] text-white/70">
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
