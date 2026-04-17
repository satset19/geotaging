/**
 * Memicu download otomatis Blob ke device sebagai file.
 * Gunakan createObjectURL + <a download> lalu revoke URL untuk mencegah memory leak.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke setelah delay agar browser selesai memproses.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Konversi HTMLCanvasElement ke Blob dengan Promise. Browser modern semua mendukung toBlob.
 */
export function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string = 'image/jpeg',
  quality: number = 0.92
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

/**
 * Load image URL ke HTMLImageElement dengan crossOrigin anonymous agar canvas tidak tainted.
 * Penting untuk Static Maps thumbnail.
 */
export function loadCorsImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer-when-downgrade';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
