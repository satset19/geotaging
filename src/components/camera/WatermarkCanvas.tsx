import { useEffect, useRef } from 'react';

interface Props {
  blob: Blob;
  alt: string;
}

/**
 * Komponen kecil untuk menampilkan preview Blob hasil composeWatermark.
 * Menggunakan Object URL dan me-revoke-nya saat unmount.
 */
export function WatermarkCanvas({ blob, alt }: Props) {
  const urlRef = useRef<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(blob);
    urlRef.current = url;
    if (imgRef.current) imgRef.current.src = url;
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [blob]);

  return (
    <img
      ref={imgRef}
      alt={alt}
      className="h-full w-full object-contain"
      draggable={false}
    />
  );
}
