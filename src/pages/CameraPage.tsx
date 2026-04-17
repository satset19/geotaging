import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { CameraPreview } from '@/components/camera/CameraPreview';
import { CaptureButton } from '@/components/camera/CaptureButton';
import { DevicePicker } from '@/components/camera/DevicePicker';
import { WatermarkCanvas } from '@/components/camera/WatermarkCanvas';
import { MiniMap } from '@/components/map/MiniMap';
import { AccuracyBadge } from '@/components/common/AccuracyBadge';
import { useCamera } from '@/hooks/useCamera';
import { useAppContext } from '@/context/AppContext';
import { composeWatermark } from '@/lib/watermark';
import { downloadBlob } from '@/lib/download';
import { formatCoordinate, formatFileStamp, formatTimestamp } from '@/lib/format';
import { classifyAccuracy } from '@/types/geo';

/**
 * Halaman kamera. Ada dua fase:
 *   1) LIVE: preview kamera + tombol capture + overlay minimap.
 *   2) PREVIEW: foto dengan watermark + tombol Download/Retake.
 */
export function CameraPage() {
  const { t } = useTranslation();
  const { activeTab, position, address, language } = useAppContext();

  // Stream hanya aktif saat tab kamera + belum di-capture.
  const [mode, setMode] = useState<'live' | 'preview'>('live');
  const [captured, setCaptured] = useState<Blob | null>(null);
  const [composing, setComposing] = useState(false);
  const [composeError, setComposeError] = useState<string | null>(null);
  const [savedFilename, setSavedFilename] = useState<string | null>(null);

  const isStreamActive = activeTab === 'camera' && mode === 'live';

  const {
    videoRef,
    isStarting,
    error: cameraError,
    facingMode,
    switchCamera,
    takeSnapshot,
  } = useCamera({ active: isStreamActive });

  // Reset fase ke live setiap kali user kembali ke tab camera dari tab lain.
  useEffect(() => {
    if (activeTab !== 'camera') return;
    setMode('live');
    setCaptured(null);
    setComposeError(null);
    setSavedFilename(null);
  }, [activeTab]);

  const handleCapture = useCallback(async () => {
    if (!position) return;
    const snap = takeSnapshot();
    if (!snap) return;
    setComposing(true);
    setComposeError(null);
    try {
      const blob = await composeWatermark(snap.canvas, {
        position,
        address,
        locale: language,
        labels: {
          address: t('watermark.address'),
          coordinates: t('watermark.coordinates'),
          capturedAt: t('watermark.capturedAt'),
        },
      });
      setCaptured(blob);
      setMode('preview');
    } catch (e) {
      setComposeError(e instanceof Error ? e.message : t('camera.errorCompose'));
    } finally {
      setComposing(false);
    }
  }, [position, takeSnapshot, address, language, t]);

  const handleDownload = useCallback(() => {
    if (!captured || !position) return;
    const stamp = formatFileStamp(position.timestamp);
    const filename = `geotag-${stamp}.jpg`;
    downloadBlob(captured, filename);
    setSavedFilename(filename);
  }, [captured, position]);

  const handleRetake = useCallback(() => {
    setCaptured(null);
    setSavedFilename(null);
    setComposeError(null);
    setMode('live');
  }, []);

  return (
    <div className="relative flex flex-1 flex-col bg-black">
      {mode === 'live' ? (
        <>
          <CameraPreview
            ref={videoRef}
            isStarting={isStarting}
            error={cameraError}
            facingMode={facingMode}
          />

          {/* Overlay atas: info lokasi compact */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3 safe-top">
            <div className="pointer-events-auto max-w-[60%] rounded-md bg-black/60 p-2 text-xs text-white backdrop-blur">
              <p className="font-semibold">{t('address.title')}</p>
              <p className="mt-0.5 line-clamp-2 text-white/90">
                {address?.formatted ?? t('address.loading')}
              </p>
              {position ? (
                <p className="mt-1 font-mono text-[11px] text-white/80">
                  {formatCoordinate(position.latitude, position.longitude)}
                </p>
              ) : null}
              {position ? (
                <p className="text-[11px] text-white/70">
                  {formatTimestamp(position.timestamp, language)}
                </p>
              ) : null}
              {position ? (
                <div className="mt-1.5">
                  <AccuracyBadge accuracyMeters={position.accuracy} compact />
                </div>
              ) : null}
              {position && classifyAccuracy(position.accuracy) === 'poor' ? (
                <p className="mt-1 text-[11px] leading-snug text-amber-300">
                  {t('geo.waitForBetterAccuracy')}
                </p>
              ) : null}
            </div>

            {/* Mini map overlay kanan atas */}
            <div className="pointer-events-auto">
              <MiniMap />
            </div>
          </div>

          {/* Overlay bawah: controls */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-6 pb-6 pt-4 safe-bottom">
            <div className="min-w-[120px]">
              <DevicePicker
                facing={facingMode}
                onSwitch={switchCamera}
                disabled={isStarting || composing}
              />
            </div>
            <CaptureButton
              onClick={() => void handleCapture()}
              disabled={!position || Boolean(cameraError)}
              busy={composing}
            />
            <div className="min-w-[120px] text-right text-xs text-white/80">
              {composing ? t('camera.composing') : null}
              {composeError ? (
                <span className="text-destructive">{composeError}</span>
              ) : null}
            </div>
          </div>
        </>
      ) : (
        <div className="relative flex flex-1 flex-col">
          <div className="flex-1 overflow-hidden">
            {captured ? (
              <WatermarkCanvas blob={captured} alt={t('camera.preview')} />
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 px-4 py-4 safe-bottom">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetake}
              className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
            >
              <RotateCcw className="mr-1 h-4 w-4" aria-hidden />
              {t('camera.retake')}
            </Button>

            <Button
              type="button"
              onClick={handleDownload}
              className="flex-1 max-w-[240px]"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              {t('camera.download')}
            </Button>

            {savedFilename ? (
              <div
                className="flex items-center gap-1 text-xs text-green-400"
                role="status"
              >
                <span className="truncate max-w-[140px]">{savedFilename}</span>
                <button
                  type="button"
                  aria-label={t('common.close')}
                  onClick={() => setSavedFilename(null)}
                  className="text-white/70 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span className="min-w-[60px]" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
