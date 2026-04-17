import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { CameraFacing } from '@/hooks/useCamera';

interface CameraPreviewProps {
  isStarting: boolean;
  error: string | null;
  facingMode: CameraFacing;
  className?: string;
}

/**
 * Elemen <video> fullscreen dengan styling mirror untuk kamera depan.
 * Ref diteruskan dari parent agar bisa di-bind oleh useCamera.
 */
export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ isStarting, error, facingMode, className }, ref) => {
    const { t } = useTranslation();

    return (
      <div
        className={cn(
          'relative flex-1 overflow-hidden bg-black',
          className
        )}
      >
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          className={cn(
            'h-full w-full object-cover',
            facingMode === 'user' && 'scale-x-[-1]'
          )}
        />
        {isStarting ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white">
            <LoadingSpinner label={t('camera.starting')} className="text-white" />
          </div>
        ) : null}
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6 text-center text-white">
            <p className="max-w-xs text-sm">
              {error === 'NotAllowedError' || error === 'SecurityError'
                ? t('permission.cameraDenied')
                : error === 'NotFoundError'
                  ? t('camera.notAvailable')
                  : error}
            </p>
          </div>
        ) : null}
      </div>
    );
  }
);
CameraPreview.displayName = 'CameraPreview';
