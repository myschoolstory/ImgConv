import React from 'react';

interface ImageInfo {
  width: number;
  height: number;
  size: string;
  format: string;
}

interface ImagePreviewProps {
  image: string;
  title: string;
  info?: ImageInfo;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ image, title, info }) => {
  return (
    <div className="flex-1 min-w-[250px]">
      <h3 className="text-lg font-medium mb-2 text-center">{title}</h3>
      <div className="border rounded-lg overflow-hidden mb-2 bg-gray-50 flex items-center justify-center">
        <img 
          src={image} 
          alt={title} 
          className="max-w-full max-h-[300px] object-contain" 
        />
      </div>
      {info && (
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Format:</span>
            <span className="font-medium">{info.format}</span>
          </div>
          <div className="flex justify-between">
            <span>Dimensions:</span>
            <span className="font-medium">{info.width} × {info.height}px</span>
          </div>
          <div className="flex justify-between">
            <span>Size:</span>
            <span className="font-medium">{info.size}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImagePreview;