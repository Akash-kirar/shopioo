import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, ArrowRight } from 'lucide-react';


interface CameraViewProps {
  onCapture: (file: File) => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onCapture(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        if (e.dataTransfer.files[0].type.startsWith('image/')) {
            onCapture(e.dataTransfer.files[0]);
        }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };



  return (
    <>
        <div 
            className="flex flex-col items-center justify-center w-full h-full min-h-[500px] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 relative hover:bg-gray-100 transition-colors"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <div className="text-center p-8 animate-in fade-in zoom-in duration-300 w-full max-w-sm">
                <div className="flex items-center justify-center gap-2 md:gap-4 text-[10px] md:text-sm font-medium text-gray-500 mb-8">
                    <span className="text-[#a82283] font-bold">1. Upload</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span>2. AI Analysis</span>
                    <ArrowRight size={12} className="text-gray-300" />
                    <span>3. Review</span>
                </div>
                <div className="w-24 h-24 bg-white text-[#a82283] rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-purple-100">
                    <Camera size={48} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">Add Product Photo</h3>
                <p className="text-gray-500 mb-8 text-sm font-medium">
                    Choose how you want to add the product image.
                </p>
                
                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => nativeCameraInputRef.current?.click()}
                        className="w-full bg-[#a82283] text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:bg-[#8a1c6b] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <Camera size={20} />
                        Take Photo
                    </button>
                    <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="w-full bg-white text-gray-800 border-2 border-gray-100 px-6 py-4 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        <ImageIcon size={20} />
                        Upload from Gallery
                    </button>
                </div>
            </div>

            <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
            <input
                type="file"
                ref={nativeCameraInputRef}
                onChange={handleFileChange}
                accept="image/*"
                capture="environment"
                className="hidden"
            />
        </div>
    </>
  );
};
