import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppContext } from '@/context/AppContext';
import {
  OSM_ATTRIBUTION,
  OSM_MAX_ZOOM,
  OSM_TILE_TEMPLATE,
} from '@/lib/openStreetMap';
import { redPinIcon } from '@/lib/leafletIcon';

/**
 * Mini peta live overlay di mode kamera. Non-interactive, auto-follow posisi.
 */
export function MiniMap() {
  const { position } = useAppContext();
  if (!position) return null;

  return (
    <div className="relative h-36 w-36 overflow-hidden rounded-lg border-2 border-white/80 shadow-lg">
      <MapContainer
        center={[position.latitude, position.longitude]}
        zoom={16}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={OSM_ATTRIBUTION}
          url={OSM_TILE_TEMPLATE}
          maxZoom={OSM_MAX_ZOOM}
        />
        <Marker
          position={[position.latitude, position.longitude]}
          icon={redPinIcon}
        />
        <FollowPosition lat={position.latitude} lng={position.longitude} />
      </MapContainer>
    </div>
  );
}

function FollowPosition({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
}
