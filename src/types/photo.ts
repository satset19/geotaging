import type { GeoAddress, GeoPosition } from './geo';

export interface WatermarkInput {
  position: GeoPosition;
  address: GeoAddress | null;
  locale: 'id' | 'en';
  labels: {
    capturedAt: string;
    coordinates: string;
    address: string;
  };
}

export interface CaptureResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
  watermarkInput: WatermarkInput;
}
