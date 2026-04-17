import { Camera } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}

/**
 * Shutter button ala kamera native: ring putih + inner brand gradient.
 * Ukuran 76-80px agar memenuhi touch target mobile dengan nyaman.
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
        'group relative inline-flex h-20 w-20 items-center justify-center rounded-full transition-all duration-200 touch-manipulation',
        'active:scale-95',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Outer ring putih */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border-[3px] border-white/90 shadow-xl"
      />
      {/* Inner disc dengan brand gradient, gap 4px dari ring */}
      <span
        aria-hidden
        className={cn(
          'absolute inset-[6px] rounded-full bg-brand shadow-inner transition-transform',
          busy && 'animate-pulse scale-90'
        )}
      />
      <Camera
        className="relative h-6 w-6 text-white drop-shadow-sm"
        strokeWidth={2.4}
        aria-hidden
      />
    </button>
  );
}
