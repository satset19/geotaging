import { useEffect, useRef, useState } from 'react';
import type { GeoAddress, GeoPosition } from '@/types/geo';
import { reverseGeocodeNominatim } from '@/lib/openStreetMap';

export interface UseReverseGeocodeOptions {
  // Jarak minimum (meter) agar geocoding dipanggil ulang. Hemat kuota Nominatim.
  minMoveMeters?: number;
  // Debounce (ms). Nominatim membatasi 1 req/s per IP; kita pakai debounce agak besar.
  debounceMs?: number;
  // Bahasa hasil (Accept-Language). Default: 'id'.
  language?: string;
}

export interface UseReverseGeocodeResult {
  address: GeoAddress | null;
  isLoading: boolean;
  error: string | null;
}

function haversineMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
): number {
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

/**
 * Reverse geocoding via Nominatim (OpenStreetMap) tanpa API key.
 *
 * Pertimbangan usage policy Nominatim:
 *   - Maksimum 1 req/detik per IP.
 *   - Tidak boleh heavy bulk usage. Untuk produksi skala besar self-host / pakai Photon.
 *   - Kami terapkan debounce 2 detik + skip bila pergerakan < 15 meter.
 *   - AbortController membatalkan request sebelumnya ketika posisi berubah.
 */
export function useReverseGeocode(
  position: GeoPosition | null,
  options: UseReverseGeocodeOptions = {}
): UseReverseGeocodeResult {
  const { minMoveMeters = 15, debounceMs = 2000, language = 'id' } = options;

  const [address, setAddress] = useState<GeoAddress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastGeocodedRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!position) return;

    if (
      lastGeocodedRef.current &&
      haversineMeters(lastGeocodedRef.current, position) < minMoveMeters
    ) {
      return;
    }

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      // Batalkan request lama bila masih berjalan.
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsLoading(true);
      setError(null);

      reverseGeocodeNominatim(position.latitude, position.longitude, {
        language,
        signal: controller.signal,
      })
        .then((result) => {
          if (controller.signal.aborted) return;
          setAddress(result ?? { formatted: '' });
          lastGeocodedRef.current = {
            latitude: position.latitude,
            longitude: position.longitude,
          };
        })
        .catch((e: unknown) => {
          if (controller.signal.aborted) return;
          setError(e instanceof Error ? e.message : 'Geocoding failed');
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoading(false);
        });
    }, debounceMs);

    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [position, minMoveMeters, debounceMs, language]);

  // Cleanup abort di unmount.
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return { address, isLoading, error };
}
