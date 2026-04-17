import { loadCorsImage } from '@/lib/download';
import type { GeoAddress } from '@/types/geo';

// OpenStreetMap standard tile server.
// Usage policy: https://operations.osmfoundation.org/policies/tiles/
// Max zoom 19, user-agent wajib (browser otomatis set), traffic tinggi tidak diperbolehkan.
// Untuk produksi skala besar, pertimbangkan self-host atau pakai provider seperti MapTiler.
export const OSM_TILE_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
export const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
export const OSM_MAX_ZOOM = 19;

// Nominatim reverse geocoding.
// Usage policy: https://operations.osmfoundation.org/policies/nominatim/
// Max 1 req/sec per IP, wajib User-Agent / Referer (browser otomatis set Referer).
// Untuk produksi skala besar, self-host Nominatim atau gunakan Photon/Geoapify.
const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org/reverse';

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  municipality?: string;
  county?: string;
  state_district?: string;
  state?: string;
  region?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
  error?: string;
}

/**
 * Reverse geocode lat/lng ke GeoAddress via Nominatim.
 * - Bahasa hasil diatur lewat Accept-Language header.
 * - AbortController untuk mendukung pembatalan saat debounced call baru masuk.
 */
export async function reverseGeocodeNominatim(
  latitude: number,
  longitude: number,
  options: { language?: string; signal?: AbortSignal } = {}
): Promise<GeoAddress | null> {
  const { language = 'id', signal } = options;
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: latitude.toFixed(6),
    lon: longitude.toFixed(6),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`${NOMINATIM_ENDPOINT}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Accept-Language': language,
      Accept: 'application/json',
    },
    signal,
  });
  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }
  const data: NominatimResponse = await response.json();
  if (data.error) return null;
  const a = data.address ?? {};
  return {
    formatted: data.display_name,
    street: a.road ?? a.pedestrian ?? a.footway,
    locality:
      a.village ??
      a.town ??
      a.city ??
      a.city_district ??
      a.municipality ??
      a.suburb,
    region: a.state ?? a.state_district ?? a.region,
    country: a.country,
    postalCode: a.postcode,
  };
}

// ---------- OSM Static Map compositor (tanpa API key, langsung dari tile server) ----------

export interface OsmStaticMapOptions {
  latitude: number;
  longitude: number;
  zoom?: number; // default 16, clamp ke OSM_MAX_ZOOM
  size?: number; // output ukuran square (px), default 300
  markerColor?: string; // fill CSS color, default "#ef4444"
}

function lon2tileX(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * 2 ** zoom;
}
function lat2tileY(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2 * 2 ** zoom;
}

/**
 * Compose thumbnail static map dari 3x3 grid tile OSM di sekitar koordinat.
 * Returns HTMLCanvasElement siap di-drawImage ke canvas watermark.
 *
 * Strategi:
 *  1. Hitung fractional tile coord untuk titik pusat.
 *  2. Fetch 3x3 tiles (256px each) di sekitar center.
 *  3. Draw tiles ke canvas dengan offset supaya titik pusat tepat di tengah.
 *  4. Gambar marker bulat di tengah.
 *  5. Gambar caption attribution kecil di pojok bawah (kewajiban OSM).
 *
 * Note CORS: tile.openstreetmap.org mengirim header Access-Control-Allow-Origin: *,
 * jadi `crossOrigin="anonymous"` aman → canvas tidak tainted → toBlob() sukses.
 */
export async function composeOsmStaticMap(
  options: OsmStaticMapOptions
): Promise<HTMLCanvasElement> {
  const {
    latitude,
    longitude,
    zoom = 16,
    size = 300,
    markerColor = '#ef4444',
  } = options;

  const z = Math.max(0, Math.min(OSM_MAX_ZOOM, Math.floor(zoom)));
  const TILE = 256;
  const GRID = 3; // 3x3 tiles = cukup untuk thumbnail size hingga ~768px dengan margin
  const HALF = Math.floor(GRID / 2);

  const cx = lon2tileX(longitude, z);
  const cy = lat2tileY(latitude, z);
  const tx = Math.floor(cx);
  const ty = Math.floor(cy);
  const fracX = cx - tx;
  const fracY = cy - ty;

  // Canvas yang cukup untuk seluruh grid tile yang di-draw, lalu di-crop ke size final.
  const gridCanvasSize = GRID * TILE;
  const grid = document.createElement('canvas');
  grid.width = gridCanvasSize;
  grid.height = gridCanvasSize;
  const gctx = grid.getContext('2d');
  if (!gctx) throw new Error('2D context not available for OSM grid');
  gctx.fillStyle = '#e5e7eb';
  gctx.fillRect(0, 0, gridCanvasSize, gridCanvasSize);

  const tasks: Promise<void>[] = [];
  for (let dy = -HALF; dy <= HALF; dy++) {
    for (let dx = -HALF; dx <= HALF; dx++) {
      const tileX = tx + dx;
      const tileY = ty + dy;
      const maxIndex = 2 ** z;
      if (tileY < 0 || tileY >= maxIndex) continue; // out of range latitude
      const wrappedX = ((tileX % maxIndex) + maxIndex) % maxIndex;
      const url = OSM_TILE_TEMPLATE.replace('{z}', String(z))
        .replace('{x}', String(wrappedX))
        .replace('{y}', String(tileY));
      const drawX = (dx + HALF) * TILE;
      const drawY = (dy + HALF) * TILE;
      tasks.push(
        loadCorsImage(url).then((img) => {
          gctx.drawImage(img, drawX, drawY, TILE, TILE);
        })
      );
    }
  }
  await Promise.all(tasks);

  // Crop ke area yang tepat di tengah pada fractional position.
  const centerX = HALF * TILE + fracX * TILE;
  const centerY = HALF * TILE + fracY * TILE;

  const out = document.createElement('canvas');
  out.width = size;
  out.height = size;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('2D context not available for OSM output');

  const srcX = Math.max(0, Math.round(centerX - size / 2));
  const srcY = Math.max(0, Math.round(centerY - size / 2));
  ctx.drawImage(grid, srcX, srcY, size, size, 0, 0, size, size);

  // Gambar marker lingkaran di tengah.
  const r = Math.max(6, Math.round(size * 0.04));
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r + 2, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  ctx.fillStyle = markerColor;
  ctx.fill();

  // Caption attribution kecil (kewajiban OSM untuk menampilkan credit).
  const attrText = 'Map data OpenStreetMap';
  const fontSize = Math.max(9, Math.round(size * 0.035));
  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`;
  const paddingX = 4;
  const paddingY = 3;
  const textWidth = ctx.measureText(attrText).width;
  const boxH = fontSize + paddingY * 2;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillRect(
    size - textWidth - paddingX * 2 - 4,
    size - boxH - 4,
    textWidth + paddingX * 2,
    boxH
  );
  ctx.fillStyle = '#111827';
  ctx.fillText(
    attrText,
    size - textWidth - paddingX - 4,
    size - paddingY - 4 - 2
  );

  return out;
}
