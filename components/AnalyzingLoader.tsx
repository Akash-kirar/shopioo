import React from 'react';
import { Sparkles } from 'lucide-react';

export const AnalyzingLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in zoom-in duration-300 relative overflow-hidden">
      
      {/* Ambient Moving Light Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-25deg] animate-[shine-sweep_3s_infinite_linear]"></div>
      </div>

      {/* AI Animation */}
      <div className="relative w-24 h-24 mb-8 flex items-center justify-center z-10">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-200/50">
        </div>
        
        {/* Inner pulsing glow */}
        <div className="absolute inset-4 bg-gradient-to-tr from-purple-100 to-pink-50 rounded-full animate-pulse opacity-60"></div>
        
        {/* Center icon */}
        <div className="relative bg-white p-4 rounded-full shadow-md border border-purple-100 flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-[#a82283] animate-pulse" />
        </div>
      </div>

      <style>{`
        @keyframes shine-sweep {
            0% { transform: translateX(-200%) skewX(-20deg); }
            100% { transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes text-shimmer {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Text with Shimmer Effect */}
      <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-500 to-gray-900 bg-[length:200%_auto] animate-[text-shimmer_3s_linear_infinite] mb-2 z-10">
        Creating Product Assets
      </h3>
      
      <p className="text-gray-500 max-w-md mx-auto mb-8 z-10 relative">
        AI is analyzing your product, enhancing the photo, and generating multiple angles...
      </p>

      <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden z-10 relative">
        <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-600 animate-progress w-full origin-left relative">
             <div className="absolute top-0 left-0 bottom-0 w-full bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shine-sweep_1.5s_infinite_linear]"></div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 text-xs text-gray-400 z-10 relative">
        <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-75 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
            <span>Writing Details</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150 shadow-[0_0_8px_rgba(96,165,250,0.6)]"></span>
            <span>Enhancing Photo</span>
        </div>
        <div className="flex flex-col items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-300 shadow-[0_0_8px_rgba(192,132,252,0.6)]"></span>
            <span>Generating Angles</span>
        </div>
      </div>
    </div>
  );
};