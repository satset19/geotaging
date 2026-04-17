import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}

/**
 * Tombol capture bulat gaya shutter kamera, dengan animasi ring aktif.
 */
export function CaptureButton({ onClick, disabled, busy }: CaptureButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      aria-label={t('camera.capture')}
      className={cn(
        'group relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/95 shadow-xl ring-2 ring-white/70 transition-transform active:scale-95 disabled:opacity-50',
        busy && 'animate-pulse'
      )}
    >
      <span
        aria-hidden
        className="absolute inset-1 rounded-full border-4 border-black/80"
      />
      <Camera className="relative h-6 w-6 text-black" aria-hidden />
    </button>
  );
}
