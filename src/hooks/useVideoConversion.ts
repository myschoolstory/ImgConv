import { useState, useCallback } from 'react';
import { loadFFmpeg, convertVideo, VideoFormat, VideoConversionResult, formatFileSize } from '../utils/videoConverter';
import { FFmpeg } from '@ffmpeg/ffmpeg';

export interface VideoInfo {
  name: string;
  size: string;
  type: string;
  duration?: number; // in seconds
  width?: number;
  height?: number;
  format?: string; // e.g., from file.type or detected format
}

export const useVideoConversion = () => {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [sourceVideo, setSourceVideo] = useState<string | null>(null); // Data URL for preview
  const [convertedVideo, setConvertedVideo] = useState<VideoConversionResult | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<string | null>(null); // e.g., 'mp4', 'webm'
  const [targetFormat, setTargetFormat] = useState<VideoFormat>('mp4');
  const [isConverting, setIsConverting] = useState(false);
  const [isLoadingFFmpeg, setIsLoadingFFmpeg] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [conversionProgress, setConversionProgress] = useState(0); // 0 to 1
  const [sourceVideoInfo, setSourceVideoInfo] = useState<VideoInfo | null>(null);

  const initializeFFmpeg = useCallback(async () => {
    if (ffmpeg) return ffmpeg;
    setIsLoadingFFmpeg(true);
    try {
      const ffmpegInstance = await loadFFmpeg();
      ffmpegInstance.on('progress', ({ progress }) => {
        // FFmpeg progress is 0-1, time is also available
        setConversionProgress(progress);
      });
      ffmpegInstance.on('log', ({ message }) => {
        // Useful for debugging, consider if/how to display to user
        console.log('FFmpeg log:', message);
      });
      setFfmpeg(ffmpegInstance);
      return ffmpegInstance;
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      setConversionError('Failed to load FFmpeg. Please try refreshing the page.');
      return null;
    } finally {
      setIsLoadingFFmpeg(false);
    }
  }, [ffmpeg]);

  const handleVideoUpload = useCallback(async (file: File) => {
    await initializeFFmpeg(); // Ensure FFmpeg is loaded or loading

    setConversionError(null);
    setConvertedVideo(null);
    setSourceFile(file);

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    setSourceFormat(fileExtension || file.type.split('/')[1] || '');

    // Basic video info
    setSourceVideoInfo({
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type,
      format: fileExtension
    });

    // Create a data URL for preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSourceVideo(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);

    // If source format matches target, set a different default
    if (fileExtension && fileExtension === targetFormat) {
      setTargetFormat(fileExtension === 'mp4' ? 'webm' : 'mp4');
    }
  }, [targetFormat, initializeFFmpeg]);

  const handleTargetFormatChange = useCallback((format: VideoFormat) => {
    setTargetFormat(format);
    setConvertedVideo(null);
    setConversionError(null);
    setConversionProgress(0);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!sourceFile || !ffmpeg) {
      setConversionError('Source video or FFmpeg not ready.');
      return;
    }
    if (isLoadingFFmpeg) {
      setConversionError('FFmpeg is still loading. Please wait.');
      return;
    }

    setIsConverting(true);
    setConversionError(null);
    setConversionProgress(0);
    setConvertedVideo(null);

    try {
      const result = await convertVideo(sourceFile, { targetFormat });
      setConvertedVideo(result);
    } catch (error) {
      console.error('Video conversion error:', error);
      setConversionError(`Failed to convert video: ${error instanceof Error ? error.message : String(error)}`);
      setConvertedVideo(null);
    } finally {
      setIsConverting(false);
      setConversionProgress(1); // Mark as complete or reset
    }
  }, [sourceFile, ffmpeg, targetFormat, isLoadingFFmpeg]);

  const handleDownload = useCallback(() => {
    if (!convertedVideo?.dataUrl || !convertedVideo?.fileName) return;

    const link = document.createElement('a');
    link.href = convertedVideo.dataUrl;
    link.download = convertedVideo.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Consider revoking the object URL if it's no longer needed
    // URL.revokeObjectURL(convertedVideo.dataUrl);
  }, [convertedVideo]);

  const resetConverter = useCallback(() => {
    setSourceVideo(null);
    setConvertedVideo(null);
    setSourceFile(null);
    setSourceFormat(null);
    setTargetFormat('mp4');
    setConversionError(null);
    setIsConverting(false);
    setConversionProgress(0);
    setSourceVideoInfo(null);
    // Note: FFmpeg instance and its loaded state are not reset, as it can be reused.
  }, []);

  return {
    sourceVideo,
    convertedVideo,
    sourceFile,
    sourceFormat,
    targetFormat,
    isConverting,
    isLoadingFFmpeg,
    conversionError,
    conversionProgress,
    sourceVideoInfo,
    initializeFFmpeg, // Expose if manual initialization trigger is needed
    handleVideoUpload,
    handleTargetFormatChange,
    handleConvert,
    handleDownload,
    resetConverter,
  };
};
