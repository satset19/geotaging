import { MapView } from '@/components/map/MapView';
import { AddressCard } from '@/components/map/AddressCard';

/**
 * Layout responsive:
 *  - Mobile: peta di atas (fixed aspect), address card di bawah, stacked scrolling.
 *  - Desktop (md+): peta besar di kiri (7 cols), card di kanan (5 cols), tanpa scroll.
 */
export function MapPage() {
  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-5 md:p-6">
        <div className="grid gap-4 md:grid-cols-12 md:gap-6">
          <div className="md:col-span-7 lg:col-span-8">
            <MapView />
          </div>
          <div className="md:col-span-5 lg:col-span-4">
            <AddressCard />
          </div>
        </div>
      </div>
    </div>
  );
}
