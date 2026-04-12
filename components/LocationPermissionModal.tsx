import React from 'react';
import { Check } from 'lucide-react';

interface LocationPermissionModalProps {
  onAllow: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onAllow }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-300 p-4">
        <div className="w-full max-w-[320px] bg-[#1c1c1e] rounded-[32px] p-8 flex flex-col items-center shadow-2xl ring-1 ring-white/5">
            
            <h3 className="text-white/90 text-[17px] font-semibold mb-8 text-center leading-normal">
                Allow this app to request access to:
            </h3>

            <div className="flex flex-col gap-4 w-full mb-10 items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-6 h-6 bg-transparent border-2 border-[#636366] rounded-[6px] flex items-center justify-center">
                         <Check className="w-4 h-4 text-white" strokeWidth={4} />
                    </div>
                    <span className="text-white text-[17px] font-medium">Geographic location</span>
                 </div>
            </div>

            <button 
                onClick={onAllow}
                className="bg-[#2c2c2e] text-white text-[17px] font-semibold py-3.5 w-full rounded-full hover:bg-[#3a3a3c] active:bg-[#48484a] transition-all mb-6"
            >
                Allow
            </button>

            <p className="text-[#8e8e93] text-[13px] text-center font-normal leading-tight px-2">
                The app may not work properly without these permissions.
            </p>
        </div>
    </div>
  );
};