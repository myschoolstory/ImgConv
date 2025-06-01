import React, { useEffect } from 'react';
import VideoUploader from './VideoUploader';
import VideoPreview from './VideoPreview';
import VideoConversionControls from './VideoConversionControls';
import { useVideoConversion } from '../hooks/useVideoConversion';

const VideoConverter: React.FC = () => {
  const {
    sourceVideo,
    convertedVideo,
    // sourceFile,
    // sourceFormat,
    targetFormat,
    isConverting,
    isLoadingFFmpeg,
    conversionError,
    conversionProgress,
    sourceVideoInfo,
    initializeFFmpeg,
    handleVideoUpload,
    handleTargetFormatChange,
    handleConvert,
    handleDownload,
    resetConverter,
  } = useVideoConversion();

  useEffect(() => {
    initializeFFmpeg();
  }, [initializeFFmpeg]);

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 max-w-5xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">Video Format Converter</h2>

        {!sourceVideo ? (
          <VideoUploader onVideoUpload={handleVideoUpload} isLoadingFFmpeg={isLoadingFFmpeg} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 justify-center">
              <VideoPreview
                videoSrc={sourceVideo}
                title="Original Video"
                info={sourceVideoInfo}
              />

              <div className="flex flex-col items-center justify-center md:w-1/3">
                <VideoConversionControls
                  targetFormat={targetFormat}
                  onTargetFormatChange={handleTargetFormatChange}
                  onConvert={handleConvert}
                  isConverting={isConverting}
                  isLoadingFFmpeg={isLoadingFFmpeg}
                  conversionProgress={conversionProgress}
                />
              </div>

              {convertedVideo && (
                <VideoPreview
                  videoSrc={convertedVideo.dataUrl}
                  title="Converted Video"
                  info={{ // TODO: Get more detailed info for converted video
                    name: convertedVideo.fileName,
                    size: '', // Placeholder, ideally get from result
                    type: `video/${targetFormat}`,
                    format: targetFormat
                  }}
                />
              )}
            </div>

            {conversionError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-center" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline"> {conversionError}</span>
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {convertedVideo && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm font-medium flex items-center"
                >
                  Download Converted Video
                </button>
              )}

              <button
                onClick={resetConverter}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors shadow-sm font-medium"
              >
                Convert Another Video
              </button>
            </div>
          </div>
        )}

        {isLoadingFFmpeg && !sourceVideo && (
          <div className="text-center mt-4 text-gray-600">
            Initializing video engine, please wait...
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoConverter;
