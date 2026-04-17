import { format as formatDate } from 'date-fns';
import { id as localeId } from 'date-fns/locale/id';
import { enUS as localeEn } from 'date-fns/locale/en-US';

// Format koordinat latitude/longitude ke string 6 desimal (akurasi ~11 cm).
export function formatCoordinate(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

// Format timestamp ke waktu lokal.
// - Indonesia: "17 April 2026, 11:50 WIB" (approx dengan getTimezoneAbbr).
// - English: "Apr 17, 2026 11:50 AM".
export function formatTimestamp(
  timestamp: number,
  locale: 'id' | 'en' = 'id'
): string {
  const date = new Date(timestamp);
  if (locale === 'id') {
    const dt = formatDate(date, 'dd MMMM yyyy, HH:mm', { locale: localeId });
    return `${dt} ${getTimezoneAbbr(date)}`;
  }
  return formatDate(date, 'MMM d, yyyy h:mm a', { locale: localeEn });
}

// Abbreviasi timezone sederhana (WIB/WITA/WIT untuk Indonesia berdasarkan offset).
// Fallback: ambil abbrev lewat Intl.DateTimeFormat timeZoneName short.
function getTimezoneAbbr(date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZoneName: 'short',
    }).formatToParts(date);
    const tzName = parts.find((p) => p.type === 'timeZoneName')?.value;
    if (tzName && tzName.length <= 6) return tzName;
  } catch {
    // ignore
  }
  const offset = -date.getTimezoneOffset() / 60;
  if (offset === 7) return 'WIB';
  if (offset === 8) return 'WITA';
  if (offset === 9) return 'WIT';
  return `UTC${offset >= 0 ? '+' : ''}${offset}`;
}

// Filename timestamp ramah-file: "20260417-115012".
export function formatFileStamp(timestamp: number): string {
  return formatDate(new Date(timestamp), 'yyyyMMdd-HHmmss');
}

export function formatAccuracy(meters: number): string {
  if (!Number.isFinite(meters)) return '-';
  if (meters < 1) return '<1';
  return String(Math.round(meters));
}
