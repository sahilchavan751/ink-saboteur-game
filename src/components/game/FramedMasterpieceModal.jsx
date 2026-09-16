import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Copy, Check, Frame, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useGameSocket } from '../../context/SocketContext';
import {
  renderFramedMasterpiece,
  downloadFramedMasterpiece,
  copyFramedMasterpieceToClipboard,
  getFrameStyles,
} from '../../utils/frameExporter';
import { playClick } from '../../utils/sound';

const FRAME_STYLE_ICONS = {
  gold: '🖼️',
  mahogany: '🪵',
  gallery: '🏛️',
  noir: '🌑',
};

export const FramedMasterpieceModal = ({ isOpen, onClose, initialRoundNumber = null }) => {
  const { roomState, strokes, roundGallery } = useGameSocket();
  const [frameStyle, setFrameStyle] = useState('gold');
  const [selectedRoundIdx, setSelectedRoundIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const previewCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const frameStyles = getFrameStyles();

  // Build the list of available rounds (gallery + current live strokes as fallback)
  const availableRounds = useCallback(() => {
    const rounds = [...(roundGallery || [])];

    // If we have live strokes that aren't yet in the gallery, add them as the latest round
    if (strokes && strokes.length > 0 && roomState) {
      const currentRound = roomState.currentRound || 1;
      const alreadyArchived = rounds.some((r) => r.roundNumber === currentRound);
      if (!alreadyArchived) {
        rounds.push({
          roundNumber: currentRound,
          strokes: [...strokes],
          citizenPrompt: roomState.roundResults?.citizenPrompt || roomState.citizenPrompt || 'Masterpiece',
          saboteurPrompt: roomState.roundResults?.saboteurPrompt || roomState.saboteurPrompt || '',
          category: roomState.roundResults?.category || roomState.category || '',
          saboteurId: roomState.roundResults?.saboteurId || null,
          players: roomState.players || [],
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          roomCode: roomState.code || '????',
        });
      }
    }

    // If gallery is empty and no live strokes, add a placeholder with current context
    if (rounds.length === 0 && roomState) {
      rounds.push({
        roundNumber: roomState.currentRound || 1,
        strokes: strokes || [],
        citizenPrompt: roomState.citizenPrompt || 'Masterpiece',
        saboteurPrompt: roomState.saboteurPrompt || '',
        category: roomState.category || '',
        saboteurId: null,
        players: roomState.players || [],
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        roomCode: roomState.code || '????',
      });
    }

    return rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  }, [roundGallery, strokes, roomState]);

  const rounds = availableRounds();
  const hasMultipleRounds = rounds.length > 1;
  const currentRoundData = rounds[selectedRoundIdx] || rounds[0];

  // Set initial round on open
  useEffect(() => {
    if (!isOpen) return;
    if (initialRoundNumber != null) {
      const idx = rounds.findIndex((r) => r.roundNumber === initialRoundNumber);
      if (idx >= 0) setSelectedRoundIdx(idx);
      else setSelectedRoundIdx(rounds.length - 1);
    } else {
      setSelectedRoundIdx(rounds.length - 1);
    }
  }, [isOpen, initialRoundNumber]);

  const getExportOptions = useCallback(() => {
    if (!currentRoundData) return null;
    return {
      strokes: currentRoundData.strokes || [],
      players: currentRoundData.players || roomState?.players || [],
      title: currentRoundData.citizenPrompt || 'Masterpiece',
      roomCode: currentRoundData.roomCode || roomState?.code || '????',
      date: currentRoundData.date || new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      frameStyle,
      roundNumber: currentRoundData.roundNumber,
    };
  }, [currentRoundData, roomState, frameStyle]);

  // Render preview whenever options change
  useEffect(() => {
    if (!isOpen) return;
    const options = getExportOptions();
    if (!options) return;

    const framedCanvas = renderFramedMasterpiece(options);
    const previewCanvas = previewCanvasRef.current;
    if (!previewCanvas) return;

    const ctx = previewCanvas.getContext('2d');
    const container = previewCanvas.parentElement;
    if (!container) return;

    const containerW = container.clientWidth;
    const scale = containerW / framedCanvas.width;
    previewCanvas.width = containerW;
    previewCanvas.height = framedCanvas.height * scale;
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    ctx.drawImage(framedCanvas, 0, 0, previewCanvas.width, previewCanvas.height);
  }, [isOpen, frameStyle, selectedRoundIdx, getExportOptions]);

  const handleDownload = () => {
    playClick();
    setDownloading(true);
    const options = getExportOptions();
    if (options) {
      downloadFramedMasterpiece(options);
    }
    setTimeout(() => setDownloading(false), 1200);
  };

  const handleDownloadAll = async () => {
    playClick();
    setDownloadingAll(true);
    for (let i = 0; i < rounds.length; i++) {
      const rd = rounds[i];
      const options = {
        strokes: rd.strokes || [],
        players: rd.players || roomState?.players || [],
        title: rd.citizenPrompt || 'Masterpiece',
        roomCode: rd.roomCode || roomState?.code || '????',
        date: rd.date || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        frameStyle,
        roundNumber: rd.roundNumber,
      };
      downloadFramedMasterpiece(options);
      // Stagger downloads to prevent browser blocking
      if (i < rounds.length - 1) {
        await new Promise((r) => setTimeout(r, 600));
      }
    }
    setTimeout(() => setDownloadingAll(false), 1200);
  };

  const handleCopy = async () => {
    playClick();
    const options = getExportOptions();
    if (!options) return;
    const result = await copyFramedMasterpieceToClipboard(options);
    if (result?.success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
    >
      <div className="relative bg-zinc-900/95 backdrop-blur-2xl border border-white/15 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Top ambient edge */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent pointer-events-none rounded-t-3xl" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-700/20 border border-amber-400/30 flex items-center justify-center">
              <Frame className="w-4.5 h-4.5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Framed Masterpiece Studio
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                {hasMultipleRounds
                  ? `${rounds.length} rounds available · Browse & export`
                  : 'Export your collaborative artwork'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 sm:p-5 space-y-4">
          {/* Round Selector (only when multiple rounds exist) */}
          {hasMultipleRounds && (
            <div className="space-y-2">
              <label className="text-[11px] font-mono uppercase tracking-wider text-white/50 flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                Select Round
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    playClick();
                    setSelectedRoundIdx((prev) => Math.max(0, prev - 1));
                  }}
                  disabled={selectedRoundIdx === 0}
                  className="w-8 h-8 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 flex gap-1.5 overflow-x-auto no-scrollbar">
                  {rounds.map((rd, idx) => (
                    <button
                      key={rd.roundNumber}
                      onClick={() => {
                        playClick();
                        setSelectedRoundIdx(idx);
                      }}
                      className={`px-3 py-2 rounded-xl text-[11px] font-semibold whitespace-nowrap transition cursor-pointer border ${
                        selectedRoundIdx === idx
                          ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 ring-1 ring-amber-400/30'
                          : 'bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      <span className="font-mono">R{rd.roundNumber}</span>
                      <span className="ml-1.5 opacity-75">{(rd.citizenPrompt || '').slice(0, 16)}{(rd.citizenPrompt || '').length > 16 ? '…' : ''}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    playClick();
                    setSelectedRoundIdx((prev) => Math.min(rounds.length - 1, prev + 1));
                  }}
                  disabled={selectedRoundIdx === rounds.length - 1}
                  className="w-8 h-8 rounded-lg bg-black/40 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="bg-black/40 rounded-2xl border border-white/10 p-3 overflow-hidden">
            <div className="w-full" style={{ minHeight: '180px' }}>
              <canvas
                ref={previewCanvasRef}
                className="w-full rounded-xl"
                style={{ display: 'block' }}
              />
            </div>
          </div>

          {/* Frame Style Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono uppercase tracking-wider text-white/50">
              Frame Style
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {frameStyles.map((fs) => (
                <button
                  key={fs.id}
                  onClick={() => {
                    playClick();
                    setFrameStyle(fs.id);
                  }}
                  className={`px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer border ${
                    frameStyle === fs.id
                      ? 'bg-amber-500/15 border-amber-400/40 text-amber-200 ring-1 ring-amber-400/30'
                      : 'bg-black/30 border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20'
                  }`}
                >
                  <span className="text-base">{FRAME_STYLE_ICONS[fs.id]}</span>
                  <span className="truncate">{fs.name.split(' ').slice(-1)[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2.5 transition cursor-pointer shadow-lg shadow-amber-500/20 active:scale-[0.97] disabled:opacity-60"
            >
              <Download className="w-4.5 h-4.5" />
              {downloading ? 'Saving…' : hasMultipleRounds ? `Download Round ${currentRoundData?.roundNumber}` : 'Download High-Res PNG'}
            </button>
            <button
              onClick={handleCopy}
              className="px-5 py-3 rounded-xl bg-black/40 hover:bg-white/10 text-white font-medium text-sm border border-white/15 backdrop-blur flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.97]"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Image
                </>
              )}
            </button>
          </div>

          {/* Download All button (only when multiple rounds) */}
          {hasMultipleRounds && (
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-white font-semibold text-xs border border-indigo-400/25 backdrop-blur flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.97] disabled:opacity-60"
            >
              <Layers className="w-3.5 h-3.5" />
              {downloadingAll ? 'Downloading…' : `Download All ${rounds.length} Masterpieces`}
            </button>
          )}

          {/* Info footer */}
          <p className="text-[10px] text-white/30 text-center font-mono pt-1">
            2000 × 1500px · Lossless PNG · Museum-Grade Export
          </p>
        </div>
      </div>
    </div>
  );
};
