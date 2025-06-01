import { useState, useCallback } from 'react';
import { convertImage, getImageInfo } from '../utils/imageConverter';
import { ImageFormat, ImageInfo } from '../types';

export const useImageConversion = () => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<ImageFormat | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>('png');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionError, setConversionError] = useState<string | null>(null);
  const [imageInfo, setImageInfo] = useState<{
    source: ImageInfo | null;
    converted: ImageInfo | null;
  }>({
    source: null,
    converted: null
  });

  const handleImageUpload = useCallback(async (file: File) => {
    setConversionError(null);
    setConvertedImage(null);
    
    // Get format from file type
    const format = file.type.split('/')[1] as ImageFormat;
    setSourceFormat(format);
    
    // If source format matches target, set a different default
    if (format === targetFormat) {
      setTargetFormat(format === 'jpeg' ? 'png' : 'jpeg');
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      if (e.target?.result) {
        const dataUrl = e.target.result as string;
        setSourceImage(dataUrl);
        setSourceFile(file);
        
        try {
          const info = await getImageInfo(dataUrl, format, file.size);
          setImageInfo(prev => ({ ...prev, source: info }));
        } catch (error) {
          console.error('Error getting image info:', error);
        }
      }
    };
    reader.readAsDataURL(file);
  }, [targetFormat]);

  const handleTargetFormatChange = useCallback((format: ImageFormat) => {
    setTargetFormat(format);
    setConvertedImage(null);
    setImageInfo(prev => ({ ...prev, converted: null }));
    setConversionError(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!sourceImage || !sourceFormat) return;
    
    setIsConverting(true);
    setConversionError(null);
    
    try {
      const result = await convertImage(sourceImage, sourceFormat, targetFormat);
      setConvertedImage(result.dataUrl);
      setImageInfo(prev => ({ ...prev, converted: result.info }));
    } catch (error) {
      console.error('Conversion error:', error);
      setConversionError('Failed to convert image. Please try again or choose a different format.');
    } finally {
      setIsConverting(false);
    }
  }, [sourceImage, sourceFormat, targetFormat]);

  const handleDownload = useCallback(() => {
    if (!convertedImage) return;
    
    const link = document.createElement('a');
    link.href = convertedImage;
    
    // Create filename from original with new extension
    const originalFilename = sourceFile?.name || 'image';
    const baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.')) || originalFilename;
    link.download = `${baseName}.${targetFormat}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [convertedImage, sourceFile, targetFormat]);

  const resetConverter = useCallback(() => {
    setSourceImage(null);
    setConvertedImage(null);
    setSourceFile(null);
    setSourceFormat(null);
    setTargetFormat('png');
    setConversionError(null);
    setImageInfo({ source: null, converted: null });
  }, []);

  return {
    sourceImage,
    convertedImage,
    sourceFormat,
    targetFormat,
    isConverting,
    conversionError,
    imageInfo,
    handleImageUpload,
    handleTargetFormatChange,
    handleConvert,
    handleDownload,
    resetConverter
  };
};