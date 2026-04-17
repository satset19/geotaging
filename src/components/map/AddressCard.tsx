import { MapPin, RefreshCw, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AccuracyBadge } from '@/components/common/AccuracyBadge';
import { formatCoordinate, formatTimestamp } from '@/lib/format';
import { useAppContext } from '@/context/AppContext';
import { classifyAccuracy } from '@/types/geo';

export function AddressCard() {
  const { t } = useTranslation();
  const {
    position,
    positionError,
    positionLoading,
    positionSamples,
    address,
    addressLoading,
    addressError,
    refreshPosition,
    language,
  } = useAppContext();

  const accuracyQuality = position ? classifyAccuracy(position.accuracy) : null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-sm">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          {t('address.title')}
        </CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refreshPosition()}
          aria-label={t('geo.refresh')}
          className="rounded-full"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          <span className="ml-1 hidden sm:inline">{t('geo.refresh')}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <Field label={t('address.address')}>
          {addressLoading ? (
            <LoadingSpinner label={t('address.loading')} />
          ) : addressError ? (
            <span className="text-destructive">{addressError}</span>
          ) : address?.formatted ? (
            <p className="text-sm leading-relaxed">{address.formatted}</p>
          ) : (
            <span className="text-muted-foreground">{t('address.notFound')}</span>
          )}
        </Field>

        <div className="h-px bg-border/60" aria-hidden />

        <Field label={t('address.coordinates')}>
          {positionLoading && !position ? (
            <LoadingSpinner label={t('geo.loading')} />
          ) : positionError ? (
            <span className="text-destructive">
              {positionError.code === 'PERMISSION_DENIED'
                ? t('permission.locationDenied')
                : positionError.code === 'TIMEOUT'
                  ? t('geo.timeout')
                  : t('geo.unavailable')}
            </span>
          ) : position ? (
            <div className="space-y-2">
              <p className="font-mono text-[13px] font-medium leading-tight">
                {formatCoordinate(position.latitude, position.longitude)}
              </p>
              <AccuracyBadge accuracyMeters={position.accuracy} />
              {accuracyQuality === 'poor' && positionSamples > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('geo.warming', { samples: positionSamples })}
                </p>
              ) : null}
            </div>
          ) : null}
        </Field>

        <div className="h-px bg-border/60" aria-hidden />

        <Field label={t('address.timestamp')}>
          {position ? (
            <span className="inline-flex items-center gap-1.5 text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {formatTimestamp(position.timestamp, language)}
            </span>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </Field>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
