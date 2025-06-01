import { ImageFormat, ImageInfo } from '../types';

export const getImageInfo = async (
  dataUrl: string, 
  format: ImageFormat, 
  fileSize: number
): Promise<ImageInfo> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: formatFileSize(fileSize),
        format: format
      });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
};

export const convertImage = async (
  sourceDataUrl: string,
  sourceFormat: ImageFormat,
  targetFormat: ImageFormat
): Promise<{ dataUrl: string; info: ImageInfo }> => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      
      img.onload = () => {
        // Create canvas and context
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas context not supported'));
          return;
        }
        
        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw the image onto the canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data URL in the target format
        let mimeType: string;
        let quality: number = 0.92;
        
        switch (targetFormat) {
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'gif':
            // Note: Canvas toDataURL doesn't properly handle GIF animation
            mimeType = 'image/gif';
            break;
          case 'bmp':
            mimeType = 'image/bmp';
            break;
          default:
            mimeType = 'image/png';
        }
        
        const dataUrl = canvas.toDataURL(mimeType, quality);
        
        // Calculate approximate file size from data URL
        const approximateFileSize = Math.round((dataUrl.length * 3) / 4);
        
        // Get image info
        getImageInfo(dataUrl, targetFormat, approximateFileSize)
          .then(info => {
            resolve({ dataUrl, info });
          })
          .catch(err => reject(err));
      };
      
      img.onerror = () => reject(new Error('Failed to load image for conversion'));
      
      img.src = sourceDataUrl;
    } catch (error) {
      reject(error);
    }
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};