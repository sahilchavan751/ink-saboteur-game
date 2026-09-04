import React, { useEffect, useRef } from 'react';
import { BatteryCharging, BatteryWarning, AlertCircle } from 'lucide-react';
import { playInkEmpty } from '../../utils/sound';

export const InkBatteryBar = ({ inkRemaining, maxInk, playerColor, compact = false }) => {
  const percent = Math.max(0, Math.min(100, (inkRemaining / maxInk) * 100));
  const isLow = percent <= 25 && percent > 0;
  const isEmpty = percent <= 0;
  const prevEmptyRef = useRef(false);

  useEffect(() => {
    if (isEmpty && !prevEmptyRef.current) {
      playInkEmpty();
    }
    prevEmptyRef.current = isEmpty;
  }, [isEmpty]);

  // Clean dynamic bar color
  let barColor = 'bg-zinc-100';
  if (isLow) barColor = 'bg-amber-400';
  if (isEmpty) barColor = 'bg-rose-500';

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs shadow-inner"
        title={`Ink Battery: ${(inkRemaining / 1000).toFixed(1)}s remaining of ${(maxInk / 1000).toFixed(0)}s`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {isEmpty ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
          ) : isLow ? (
            <BatteryWarning className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
          ) : (
            <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="font-mono text-[10px] text-zinc-500 uppercase hidden sm:inline">Ink</span>
        </div>

        {/* Smooth Linear Progress Bar Track */}
        <div className="w-14 sm:w-20 h-2 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800 shrink-0">
          <div
            className={`h-full ${barColor} transition-[width] duration-1000 ease-linear rounded-full`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Digits Display */}
        <span className="font-mono text-xs font-semibold text-zinc-200 min-w-[24px] text-right shrink-0">
          {isEmpty ? '0s' : `${Math.ceil(inkRemaining / 1000)}s`}
        </span>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          {isEmpty ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          ) : isLow ? (
            <BatteryWarning className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" />
          )}
          <span className="font-medium text-zinc-300">
            Ink Battery
          </span>
          {playerColor && (
            <span
              className="w-2.5 h-2.5 rounded-full border border-zinc-700 inline-block"
              style={{ backgroundColor: playerColor }}
              title="Your assigned ink pigment"
            />
          )}
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          {isEmpty ? (
            <span className="text-rose-400 font-semibold uppercase tracking-wider">
              Empty
            </span>
          ) : (
            <span className="text-zinc-200 font-semibold">
              {(inkRemaining / 1000).toFixed(1)}s
            </span>
          )}
          <span className="text-zinc-500">/ {(maxInk / 1000).toFixed(0)}s</span>
        </div>
      </div>

      {/* Smooth Linear Battery Track */}
      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div
          className={`h-full ${barColor} transition-[width] duration-1000 ease-linear`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[11px] text-zinc-500">
        <span>Draws only while holding mouse/touch down.</span>
        {isEmpty && <span className="text-rose-400 font-medium">Drawing locked for this round</span>}
      </div>
    </div>
  );
};
