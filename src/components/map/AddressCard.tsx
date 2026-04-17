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
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4" aria-hidden />
          {t('address.title')}
        </CardTitle>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => refreshPosition()}
          aria-label={t('geo.refresh')}
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          <span className="ml-1 hidden sm:inline">{t('geo.refresh')}</span>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label={t('address.address')}>
          {addressLoading ? (
            <LoadingSpinner label={t('address.loading')} />
          ) : addressError ? (
            <span className="text-destructive">{addressError}</span>
          ) : address?.formatted ? (
            <span>{address.formatted}</span>
          ) : (
            <span className="text-muted-foreground">{t('address.notFound')}</span>
          )}
        </Field>

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
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-sm">
                  {formatCoordinate(position.latitude, position.longitude)}
                </span>
                <AccuracyBadge accuracyMeters={position.accuracy} />
              </div>
              {accuracyQuality === 'poor' && positionSamples > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {t('geo.warming', { samples: positionSamples })}
                </p>
              ) : null}
            </div>
          ) : null}
        </Field>

        <Field label={t('address.timestamp')}>
          {position ? (
            <span className="inline-flex items-center gap-1 text-sm">
              <Clock className="h-3.5 w-3.5" aria-hidden />
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
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 text-sm">{children}</div>
    </div>
  );
}
