import { useEffect, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import 'leaflet/dist/leaflet.css';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAppContext } from '@/context/AppContext';
import {
  OSM_ATTRIBUTION,
  OSM_MAX_ZOOM,
  OSM_TILE_TEMPLATE,
} from '@/lib/openStreetMap';
import { bluePinIcon } from '@/lib/leafletIcon';

interface MapViewProps {
  heightClassName?: string;
}

/**
 * Peta Leaflet + OpenStreetMap dengan marker posisi user.
 * Zoom awal 16 saat posisi sudah tersedia, fallback center ke Monas bila belum.
 */
export function MapView({ heightClassName = 'h-[380px]' }: MapViewProps) {
  const { t } = useTranslation();
  const { position } = useAppContext();

  const center = useMemo<[number, number]>(
    () =>
      position
        ? [position.latitude, position.longitude]
        : [-6.175392, 106.827153], // fallback: Monas, Jakarta.
    [position]
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${heightClassName}`}
    >
      <MapContainer
        center={center}
        zoom={position ? 16 : 12}
        scrollWheelZoom
        className="h-full w-full"
        // Matikan tombol attribution default di pojok kanan bawah: kita kendalikan via TileLayer.
        attributionControl
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_TEMPLATE}
          maxZoom={OSM_MAX_ZOOM}
        />
        {position ? (
          <Marker
            position={[position.latitude, position.longitude]}
            icon={bluePinIcon}
          />
        ) : null}
        <RecenterOnPosition lat={position?.latitude} lng={position?.longitude} />
      </MapContainer>
      {!position ? (
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <LoadingSpinner label={t('geo.loading')} />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Re-center peta setiap kali posisi berubah. panTo memberi animasi halus.
 */
function RecenterOnPosition({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.panTo([lat, lng]);
  }, [map, lat, lng]);
  return null;
}
