import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraFacing = 'environment' | 'user';

export interface UseCameraOptions {
  active: boolean; // kendali start/stop stream dari parent
  facingMode?: CameraFacing;
  width?: number;
  height?: number;
}

export interface UseCameraResult {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement>;
  isStarting: boolean;
  error: string | null;
  facingMode: CameraFacing;
  switchCamera: () => void;
  // Mengambil snapshot video saat ini ke canvas baru. Returns canvas dan dimensinya.
  takeSnapshot: () => { canvas: HTMLCanvasElement; width: number; height: number } | null;
}

/**
 * Hook getUserMedia wrapper.
 * - Stream hidup hanya selama `active === true`. Ini penting untuk mematikan LED kamera
 *   saat user switch tab ke Map.
 * - Mengubah facingMode akan me-restart stream dengan constraint baru.
 * - Cleanup memanggil track.stop() di unmount untuk release resource.
 */
export function useCamera({
  active,
  facingMode: initialFacingMode = 'environment',
  width = 1920,
  height = 1080,
}: UseCameraOptions): UseCameraResult {
  const [facingMode, setFacingMode] = useState<CameraFacing>(initialFacingMode);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopStream();
      return;
    }

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('UNSUPPORTED');
      return;
    }

    let cancelled = false;

    const start = async () => {
      setIsStarting(true);
      setError(null);
      try {
        const constraints: MediaStreamConstraints = {
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: width },
            height: { ideal: height },
          },
        };
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // iOS Safari butuh play() manual.
          try {
            await videoRef.current.play();
          } catch {
            // Autoplay dapat gagal; user gesture akan memicu play lewat komponen.
          }
        }
      } catch (e) {
        if (!cancelled) {
          const name = (e as DOMException)?.name ?? 'UNKNOWN';
          setError(name);
        }
      } finally {
        if (!cancelled) setIsStarting(false);
      }
    };

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, facingMode, width, height]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const takeSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    // Jika kamera depan (user), flip horizontal agar hasil sesuai preview mirror.
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return { canvas, width: canvas.width, height: canvas.height };
  }, [facingMode]);

  return {
    stream,
    videoRef,
    isStarting,
    error,
    facingMode,
    switchCamera,
    takeSnapshot,
  };
}
