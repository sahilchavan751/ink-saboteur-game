import React, { useState } from 'react';
import { Mic, MicOff, Radio, MessageSquare, Send, Volume2, VolumeX, AlertCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { playClick } from '../../utils/sound';

export const ProximityChatBar = ({
  isProximityEnabled,
  toggleProximity,
  isMuted,
  toggleMute,
  isSpeaking,
  micError,
  sendProximityMessage
}) => {
  const [inputText, setInputText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendProximityMessage(inputText.trim());
    setInputText('');
    playClick();
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 select-none">
      <div className="bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-2xl shadow-elevated p-2.5 space-y-2 transition-all">
        {/* Main Control Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Proximity Chat Toggle Button */}
          <button
            onClick={() => {
              playClick();
              toggleProximity();
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isProximityEnabled
                ? 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300 shadow-sm'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
            title="Toggle proximity audio & spatial voice"
          >
            <Radio className={`w-3.5 h-3.5 ${isProximityEnabled ? 'animate-pulse text-emerald-400' : 'text-zinc-500'}`} />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Proximity: {isProximityEnabled ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Controls when Proximity is Enabled */}
          {isProximityEnabled && (
            <div className="flex items-center gap-1.5">
              {/* Mic Mute / Unmute Button */}
              <button
                onClick={() => {
                  playClick();
                  toggleMute();
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  isMuted
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                    : isSpeaking
                    ? 'bg-emerald-950/80 border-emerald-500 text-white animate-pulse'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                }`}
                title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                {isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="font-mono text-[11px]">
                  {isMuted ? 'Muted' : isSpeaking ? 'Speaking...' : 'Active'}
                </span>
              </button>

              {/* Toggle Speech Input Expand */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                title="Toggle proximity whisper chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Information badge */}
          <div className="hidden sm:flex items-center text-[10px] font-mono text-zinc-500">
            {isProximityEnabled ? 'Audio fades with distance' : 'Click to enable voice'}
          </div>
        </div>

        {/* Mic Warning Banner */}
        {micError && isProximityEnabled && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-900 text-amber-300 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="truncate">{micError}</span>
          </div>
        )}

        {/* Proximity Whisper Form (Sends speech bubble over cursor) */}
        {(isExpanded || isProximityEnabled) && (
          <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Whisper nearby (shows over your cursor)..."
              maxLength={70}
              className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-zinc-600 px-3 py-1.5 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-zinc-200 border border-zinc-700 transition cursor-pointer shrink-0"
              title="Send speech bubble"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
