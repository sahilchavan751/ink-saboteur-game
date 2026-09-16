/**
 * frameExporter.js — Museum-Grade Frame Canvas Renderer
 *
 * Generates a high-resolution (2000×1500) framed masterpiece
 * with vintage frame, matte board, engraved plaque, and artist signatures.
 */

// ─── Frame Style Palettes ────────────────────────────────────────────────────
const FRAME_STYLES = {
  gold: {
    name: 'Gilded Baroque Gold',
    outerBorder: '#2a1a08',
    frameGradient: ['#d4a843', '#f5d98a', '#c09430', '#f5d98a', '#a07828', '#d4a843'],
    innerFillet: '#c8a84e',
    matteColor: '#f7f4ec',
    matteShadow: 'rgba(60,40,10,0.25)',
    plaqueGradient: ['#c8a84e', '#e8cf7e', '#b89438', '#e8cf7e'],
    plaqueText: '#3a2a10',
    plaqueBorder: '#a07828',
    sealColor: '#8b2020',
    cornerAccent: '#f5d98a',
  },
  mahogany: {
    name: 'Antique Mahogany',
    outerBorder: '#1a0a04',
    frameGradient: ['#4a1e0a', '#7a3518', '#5a2510', '#8a4020', '#4a1e0a', '#6a2e14'],
    innerFillet: '#c8a84e',
    matteColor: '#f5f0e6',
    matteShadow: 'rgba(40,15,5,0.3)',
    plaqueGradient: ['#c8a84e', '#e8cf7e', '#b89438', '#e8cf7e'],
    plaqueText: '#3a2a10',
    plaqueBorder: '#8a6020',
    sealColor: '#6a1818',
    cornerAccent: '#c8a84e',
  },
  gallery: {
    name: 'Contemporary Gallery',
    outerBorder: '#0a0a0a',
    frameGradient: ['#1a1a1a', '#2a2a2a', '#1e1e1e', '#303030', '#1a1a1a', '#252525'],
    innerFillet: '#888888',
    matteColor: '#fafafa',
    matteShadow: 'rgba(0,0,0,0.15)',
    plaqueGradient: ['#e0e0e0', '#f4f4f4', '#d0d0d0', '#f0f0f0'],
    plaqueText: '#222222',
    plaqueBorder: '#aaaaaa',
    sealColor: '#444444',
    cornerAccent: '#555555',
  },
  noir: {
    name: 'Midnight Noir',
    outerBorder: '#000000',
    frameGradient: ['#0e0e14', '#1a1a24', '#12121c', '#22222e', '#0e0e14', '#181822'],
    innerFillet: '#c8a84e',
    matteColor: '#1a1a22',
    matteShadow: 'rgba(0,0,0,0.5)',
    plaqueGradient: ['#c8a84e', '#e8cf7e', '#b89438', '#e8cf7e'],
    plaqueText: '#1a1008',
    plaqueBorder: '#a07828',
    sealColor: '#8b2020',
    cornerAccent: '#c8a84e',
  },
};

// ─── Dimensions ──────────────────────────────────────────────────────────────
const CANVAS_W = 2000;
const CANVAS_H = 1500;
const FRAME_THICKNESS = 70;
const MATTE_PADDING = 55;
const ARTWORK_X = FRAME_THICKNESS + MATTE_PADDING;
const ARTWORK_Y = FRAME_THICKNESS + MATTE_PADDING;
const ARTWORK_W = CANVAS_W - 2 * ARTWORK_X;
const ARTWORK_H = CANVAS_H - 2 * (FRAME_THICKNESS + MATTE_PADDING) - 120; // leave room for plaque + sigs

// ─── Helpers ─────────────────────────────────────────────────────────────────
function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawFrameBevel(ctx, x, y, w, h, thickness, colors) {
  // Outer frame edge
  ctx.fillStyle = colors.outerBorder;
  ctx.fillRect(x, y, w, h);

  // Multi-layer frame gradient for depth
  const layers = 5;
  for (let i = 0; i < layers; i++) {
    const t = (i / layers) * thickness;
    const ix = x + t;
    const iy = y + t;
    const iw = w - 2 * t;
    const ih = h - 2 * t;

    const gradIdx = Math.min(i, colors.frameGradient.length - 1);
    ctx.fillStyle = colors.frameGradient[gradIdx];
    ctx.fillRect(ix, iy, iw, ih);

    // Subtle top highlight for each layer
    ctx.fillStyle = `rgba(255,255,255,${0.08 - i * 0.012})`;
    ctx.fillRect(ix, iy, iw, Math.max(2, 4 - i));

    // Bottom shadow
    ctx.fillStyle = `rgba(0,0,0,${0.1 - i * 0.015})`;
    ctx.fillRect(ix, iy + ih - Math.max(2, 4 - i), iw, Math.max(2, 4 - i));
  }

  // Inner fillet line (thin gold/accent border)
  const inset = thickness - 4;
  ctx.strokeStyle = colors.innerFillet;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x + inset, y + inset, w - 2 * inset, h - 2 * inset);
}

