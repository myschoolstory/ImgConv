import React from 'react';
import { VideoFormat } from '../utils/videoConverter';

interface VideoConversionControlsProps {
  targetFormat: VideoFormat;
  onTargetFormatChange: (format: VideoFormat) => void;
  onConvert: () => void;
  isConverting: boolean;
  isLoadingFFmpeg: boolean;
  conversionProgress: number; // 0 to 1
}

const availableFormats: { label: string; value: VideoFormat }[] = [
  { label: 'MP4', value: 'mp4' },
  { label: 'WebM', value: 'webm' },
  { label: 'GIF', value: 'gif' },
  { label: 'MOV', value: 'mov' },
  { label: 'AVI', value: 'avi' },
  { label: 'FLV', value: 'flv' },
];

const VideoConversionControls: React.FC<VideoConversionControlsProps> = ({
  targetFormat,
  onTargetFormatChange,
  onConvert,
  isConverting,
  isLoadingFFmpeg,
  conversionProgress
}) => {
  return (
    <div className="flex flex-col items-center space-y-4 p-4 rounded-lg bg-gray-50 shadow">
      <div className="w-full">
        <label htmlFor="targetFormat" className="block text-sm font-medium text-gray-700 mb-1">
          Convert to:
        </label>
        <select
          id="targetFormat"
          value={targetFormat}
          onChange={(e) => onTargetFormatChange(e.target.value as VideoFormat)}
          disabled={isConverting || isLoadingFFmpeg}
          className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
        >
          {availableFormats.map((format) => (
            <option key={format.value} value={format.value}>
              {format.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onConvert}
        disabled={isConverting || isLoadingFFmpeg}
        className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors shadow-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoadingFFmpeg ? 'Loading Engine...' : isConverting ? 'Converting...' : 'Convert Video'}
      </button>

      {(isConverting || (conversionProgress > 0 && conversionProgress < 1)) && (
        <div className="w-full text-center">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-150"
              style={{ width: `${conversionProgress * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-blue-700 mt-1">
            Progress: {Math.round(conversionProgress * 100)}%
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoConversionControls;
