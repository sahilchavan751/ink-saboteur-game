import React, { useState } from 'react';
import { X, Sliders, Users, Clock, Flame, RotateCcw, Check, Sparkles, Hourglass, Grid, Circle, Square } from 'lucide-react';
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
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

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
        whiteboardPattern
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-elevated space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Match Customization</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 transition cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sliders Container */}
        <div className="space-y-4">
          {/* 1. Turn Duration per player */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" />
                Turn Draw Time (Per Player)
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {turnDuration}s
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              step="1"
              value={turnDuration}
              onChange={(e) => setTurnDuration(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>5s Blitz</span>
              <span>10s Standard</span>
              <span>30s Long</span>
            </div>
          </div>

          {/* 2. Draw Chances per Player */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                Draw Chances Per Player (Turns / Round)
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {drawChances} {drawChances === 1 ? 'Turn' : 'Turns'}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={drawChances}
              onChange={(e) => setDrawChances(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>1 Turn (Quick)</span>
              <span>2 Turns (Fair)</span>
              <span>4 Turns (Deep)</span>
            </div>
          </div>

          {/* 2. Review Intermission before voting */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Hourglass className="w-3.5 h-3.5 text-zinc-500" />
                Intermission Pause Before Voting
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {intermissionDuration}s
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={intermissionDuration}
              onChange={(e) => setIntermissionDuration(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>3s Quick</span>
              <span>5s Standard</span>
              <span>10s Relaxed</span>
            </div>
          </div>

          {/* 3. Voting Duration */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                Voting Discussion Duration
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {votingDuration}s
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={votingDuration}
              onChange={(e) => setVotingDuration(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
          </div>

          {/* 4. Total Rounds */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-zinc-500" />
                Total Match Rounds
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {maxRounds} Rounds
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={maxRounds}
              onChange={(e) => setMaxRounds(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
          </div>

          {/* 5. Max Players */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                Max Players
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 font-semibold">
                {maxPlayers}
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="12"
              step="1"
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(e.target.value)}
              className="w-full accent-zinc-200 cursor-pointer h-1.5 bg-zinc-950 rounded appearance-none"
            />
          </div>

          {/* 6. Whiteboard Pattern Selector (Author sets for everybody) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-zinc-500" />
                Whiteboard Paper Pattern
              </label>
              <span className="font-mono text-zinc-200 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-[11px] capitalize">
                {whiteboardPattern}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'dotted', label: 'Dots', icon: Circle, desc: 'Dotted paper' },
                { id: 'grid', label: 'Grid', icon: Grid, desc: 'Graph grid' },
                { id: 'clean', label: 'Clean', icon: Square, desc: 'Pure white' }
              ].map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    playClick();
                    setWhiteboardPattern(id);
                  }}
                  className={`p-2.5 rounded-xl border text-xs flex flex-col items-center gap-1 transition cursor-pointer ${
                    whiteboardPattern === id
                      ? 'bg-zinc-100 text-zinc-900 border-white font-semibold shadow-sm'
                      : 'bg-zinc-950 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border-zinc-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-xs">{label}</span>
                  <span className={`text-[10px] ${whiteboardPattern === id ? 'text-zinc-600' : 'text-zinc-500'}`}>
                    {desc}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-500">
              Synced to all players in the room during drawing & voting.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={resetDefaults}
            className="text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
          >
            Reset Defaults
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
