import React from 'react';
import Header from './components/Header';
import ImageConverter from './components/ImageConverter';
import Footer from './components/Footer';
import VideoConverter from './components/VideoConverter'; // Import the new component

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Display Image Converter */}
        <div className="mb-12">
          <ImageConverter />
        </div>

        {/* Display Video Converter */}
        <div>
          <VideoConverter />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;