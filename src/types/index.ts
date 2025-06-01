// Existing Image related types
export type ImageFormat = 'png' | 'jpeg' | 'webp' | 'gif' | 'bmp';

export interface ImageInfo {
  width: number;
  height: number;
  size: string; // Formatted string e.g., "1.2 MB"
  format: ImageFormat | string; // Allow string for flexibility if format is not strictly one of the above
}

// New Video related types

// Re-export or redefine VideoFormat from videoConverter.ts for central access
// If imported from videoConverter, ensure paths are correct.
// For simplicity here, we'll redefine it, but re-exporting is often cleaner.
export type VideoFormat = 'mp4' | 'webm' | 'gif' | 'mov' | 'avi' | 'flv';

export interface VideoInfo {
  name: string;
  size: string; // Formatted string e.g., "10.5 MB"
  type: string; // e.g., "video/mp4"
  duration?: number; // Duration in seconds
  width?: number; // Video width in pixels
  height?: number; // Video height in pixels
  format?: string; // File extension or detected format, e.g., "mp4"
}

export interface VideoConversionResult {
  dataUrl: string; // Object URL for the converted video
  fileName: string; // e.g., "output.mp4"
  // Potentially add converted video info here too
  // size?: string;
  // duration?: number;
}

// Generic type for conversion items (could be useful if creating a unified list/history)
export type ConversionItemType = 'image' | 'video';

export interface ConversionItem {
  id: string;
  type: ConversionItemType;
  sourceFile: File;
  targetFormat: ImageFormat | VideoFormat;
  status: 'pending' | 'converting' | 'completed' | 'failed';
  timestamp: Date;
  sourcePreviewUrl?: string; // for image or video
  convertedFileUrl?: string; // for image or video
  error?: string;
}