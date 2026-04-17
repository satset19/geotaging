import type { WatermarkInput } from '@/types/photo';
import { composeOsmStaticMap } from '@/lib/openStreetMap';
import { canvasToBlob } from '@/lib/download';
import { formatCoordinate, formatTimestamp } from '@/lib/format';

/**
 * Watermark overlay semi-transparan (bg alpha 10%) dengan tinggi panel TETAP 1/5
 * (20%) dari tinggi foto. Konten auto-fit ke dalam panel:
 *   1. Panel height = height * 0.20, fix.
 *   2. Mini-map di-resize agar muat dalam panel.
 *   3. Iterasi shrink: kurangi baris alamat (4→3→2), lalu scale font, sampai konten
 *      muat di contentAvailHeight.
 *   4. Teks putih dengan outline stroke + shadow agar tetap terbaca di bg transparan.
 *
 * Returns JPEG Blob siap di-download.
 */
export async function composeWatermark(
  source: HTMLCanvasElement,
  input: WatermarkInput
): Promise<Blob> {
  const width = source.width;
  const height = source.height;

  const fontFamily =
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const baseDim = Math.min(width, height);
  const padding = Math.max(14, Math.round(baseDim * 0.022));
  const baseFontSizeRef = Math.max(18, Math.round(baseDim * 0.028));

  // Panel tinggi FIX = 1/5 foto (20%).
  const panelHeight = Math.round(height * 0.2);
  const contentAvailHeight = panelHeight - padding * 2;

  // Mini-map: 25% lebar foto, tapi di-cap oleh tinggi panel.
  let miniMapSize = Math.min(Math.round(width * 0.25), 420);
  miniMapSize = Math.min(miniMapSize, panelHeight - padding * 2);
  miniMapSize = Math.max(96, miniMapSize);

  const textAreaWidth = Math.max(120, width - miniMapSize - padding * 3);

  const addressText =
    input.address?.formatted && input.address.formatted.trim().length > 0
      ? input.address.formatted
      : '-';
  const coordText = formatCoordinate(
    input.position.latitude,
    input.position.longitude
  );
  const timeText = formatTimestamp(input.position.timestamp, input.locale);

  type FieldDef = {
    label: string;
    value: string;
    valueSize: number;
    maxLines: number;
  };

  const buildFields = (addressMaxLines: number, fSize: number): FieldDef[] => [
    {
      label: input.labels.address,
      value: addressText,
      valueSize: fSize,
      maxLines: addressMaxLines,
    },
    {
      label: input.labels.coordinates,
      value: coordText,
      valueSize: fSize,
      maxLines: 1,
    },
    {
      label: input.labels.capturedAt,
      value: timeText,
      valueSize: Math.round(fSize * 0.95),
      maxLines: 2,
    },
  ];

  const measureCanvas = document.createElement('canvas');
  measureCanvas.width = 10;
  measureCanvas.height = 10;
  const measureCtx = measureCanvas.getContext('2d');
  if (!measureCtx) throw new Error('2D context not available');

  // Auto-fit iteration: mulai dari font penuh + 4 baris alamat.
  // Kurangi address lines dulu (4→3→2), lalu scale font, sampai muat.
  let addressMaxLines = 4;
  let fontScale = 1.0;
  let fontSize = baseFontSizeRef;
  let labelFontSize = Math.max(10, Math.round(fontSize * 0.62));
  let lineGap = Math.max(2, Math.round(fontSize * 0.25));
  let fieldGap = Math.max(4, Math.round(fontSize * 0.45));
  let fields = buildFields(addressMaxLines, fontSize);
  let layout = measureFields(measureCtx, fields, {
    textAreaWidth,
    labelFontSize,
    fontFamily,
    lineGap,
    fieldGap,
  });

  const MIN_FONT = 10;
  for (let i = 0; i < 20 && layout.totalHeight > contentAvailHeight; i++) {
    if (addressMaxLines > 2) {
      addressMaxLines--;
    } else if (fontScale * baseFontSizeRef > MIN_FONT) {
      fontScale *= 0.9;
    } else {
      // Sudah minimum, paksa address 1 baris sebagai last resort.
      addressMaxLines = 1;
      break;
    }

    fontSize = Math.max(MIN_FONT, Math.round(baseFontSizeRef * fontScale));
    labelFontSize = Math.max(8, Math.round(fontSize * 0.62));
    lineGap = Math.max(2, Math.round(fontSize * 0.25));
    fieldGap = Math.max(3, Math.round(fontSize * 0.45));

    fields = buildFields(addressMaxLines, fontSize);
    layout = measureFields(measureCtx, fields, {
      textAreaWidth,
      labelFontSize,
      fontFamily,
      lineGap,
      fieldGap,
    });
  }

  // Panel di bagian bawah foto. Letakkan panel tepat menempel di bawah.
  const panelY = height - panelHeight;

  // 1. Output canvas = ukuran foto asli (overlay, bukan letterbox).
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  // 2. Gambar foto asli full.
  ctx.drawImage(source, 0, 0, width, height);

  // 3. Panel overlay transparan 10%.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
  ctx.fillRect(0, panelY, width, panelHeight);

  // Garis aksen tipis di atas panel.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(0, panelY, width, 1);

  // 4. Mini map thumbnail.
  try {
    const mapX = width - miniMapSize - padding;
    const mapY = panelY + Math.round((panelHeight - miniMapSize) / 2);

    const mapCanvas = await composeOsmStaticMap({
      latitude: input.position.latitude,
      longitude: input.position.longitude,
      zoom: 16,
      size: Math.max(200, miniMapSize),
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2;
    roundedRect(ctx, mapX - 1, mapY - 1, miniMapSize + 2, miniMapSize + 2, 8);
    ctx.stroke();

    ctx.save();
    roundedRect(ctx, mapX, mapY, miniMapSize, miniMapSize, 6);
    ctx.clip();
    ctx.drawImage(mapCanvas, mapX, mapY, miniMapSize, miniMapSize);
    ctx.restore();
  } catch (e) {
    console.warn('[watermark] OSM mini map failed:', e);
  }

  // 5. Draw teks dengan outline + shadow.
  ctx.save();
  ctx.beginPath();
  ctx.rect(padding, panelY, textAreaWidth, panelHeight);
  ctx.clip();
  ctx.textBaseline = 'top';
  let cursorY = panelY + padding;

  const applyStroke = (size: number) => {
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.lineWidth = Math.max(2, Math.round(size * 0.18));
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
  };

  for (const f of layout.fields) {
    // Label
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    ctx.font = `700 ${labelFontSize}px ${fontFamily}`;
    const labelUpper = f.label.toUpperCase();
    applyStroke(labelFontSize);
    ctx.shadowBlur = 2;
    ctx.strokeText(labelUpper, padding, cursorY);
    ctx.shadowBlur = 4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText(labelUpper, padding, cursorY);
    cursorY += labelFontSize + Math.round(labelFontSize * 0.3);

    // Value
    ctx.font = `700 ${f.valueSize}px ${fontFamily}`;
    for (const line of f.lines) {
      applyStroke(f.valueSize);
      ctx.shadowBlur = 3;
      ctx.strokeText(line, padding, cursorY);
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(line, padding, cursorY);
      cursorY += f.valueSize + lineGap;
    }
    cursorY += fieldGap;
  }
  ctx.restore();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // 6. Output JPEG Blob.
  return canvasToBlob(out, 'image/jpeg', 0.92);
}

// ---------- Layout helpers ----------

interface MeasureOpts {
  textAreaWidth: number;
  labelFontSize: number;
  fontFamily: string;
  lineGap: number;
  fieldGap: number;
}

interface MeasuredField {
  label: string;
  lines: string[];
  valueSize: number;
  blockHeight: number;
}

interface MeasuredLayout {
  fields: MeasuredField[];
  totalHeight: number;
}

function measureFields(
  ctx: CanvasRenderingContext2D,
  fields: { label: string; value: string; valueSize: number; maxLines: number }[],
  opts: MeasureOpts
): MeasuredLayout {
  const measured: MeasuredField[] = [];
  let totalHeight = 0;

  for (const f of fields) {
    ctx.font = `700 ${f.valueSize}px ${opts.fontFamily}`;
    const lines = wrapText(ctx, f.value, opts.textAreaWidth, f.maxLines);

    const labelHeight = opts.labelFontSize + Math.round(opts.labelFontSize * 0.3);
    const valueHeight = lines.length * (f.valueSize + opts.lineGap);
    const blockHeight = labelHeight + valueHeight + opts.fieldGap;

    measured.push({
      label: f.label,
      lines,
      valueSize: f.valueSize,
      blockHeight,
    });
    totalHeight += blockHeight;
  }

  if (measured.length > 0) totalHeight -= opts.fieldGap;
  return { fields: measured, totalHeight };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current) {
      lines.push(current);
      current = '';
    }
  };

  for (const word of words) {
    if (lines.length >= maxLines) break;
    if (ctx.measureText(word).width > maxWidth) {
      pushCurrent();
      if (lines.length >= maxLines) break;
      lines.push(truncateToWidth(ctx, word, maxWidth));
      continue;
    }
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      pushCurrent();
      if (lines.length >= maxLines) break;
      current = word;
    }
  }
  if (lines.length < maxLines) pushCurrent();

  const producedAll =
    lines.join(' ').split(/\s+/).filter(Boolean).length === words.length;
  if (!producedAll && lines.length > 0) {
    const lastIdx = lines.length - 1;
    lines[lastIdx] = appendEllipsisFit(ctx, lines[lastIdx], maxWidth);
  }

  return lines;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  const ellipsis = '…';
  if (ctx.measureText(text).width <= maxWidth) return text;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const candidate = text.slice(0, mid) + ellipsis;
    if (ctx.measureText(candidate).width <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  return lo > 0 ? text.slice(0, lo) + ellipsis : ellipsis;
}

function appendEllipsisFit(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
  const withDots = `${line}…`;
  if (ctx.measureText(withDots).width <= maxWidth) return withDots;
  return truncateToWidth(ctx, line, maxWidth);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
