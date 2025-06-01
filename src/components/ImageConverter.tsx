import React from 'react';
import ImageUploader from './ImageUploader';
import ImagePreview from './ImagePreview';
import ConversionControls from './ConversionControls';
import { useImageConversion } from '../hooks/useImageConversion';

const ImageConverter = () => {
  const {
    sourceImage,
    convertedImage,
    sourceFormat,
    targetFormat,
    isConverting,
    conversionError,
    handleImageUpload,
    handleTargetFormatChange,
    handleConvert,
    handleDownload,
    resetConverter,
    imageInfo
  } = useImageConversion();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 max-w-5xl mx-auto">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-center mb-6">Image Format Converter</h2>
        
        {!sourceImage ? (
          <ImageUploader onImageUpload={handleImageUpload} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <ImagePreview 
                image={sourceImage} 
                title="Original Image" 
                info={imageInfo.source}
              />
              
              <div className="flex items-center justify-center">
                <ConversionControls 
                  sourceFormat={sourceFormat}
                  targetFormat={targetFormat}
                  onTargetFormatChange={handleTargetFormatChange}
                  onConvert={handleConvert}
                  isConverting={isConverting}
                />
              </div>
              
              {convertedImage && (
                <ImagePreview 
                  image={convertedImage} 
                  title="Converted Image"
                  info={imageInfo.converted}
                />
              )}
            </div>
            
            {conversionError && (
              <div className="bg-red-50 text-red-500 p-4 rounded-md text-center">
                {conversionError}
              </div>
            )}
            
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {convertedImage && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-sm font-medium flex items-center"
                >
                  Download
                </button>
              )}
              
              <button
                onClick={resetConverter}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md transition-colors shadow-sm font-medium"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageConverter;