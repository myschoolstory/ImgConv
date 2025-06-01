import React from 'react';
import { VideoInfo } from '../hooks/useVideoConversion';

interface VideoPreviewProps {
  videoSrc: string | null; // Data URL
  title: string;
  info: VideoInfo | null;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ videoSrc, title, info }) => {
  if (!videoSrc) {
    return null;
  }

  return (
    <div className="w-full md:w-1/2 p-4 border rounded-lg shadow-sm bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-700 mb-3 text-center">{title}</h3>
      <video src={videoSrc} controls className="w-full rounded-md max-h-80" />
      {info && (
        <div className="mt-3 text-sm text-gray-600 space-y-1">
          <p><strong>Name:</strong> {info.name}</p>
          <p><strong>Size:</strong> {info.size}</p>
          <p><strong>Type:</strong> {info.type}</p>
          {info.format && <p><strong>Format:</strong> {info.format}</p>}
          {/* Add duration, dimensions if available later */}
        </div>
      )}
    </div>
  );
};

export default VideoPreview;
