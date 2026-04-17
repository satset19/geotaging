import type { WatermarkInput } from '@/types/photo';
import { composeOsmStaticMap } from '@/lib/openStreetMap';
import { canvasToBlob } from '@/lib/download';
import { formatCoordinate, formatTimestamp } from '@/lib/format';

/**
 * Meng-compose foto (canvas dari snapshot video) dengan watermark berisi:
 *   - Alamat lengkap (wrap beberapa baris bila perlu)
 *   - Koordinat latitude/longitude
 *   - Timestamp (lokal)
 *   - Mini map thumbnail (OpenStreetMap tile compositor) di pojok kanan bawah
 *
 * Strategi layout agar tidak keluar frame:
 *   1. Pre-measure semua baris teks dan mini-map di "dry run" sebelum menggambar.
 *   2. Hitung panelHeight dinamis berdasarkan tinggi konten aktual.
 *   3. Clamp panelHeight <= 45% tinggi foto agar foto utama tetap terlihat.
 *   4. Kalau konten tetap overflow clamp, kurangi address jadi 2-3 baris bertahap.
 *   5. Mini-map selalu fit di dalam panel (resize bila perlu).
 *   6. Semua drawing di-clip ke canvas out agar tidak keluar frame.
 *
 * Returns JPEG Blob siap di-download.
 */
