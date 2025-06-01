import React from 'react';
import { ArrowRightIcon, RefreshCwIcon } from 'lucide-react';
import { ImageFormat } from '../types';

interface ConversionControlsProps {
  sourceFormat: ImageFormat | null;
  targetFormat: ImageFormat;
  onTargetFormatChange: (format: ImageFormat) => void;
  onConvert: () => void;
  isConverting: boolean;
}

const ConversionControls: React.FC<ConversionControlsProps> = ({
  sourceFormat,
  targetFormat,
  onTargetFormatChange,
  onConvert,
  isConverting
}) => {
  const formats: ImageFormat[] = ['jpeg', 'png', 'webp', 'gif', 'bmp'];

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      {sourceFormat && (
        <>
          <div className="flex items-center space-x-3">
            <div className="py-2 px-3 bg-gray-100 rounded font-medium text-gray-800 uppercase text-sm">
              {sourceFormat}
            </div>
            <ArrowRightIcon className="h-5 w-5 text-gray-400" />
            <select
              value={targetFormat}
              onChange={(e) => onTargetFormatChange(e.target.value as ImageFormat)}
              className="py-2 px-3 bg-blue-50 border border-blue-200 rounded font-medium text-blue-600 uppercase text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {formats
                .filter(format => format !== sourceFormat)
                .map(format => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
            </select>
          </div>
          
          <button
            onClick={onConvert}
            disabled={isConverting}
            className={`px-6 py-2 rounded-md transition-all font-medium flex items-center ${
              isConverting 
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
            }`}
          >
            {isConverting ? (
              <>
                <RefreshCwIcon className="h-5 w-5 mr-2 animate-spin" />
                Converting...
              </>
            ) : (
              'Convert'
            )}
          </button>
        </>
      )}
    </div>
  );
};

export default ConversionControls;