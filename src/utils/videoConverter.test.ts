import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { loadFFmpeg, convertVideo, formatFileSize, VideoFormat } from './videoConverter';

// Mock the external dependencies
vi.mock('@ffmpeg/ffmpeg', () => {
  const mockExec = vi.fn(async (args: string[]) => {
    // Simulate file output based on command (very basic)
    if (args.includes('output.mp4')) return 0; // Success
    if (args.includes('error_output.mp4')) throw new Error('FFmpeg execution error');
    return 0;
  });
  const mockWriteFile = vi.fn(async () => {});
  const mockReadFile = vi.fn(async (path: string) => {
    if (path.includes('error')) throw new Error('File read error');
    return new Uint8Array([1, 2, 3]); // Dummy data
  });
  const mockDeleteFile = vi.fn(async () => {});
  const mockLoad = vi.fn(async () => {});
  const mockOn = vi.fn(() => {});

  return {
    FFmpeg: vi.fn(() => ({
      load: mockLoad,
      exec: mockExec,
      writeFile: mockWriteFile,
      readFile: mockReadFile,
      deleteFile: mockDeleteFile,
      on: mockOn,
    })),
  };
});

vi.mock('@ffmpeg/util', () => ({
  fetchFile: vi.fn(async (file: File | string) => {
    if (typeof file === 'string' && file.includes('error')) {
      throw new Error('fetchFile error');
    }
    return new Uint8Array([4, 5, 6]); // Dummy data for source file
  }),
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn((blob: Blob) => `blob:${blob.type}/mocked-url`);
global.URL.revokeObjectURL = vi.fn();


describe('videoConverter utility', () => {
  let ffmpegInstance: FFmpeg;

  beforeEach(() => {
    vi.clearAllMocks();
    // Re-initialize ffmpegInstance before each test if needed, or get it from loadFFmpeg
    // For these tests, the mock FFmpeg is constructed fresh by loadFFmpeg
  });

  describe('formatFileSize', () => {
    it('should return "0 Bytes" for 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
    });

    it('should correctly format KB', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(2500)).toBe('2.44 KB');
    });

    it('should correctly format MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1500000)).toBe('1.43 MB');
    });

    it('should correctly format GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
      expect(formatFileSize(2500000000)).toBe('2.33 GB');
    });
  });

  describe('loadFFmpeg', () => {
    it('should create an FFmpeg instance and call load', async () => {
      const ffmpeg = await loadFFmpeg();
      expect(FFmpeg).toHaveBeenCalledTimes(1);
      // Access the mocked methods via the class mock's instances
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;
      expect(mockFfmpegInstance.load).toHaveBeenCalledWith({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      });
      expect(ffmpeg).toBe(mockFfmpegInstance);
    });

    it('should return the existing instance if already loaded', async () => {
      const ffmpeg1 = await loadFFmpeg(); // First call, loads
      const ffmpeg2 = await loadFFmpeg(); // Second call, should return existing
      expect(FFmpeg).toHaveBeenCalledTimes(1); // Constructor only called once
      expect(ffmpeg2).toBe(ffmpeg1);
    });
  });

  describe('convertVideo', () => {
    const mockSourceFile = new File(['dummy content'], 'source.mp4', { type: 'video/mp4' });

    it('should correctly call FFmpeg methods for conversion (e.g. mp4 to gif)', async () => {
      // Reset FFmpeg constructor count for this specific test scenario
      (FFmpeg as any).mockClear(); // Clears constructor calls and instance method mocks for fresh count

      const ffmpeg = await loadFFmpeg(); // This will create an instance
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;

      const options = { targetFormat: 'gif' as VideoFormat };
      const result = await convertVideo(mockSourceFile, options);

      expect(fetchFile).toHaveBeenCalledWith(mockSourceFile);
      expect(mockFfmpegInstance.writeFile).toHaveBeenCalledWith('input.mp4', expect.any(Uint8Array));

      const expectedGifCommand = ['-i', 'input.mp4', '-vf', 'fps=10,scale=320:-1:flags=lanczos', 'output.gif'];
      expect(mockFfmpegInstance.exec).toHaveBeenCalledWith(expectedGifCommand);

      expect(mockFfmpegInstance.readFile).toHaveBeenCalledWith('output.gif');
      expect(mockFfmpegInstance.deleteFile).toHaveBeenCalledWith('input.mp4');
      expect(mockFfmpegInstance.deleteFile).toHaveBeenCalledWith('output.gif');

      expect(result.fileName).toBe('output.gif');
      expect(result.dataUrl).toMatch(/^blob:video\/gif/);
    });

    it('should correctly call FFmpeg methods for mp4 to webm', async () => {
      (FFmpeg as any).mockClear();
      const ffmpeg = await loadFFmpeg();
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;

      const options = { targetFormat: 'webm' as VideoFormat };
      await convertVideo(mockSourceFile, options);

      const expectedWebmCommand = ['-i', 'input.mp4', '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-c:a', 'libopus', 'output.webm'];
      expect(mockFfmpegInstance.exec).toHaveBeenCalledWith(expectedWebmCommand);
      expect(mockFfmpegInstance.readFile).toHaveBeenCalledWith('output.webm');
    });

    it('should correctly call FFmpeg methods for mp4 to mp4 (re-encode)', async () => {
      (FFmpeg as any).mockClear();
      const ffmpeg = await loadFFmpeg();
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;

      const options = { targetFormat: 'mp4' as VideoFormat };
      await convertVideo(mockSourceFile, options);

      const expectedMp4Command = ['-i', 'input.mp4', '-c:v', 'libx264', '-c:a', 'aac', '-strict', 'experimental', 'output.mp4'];
      expect(mockFfmpegInstance.exec).toHaveBeenCalledWith(expectedMp4Command);
    });


    it('should handle FFmpeg execution error', async () => {
      (FFmpeg as any).mockClear();
      const ffmpeg = await loadFFmpeg();
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;

      // Configure mockExec for this specific instance to throw an error
      mockFfmpegInstance.exec = vi.fn().mockRejectedValueOnce(new Error('FFmpeg execution failed'));

      const options = { targetFormat: 'mp4' as VideoFormat };
      await expect(convertVideo(mockSourceFile, options)).rejects.toThrow('FFmpeg execution failed');

      // Ensure cleanup functions are still called or handled appropriately
      // Depending on implementation, deleteFile might not be called if exec fails early.
      // Current implementation in videoConverter.ts would not call deleteFile if exec throws.
    });

    it('should handle readFile error', async () => {
      (FFmpeg as any).mockClear();
      const ffmpeg = await loadFFmpeg();
      const mockFfmpegInstance = (FFmpeg as any).mock.results[0].value;

      mockFfmpegInstance.readFile = vi.fn().mockRejectedValueOnce(new Error('File read error'));

      const options = { targetFormat: 'mp4' as VideoFormat };
      await expect(convertVideo(mockSourceFile, options)).rejects.toThrow('File read error');
    });
  });
});
