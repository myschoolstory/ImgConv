import React from 'react';
import { ImageIcon } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center">
        <div className="flex items-center">
          <ImageIcon className="h-8 w-8 text-blue-500 mr-3" />
          <h1 className="text-xl font-semibold text-gray-900">ImageConvert</h1>
        </div>
        <div className="ml-auto">
          <span className="text-sm text-gray-600">Convert any image format</span>
        </div>
      </div>
    </header>
  );
};

export default Header;