# GeoDjengs (Geotag Camera PWA)

Aplikasi web PWA yang mengombinasikan kamera perangkat dengan peta
OpenStreetMap dan GPS untuk menghasilkan foto ber-watermark lokasi otomatis.
Saat user membuka kamera, tampil mini peta lokasi sekarang; saat tombol capture
ditekan, foto hasil dibubuhi watermark berisi alamat lengkap, koordinat
latitude/longitude, timestamp, dan thumbnail peta di pojok.

**100% open-source, tanpa API key, tanpa billing, tanpa akun apa pun.**

## Tumpukan Teknologi

- React 18 + Vite + TypeScript
- Tailwind CSS (skema shadcn/ui new-york slate)
- **Leaflet 1.9 + react-leaflet 4** untuk peta interaktif
- **OpenStreetMap** sebagai tile server
- **Nominatim** untuk reverse geocoding (koordinat -> alamat)
- Compositor OSM tile kustom untuk thumbnail watermark (client-side, tanpa
  dependensi eksternal)
- `vite-plugin-pwa` (installable + offline app shell)
- `react-i18next` (Bahasa Indonesia dan English)
- `lucide-react` untuk ikon, `date-fns` untuk format timestamp
- pnpm sebagai package manager

## Prasyarat

- Node.js >= 18.17
- pnpm >= 8
- Device yang akan diuji perlu kamera dan GPS (mobile direkomendasikan).
- Fitur kamera dan geolokasi memerlukan **secure context** (HTTPS atau
  localhost).

## Setup

```bash
# 1. Install dependencies
pnpm install

# 2. (Opsional) Salin env template - tidak ada variabel wajib secara default.
cp .env.example .env
```

Itu saja. Tidak butuh langkah setup API key.

## Menjalankan Dev Server

Vite dikonfigurasi dengan `@vitejs/plugin-basic-ssl` sehingga dev server
berjalan di HTTPS (self-signed certificate).

```bash
pnpm dev
```

- Desktop: buka `https://localhost:5173`. Browser akan memperingatkan
  self-signed cert - klik Advanced -> Proceed.
- Mobile di LAN yang sama: buka `https://<IP-LAN-mesin-dev>:5173`. Accept the
  risk di perangkat mobile. Alternatif yang lebih mulus: `cloudflared tunnel
  --url https://localhost:5173`.

## Build Produksi

```bash
pnpm build
pnpm preview
```

## Deployment

Aplikasi 100% statis. Cocok untuk Vercel, Netlify, Cloudflare Pages, atau
GitHub Pages. Pastikan domain produksi melayani HTTPS (syarat getUserMedia
dan Geolocation API).

## Struktur Folder

```
src/
  components/
    camera/        # Preview kamera, tombol capture, watermark canvas
    map/           # MapView, MiniMap, AddressCard
    layout/        # AppShell, Header, TabBar
    common/        # PermissionGate, LanguageSwitcher, InstallPrompt
    ui/            # Primitive shadcn (Button, Card)
  hooks/           # useGeolocation, useCamera, useReverseGeocode, useOnline
  lib/             # openStreetMap, watermark, leafletIcon, download, format, utils
  i18n/            # Konfigurasi react-i18next + locales ID/EN
  pages/           # MapPage, CameraPage
  context/         # AppContext (state global tab, posisi, bahasa)
  types/           # Tipe geo dan photo
```

## Catatan Penting

- Service worker tidak men-cache tile OpenStreetMap untuk menghormati usage
  policy OSM.
- Stream kamera dihentikan saat user pindah ke tab Map (LED kamera mati).
- Watermark di-compose di client via Canvas 2D. Thumbnail OSM di-load dengan
  `crossOrigin="anonymous"` agar canvas tidak tainted.
- Ada rate limit Nominatim (1 req/s per IP); aplikasi sudah men-debounce dan
  men-skip geocoding bila pergerakan < 15 meter.

Untuk detail provider peta dan kebijakan pemakaian, baca
`docs/map-provider.md`.

## Lisensi

MIT.
