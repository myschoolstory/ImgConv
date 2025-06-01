export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'bmp';

export interface ImageInfo {
  width: number;
  height: number;
  size: string;
  format: string;
}