function drawMatte(ctx, style) {
  const mx = FRAME_THICKNESS;
  const my = FRAME_THICKNESS;
  const mw = CANVAS_W - 2 * FRAME_THICKNESS;
  const mh = CANVAS_H - 2 * FRAME_THICKNESS;

  // Matte fill
  ctx.fillStyle = style.matteColor;
  ctx.fillRect(mx, my, mw, mh);

  // Subtle texture grain on matte
  for (let i = 0; i < 4000; i++) {
    const gx = mx + Math.random() * mw;
    const gy = my + Math.random() * mh;
    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.03})`;
    ctx.fillRect(gx, gy, 1, 1);
  }

  // Beveled window aperture shadow (inner drop shadow onto artwork area)
  const bevel = 6;
  // Top shadow
  const topGrad = ctx.createLinearGradient(ARTWORK_X, ARTWORK_Y - bevel, ARTWORK_X, ARTWORK_Y + 12);
  topGrad.addColorStop(0, style.matteShadow);
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(ARTWORK_X - bevel, ARTWORK_Y - bevel, ARTWORK_W + 2 * bevel, 18);

  // Left shadow
  const leftGrad = ctx.createLinearGradient(ARTWORK_X - bevel, ARTWORK_Y, ARTWORK_X + 12, ARTWORK_Y);
  leftGrad.addColorStop(0, style.matteShadow);
  leftGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(ARTWORK_X - bevel, ARTWORK_Y, 18, ARTWORK_H);

  // Beveled cut border
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 2;
  ctx.strokeRect(ARTWORK_X - 1, ARTWORK_Y - 1, ARTWORK_W + 2, ARTWORK_H + 2);
}

function drawArtwork(ctx, strokes) {
  // White background for the artwork area
  ctx.save();
  ctx.beginPath();
  ctx.rect(ARTWORK_X, ARTWORK_Y, ARTWORK_W, ARTWORK_H);
  ctx.clip();

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(ARTWORK_X, ARTWORK_Y, ARTWORK_W, ARTWORK_H);

  // Render each stroke — strokes use normalized [0,1] coordinates
  strokes.forEach((stroke) => {
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.color || '#18181b';
    ctx.lineWidth = (stroke.width || 5) * (ARTWORK_W / 800);
    ctx.moveTo(ARTWORK_X + stroke.startX * ARTWORK_W, ARTWORK_Y + stroke.startY * ARTWORK_H);
    ctx.lineTo(ARTWORK_X + stroke.endX * ARTWORK_W, ARTWORK_Y + stroke.endY * ARTWORK_H);
    ctx.stroke();
  });

  ctx.restore();
}

function drawPlaque(ctx, style, { title, date, roomCode }) {
  const plaqueW = 520;
  const plaqueH = 68;
  const plaqueX = (CANVAS_W - plaqueW) / 2;
  const plaqueY = ARTWORK_Y + ARTWORK_H + 22;

  // Brushed brass background
  const brasGrad = ctx.createLinearGradient(plaqueX, plaqueY, plaqueX, plaqueY + plaqueH);
  const gc = style.plaqueGradient;
  brasGrad.addColorStop(0, gc[0]);
  brasGrad.addColorStop(0.35, gc[1]);
  brasGrad.addColorStop(0.65, gc[2]);
  brasGrad.addColorStop(1, gc[3]);

  drawRoundedRect(ctx, plaqueX, plaqueY, plaqueW, plaqueH, 6);
  ctx.fillStyle = brasGrad;
  ctx.fill();

  // Embossed border
  ctx.strokeStyle = style.plaqueBorder;
  ctx.lineWidth = 2;
  drawRoundedRect(ctx, plaqueX + 4, plaqueY + 4, plaqueW - 8, plaqueH - 8, 4);
  ctx.stroke();

  // Horizontal hairlines for engraved look
  ctx.strokeStyle = `rgba(0,0,0,0.06)`;
  ctx.lineWidth = 0.5;
  for (let ly = plaqueY + 8; ly < plaqueY + plaqueH - 8; ly += 2) {
    ctx.beginPath();
    ctx.moveTo(plaqueX + 8, ly);
    ctx.lineTo(plaqueX + plaqueW - 8, ly);
    ctx.stroke();
  }

  // Corner brass screw rivets
  const screwR = 5;
  const screwInset = 14;
  const screwPositions = [
    [plaqueX + screwInset, plaqueY + screwInset],
    [plaqueX + plaqueW - screwInset, plaqueY + screwInset],
    [plaqueX + screwInset, plaqueY + plaqueH - screwInset],
    [plaqueX + plaqueW - screwInset, plaqueY + plaqueH - screwInset],
  ];
  screwPositions.forEach(([sx, sy]) => {
    const sg = ctx.createRadialGradient(sx - 1, sy - 1, 0, sx, sy, screwR);
    sg.addColorStop(0, '#f5e8b0');
    sg.addColorStop(0.6, '#c8a84e');
    sg.addColorStop(1, '#8a6820');
    ctx.beginPath();
    ctx.arc(sx, sy, screwR, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();

    // Phillips cross
    ctx.strokeStyle = 'rgba(60,40,10,0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy);
    ctx.lineTo(sx + 3, sy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sx, sy - 3);
    ctx.lineTo(sx, sy + 3);
    ctx.stroke();
  });

  // Title text (prompt)
  ctx.fillStyle = style.plaqueText;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 20px "Cinzel", "Playfair Display", "Georgia", serif';
  const displayTitle = (title || 'Untitled').toUpperCase();
  // Truncate if too long
  const maxTitleW = plaqueW - 80;
  let finalTitle = displayTitle;
  if (ctx.measureText(finalTitle).width > maxTitleW) {
    while (ctx.measureText(finalTitle + '…').width > maxTitleW && finalTitle.length > 0) {
      finalTitle = finalTitle.slice(0, -1);
    }
    finalTitle += '…';
  }
  ctx.fillText(finalTitle, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 - 10);

  // Subtitle line
  ctx.font = '400 12px "Cinzel", "Playfair Display", "Georgia", serif';
  ctx.fillStyle = style.plaqueText;
  ctx.globalAlpha = 0.7;
  const subtitleText = `${date}  ·  Room ${roomCode}  ·  InkSpy`;
  ctx.fillText(subtitleText, plaqueX + plaqueW / 2, plaqueY + plaqueH / 2 + 12);
  ctx.globalAlpha = 1;
}

function drawSignatures(ctx, style, players) {
  if (!players || players.length === 0) return;

  const sigY = ARTWORK_Y + ARTWORK_H + 100;
  const totalWidth = CANVAS_W - 2 * (FRAME_THICKNESS + 40);
  const startX = FRAME_THICKNESS + 40;
  const spacing = totalWidth / Math.max(1, players.length);

  // "Artists" label
  ctx.font = '400 11px "Cinzel", "Playfair Display", serif';
  ctx.fillStyle = style.plaqueText || '#3a2a10';
  ctx.globalAlpha = 0.4;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('A R T I S T S', CANVAS_W / 2, sigY - 18);
  ctx.globalAlpha = 1;

  // Thin decorative line
  ctx.strokeStyle = style.innerFillet || '#c8a84e';
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX + 60, sigY - 6);
  ctx.lineTo(startX + totalWidth - 60, sigY - 6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  players.forEach((player, i) => {
    const cx = startX + spacing * i + spacing / 2;
    const sigColor = player.color || '#18181b';

    // Flowing signature in player color
    ctx.font = `600 ${Math.max(18, Math.min(26, 200 / players.length))}px "Dancing Script", "Caveat", cursive`;
    ctx.fillStyle = sigColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Slight rotation for authentic handwriting feel
    ctx.save();
    ctx.translate(cx, sigY + 4);
    ctx.rotate((Math.random() - 0.5) * 0.06);
    ctx.fillText(player.name, 0, 0);
    ctx.restore();

    // Underline flourish
    const nameW = ctx.measureText(player.name).width;
    ctx.strokeStyle = sigColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - nameW / 2 - 4, sigY + 30);
    ctx.quadraticCurveTo(cx, sigY + 34, cx + nameW / 2 + 4, sigY + 28);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawWaxSeal(ctx, style) {
  const sealX = CANVAS_W - FRAME_THICKNESS - MATTE_PADDING - 45;
  const sealY = ARTWORK_Y + ARTWORK_H + 68;
  const sealR = 22;

  // Wax seal circle
  ctx.beginPath();
  ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
  const sealGrad = ctx.createRadialGradient(sealX - 4, sealY - 4, 0, sealX, sealY, sealR);
  sealGrad.addColorStop(0, lightenColor(style.sealColor, 40));
  sealGrad.addColorStop(0.7, style.sealColor);
  sealGrad.addColorStop(1, darkenColor(style.sealColor, 30));
  ctx.fillStyle = sealGrad;
  ctx.fill();

  // Seal edge
  ctx.strokeStyle = darkenColor(style.sealColor, 50);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Wax drip bumps
  for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
    const bx = sealX + Math.cos(a) * (sealR + 2);
    const by = sealY + Math.sin(a) * (sealR + 2);
    ctx.beginPath();
    ctx.arc(bx, by, 3 + Math.random() * 2, 0, Math.PI * 2);
    ctx.fillStyle = style.sealColor;
    ctx.fill();
  }

  // "IS" monogram
  ctx.font = '700 18px "Cinzel", serif';
  ctx.fillStyle = darkenColor(style.sealColor, 60);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('IS', sealX, sealY + 1);

  // Highlight
  ctx.beginPath();
  ctx.arc(sealX - 6, sealY - 8, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fill();
}

function lightenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function darkenColor(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `rgb(${r},${g},${b})`;
}

// ─── Corner ornament decorations for baroque style ───────────────────────────
function drawCornerOrnaments(ctx, style) {
  const accent = style.cornerAccent;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 1.5;

  const corners = [
    { x: FRAME_THICKNESS + 14, y: FRAME_THICKNESS + 14, sx: 1, sy: 1 },
    { x: CANVAS_W - FRAME_THICKNESS - 14, y: FRAME_THICKNESS + 14, sx: -1, sy: 1 },
    { x: FRAME_THICKNESS + 14, y: CANVAS_H - FRAME_THICKNESS - 14, sx: 1, sy: -1 },
    { x: CANVAS_W - FRAME_THICKNESS - 14, y: CANVAS_H - FRAME_THICKNESS - 14, sx: -1, sy: -1 },
  ];

  corners.forEach(({ x, y, sx, sy }) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);

    // L-shaped corner bracket
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(0, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // Small diamond
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(8, 2);
    ctx.lineTo(11, 5);
    ctx.lineTo(8, 8);
    ctx.closePath();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.25;
    ctx.fill();
    ctx.globalAlpha = 0.4;

    ctx.restore();
  });

  ctx.globalAlpha = 1;
}

// ─── Public API ──────────────────────────────────────────────────────────────
export function getFrameStyles() {
  return Object.entries(FRAME_STYLES).map(([key, val]) => ({
    id: key,
    name: val.name,
  }));
}

export function renderFramedMasterpiece({
  strokes = [],
  players = [],
  title = 'Untitled',
  roomCode = '????',
  date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  frameStyle = 'gold',
}) {
  const style = FRAME_STYLES[frameStyle] || FRAME_STYLES.gold;

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');

  // 1. Frame
  drawFrameBevel(ctx, 0, 0, CANVAS_W, CANVAS_H, FRAME_THICKNESS, style);

  // 2. Matte board
  drawMatte(ctx, style);

  // 3. Artwork (strokes)
  drawArtwork(ctx, strokes);

  // 4. Corner ornaments
  drawCornerOrnaments(ctx, style);

  // 5. Engraved plaque
  drawPlaque(ctx, style, { title, date, roomCode });

  // 6. Artist signatures
  drawSignatures(ctx, style, players);

  // 7. Wax seal
  drawWaxSeal(ctx, style);

  return canvas;
}

export function downloadFramedMasterpiece(options) {
  const canvas = renderFramedMasterpiece(options);
  const link = document.createElement('a');
  const safeName = (options.title || 'Masterpiece').replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_');
  const roundTag = options.roundNumber ? `Round_${options.roundNumber}_` : '';
  link.download = `InkSpy_Masterpiece_${roundTag}${safeName}_${options.roomCode || 'Room'}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function copyFramedMasterpieceToClipboard(options) {
  const canvas = renderFramedMasterpiece(options);
  try {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (blob && navigator.clipboard && ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      return { success: true };
    }
    throw new Error('Clipboard API not supported');
  } catch (err) {
    // Fallback: open in new tab
    const dataUrl = canvas.toDataURL('image/png');
    window.open(dataUrl, '_blank');
    return { success: false, fallback: true };
  }
}
