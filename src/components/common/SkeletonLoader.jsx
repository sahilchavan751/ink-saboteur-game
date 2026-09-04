import React from 'react';

export const Skeleton = ({ className = '' }) => {
  return (
    <div className={`bg-zinc-800/60 animate-pulse rounded-lg ${className}`} />
  );
};

export const PlayerGridSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="w-24 h-3.5" />
              <Skeleton className="w-14 h-2.5" />
            </div>
          </div>
          <Skeleton className="w-3 h-3 rounded-full" />
        </div>
      ))}
    </div>
  );
};

export const CanvasSkeleton = () => {
  return (
    <div className="w-full aspect-[16/10] bg-zinc-900 rounded-2xl border border-zinc-800 p-6 flex flex-col items-center justify-center space-y-3">
      <Skeleton className="w-16 h-16 rounded-full" />
      <Skeleton className="w-48 h-4 rounded-md" />
      <Skeleton className="w-32 h-3 rounded-md" />
    </div>
  );
};
