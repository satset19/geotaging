# Map Provider: OpenStreetMap + Nominatim

Aplikasi ini memakai tumpukan peta 100% open-source, tanpa API key, tanpa
billing, tanpa akun.

## Komponen

1. **Leaflet 1.9** + **react-leaflet 4** untuk rendering peta di browser.
2. **OpenStreetMap tile server** (`tile.openstreetmap.org`) sebagai basemap.
3. **Nominatim** (`nominatim.openstreetmap.org`) untuk reverse geocoding
   (koordinat ke alamat).
4. **OSM tile compositor** kustom di `src/lib/openStreetMap.ts` untuk
   membangun thumbnail static map yang di-embed ke watermark foto. Mengambil
   3x3 tile lalu crop ke center; semuanya client-side tanpa server tambahan.

## Usage Policies (Wajib Dipatuhi)

### OpenStreetMap Tile Server
Referensi: https://operations.osmfoundation.org/policies/tiles/

- Tidak untuk traffic tinggi atau bulk download.
- Wajib menampilkan atribusi `© OpenStreetMap contributors` (aplikasi ini
  sudah menampilkan di pojok bawah peta via `TileLayer.attribution` dan di
  watermark foto via compositor).
- Maksimal zoom 19.
- Bila proyek tumbuh besar, pertimbangkan opsi berikut:
  - Self-host tile server (OpenMapTiles, Tileserver GL).
  - Layanan komersial dengan free tier: MapTiler, Stadia Maps, Geoapify.
  - Protomaps (single-file PMTiles, sangat hemat bandwidth).

### Nominatim
Referensi: https://operations.osmfoundation.org/policies/nominatim/

- Maksimum 1 request/detik per IP.
- Tidak untuk auto-complete real-time di aplikasi berskala besar.
- Aplikasi ini sudah menerapkan:
  - Debounce 2 detik di `useReverseGeocode`.
  - Skip geocoding bila pergerakan < 15 meter.
  - AbortController untuk membatalkan request lama.
- Untuk produksi skala besar:
  - Self-host Nominatim (butuh snapshot Planet.osm).
  - Alternatif: Photon (https://photon.komoot.io/) - gratis, tanpa
    rate-limit ketat.
  - Pelias atau Geoapify / LocationIQ / MapTiler Geocoding.

## Ganti Provider

Bila ingin swap ke provider lain (mis. MapTiler vector tiles atau
Photon geocoding), sentuh dua titik:

1. `src/lib/openStreetMap.ts`
   - `OSM_TILE_TEMPLATE` dan `OSM_ATTRIBUTION` untuk basemap.
   - Fungsi `reverseGeocodeNominatim` untuk endpoint geocoding.
   - Fungsi `composeOsmStaticMap` untuk thumbnail di watermark.
2. Bila provider butuh API key, tambahkan di `.env.example` dan baca lewat
   `import.meta.env.VITE_*`.

## Troubleshooting

- **Tile tidak muncul**: cek network di DevTools. `tile.openstreetmap.org`
  kadang lambat atau memblokir IP yang request terlalu sering.
- **Reverse geocoding error 429**: Anda melebihi rate limit Nominatim. Naikkan
  `debounceMs` di `useReverseGeocode` atau ganti ke Photon.
- **Watermark thumbnail gagal load**: biasanya network offline. Foto tetap
  di-capture tanpa thumbnail (graceful fallback di `watermark.ts`).
