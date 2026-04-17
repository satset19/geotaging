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
import { cn } from '@/lib/utils';

interface MapViewProps {
  className?: string;
}

export function MapView({ className }: MapViewProps) {
  const { t } = useTranslation();
  const { position } = useAppContext();

  const center = useMemo<[number, number]>(
    () =>
      position
        ? [position.latitude, position.longitude]
        : [-6.175392, 106.827153],
    [position]
  );

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 surface-card',
        // Tinggi adaptif: mobile aspect ratio 4:3, tablet tinggi fix, desktop lebih tinggi.
        'h-[46vh] min-h-[280px] sm:h-[54vh] md:h-[70vh] md:min-h-[420px]',
        className
      )}
    >
      <MapContainer
        center={center}
        zoom={position ? 16 : 12}
        scrollWheelZoom
        className="h-full w-full"
        attributionControl
        zoomControl
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
        <div className="pointer-events-none absolute inset-0 z-[400] flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="rounded-full border border-border bg-card px-4 py-2 shadow-sm">
            <LoadingSpinner label={t('geo.loading')} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RecenterOnPosition({ lat, lng }: { lat?: number; lng?: number }) {
  const map = useMap();
  useEffect(() => {
    if (lat === undefined || lng === undefined) return;
    map.panTo([lat, lng]);
  }, [map, lat, lng]);
  return null;
}
