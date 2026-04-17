import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { MapPin, Camera, ShieldAlert, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { cn } from '@/lib/utils';

type PermState = 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported';

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
 * Gate yang memastikan secure context + permission lokasi + kamera sudah granted.
 * Bila belum, menampilkan card onboarding dengan status per permission dan tombol request.
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
      stream.getTracks().forEach((tr) => tr.stop());
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
      <div className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="mt-3">{t('permission.title')}</CardTitle>
            <CardDescription className="px-2">{t('permission.httpsRequired')}</CardDescription>
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
    <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="mt-3">{t('permission.title')}</CardTitle>
          <CardDescription className="px-2">
            {t('permission.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <PermRow
            icon={<MapPin className="h-5 w-5" />}
            label={t('permission.requestLocation')}
            state={geoPerm}
          />
          <PermRow
            icon={<Camera className="h-5 w-5" />}
            label={t('permission.requestCamera')}
            state={cameraPerm}
          />

          {geoPerm === 'denied' ? (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              {t('permission.locationDenied')}
            </div>
          ) : null}
          {cameraPerm === 'denied' ? (
            <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              {t('permission.cameraDenied')}
            </div>
          ) : null}

          <Button
            type="button"
            size="lg"
            className="w-full bg-brand shadow-brand"
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

function PermRow({
  icon,
  label,
  state,
}: {
  icon: ReactNode;
  label: string;
  state: PermState;
}) {
  const granted = state === 'granted';
  const denied = state === 'denied';
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border p-3 transition-colors',
        granted && 'border-emerald-500/30 bg-emerald-500/5',
        denied && 'border-destructive/30 bg-destructive/5'
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground',
            granted && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
            denied && 'bg-destructive/10 text-destructive'
          )}
        >
          {icon}
        </span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <StatusBadge state={state} />
    </div>
  );
}

function StatusBadge({ state }: { state: PermState }) {
  const styles =
    state === 'granted'
      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
      : state === 'denied'
        ? 'bg-destructive/15 text-destructive'
        : 'bg-muted text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        styles
      )}
      aria-live="polite"
    >
      {state === 'granted' ? <Check className="h-3 w-3" aria-hidden /> : null}
      {state === 'granted' ? 'OK' : state === 'denied' ? 'Denied' : '...'}
    </span>
  );
}
