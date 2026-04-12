import React, { useState, useEffect } from 'react';
import { AdBanner } from '../types';

interface BannerSectionProps {
  title?: string;
  ads: AdBanner[];
  variant?: 'large' | 'compact';
}

export const BannerSection: React.FC<BannerSectionProps> = ({ title, ads, variant = 'large' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 4000); // Change slide every 4 seconds

    return () => clearInterval(interval);
  }, [ads.length]);

  if (!ads.length) return null;

  return (
    <div className="my-4 px-4">
      {title && <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>}
      
      <div className={`relative overflow-hidden rounded-xl shadow-sm group ${variant === 'compact' ? 'h-32' : 'h-48'}`}>
        {/* Slider Track */}
        <div 
            className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)]" 
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {ads.map((ad, index) => (
            <div key={ad.id} className="min-w-full h-full relative shrink-0">
               <img 
                src={ad.image} 
                alt={ad.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex flex-col justify-center px-6">
                <span className="text-[#facc15] text-[10px] font-black uppercase tracking-widest mb-1.5 border border-[#facc15] w-fit px-1.5 py-0.5 rounded">
                  {ad.type}
                </span>
                <h4 className="text-white font-bold text-xl md:text-2xl leading-tight max-w-[85%] drop-shadow-md">
                  {ad.title}
                </h4>
                <p className="text-white/90 text-sm mt-1 mb-4 line-clamp-1 font-medium text-shadow">
                    {ad.subtitle}
                </p>
                <button className="bg-white text-[#a82283] w-fit px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-50 active:scale-95 transition-all shadow-lg flex items-center gap-1">
                  Shop Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Indicators */}
        {ads.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {ads.map((_, idx) => (
                    <button 
                        key={idx} 
                        onClick={() => setCurrentIndex(idx)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-white w-5' : 'bg-white/40 w-1.5 hover:bg-white/60'}`}
                        aria-label={`Go to slide ${idx + 1}`}
                    />
                ))}
            </div>
        )}
      </div>
    </div>
  );
};