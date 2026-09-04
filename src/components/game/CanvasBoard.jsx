import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand, Trash2 } from 'lucide-react';
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
  const { strokes, drawStroke, sendCursor, remoteCursors, notifyInkDepleted, socket, roomState, wipeCanvas } = useGameSocket();
  const { speakingPeers, proximityMessages, localCursor, setLocalCursor } = useProximity();

  // Whiteboard pattern set authoritatively by room settings: 'dotted' | 'grid' | 'clean'
  const pattern = roomState?.whiteboardPattern || 'dotted';
  const isHost = roomState?.hostId === socket?.id || roomState?.players?.find((p) => p.id === socket?.id)?.isHost;

  // Zoom and Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const lastPosRef = useRef(null);
  const lastDrawTimeRef = useRef(null);
  const soundThrottleRef = useRef(0);
  const lastCursorSendRef = useRef(0);
  const drawnStrokesCountRef = useRef(0);
  const lastDimensionsRef = useRef({ width: 0, height: 0 });

  // Pan boundary clamp helper
  const clampPan = useCallback((newX, newY, currentZoom = zoom) => {
    const container = containerRef.current;
    if (!container) return { x: newX, y: newY };
    const rect = container.getBoundingClientRect();
    const boundX = rect.width * Math.max(0.3, currentZoom - 0.5);
    const boundY = rect.height * Math.max(0.3, currentZoom - 0.5);
    return {
      x: Math.max(-boundX, Math.min(boundX, newX)),
      y: Math.max(-boundY, Math.min(boundY, newY))
    };
  }, [zoom]);

  const handleZoomChange = (delta) => {
    setZoom((prev) => {
      const next = Math.round((prev + delta) * 10) / 10;
      const clamped = Math.max(0.7, Math.min(2.2, next));
      setPan((currentPan) => clampPan(currentPan.x, currentPan.y, clamped));
      return clamped;
    });
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsPanMode(false);
  };

  const handleWipeCanvas = async () => {
    if (!isHost || !wipeCanvas) return;
    if (window.confirm('Clear all drawings on the shared whiteboard?')) {
      await wipeCanvas();
    }
  };

  // Wheel zoom handling with passive: false to allow e.preventDefault()
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        setZoom((prev) => {
          const next = Math.round((prev + delta) * 10) / 10;
          const clamped = Math.max(0.7, Math.min(2.2, next));
          setPan((currentPan) => clampPan(currentPan.x, currentPan.y, clamped));
          return clamped;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [clampPan]);

  // Helper to draw a single stroke segment onto 2D context
  const drawStrokeSegment = (ctx, stroke, width, height) => {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = (stroke.width || 5) * (width / 800);
    ctx.moveTo(stroke.startX * width, stroke.startY * height);
    ctx.lineTo(stroke.endX * width, stroke.endY * height);
    ctx.stroke();
  };

  // Full redraw: executed on container resize, pattern change, or stroke reset
  const fullRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    lastDimensionsRef.current = { width: rect.width, height: rect.height };

    ctx.scale(dpr, dpr);

    // 1. Pure White Board
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // 2. Render Pattern
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
    // 'clean' leaves purely white canvas

    // 3. Render all strokes crisply
    strokes.forEach((stroke) => {
      drawStrokeSegment(ctx, stroke, rect.width, rect.height);
    });
    drawnStrokesCountRef.current = strokes.length;
  }, [strokes, pattern]);

  // Handle window and element resize
  useEffect(() => {
    fullRedraw();
    const handleResize = () => fullRedraw();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [fullRedraw]);

  // Real-time incremental stroke rendering: draw new strokes without wiping canvas buffer
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // If canvas size changed or strokes were cleared/reset, perform full redraw
    if (
      strokes.length === 0 ||
      strokes.length < drawnStrokesCountRef.current ||
      rect.width !== lastDimensionsRef.current.width ||
      rect.height !== lastDimensionsRef.current.height
    ) {
      fullRedraw();
      return;
    }

    // Incremental draw: only render incoming new strokes!
    const start = drawnStrokesCountRef.current;
    if (start < strokes.length) {
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      for (let i = start; i < strokes.length; i++) {
        drawStrokeSegment(ctx, strokes[i], rect.width, rect.height);
      }
      ctx.restore();
      drawnStrokesCountRef.current = strokes.length;
    }
  }, [strokes, fullRedraw]);

  // Accurate coordinate normalization taking zoom and pan into account
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
    // Pan trigger conditions: Pan Mode, Middle Mouse Button, Alt+Click, or spectator mode
    const shouldPan = isPanMode || e.button === 1 || e.altKey || !isInteractive;
    if (shouldPan) {
      isPanningRef.current = true;
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
      if (e.pointerId && e.target?.setPointerCapture) {
        try { e.target.setPointerCapture(e.pointerId); } catch (err) {}
      }
      return;
    }

    if (!isInteractive || inkRemaining <= 0) return;
    isDrawingRef.current = true;
    lastPosRef.current = getNormalizedPos(e);
    lastDrawTimeRef.current = Date.now();

    if (e.pointerId && e.target?.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) {}
    }

    sendCursor({
      x: lastPosRef.current.x,
      y: lastPosRef.current.y,
      isDrawing: true
    });
    lastCursorSendRef.current = Date.now();
  };

  const handlePointerMove = (e) => {
    // If currently panning the canvas
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan(clampPan(panStartRef.current.panX + dx, panStartRef.current.panY + dy, zoom));
      return;
    }

    const currentPos = getNormalizedPos(e);
    if (setLocalCursor) {
      setLocalCursor(currentPos);
    }

    const now = Date.now();

    // Throttle cursor position broadcast to 40ms (~25 updates/sec)
    if (now - lastCursorSendRef.current > 40) {
      sendCursor({
        x: currentPos.x,
        y: currentPos.y,
        isDrawing: isDrawingRef.current && inkRemaining > 0
      });
      lastCursorSendRef.current = now;
    }

    if (!isDrawingRef.current || !isInteractive || inkRemaining <= 0) {
      return;
    }

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

    // Immediate local drawing for zero-lag instant feedback
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawStrokeSegment(ctx, strokeData, lastDimensionsRef.current.width, lastDimensionsRef.current.height);
        ctx.restore();
      }
    }

    drawStroke(strokeData);
    lastPosRef.current = currentPos;
  };

  const handlePointerUp = (e) => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      return;
    }

    isDrawingRef.current = false;
    lastPosRef.current = null;
    lastDrawTimeRef.current = null;

    sendCursor({
      ...getNormalizedPos(e),
      isDrawing: false
    });
    lastCursorSendRef.current = Date.now();
  };

  return (
    <div className="w-full h-full flex flex-col flex-1 min-h-0">
      {/* The Whiteboard Frame - Stretches to bottom */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex-1 min-h-[360px] bg-white rounded-2xl border border-zinc-300 shadow-sm overflow-hidden canvas-wrapper touch-none select-none"
      >
        {/* Inner Scaled and Panned Canvas Container */}
        <div
          className="w-full h-full relative"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            willChange: 'transform'
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className={`w-full h-full block ${
              isPanMode || (!isInteractive && !isDrawingRef.current)
                ? 'cursor-grab active:cursor-grabbing'
                : isInteractive && inkRemaining > 0
                ? 'cursor-crosshair'
                : isInteractive && inkRemaining <= 0
                ? 'cursor-not-allowed'
                : 'cursor-grab'
            }`}
          />

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
        </div>

        {/* Floating Whiteboard Controls Widget: Pan, Zoom In/Out/Reset & Host Clear Board */}
        <div className="absolute bottom-3 right-3 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-zinc-700/80 shadow-xl select-none">
          {/* Host-only Clear Board button */}
          {isHost && (
            <>
              <button
                type="button"
                onClick={handleWipeCanvas}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-200 text-xs font-medium transition cursor-pointer shadow-sm"
                title="Host Action: Clear all strokes on canvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear Board</span>
              </button>
              <div className="w-[1px] h-4 bg-zinc-700/80 mx-0.5" />
            </>
          )}

          {/* Pan / Move Tool Toggle */}
          <button
            type="button"
            onClick={() => setIsPanMode(!isPanMode)}
            className={`p-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              isPanMode
                ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
            title={isPanMode ? 'Pan Mode Active (Drag to move canvas)' : 'Toggle Pan Mode (Move canvas)'}
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-[11px]">{isPanMode ? 'Moving' : 'Pan'}</span>
          </button>

          <div className="w-[1px] h-4 bg-zinc-700/80 mx-0.5" />

          {/* Zoom Out Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(-0.2)}
            disabled={zoom <= 0.7}
            className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          {/* Zoom Reset / Level Indicator */}
          <button
            type="button"
            onClick={handleResetView}
            className="px-2 py-1 rounded-lg text-[11px] font-mono font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            title="Reset View (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>

          {/* Zoom In Button */}
          <button
            type="button"
            onClick={() => handleZoomChange(0.2)}
            disabled={zoom >= 2.2}
            className="p-1.5 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

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
