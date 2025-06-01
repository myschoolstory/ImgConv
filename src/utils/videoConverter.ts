import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpeg) {
    return ffmpeg;
  }
  ffmpeg = new FFmpeg();
  // TODO: Configure FFmpeg logging and progress updates
  // ffmpeg.on('log', ({ message }) => console.log(message));
  // ffmpeg.on('progress', ({ progress, time }) => {
  //   console.log(`Progress: ${progress * 100}%, Time: ${time}`);
  // });

  // TODO: The URL for core.js might need to be adjusted based on how Vite serves static assets.
  // It's often in /node_modules/@ffmpeg/core/dist/
  // We need to ensure these files are available in the deployed application.
  // This might require changes to vite.config.ts or public directory.
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
  await ffmpeg.load({
    coreURL: `${baseURL}/ffmpeg-core.js`,
    wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    // workerURL: `${baseURL}/ffmpeg-core.worker.js`, // Optional: if using SharedArrayBuffer
  });
  return ffmpeg;
};

export type VideoFormat = 'mp4' | 'webm' | 'gif' | 'mov' | 'avi' | 'flv';

export interface VideoConversionOptions {
  targetFormat: VideoFormat;
  // TODO: Add more conversion options like resolution, bitrate, etc.
}

export interface VideoConversionResult {
  dataUrl: string;
  fileName: string;
  // TODO: Add more result details like duration, dimensions, size
}

export const convertVideo = async (
  sourceFile: File,
  options: VideoConversionOptions
): Promise<VideoConversionResult> => {
  const ffmpegInstance = await loadFFmpeg();
  const { targetFormat } = options;

  const inputFileName = `input.${sourceFile.name.split('.').pop() || 'mp4'}`;
  const outputFileName = `output.${targetFormat}`;

  await ffmpegInstance.writeFile(inputFileName, await fetchFile(sourceFile));

  // TODO: Construct the FFmpeg command based on options
  // This is a basic example command.
  // For more complex scenarios, we might need to adjust arguments based on targetFormat,
  // desired resolution, bitrate, etc.
  let command: string[];
  switch (targetFormat) {
    case 'gif':
      // Example: convert to GIF. May need to adjust fps, scale for better results.
      // ffmpeg -i input.mp4 -vf "fps=10,scale=320:-1:flags=lanczos" output.gif
      command = ['-i', inputFileName, '-vf', 'fps=10,scale=320:-1:flags=lanczos', outputFileName];
      break;
    case 'webm':
      // Example: convert to WebM (VP9 codec)
      // ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 -c:a libopus output.webm
      command = ['-i', inputFileName, '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', outputFileName];
      break;
    case 'mov':
        // MOV typically uses H.264 for video and AAC for audio. FFmpeg's default for .mov is often suitable.
        command = ['-i', inputFileName, '-c:v', 'h264', '-c:a', 'aac', outputFileName];
        break;
    case 'avi':
        // AVI can use various codecs. A common one is MJPEG for video and MP3 for audio for wider compatibility,
        // though quality/compression might not be optimal.
        // Or use mpeg4 for video:
        command = ['-i', inputFileName, '-c:v', 'mpeg4', '-q:v', '4', '-c:a', 'mp3', '-q:a', '2', outputFileName];
        break;
    case 'flv':
        // FLV typically uses H.264 for video and AAC for audio (similar to MP4).
        command = ['-i', inputFileName, '-c:v', 'libx264', '-c:a', 'aac', '-ar', '44100', '-crf', '28', outputFileName];
        break;
    case 'mp4':
    default:
      // Default to MP4, try to copy codecs if possible, otherwise re-encode to H.264/AAC
      // Using -c copy can be much faster if the source codecs are compatible with MP4.
      // However, to ensure conversion, we might re-encode.
      // command = ['-i', inputFileName, '-c', 'copy', outputFileName]; // This would be faster if codecs match
      command = ['-i', inputFileName, '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', outputFileName];
      break;
  }

  console.log('Running FFmpeg command:', command.join(' '));
  await ffmpegInstance.exec(command);

  const data = await ffmpegInstance.readFile(outputFileName);

  // Clean up files from FFmpeg's virtual file system
  await ffmpegInstance.deleteFile(inputFileName);
  await ffmpegInstance.deleteFile(outputFileName);

  const dataUrl = URL.createObjectURL(new Blob([data], { type: `video/${targetFormat}` }));

  return {
    dataUrl,
    fileName: outputFileName,
  };
};

// Helper to format file size (similar to imageConverter)
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// TODO: Add a function to get video info (dimensions, duration, etc.)
// This might involve running ffprobe (if available in ffmpeg.wasm build) or using a library
// export const getVideoInfo = async (file: File): Promise<any> => {
//   const ffmpegInstance = await loadFFmpeg();
//   // Need to figure out how to run ffprobe or get media info
//   // This part is complex with ffmpeg.wasm alone for full metadata like `mediainfo.js`
//   return {
//     name: file.name,
//     size: formatFileSize(file.size),
//     type: file.type,
//     // duration, width, height would require more processing
//   };
// };
