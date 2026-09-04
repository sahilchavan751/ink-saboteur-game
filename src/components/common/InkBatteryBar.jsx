import React, { useEffect, useRef } from 'react';
import { BatteryCharging, BatteryWarning, AlertCircle } from 'lucide-react';
import { playInkEmpty } from '../../utils/sound';

export const InkBatteryBar = ({ inkRemaining, maxInk, playerColor }) => {
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

  // Clean solid color for the bar
  let barColor = 'bg-zinc-100';
  if (isLow) barColor = 'bg-amber-500';
  if (isEmpty) barColor = 'bg-rose-500';

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

      {/* Solid Battery Track */}
      <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
        <div
          className={`h-full ${barColor} transition-all duration-75 ease-out`}
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
