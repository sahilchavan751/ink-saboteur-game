import React, { useRef, useEffect, useState, useCallback } from 'react';

import { useGameSocket } from '../../context/SocketContext';
import { useProximity } from '../../context/ProximityContext';
import { playStrokeSound } from '../../utils/sound';

export const CanvasBoard = ({
  playerColor = '#18181b',
  inkRemaining,
  setInkRemaining,
  isInteractive = true,
  brushSize = 5
}) => {
  const { strokes, drawStroke, sendCursor, remoteCursors, notifyInkDepleted, socket, roomState } = useGameSocket();
  const { isProximityEnabled, speakingPeers, proximityMessages, localCursor, setLocalCursor } = useProximity();

  // Whiteboard pattern set authoritatively by room settings: 'dotted' | 'grid' | 'clean'
  const pattern = roomState?.whiteboardPattern || 'dotted';

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef(null);
  const lastDrawTimeRef = useRef(null);
  const soundThrottleRef = useRef(0);

  // Render Whiteboard: Pure White with optional Dotted / Grid / Clean background
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.scale(dpr, dpr);

    // 1. Pure White Board
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 2. Render Selected Pattern
    if (pattern === 'dotted') {
      ctx.fillStyle = '#d4d4d8';
      const spacing = 24;
      for (let x = spacing; x < rect.width; x += spacing) {
        for (let y = spacing; y < rect.height; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (pattern === 'grid') {
      ctx.strokeStyle = '#e4e4e7';
      ctx.lineWidth = 1;
      const gridSize = 28;
      for (let x = 0; x < rect.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, rect.height);
        ctx.stroke();
      }
      for (let y = 0; y < rect.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }
    }
    // 'clean' leaves the canvas purely white with no patterns

    // 3. Render all strokes crisply
    strokes.forEach((stroke) => {
      ctx.beginPath();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = (stroke.width || 5) * (rect.width / 800);

      ctx.moveTo(stroke.startX * rect.width, stroke.startY * rect.height);
      ctx.lineTo(stroke.endX * rect.width, stroke.endY * rect.height);
      ctx.stroke();
    });
  }, [strokes, pattern]);

  useEffect(() => {
    redrawCanvas();
    const handleResize = () => redrawCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [redrawCanvas]);

  const getNormalizedPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);

    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return { x, y };
  };

  const handlePointerDown = (e) => {
    if (!isInteractive || inkRemaining <= 0) return;
    isDrawingRef.current = true;
    lastPosRef.current = getNormalizedPos(e);
    lastDrawTimeRef.current = Date.now();

    if (e.pointerId && e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  const handlePointerMove = (e) => {
    const currentPos = getNormalizedPos(e);
    if (setLocalCursor) {
      setLocalCursor(currentPos);
    }

    sendCursor({
      x: currentPos.x,
      y: currentPos.y,
      isDrawing: isDrawingRef.current && inkRemaining > 0
    });

    if (!isDrawingRef.current || !isInteractive || inkRemaining <= 0) {
      return;
    }

    const now = Date.now();
    const deltaTime = now - (lastDrawTimeRef.current || now);
    lastDrawTimeRef.current = now;

    const newInk = Math.max(0, inkRemaining - deltaTime);
    setInkRemaining(newInk);

    if (newInk <= 0) {
      isDrawingRef.current = false;
      notifyInkDepleted();
      return;
    }

    if (now - soundThrottleRef.current > 75) {
      playStrokeSound();
      soundThrottleRef.current = now;
    }

    const lastPos = lastPosRef.current || currentPos;

    const strokeData = {
      startX: lastPos.x,
      startY: lastPos.y,
      endX: currentPos.x,
      endY: currentPos.y,
      color: playerColor,
      width: brushSize
    };

    drawStroke(strokeData);
    lastPosRef.current = currentPos;
  };

  const handlePointerUp = (e) => {
    isDrawingRef.current = false;
    lastPosRef.current = null;
    lastDrawTimeRef.current = null;

    sendCursor({
      ...getNormalizedPos(e),
      isDrawing: false
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* The Whiteboard Frame - Maximized and responsive */}
      <div
        ref={containerRef}
        className="relative w-full flex-1 aspect-[4/3] sm:aspect-[16/10] lg:aspect-auto min-h-[460px] sm:min-h-[520px] lg:min-h-[620px] max-h-[780px] bg-white rounded-2xl border border-zinc-300 shadow-sm overflow-hidden canvas-wrapper touch-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className={`w-full h-full block ${
            isInteractive && inkRemaining > 0
              ? 'cursor-crosshair'
              : isInteractive && inkRemaining <= 0
              ? 'cursor-not-allowed'
              : 'cursor-default'
          }`}
        />

        {/* Proximity Hearing Range Circle (Around local cursor) */}
        {isProximityEnabled && (
          <div
            className="absolute pointer-events-none rounded-full border border-emerald-500/20 bg-emerald-500/5 transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${(localCursor?.x ?? 0.5) * 100}%`,
              top: `${(localCursor?.y ?? 0.5) * 100}%`,
              width: '45%',
              aspectRatio: '1 / 1'
            }}
          />
        )}

        {/* Remote Opponent Live Cursors with High-Contrast Dark Badges & Proximity Indicators */}
        {Object.entries(remoteCursors).map(([id, cursor]) => {
          const isPeerSpeaking = speakingPeers?.[id];
          const peerMsg = [...(proximityMessages || [])].reverse().find(
            (m) => m.playerId === id && Date.now() - m.timestamp < 5000
          );

          return (
            <div
              key={id}
              className="absolute pointer-events-none transition-all duration-75 ease-out z-20"
              style={{
                left: `${cursor.x * 100}%`,
                top: `${cursor.y * 100}%`,
                transform: 'translate(-3px, -3px)'
              }}
            >
              <div className="relative">
                {/* Speaking wave pulse */}
                {isPeerSpeaking && (
                  <span className="absolute -inset-1 rounded-full border-2 border-emerald-400 animate-ping opacity-75" />
                )}

                <span
                  className="block w-3.5 h-3.5 rounded-full border-2 border-zinc-950 shadow-sm"
                  style={{ backgroundColor: cursor.color }}
                />
                <div className="absolute left-4 top-0 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-[10px] font-medium whitespace-nowrap shadow flex items-center gap-1">
                  <span>{cursor.avatar}</span>
                  <span className="font-semibold">{cursor.name}</span>
                  {isPeerSpeaking && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                {/* Proximity Speech Bubble */}
                {peerMsg && (
                  <div className="absolute left-0 -top-8 bg-zinc-900/95 border border-zinc-700 text-zinc-100 text-xs px-2.5 py-1 rounded-xl shadow-popover whitespace-nowrap animate-fadeIn z-30 flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-400">💬</span>
                    <span className="font-medium text-[11px]">{peerMsg.text}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Local Player Speech Bubble on Canvas */}
        {(() => {
          const localMsg = [...(proximityMessages || [])].reverse().find(
            (m) => m.playerId === socket?.id && Date.now() - m.timestamp < 5000
          );
          if (!localMsg) return null;
          return (
            <div
              className="absolute pointer-events-none z-30 transition-all duration-75 ease-out"
              style={{
                left: `${(localCursor?.x ?? 0.5) * 100}%`,
                top: `${(localCursor?.y ?? 0.5) * 100}%`,
                transform: 'translate(10px, -30px)'
              }}
            >
              <div className="bg-zinc-900 border border-emerald-500/60 text-emerald-200 text-xs px-2.5 py-1 rounded-xl shadow-popover whitespace-nowrap animate-fadeIn flex items-center gap-1.5">
                <span className="text-[10px]">💬 You:</span>
                <span className="font-medium text-[11px]">{localMsg.text}</span>
              </div>
            </div>
          );
        })()}

        {/* Out of Ink Indicator on Whiteboard */}
        {isInteractive && inkRemaining <= 0 && (
          <div className="absolute top-3 right-3 z-20 pointer-events-none bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-[11px] font-semibold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Ink Depleted</span>
          </div>
        )}
      </div>
    </div>
  );
};
