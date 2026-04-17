import { useCallback, useEffect, useState } from 'react';
import { Download, RotateCcw, Check, AlertTriangle, MapPin } from 'lucide-react';
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
 * Fase:
 *  1) LIVE: preview kamera + overlay glassy info lokasi + tombol capture.
 *  2) PREVIEW: hasil foto dengan watermark + tombol Retake/Download.
 */
export function CameraPage() {
  const { t } = useTranslation();
  const { activeTab, position, address, language } = useAppContext();

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
    const filename = `geodjengs-${stamp}.jpg`;
    downloadBlob(captured, filename);
    setSavedFilename(filename);
  }, [captured, position]);

  const handleRetake = useCallback(() => {
    setCaptured(null);
    setSavedFilename(null);
    setComposeError(null);
    setMode('live');
  }, []);

  const accuracyQuality = position ? classifyAccuracy(position.accuracy) : null;

  return (
    <div className="relative flex flex-1 flex-col bg-black overflow-hidden">
      {mode === 'live' ? (
        <LiveMode
          videoRef={videoRef}
          isStarting={isStarting}
          cameraError={cameraError}
          facingMode={facingMode}
          switchCamera={switchCamera}
          onCapture={() => void handleCapture()}
          composing={composing}
          composeError={composeError}
          position={position}
          address={address?.formatted ?? null}
          language={language}
          t={t}
          accuracyQuality={accuracyQuality}
        />
      ) : (
        <PreviewMode
          captured={captured}
          savedFilename={savedFilename}
          onRetake={handleRetake}
          onDownload={handleDownload}
          clearSaved={() => setSavedFilename(null)}
          t={t}
        />
      )}
    </div>
  );
}

// ---------- Live mode ----------

interface LiveModeProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  isStarting: boolean;
  cameraError: string | null;
  facingMode: 'environment' | 'user';
  switchCamera: () => void;
  onCapture: () => void;
  composing: boolean;
  composeError: string | null;
  position: ReturnType<typeof useAppContext>['position'];
  address: string | null;
  language: 'id' | 'en';
  t: ReturnType<typeof useTranslation>['t'];
  accuracyQuality: ReturnType<typeof classifyAccuracy> | null;
}

function LiveMode({
  videoRef,
  isStarting,
  cameraError,
  facingMode,
  switchCamera,
  onCapture,
  composing,
  composeError,
  position,
  address,
  language,
  t,
  accuracyQuality,
}: LiveModeProps) {
  return (
    <>
      <CameraPreview
        ref={videoRef}
        isStarting={isStarting}
        error={cameraError}
        facingMode={facingMode}
      />

      {/* Overlay top: info lokasi + mini map, safe area aware */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3 safe-top sm:p-4">
        <LocationHud
          address={address}
          position={position}
          language={language}
          t={t}
          accuracyQuality={accuracyQuality}
        />
        <div className="pointer-events-auto">
          <MiniMap />
        </div>
      </div>

      {/* Overlay bottom: controls */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-6 pb-6 pt-5 safe-bottom sm:px-10 sm:pb-8">
        <DevicePicker
          facing={facingMode}
          onSwitch={switchCamera}
          disabled={isStarting || composing}
        />
        <div className="flex flex-col items-center gap-1.5">
          <CaptureButton
            onClick={onCapture}
            disabled={!position || Boolean(cameraError)}
            busy={composing}
          />
          {composing ? (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
              {t('camera.composing')}
            </span>
          ) : composeError ? (
            <span className="text-[11px] font-semibold text-red-300">
              {composeError}
            </span>
          ) : null}
        </div>
        <div className="w-12" aria-hidden />
      </div>
    </>
  );
}

function LocationHud({
  address,
  position,
  language,
  t,
  accuracyQuality,
}: {
  address: string | null;
  position: ReturnType<typeof useAppContext>['position'];
  language: 'id' | 'en';
  t: ReturnType<typeof useTranslation>['t'];
  accuracyQuality: ReturnType<typeof classifyAccuracy> | null;
}) {
  return (
    <div className="pointer-events-auto max-w-[62%] space-y-1.5 rounded-2xl glass-dark px-3 py-2.5 text-white shadow-lg">
      <div className="flex items-center gap-1.5">
        <MapPin className="h-3 w-3 text-cyan-300" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/70">
          {t('address.title')}
        </span>
      </div>
      <p className="line-clamp-2 text-[13px] font-medium leading-snug text-white">
        {address ?? t('address.loading')}
      </p>
      {position ? (
        <p className="font-mono text-[11px] text-white/70">
          {formatCoordinate(position.latitude, position.longitude)}
        </p>
      ) : null}
      {position ? (
        <p className="text-[11px] text-white/60">
          {formatTimestamp(position.timestamp, language)}
        </p>
      ) : null}
      {position ? (
        <AccuracyBadge accuracyMeters={position.accuracy} compact />
      ) : null}
      {accuracyQuality === 'poor' ? (
        <div className="flex items-start gap-1 rounded-md bg-amber-500/20 px-1.5 py-1 text-[11px] leading-tight text-amber-100">
          <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden />
          <span>{t('geo.waitForBetterAccuracy')}</span>
        </div>
      ) : null}
    </div>
  );
}

// ---------- Preview mode ----------

interface PreviewModeProps {
  captured: Blob | null;
  savedFilename: string | null;
  onRetake: () => void;
  onDownload: () => void;
  clearSaved: () => void;
  t: ReturnType<typeof useTranslation>['t'];
}

function PreviewMode({
  captured,
  savedFilename,
  onRetake,
  onDownload,
  clearSaved: _clearSaved,
  t,
}: PreviewModeProps) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-hidden bg-black p-2 sm:p-4">
        {captured ? (
          <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
            <WatermarkCanvas blob={captured} alt={t('camera.preview')} />
          </div>
        ) : null}
      </div>

      <div className="relative z-50 flex shrink-0 items-center justify-center gap-3 bg-gradient-to-t from-black/95 to-black/70 px-4 py-4 sm:px-8 sm:py-6">
        <Button
          type="button"
          variant="outline"
          onClick={onRetake}
          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          {t('camera.retake')}
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={onDownload}
          className="bg-brand shadow-brand flex-1 max-w-[260px]"
        >
          <Download className="h-4 w-4" aria-hidden />
          {t('camera.download')}
        </Button>
      </div>

      {savedFilename ? (
        <div className="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center safe-top">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur">
            <Check className="h-3.5 w-3.5" aria-hidden />
            <span>{t('camera.success')}</span>
            <span className="max-w-[200px] truncate font-normal opacity-90">
              {savedFilename}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
