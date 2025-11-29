import React from 'react';
import { Terminal, Folder, Star, Gift, Calendar } from 'lucide-react';

const OGImage = () => {
  // Hardcoded wallpaper similar to the app
  const wallpaper = "/lists/images/wallpaper_illustration_1.png"; // Cozy Fireplace
  
  return (
    <div className="w-[1200px] h-[630px] relative overflow-hidden flex items-center justify-center font-sans text-gray-900 antialiased">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ 
          backgroundImage: `url(${wallpaper})`,
          // Fallback gradient if image missing
          backgroundColor: '#8B0000' 
        }}
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
      </div>

      {/* Main Window */}
      <div className="w-[600px] bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/40 z-10 relative transform -rotate-2">
        {/* Title Bar */}
        <div className="h-10 bg-gray-200/80 border-b border-gray-300/50 flex items-center px-4 space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24] shadow-inner"></div>
            <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] shadow-inner"></div>
          </div>
          <div className="flex-1 text-center text-sm font-semibold text-gray-600 flex items-center justify-center gap-2">
            <Folder size={14} className="text-blue-500" fill="currentColor" />
            <span>David's List '25</span>
          </div>
        </div>

        {/* Window Content */}
        <div className="p-8 bg-white/50 min-h-[300px] flex flex-col items-center justify-center space-y-6">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-red-600 rounded-2xl shadow-lg mb-4 rotate-3">
                    <Gift className="text-white w-14 h-14" />
                </div>
                <h1 className="text-5xl font-bold tracking-tight text-gray-900 drop-shadow-sm">David's List '25</h1>
                <p className="text-xl text-gray-700 font-medium">The Ultimate Holiday Wishlist</p>
            </div>

            <div className="flex gap-4 mt-4">
                <div className="px-4 py-2 bg-white/80 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                    <Calendar size={18} className="text-red-600" />
                    <span className="font-medium text-gray-800">December 25</span>
                </div>
                <div className="px-4 py-2 bg-white/80 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
                    <Star size={18} className="text-yellow-500" fill="currentColor" />
                    <span className="font-medium text-gray-800">Approved</span>
                </div>
            </div>
        </div>
      </div>

      {/* Floating Elements for Depth */}
      <div className="absolute bottom-10 right-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl rotate-6">
        <div className="flex gap-4">
             <div className="w-12 h-12 bg-gradient-to-b from-blue-400 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                <Terminal className="text-white" size={24} />
             </div>
             <div className="w-12 h-12 bg-gradient-to-b from-green-400 to-green-600 rounded-xl shadow-lg flex items-center justify-center">
                <div className="text-white font-bold text-xl">DL</div>
             </div>
        </div>
      </div>

    </div>
  );
};

export default OGImage;

