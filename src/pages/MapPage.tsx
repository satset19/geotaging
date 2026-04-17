import { MapView } from '@/components/map/MapView';
import { AddressCard } from '@/components/map/AddressCard';

export function MapPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
        <MapView />
        <AddressCard />
      </div>
    </div>
  );
}
