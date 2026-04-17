import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { MapPin, Camera, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';

type PermState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

// Query Permissions API untuk kamera dan geolokasi (tidak semua browser support untuk camera).
async function queryPermission(
  name: 'geolocation' | 'camera'
): Promise<PermState> {
  if (
    typeof navigator === 'undefined' ||
    !('permissions' in navigator) ||
    !navigator.permissions?.query
  ) {
    return 'unknown';
  }
  try {
    const status = await navigator.permissions.query({
      name: name as PermissionName,
    });
    return status.state as PermState;
  } catch {
    return 'unknown';
  }
}

/**
 * Gate yang memastikan aplikasi jalan di secure context dan user sudah diminta izin
 * geolocation & camera. Bila belum granted, menampilkan CTA untuk meminta izin.
 * Tetap menampilkan children agar user bisa melihat UI dasar; CTA muncul sebagai overlay card.
 */
export function PermissionGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { position, positionError } = useAppContext();

  const isSecure =
    typeof window !== 'undefined' &&
    (window.isSecureContext || window.location.hostname === 'localhost');

  const [cameraPerm, setCameraPerm] = useState<PermState>('unknown');
  const [geoPerm, setGeoPerm] = useState<PermState>('unknown');

  useEffect(() => {
    void queryPermission('geolocation').then(setGeoPerm);
    void queryPermission('camera').then(setCameraPerm);
  }, []);

  // Sinkronkan status geo dengan hasil actual hook geolocation.
  useEffect(() => {
    if (position) setGeoPerm('granted');
    if (positionError?.code === 'PERMISSION_DENIED') setGeoPerm('denied');
  }, [position, positionError]);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      stream.getTracks().forEach((t) => t.stop());
      setCameraPerm('granted');
    } catch {
      setCameraPerm('denied');
    }
  }, []);

  const requestGeo = useCallback(() => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      () => setGeoPerm('granted'),
      (err) => setGeoPerm(err.code === err.PERMISSION_DENIED ? 'denied' : 'prompt'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const requestAll = useCallback(async () => {
    requestGeo();
    await requestCamera();
  }, [requestGeo, requestCamera]);

  if (!isSecure) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <ShieldAlert className="h-6 w-6 text-destructive" />
            <CardTitle>{t('permission.title')}</CardTitle>
            <CardDescription>{t('permission.httpsRequired')}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const needsCamera = cameraPerm !== 'granted';
  const needsGeo = geoPerm !== 'granted';
  const showGate = needsCamera || needsGeo;

  if (!showGate) return <>{children}</>;

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" aria-hidden />
            {t('permission.title')}
          </CardTitle>
          <CardDescription>{t('permission.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" aria-hidden />
              <span className="text-sm">{t('permission.requestLocation')}</span>
            </div>
            <StatusBadge state={geoPerm} t={t} />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4" aria-hidden />
              <span className="text-sm">{t('permission.requestCamera')}</span>
            </div>
            <StatusBadge state={cameraPerm} t={t} />
          </div>

          {geoPerm === 'denied' ? (
            <p className="text-xs text-destructive">{t('permission.locationDenied')}</p>
          ) : null}
          {cameraPerm === 'denied' ? (
            <p className="text-xs text-destructive">{t('permission.cameraDenied')}</p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            onClick={() => void requestAll()}
            disabled={geoPerm === 'denied' && cameraPerm === 'denied'}
          >
            {t('permission.requestAll')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({
  state,
  t,
}: {
  state: PermState;
  t: (key: string) => string;
}) {
  const color =
    state === 'granted'
      ? 'bg-green-500/15 text-green-700 dark:text-green-400'
      : state === 'denied'
        ? 'bg-destructive/15 text-destructive'
        : 'bg-muted text-muted-foreground';
  const label =
    state === 'granted'
      ? t('common.ok')
      : state === 'denied'
        ? 'Denied'
        : state === 'prompt'
          ? '...'
          : '-';
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
