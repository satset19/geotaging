import { Navigation, Signal, SignalHigh, SignalLow } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { classifyAccuracy, type AccuracyQuality } from '@/types/geo';
import { formatAccuracy } from '@/lib/format';

interface AccuracyBadgeProps {
  accuracyMeters: number;
  compact?: boolean;
  className?: string;
}

// Warna dan ikon per kualitas akurasi, konsisten dipakai di AddressCard dan camera overlay.
const QUALITY_STYLES: Record<
  AccuracyQuality,
  { className: string; icon: typeof Signal; labelKey: string }
> = {
  excellent: {
    className:
      'bg-green-500/15 text-green-700 dark:text-green-400 ring-green-500/20',
    icon: SignalHigh,
    labelKey: 'geo.accuracyExcellent',
  },
  good: {
    className:
      'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20',
    icon: Signal,
    labelKey: 'geo.accuracyGood',
  },
  poor: {
    className:
      'bg-destructive/15 text-destructive ring-destructive/20',
    icon: SignalLow,
    labelKey: 'geo.accuracyPoor',
  },
};

/**
 * Badge warna sesuai kualitas akurasi GPS.
 * Versi compact hanya menampilkan angka + warna (untuk overlay kamera).
 */
export function AccuracyBadge({
  accuracyMeters,
  compact,
  className,
}: AccuracyBadgeProps) {
  const { t } = useTranslation();
  const quality = classifyAccuracy(accuracyMeters);
  const style = QUALITY_STYLES[quality];
  const Icon = style.icon;
  const meters = formatAccuracy(accuracyMeters);

  if (compact) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
          style.className,
          className
        )}
        title={t(style.labelKey)}
      >
        <Icon className="h-3 w-3" aria-hidden />
        <span>{meters} m</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1',
        style.className,
        className
      )}
    >
      <Navigation className="h-3 w-3" aria-hidden />
      <span>
        {t('geo.accuracyMeters', { meters })}
      </span>
      <span className="opacity-80">&middot; {t(style.labelKey)}</span>
    </span>
  );
}