export async function composeWatermark(
  source: HTMLCanvasElement,
  input: WatermarkInput
): Promise<Blob> {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('2D context not available');

  // 1. Gambar foto dasar.
  ctx.drawImage(source, 0, 0, out.width, out.height);

  const fontFamily =
    'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  // 2. Compute layout.
  // Gunakan dimensi terpendek sebagai acuan responsive: foto portrait vs landscape
  // menghasilkan ukuran font dan padding yang proporsional.
  const baseDim = Math.min(out.width, out.height);
  const padding = Math.max(14, Math.round(baseDim * 0.022));
  const baseFontSize = Math.max(16, Math.round(baseDim * 0.028));
  const labelFontSize = Math.max(10, Math.round(baseFontSize * 0.62));
  const lineGap = Math.round(baseFontSize * 0.25);
  const fieldGap = Math.round(baseFontSize * 0.45);
  const minPanelHeight = Math.round(baseDim * 0.28);
  const maxPanelHeight = Math.round(out.height * 0.45);

  // Target ukuran mini-map: ~25% lebar foto, tapi dibatasi juga oleh tinggi panel nanti.
  let miniMapSize = Math.min(
    Math.round(out.width * 0.25),
    Math.round(out.height * 0.28),
    420
  );
  miniMapSize = Math.max(140, miniMapSize);

  // Text area: kiri panel, lebar total - miniMap - padding 3x.
  const textAreaWidth = Math.max(
    120,
    out.width - miniMapSize - padding * 3
  );

  const addressText =
    input.address?.formatted && input.address.formatted.trim().length > 0
      ? input.address.formatted
      : '-';
  const coordText = formatCoordinate(
    input.position.latitude,
    input.position.longitude
  );
  const timeText = formatTimestamp(input.position.timestamp, input.locale);

  // Definisi field dengan ukuran font custom per field (timestamp sedikit lebih kecil).
  type FieldDef = {
    label: string;
    value: string;
    valueSize: number;
    maxLines: number;
  };

  const buildFields = (addressMaxLines: number): FieldDef[] => [
    { label: input.labels.address, value: addressText, valueSize: baseFontSize, maxLines: addressMaxLines },
    { label: input.labels.coordinates, value: coordText, valueSize: baseFontSize, maxLines: 1 },
    { label: input.labels.capturedAt, value: timeText, valueSize: Math.round(baseFontSize * 0.95), maxLines: 2 },
  ];

  // Coba wrapping dengan address 4 baris dulu, shrink bertahap bila panel butuh > max.
  let fields = buildFields(4);
  let layout = measureFields(ctx, fields, {
    textAreaWidth,
    labelFontSize,
    fontFamily,
    lineGap,
    fieldGap,
  });
  let panelHeight = layout.totalHeight + padding * 2;

  if (panelHeight > maxPanelHeight) {
    // Kurangi address max lines secara bertahap.
    for (const addressLines of [3, 2, 1]) {
      fields = buildFields(addressLines);
      layout = measureFields(ctx, fields, {
        textAreaWidth,
        labelFontSize,
        fontFamily,
        lineGap,
        fieldGap,
      });
      panelHeight = layout.totalHeight + padding * 2;
      if (panelHeight <= maxPanelHeight) break;
    }
  }

  // Final clamp.
  panelHeight = Math.min(maxPanelHeight, Math.max(minPanelHeight, panelHeight));
  const panelY = out.height - panelHeight;

  // Mini map di-resize agar fit di dalam panel (minus padding atas-bawah).
  miniMapSize = Math.min(miniMapSize, panelHeight - padding * 2);
  miniMapSize = Math.max(96, miniMapSize);

  // 3. Draw gradient panel.
  const gradient = ctx.createLinearGradient(0, panelY - 40, 0, out.height);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.55)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, panelY - 40, out.width, panelHeight + 40);

  // 4. Draw teks. Clip area teks agar tidak pernah keluar zona kiri panel,
  // termasuk jika wrap gagal mengukur (font fallback berbeda di browser).
  ctx.save();
  ctx.beginPath();
  ctx.rect(padding, panelY, textAreaWidth, panelHeight);
  ctx.clip();

  ctx.textBaseline = 'top';
  let cursorY = panelY + padding;

  for (const f of layout.fields) {
    // Label
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.font = `600 ${labelFontSize}px ${fontFamily}`;
    ctx.fillText(f.label.toUpperCase(), padding, cursorY);
    cursorY += labelFontSize + Math.round(labelFontSize * 0.3);

    // Value
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${f.valueSize}px ${fontFamily}`;
    for (const line of f.lines) {
      ctx.fillText(line, padding, cursorY);
      cursorY += f.valueSize + lineGap;
    }
    cursorY += fieldGap;
  }
  ctx.restore();

  // 5. Mini map thumbnail OSM.
  try {
    const mapX = out.width - miniMapSize - padding;
    const mapY = panelY + Math.round((panelHeight - miniMapSize) / 2);

    // Pastikan mini-map tidak keluar canvas.
    const clampedX = Math.max(padding, Math.min(mapX, out.width - miniMapSize - padding));
    const clampedY = Math.max(panelY + padding, Math.min(mapY, out.height - miniMapSize - padding));

    const mapCanvas = await composeOsmStaticMap({
      latitude: input.position.latitude,
      longitude: input.position.longitude,
      zoom: 16,
      size: Math.max(200, miniMapSize),
    });

    // Bingkai putih tipis.
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    roundedRect(ctx, clampedX - 2, clampedY - 2, miniMapSize + 4, miniMapSize + 4, 8);
    ctx.stroke();

    // Clip rounded untuk image.
    ctx.save();
    roundedRect(ctx, clampedX, clampedY, miniMapSize, miniMapSize, 6);
    ctx.clip();
    ctx.drawImage(mapCanvas, clampedX, clampedY, miniMapSize, miniMapSize);
    ctx.restore();
  } catch (e) {
    // Bila gagal (offline atau tile server down), lanjutkan tanpa thumbnail.
    console.warn('[watermark] OSM mini map failed:', e);
  }

  // 6. Output ke JPEG Blob.
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
    // Ukur text dengan font yang tepat (harus set font sebelum measureText).
    ctx.font = `600 ${f.valueSize}px ${opts.fontFamily}`;
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

  // Kurangi fieldGap terakhir karena tidak ada field setelahnya.
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

  for (const word of words) {
    // Jika satu kata saja melebihi maxWidth, paksa truncate di tengah kata.
    if (ctx.measureText(word).width > maxWidth) {
      if (current) {
        lines.push(current);
        current = '';
        if (lines.length >= maxLines) break;
      }
      lines.push(truncateToWidth(ctx, word, maxWidth));
      if (lines.length >= maxLines) break;
      continue;
    }
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);

  // Jika kita stop karena maxLines dan masih ada sisa kata, tambahkan ellipsis di baris terakhir.
  if (lines.length === maxLines && (words.length > 0)) {
    const joined = lines.join(' ');
    const remaining = text.slice(joined.length).trim();
    if (remaining.length > 0) {
      const lastIdx = lines.length - 1;
      lines[lastIdx] = truncateToWidthWithEllipsis(ctx, lines[lastIdx], maxWidth);
    }
  }
  return lines;
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  // Potong karakter dari belakang sampai muat + beri ellipsis.
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

function truncateToWidthWithEllipsis(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
  // Append "…" ke line yang sudah muat; kalau overflow setelah append, truncate juga.
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
