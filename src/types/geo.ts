export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number; // horizontal accuracy dalam meter (95% confidence) - MDN
  altitude: number | null;
  altitudeAccuracy: number | null; // meter
  heading: number | null; // degrees (0-360)
  speed: number | null; // m/s
  timestamp: number; // epoch ms
}

export interface GeoAddress {
  formatted: string;
  street?: string;
  locality?: string;
  region?: string;
  country?: string;
  postalCode?: string;
}

export type GeoErrorCode =
  | 'PERMISSION_DENIED'
  | 'POSITION_UNAVAILABLE'
  | 'TIMEOUT'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export interface GeoError {
  code: GeoErrorCode;
  message: string;
}

// Kualitas akurasi GPS berdasarkan nilai accuracy (meter).
// Threshold ditetapkan berdasarkan praktik umum:
//  - <= 20m  : GPS lock bagus (outdoor, satellite fix)
//  - <= 100m : Cukup (warm-up atau sedikit obstruction)
//  - > 100m  : Buruk (indoor, fallback ke WiFi/cell tower)
export type AccuracyQuality = 'excellent' | 'good' | 'poor';

export function classifyAccuracy(meters: number): AccuracyQuality {
  if (!Number.isFinite(meters)) return 'poor';
  if (meters <= 20) return 'excellent';
  if (meters <= 100) return 'good';
  return 'poor';
}
