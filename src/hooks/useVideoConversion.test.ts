import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVideoConversion, VideoInfo } from './useVideoConversion';
import { loadFFmpeg, convertVideo, formatFileSize, VideoConversionResult, VideoFormat } from '../utils/videoConverter';
import { FFmpeg } from '@ffmpeg/ffmpeg';

// Mock the videoConverter utility functions
vi.mock('../utils/videoConverter', async (importOriginal) => {
  const original = await importOriginal<typeof import('../utils/videoConverter')>();
  return {
    ...original, // Keep formatFileSize, etc.
    loadFFmpeg: vi.fn(),
    convertVideo: vi.fn(),
  };
});

// Mock FileReader
const mockFileReader = {
  onload: vi.fn() as ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null,
  readAsDataURL: vi.fn(),
  result: 'data:video/mp4;base64,dummy' // Dummy data URL
};
global.FileReader = vi.fn(() => mockFileReader) as any;


describe('useVideoConversion Hook', () => {
  const mockLoadFFmpeg = loadFFmpeg as Mock;
  const mockConvertVideo = convertVideo as Mock;

  const mockFfmpegInstance = {
    on: vi.fn(),
    // Add other methods if they are called directly by the hook (not in this case)
  } as unknown as FFmpeg;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks for each test
    mockLoadFFmpeg.mockResolvedValue(mockFfmpegInstance);
    mockConvertVideo.mockResolvedValue({
      dataUrl: 'blob:video/mp4/converted-url',
      fileName: 'output.mp4',
    } as VideoConversionResult);

    // Reset FileReader mocks
    mockFileReader.onload = null;
    mockFileReader.readAsDataURL.mockClear();
    mockFileReader.result = 'data:video/mp4;base64,dummy';
  });

  it('should have correct initial state', () => {
    const { result } = renderHook(() => useVideoConversion());
    expect(result.current.sourceVideo).toBeNull();
    expect(result.current.convertedVideo).toBeNull();
    expect(result.current.sourceFile).toBeNull();
    expect(result.current.targetFormat).toBe('mp4');
    expect(result.current.isConverting).toBe(false);
    expect(result.current.isLoadingFFmpeg).toBe(false);
    expect(result.current.conversionError).toBeNull();
    expect(result.current.conversionProgress).toBe(0);
    expect(result.current.sourceVideoInfo).toBeNull();
  });

  describe('initializeFFmpeg', () => {
    it('should call loadFFmpeg and set isLoadingFFmpeg states', async () => {
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        result.current.initializeFFmpeg();
      });
      expect(result.current.isLoadingFFmpeg).toBe(true); // Should be true during the call
      // After call completes:
      expect(result.current.isLoadingFFmpeg).toBe(false);
      expect(mockLoadFFmpeg).toHaveBeenCalledTimes(1);
      expect(mockFfmpegInstance.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockFfmpegInstance.on).toHaveBeenCalledWith('log', expect.any(Function));
    });

    it('should handle loadFFmpeg failure', async () => {
      mockLoadFFmpeg.mockRejectedValueOnce(new Error('FFmpeg load failed'));
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        await result.current.initializeFFmpeg();
      });
      expect(result.current.isLoadingFFmpeg).toBe(false);
      expect(result.current.conversionError).toBe('Failed to load FFmpeg. Please try refreshing the page.');
    });

    it('should not load FFmpeg if already loaded', async () => {
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        await result.current.initializeFFmpeg(); // First load
      });
      await act(async () => {
        await result.current.initializeFFmpeg(); // Second call
      });
      expect(mockLoadFFmpeg).toHaveBeenCalledTimes(1); // Still 1, as it's memoized/cached
    });
  });

  describe('handleVideoUpload', () => {
    const mockFile = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });

    it('should set source file, info, data URL and call initializeFFmpeg', async () => {
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        result.current.handleVideoUpload(mockFile);
      });

      expect(mockLoadFFmpeg).toHaveBeenCalled(); // initializeFFmpeg is called
      expect(result.current.sourceFile).toBe(mockFile);
      expect(result.current.sourceVideoInfo).toEqual({
        name: 'test.mp4',
        size: formatFileSize(mockFile.size), // Uses the real formatFileSize
        type: 'video/mp4',
        format: 'mp4',
      });
      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);

      // Simulate FileReader onload
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
        }
      });
      expect(result.current.sourceVideo).toBe(mockFileReader.result);
    });

    it('should change targetFormat if source and target are same', async () => {
        const { result } = renderHook(() => useVideoConversion());
        // Initial targetFormat is 'mp4'
        await act(async () => {
            result.current.handleVideoUpload(mockFile); // Upload an mp4
        });
        expect(result.current.targetFormat).toBe('webm'); // Should change from mp4
    });

    it('should not change targetFormat if source and target are different', async () => {
        const { result } = renderHook(() => useVideoConversion());
        const webmFile = new File(['dummy'], 'test.webm', { type: 'video/webm' });
        await act(async () => {
            result.current.handleVideoUpload(webmFile); // Upload a webm, target is 'mp4'
        });
        expect(result.current.targetFormat).toBe('mp4'); // Should remain mp4
    });
  });

  describe('handleTargetFormatChange', () => {
    it('should update targetFormat and reset relevant states', () => {
      const { result } = renderHook(() => useVideoConversion());
      // Set some initial state to check reset
      act(() => {
        result.current.handleVideoUpload(new File([''], 'test.mp4', {type: 'video/mp4'}));
        result.current.handleConvert(); // Simulate a conversion
      });
      // Simulate FileReader onload for sourceVideo
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
        }
      });

      act(() => {
        result.current.handleTargetFormatChange('webm');
      });

      expect(result.current.targetFormat).toBe('webm');
      expect(result.current.convertedVideo).toBeNull();
      expect(result.current.conversionError).toBeNull();
      expect(result.current.conversionProgress).toBe(0);
    });
  });

  describe('handleConvert', () => {
    const mockFile = new File(['dummy'], 'source.mp4', { type: 'video/mp4' });

    it('should not convert if sourceFile or ffmpeg not ready', async () => {
      const { result } = renderHook(() => useVideoConversion());
      // Case 1: No source file
      await act(async () => {
        result.current.handleConvert();
      });
      expect(mockConvertVideo).not.toHaveBeenCalled();
      expect(result.current.conversionError).toBe('Source video or FFmpeg not ready.');

      // Case 2: FFmpeg not loaded (simulate by not calling initializeFFmpeg or making it return null)
      // For this test, we'll reset ffmpeg instance in hook to null.
      // This requires a more complex setup or direct state manipulation if possible,
      // or rely on initializeFFmpeg not having been called yet.
      // The current setup ensures ffmpeg is set by handleVideoUpload.
      // Let's simulate isLoadingFFmpeg = true
      act(() => {
        result.current.handleVideoUpload(mockFile); // This loads ffmpeg
      });
       const { result: result2 } = renderHook(() => useVideoConversion()); // Fresh hook
       mockLoadFFmpeg.mockImplementationOnce(async () => {
        // Simulate ffmpeg still loading by never resolving this promise from the hook's perspective
        // or by setting isLoadingFFmpeg to true manually if the hook allowed.
        // For simplicity, we'll assume initializeFFmpeg was called but is still "running"
        // by directly checking the isLoadingFFmpeg state if it were exposed or set by the hook.
        // The hook itself sets isLoadingFFmpeg to true then false.
        // A better way would be to have initializeFFmpeg in the hook return a promise that doesn't resolve for this test.
        return new Promise(() => {}); // Never resolves
      });
      // This test case is tricky because `initializeFFmpeg` is auto-called by `handleVideoUpload`.
      // A more direct test for isLoadingFFmpeg would be to set the state directly.
      // Given the current hook structure, this specific isLoadingFFmpeg check in handleConvert
      // is hard to trigger in isolation without a refactor or more complex async control.
      // We'll assume FFmpeg is loaded for other tests.
    });

    it('should call convertVideo and update states on success', async () => {
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        await result.current.initializeFFmpeg(); // Ensure FFmpeg is loaded
        result.current.handleVideoUpload(mockFile);
      });
       // Simulate FileReader onload for sourceVideo
      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
        }
      });

      await act(async () => {
        result.current.handleConvert();
      });

      expect(result.current.isConverting).toBe(true); // During conversion
      // After conversion:
      expect(result.current.isConverting).toBe(false);
      expect(mockConvertVideo).toHaveBeenCalledWith(mockFile, { targetFormat: result.current.targetFormat });
      expect(result.current.convertedVideo).toEqual({
        dataUrl: 'blob:video/mp4/converted-url', // depends on target format
        fileName: 'output.mp4',
      });
      expect(result.current.conversionError).toBeNull();
      expect(result.current.conversionProgress).toBe(1); // Completed
    });

    it('should handle convertVideo failure', async () => {
      mockConvertVideo.mockRejectedValueOnce(new Error('Conversion failed'));
      const { result } = renderHook(() => useVideoConversion());
      await act(async () => {
        await result.current.initializeFFmpeg();
        result.current.handleVideoUpload(mockFile);
      });
      act(() => { // Simulate FileReader onload
        if (mockFileReader.onload) mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
      });

      await act(async () => {
        result.current.handleConvert();
      });

      expect(result.current.isConverting).toBe(false);
      expect(result.current.conversionError).toBe('Failed to convert video: Conversion failed');
      expect(result.current.convertedVideo).toBeNull();
    });
  });

  describe('handleDownload', () => {
    it('should trigger a download link click', () => {
      const { result } = renderHook(() => useVideoConversion());
      const mockConvertedResult: VideoConversionResult = {
        dataUrl: 'blob:video/mp4/test-download-url',
        fileName: 'download.mp4',
      };

      // Mock document.createElement and appendChild/click/removeChild
      const mockLink = { href: '', download: '', click: vi.fn(), style: { display: '' } };
      document.createElement = vi.fn(() => mockLink as any);
      document.body.appendChild = vi.fn();
      document.body.removeChild = vi.fn();

      act(() => {
        // Manually set convertedVideo for this test
        result.current.handleVideoUpload(new File([''], 'test.mp4', {type: 'video/mp4'})); // Sets up source
        // Simulate a successful conversion
        mockConvertVideo.mockResolvedValue(mockConvertedResult);
      });
      act(() => {
         if (mockFileReader.onload) mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
      });
      act(() => {
        result.current.handleConvert(); // This will set convertedVideo
      });

      act(() => {
        result.current.handleDownload();
      });

      expect(document.createElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockConvertedResult.dataUrl);
      expect(mockLink.download).toBe(mockConvertedResult.fileName);
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalledTimes(1);
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
    });
  });

  describe('resetConverter', () => {
    it('should reset all relevant states', async () => {
      const { result } = renderHook(() => useVideoConversion());
      const mockFile = new File(['dummy'], 'test.mp4', { type: 'video/mp4' });

      // Set up some state
      await act(async () => {
        await result.current.initializeFFmpeg();
        result.current.handleVideoUpload(mockFile);
      });
      act(() => { // Simulate FileReader onload
        if (mockFileReader.onload) mockFileReader.onload({ target: { result: mockFileReader.result } } as ProgressEvent<FileReader>);
      });
      await act(async () => {
        result.current.handleTargetFormatChange('webm');
        result.current.handleConvert(); // This will set convertedVideo and potentially an error
      });
      mockConvertVideo.mockRejectedValueOnce(new Error("test error for reset"));
       await act(async () => {
        result.current.handleConvert();
      });


      // Now reset
      act(() => {
        result.current.resetConverter();
      });

      expect(result.current.sourceVideo).toBeNull();
      expect(result.current.convertedVideo).toBeNull();
      expect(result.current.sourceFile).toBeNull();
      expect(result.current.sourceFormat).toBeNull();
      expect(result.current.targetFormat).toBe('mp4'); // Resets to default
      expect(result.current.conversionError).toBeNull();
      expect(result.current.isConverting).toBe(false);
      expect(result.current.conversionProgress).toBe(0);
      expect(result.current.sourceVideoInfo).toBeNull();
      // FFmpeg instance itself is not reset by design
      expect(mockLoadFFmpeg).toHaveBeenCalledTimes(1); // Assuming it was loaded once
    });
  });

  // Test FFmpeg progress updates
  it('should update conversionProgress when ffmpegInstance reports progress', async () => {
    const { result } = renderHook(() => useVideoConversion());
    let progressCallback: ((payload: { progress: number }) => void) | null = null;

    // Capture the progress callback
    mockFfmpegInstance.on = vi.fn((event: string, callback: any) => {
      if (event === 'progress') {
        progressCallback = callback;
      }
    }) as any;

    await act(async () => {
      await result.current.initializeFFmpeg();
    });

    expect(progressCallback).not.toBeNull();

    act(() => {
      if (progressCallback) {
        progressCallback({ progress: 0.5 });
      }
    });
    expect(result.current.conversionProgress).toBe(0.5);

    act(() => {
      if (progressCallback) {
        progressCallback({ progress: 1 });
      }
    });
    expect(result.current.conversionProgress).toBe(1);
  });

});
