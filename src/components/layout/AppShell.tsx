import { lazy, Suspense } from 'react';
import { Header } from './Header';
import { TabBar } from './TabBar';
import { PermissionGate } from '@/components/common/PermissionGate';
import { InstallPrompt } from '@/components/common/InstallPrompt';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAppContext } from '@/context/AppContext';

// Lazy load halaman besar agar bundle awal ringan.
const MapPage = lazy(() =>
  import('@/pages/MapPage').then((m) => ({ default: m.MapPage }))
);
const CameraPage = lazy(() =>
  import('@/pages/CameraPage').then((m) => ({ default: m.CameraPage }))
);

export function AppShell() {
  const { activeTab } = useAppContext();

  return (
    <div className="flex h-dvh flex-col bg-background">
      <Header />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <PermissionGate>
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center">
                <LoadingSpinner />
              </div>
            }
          >
            {activeTab === 'map' ? (
              <section
                id="panel-map"
                role="tabpanel"
                aria-labelledby="tab-map"
                className="flex flex-1 flex-col overflow-hidden"
              >
                <MapPage />
              </section>
            ) : (
              <section
                id="panel-camera"
                role="tabpanel"
                aria-labelledby="tab-camera"
                className="flex flex-1 flex-col overflow-hidden"
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
