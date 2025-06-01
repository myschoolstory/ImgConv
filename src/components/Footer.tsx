import React from 'react';
import { HeartIcon } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-white py-6 border-t border-gray-200">
      <div className="container mx-auto px-4 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center">
          Created with <HeartIcon className="h-4 w-4 text-red-500 mx-1" /> for all your image conversion needs
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} ImageConvert
        </p>
      </div>
    </footer>
  );
};

export default Footer;