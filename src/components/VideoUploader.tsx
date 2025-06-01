import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface VideoUploaderProps {
  onVideoUpload: (file: File) => void;
  isLoadingFFmpeg: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoUpload, isLoadingFFmpeg }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onVideoUpload(acceptedFiles[0]);
      }
    },
    [onVideoUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.webm', '.mov', '.avi', '.flv', '.mkv', '.wmv'], // Add more as needed
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
                 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
    >
      <input {...getInputProps()} />
      {isLoadingFFmpeg ? (
        <p className="text-gray-600">Loading Video Engine...</p>
      ) : isDragActive ? (
        <p className="text-blue-600">Drop the video file here ...</p>
      ) : (
        <p className="text-gray-600">Drag 'n' drop a video file here, or click to select file</p>
      )}
      <p className="text-sm text-gray-500 mt-2">
        Supported formats: MP4, WebM, MOV, AVI, FLV, etc.
      </p>
    </div>
  );
};

export default VideoUploader;
