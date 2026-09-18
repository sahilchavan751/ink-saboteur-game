import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Users,
  Clock,
  Flame,
  RotateCcw,
  Check,
  Sparkles,
  Hourglass,
  Grid,
  Circle,
  Square,
  Globe,
  Lock
} from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import { playClick } from '../../utils/sound';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { roomState, updateSettings } = useGameSocket();

  const [maxPlayers, setMaxPlayers] = useState(roomState?.maxPlayers || 8);
  const [turnDuration, setTurnDuration] = useState(roomState?.turnDuration || 10);
  const [drawChances, setDrawChances] = useState(roomState?.drawChances || 2);
  const [intermissionDuration, setIntermissionDuration] = useState(roomState?.intermissionDuration || 5);
  const [votingDuration, setVotingDuration] = useState(roomState?.votingDuration || 30);
  const [maxRounds, setMaxRounds] = useState(roomState?.maxRounds || 5);
  const [whiteboardPattern, setWhiteboardPattern] = useState(roomState?.whiteboardPattern || 'dotted');
  const [isPublic, setIsPublic] = useState(roomState?.isPublic || false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (roomState && isOpen) {
      if (roomState.maxPlayers !== undefined) setMaxPlayers(roomState.maxPlayers);
      if (roomState.turnDuration !== undefined) setTurnDuration(roomState.turnDuration);
      if (roomState.drawChances !== undefined) setDrawChances(roomState.drawChances);
      if (roomState.intermissionDuration !== undefined) setIntermissionDuration(roomState.intermissionDuration);
      if (roomState.votingDuration !== undefined) setVotingDuration(roomState.votingDuration);
      if (roomState.maxRounds !== undefined) setMaxRounds(roomState.maxRounds);
      if (roomState.whiteboardPattern !== undefined) setWhiteboardPattern(roomState.whiteboardPattern);
      if (roomState.isPublic !== undefined) setIsPublic(roomState.isPublic);
    }
  }, [roomState, isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    playClick();
    onClose();
  };

  const handleSave = async () => {
    setSaving(true);
    playClick();
    try {
      await updateSettings({
        maxPlayers: Number(maxPlayers),
        turnDuration: Number(turnDuration),
        drawChances: Number(drawChances),
        intermissionDuration: Number(intermissionDuration),
        votingDuration: Number(votingDuration),
        maxRounds: Number(maxRounds),
        whiteboardPattern,
        isPublic
      });
      onClose();
    } catch (e) {
      alert(e.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    playClick();
    setMaxPlayers(8);
    setTurnDuration(10);
    setDrawChances(2);
    setIntermissionDuration(5);
    setVotingDuration(30);
    setMaxRounds(5);
    setWhiteboardPattern('dotted');
    setIsPublic(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md animate-fadeIn select-none overflow-y-auto"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-[390px] bg-gradient-to-b from-black/70 via-zinc-950/85 to-black/90 backdrop-blur-2xl rounded-2xl p-4 sm:p-4.5 border-2 border-white/20 shadow-[0_8px_0_#0f172a,0_24px_48px_rgba(0,0,0,0.6)] flex flex-col max-h-[82vh] space-y-2.5 animate-fadeIn my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar with Back Navigation */}
        <div className="flex items-center justify-between pb-2 border-b border-white/10 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 hover:border-white/40 text-white text-[11px] font-bold tracking-wide shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer group"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-amber-300 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>

          <div className="flex items-center">
            <h2 className="text-[11px] font-black text-white uppercase tracking-wider font-sans">
              Match Customization
            </h2>
          </div>
        </div>

        {/* Scrollable Settings Cards Body */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 glass-scrollbar my-0.5">
          {/* 1. Turn Duration per player */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Clock className="w-3 h-3 text-amber-300" />
                <span>Turn Draw Time (Per Player)</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {turnDuration}s
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={turnDuration}
                onChange={(e) => setTurnDuration(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-amber-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>5s Blitz</span>
              <span>10s Standard</span>
              <span>30s Long</span>
            </div>
          </div>

          {/* 2. Draw Chances per Player */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <RotateCcw className="w-3 h-3 text-sky-400" />
                <span>Draw Chances Per Player</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {drawChances} {drawChances === 1 ? 'Turn' : 'Turns'}
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="1"
                max="4"
                step="1"
                value={drawChances}
                onChange={(e) => setDrawChances(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-sky-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>1 Turn (Quick)</span>
              <span>2 Turns (Fair)</span>
              <span>4 Turns (Deep)</span>
            </div>
          </div>

          {/* 3. Review Intermission before voting */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Hourglass className="w-3 h-3 text-indigo-400" />
                <span>Intermission Before Voting</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {intermissionDuration}s
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                value={intermissionDuration}
                onChange={(e) => setIntermissionDuration(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-indigo-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>3s Quick</span>
              <span>5s Standard</span>
              <span>10s Relaxed</span>
            </div>
          </div>

          {/* 4. Voting Discussion Duration */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>Voting Discussion Duration</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {votingDuration}s
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={votingDuration}
                onChange={(e) => setVotingDuration(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-emerald-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>15s Rapid</span>
              <span>30s Standard</span>
              <span>60s Extended</span>
            </div>
          </div>

          {/* 5. Total Rounds */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>Total Match Rounds</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {maxRounds} {maxRounds === 1 ? 'Round' : 'Rounds'}
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={maxRounds}
                onChange={(e) => setMaxRounds(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-rose-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>1 Fast</span>
              <span>5 Standard</span>
              <span>10 Epic</span>
            </div>
          </div>

          {/* 6. Max Players */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Users className="w-3 h-3 text-amber-300" />
                <span>Max Room Players</span>
              </label>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold shadow-inner">
                {maxPlayers} Players
              </span>
            </div>
            <div className="pt-0.5">
              <input
                type="range"
                min="3"
                max="12"
                step="1"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full h-1.5 bg-zinc-800/90 rounded-full appearance-none cursor-pointer accent-amber-400 border border-white/20 shadow-inner hover:border-white/35 transition-colors"
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/50 font-mono">
              <span>3 Min</span>
              <span>8 Standard</span>
              <span>12 Max</span>
            </div>
          </div>

          {/* 7. Whiteboard Paper Pattern */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Grid className="w-3 h-3 text-cyan-300" />
                <span>Whiteboard Pattern</span>
              </label>
              <span className="font-mono text-white text-[10px] bg-black/40 px-2 py-0.2 rounded-md border border-white/20 font-bold capitalize shadow-inner">
                {whiteboardPattern}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'dotted', label: 'Dots', icon: Circle, desc: 'Dotted' },
                { id: 'grid', label: 'Grid', icon: Grid, desc: 'Graph' },
                { id: 'clean', label: 'Clean', icon: Square, desc: 'Canvas' }
              ].map(({ id, label, icon: Icon, desc }) => {
                const isSelected = whiteboardPattern === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      playClick();
                      setWhiteboardPattern(id);
                    }}
                    className={`py-2 px-1 rounded-xl border text-xs flex flex-col items-center gap-0.5 transition-all cursor-pointer backdrop-blur ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-zinc-950 border-amber-300 font-black shadow-[0_3px_0_#b45309,0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02]'
                        : 'bg-black/30 hover:bg-black/50 text-white/70 hover:text-white border-white/15 hover:border-white/30'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'stroke-[2.5]' : ''}`} />
                    <span className="text-[11px] font-bold">{label}</span>
                    <span className={`text-[8.5px] font-mono ${isSelected ? 'text-zinc-900/80 font-bold' : 'text-white/45'}`}>
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-white/45 text-center pt-0.5">
              Synced to all players in the room during drawing & voting.
            </p>
          </div>

          {/* Lobby Visibility */}
          <div className="space-y-1 p-2.5 rounded-xl bg-black/25 border border-white/15 backdrop-blur">
            <div className="flex items-center justify-between text-[11px]">
              <label className="font-medium text-white flex items-center gap-1.5 drop-shadow-sm">
                <Globe className="w-3 h-3 text-emerald-300" />
                <span>Lobby Visibility</span>
              </label>
              <span className={`font-mono text-[11px] px-2 py-0.5 rounded-md border font-bold shadow-inner ${isPublic ? 'text-emerald-300 bg-emerald-900/30 border-emerald-400/30' : 'text-white bg-black/40 border-white/20'}`}>
                {isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { playClick(); setIsPublic(false); }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                  !isPublic
                    ? 'bg-white/15 border-white/30 text-white'
                    : 'bg-transparent border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Lock className="w-3 h-3" />
                Private
              </button>
              <button
                type="button"
                onClick={() => { playClick(); setIsPublic(true); }}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border ${
                  isPublic
                    ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                    : 'bg-transparent border-transparent text-white/50 hover:text-white/80'
                }`}
              >
                <Globe className="w-3 h-3" />
                Public
              </button>
            </div>
            <p className="text-[9px] text-white/45 text-center pt-0.5">
              {isPublic ? 'Room will appear in the Play Online matchmaking queue.' : 'Only players with the room code can join.'}
            </p>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="pt-2 border-t border-white/10 shrink-0 space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={resetDefaults}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 hover:border-white/40 text-white/80 hover:text-white text-[11px] font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <RotateCcw className="w-3 h-3 text-amber-300" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-1 text-[11px] text-white/70 hover:text-white transition cursor-pointer font-medium hover:underline underline-offset-4"
            >
              Cancel
            </button>
          </div>

          {/* 3D Tactile Game Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 sm:py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-zinc-950 shadow-[0_4px_0_#b45309,0_10px_20px_rgba(0,0,0,0.4)] hover:shadow-[0_2px_0_#b45309,0_6px_12px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:translate-y-[4px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{saving ? 'SAVING CHANGES...' : 'SAVE SETTINGS'}</span>
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
};
