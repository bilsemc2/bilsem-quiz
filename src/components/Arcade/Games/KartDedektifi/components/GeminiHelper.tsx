
import React from 'react';

interface GeminiHelperProps {
  message: string;
  loading: boolean;
}

const GeminiHelper: React.FC<GeminiHelperProps> = ({ message, loading }) => {
  return (
    <div className="flex items-center gap-4 bg-white/80 backdrop-blur-sm p-4 rounded-3xl border-2 border-purple-200 shadow-sm max-w-md w-full">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 animate-float border-2 border-purple-300">
        <i className="fa-solid fa-robot text-purple-600 text-3xl"></i>
      </div>
      <div className="flex-1">
        <p className="text-purple-900 font-bold text-sm mb-1 uppercase tracking-wider">Robot Yardımcı</p>
        <p className="text-gray-700 font-medium italic">
          {loading ? "Düşünüyorum..." : `"${message}"`}
        </p>
      </div>
    </div>
  );
};

export default GeminiHelper;
