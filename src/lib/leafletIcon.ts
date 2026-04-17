import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix default icon paths untuk bundler seperti Vite/Webpack.
// Leaflet default icon memakai path relatif terhadap CSS-nya, yang broken di bundler.
// Workaround: assign langsung Icon.Default.prototype._getIconUrl dengan URL asset yang di-bundle.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Ikon kustom berwarna biru (untuk peta utama) dan merah (untuk mini map).
// Menggunakan SVG inline agar tidak butuh asset tambahan.
function svgPinDataUri(fillColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
    <path d="M16 2C9.373 2 4 7.373 4 14c0 9.5 12 28 12 28s12-18.5 12-28c0-6.627-5.373-12-12-12Z" fill="${fillColor}" stroke="#ffffff" stroke-width="2"/>
    <circle cx="16" cy="14" r="5" fill="#ffffff"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const bluePinIcon = L.icon({
  iconUrl: svgPinDataUri('#2563eb'),
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -40],
});

export const redPinIcon = L.icon({
  iconUrl: svgPinDataUri('#ef4444'),
  iconSize: [32, 44],
  iconAnchor: [16, 44],
  popupAnchor: [0, -40],
});
