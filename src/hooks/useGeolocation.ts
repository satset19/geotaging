import { useCallback, useEffect, useRef, useState } from 'react';
import type { GeoError, GeoPosition } from '@/types/geo';

export interface UseGeolocationOptions {
  // Mode watch (watchPosition) vs one-shot (getCurrentPosition). Default: true.
  watch?: boolean;
  // PositionOptions standar.
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;

  // --- Accuracy filter (tambahan, di luar spek PositionOptions) ---
  // Reading dengan accuracy > targetAccuracyMeters dianggap "poor" dan hanya
  // dipakai bila belum ada reading lebih baik atau reading lama sudah stale.
  // Default 100m (cukup untuk UI city-level).
  targetAccuracyMeters?: number;
  // Reading lama dianggap stale setelah N ms (selain dari maximumAge PositionOptions).
  // Default 30s: setelah 30s, reading baru akan menggantikan walau accuracy lebih buruk.
  staleAfterMs?: number;
  // Selisih akurasi minimum (m) agar reading baru dianggap "lebih baik" dari reading lama.
  // Mencegah flicker dari drift kecil GPS. Default 3m.
  improvementThresholdMeters?: number;
}

export interface UseGeolocationResult {
  position: GeoPosition | null;
  error: GeoError | null;
  isLoading: boolean;
  refresh: () => void;
  // Jumlah reading mentah yang diterima (untuk debug / UI indicator "GPS warming up").
  samples: number;
}

// Konversi GeolocationPosition ke tipe plain JSON-serializable kami.
function toGeoPosition(p: GeolocationPosition): GeoPosition {
  return {
    latitude: p.coords.latitude,
    longitude: p.coords.longitude,
    accuracy: p.coords.accuracy,
    altitude: p.coords.altitude,
    altitudeAccuracy: p.coords.altitudeAccuracy,
    heading: p.coords.heading,
    speed: p.coords.speed,
    timestamp: p.timestamp,
  };
}

function toGeoError(e: GeolocationPositionError): GeoError {
  switch (e.code) {
    case e.PERMISSION_DENIED:
      return { code: 'PERMISSION_DENIED', message: e.message };
    case e.POSITION_UNAVAILABLE:
      return { code: 'POSITION_UNAVAILABLE', message: e.message };
    case e.TIMEOUT:
      return { code: 'TIMEOUT', message: e.message };
    default:
      return { code: 'UNKNOWN', message: e.message };
  }
}

/**
 * Hook Geolocation API dengan strategi "best-so-far" untuk memaksimalkan akurasi.
 *
 * Masalah tanpa filter:
 *   - Reading pertama setelah cold-start GPS sering sangat buruk (1000-5000m) karena
 *     browser fallback ke WiFi/cell-tower sebelum GPS lock. Bila langsung dipakai,
 *     watermark foto dan peta menunjukkan lokasi yang salah.
 *   - Selama GPS warming up, reading bisa fluktuatif (drift 10-20m tiap detik).
 *     Tanpa threshold, UI bergetar dan reverse-geocoding terpanggil berlebihan.
 *
 * Strategi (rujuk MDN https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API):
 *   1. enableHighAccuracy: true -> request satellite fix.
 *   2. maximumAge: 0 -> selalu dapatkan reading fresh, bukan cached.
 *   3. timeout: 30s -> beri GPS waktu untuk cold-start.
 *   4. Accept reading baru HANYA bila:
 *        a. Belum ada reading sebelumnya, ATAU
 *        b. Reading baru accuracy <= reading lama - improvementThreshold (lebih baik), ATAU
 *        c. Reading lama sudah > staleAfterMs (user pindah tempat, harus update meski lebih buruk).
 *   5. Clear watch di unmount untuk hemat baterai.
 */
export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationResult {
  const {
    watch = true,
    enableHighAccuracy = true,
    timeout = 30000,
    maximumAge = 0,
    targetAccuracyMeters: _targetAccuracyMeters = 100,
    staleAfterMs = 30000,
    improvementThresholdMeters = 3,
  } = options;

  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<GeoError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [samples, setSamples] = useState(0);

  const watchIdRef = useRef<number | null>(null);
  const bestRef = useRef<GeoPosition | null>(null);

  const acceptCandidate = useCallback(
    (candidate: GeoPosition): boolean => {
      const prev = bestRef.current;
      if (!prev) return true;
      const ageMs = candidate.timestamp - prev.timestamp;
      if (ageMs >= staleAfterMs) return true;
      // Reading baru lebih akurat: accuracy lebih kecil dengan selisih minimum threshold.
      if (candidate.accuracy <= prev.accuracy - improvementThresholdMeters) {
        return true;
      }
      // Jika accuracy kira-kira sama tapi koordinat berubah signifikan (> radius accuracy),
      // kemungkinan user benar-benar bergerak -> terima.
      const moved = haversineMeters(prev, candidate);
      if (moved > Math.max(prev.accuracy, candidate.accuracy)) {
        return true;
      }
      return false;
    },
    [staleAfterMs, improvementThresholdMeters]
  );

  const handleSuccess = useCallback(
    (p: GeolocationPosition) => {
      const candidate = toGeoPosition(p);
      setSamples((n) => n + 1);
      if (acceptCandidate(candidate)) {
        bestRef.current = candidate;
        setPosition(candidate);
      }
      setError(null);
      setIsLoading(false);
    },
    [acceptCandidate]
  );

  const handleError = useCallback((e: GeolocationPositionError) => {
    setError(toGeoError(e));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      setError({ code: 'UNSUPPORTED', message: 'Geolocation API not supported' });
      setIsLoading(false);
      return;
    }

    const posOptions: PositionOptions = {
      enableHighAccuracy,
      timeout,
      maximumAge,
    };

    if (watch) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        posOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(handleSuccess, handleError, posOptions);
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [watch, enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  const refresh = useCallback(() => {
    if (typeof window === 'undefined' || !('geolocation' in navigator)) {
      return;
    }
    setIsLoading(true);
    // Reset best-so-far agar refresh benar-benar mulai dari nol.
    bestRef.current = null;
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy,
      timeout,
      maximumAge: 0,
    });
  }, [enableHighAccuracy, timeout, handleSuccess, handleError]);

  return { position, error, isLoading, samples, refresh };
}

// Haversine distance (meter) untuk detect real movement vs drift.
function haversineMeters(a: GeoPosition, b: GeoPosition): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}
