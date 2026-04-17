import { lazy, Suspense } from 'react';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { PermissionGate } from '@/components/common/PermissionGate';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAppContext } from '@/context/AppContext';

// Lazy load page besar agar bundle awal kecil.
const MapPage = lazy(() =>
  import('@/pages/MapPage').then((m) => ({ default: m.MapPage }))
);
const CameraPage = lazy(() =>
  import('@/pages/CameraPage').then((m) => ({ default: m.CameraPage }))
);

export function AppShell() {
  const { activeTab } = useAppContext();

  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col overflow-hidden">
        <PermissionGate>
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <LoadingSpinner label="..." />
              </div>
            }
          >
            {activeTab === 'map' ? (
              <section
                id="panel-map"
                role="tabpanel"
                aria-labelledby="tab-map"
                className="flex flex-1 flex-col"
              >
                <MapPage />
              </section>
            ) : (
              <section
                id="panel-camera"
                role="tabpanel"
                aria-labelledby="tab-camera"
                className="flex flex-1 flex-col"
              >
                <CameraPage />
              </section>
            )}
          </Suspense>
        </PermissionGate>
      </main>
      <TabBar />
      <InstallPrompt />
    </div>
  );
}
