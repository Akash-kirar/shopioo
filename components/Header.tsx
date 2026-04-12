import React, { useRef, useState, useEffect } from 'react';
import { Search, LogOut, User, Store, ChevronDown, Camera, Image as ImageIcon, Home } from 'lucide-react';
import { WebcamCapture } from './WebcamCapture';

interface HeaderProps {
  userLocation: string;
  onSearch: (query: string) => void;
  onImageSearch: (file: File) => void;
  onLogout: () => void;
  onLocationClick: () => void;
  onMapClick: () => void;
  onOwnerClick: () => void;
}

const RedMapPinIcon = ({ className = "w-10 h-10" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top Arc */}
        <path d="M25 20 A 35 35 0 0 1 75 20" stroke="#EF4444" strokeWidth="5" strokeLinecap="round" />
        
        {/* Pin Body */}
        <path 
            d="M50 28 C35 28 23 40 23 55 C23 72 50 90 50 90 C50 90 77 72 77 55 C77 40 65 28 50 28 Z" 
            fill="#EF4444" 
        />
        
        {/* Inner White Circle */}
        <circle cx="50" cy="55" r="13" fill="white" />
        
        {/* Bottom Ring */}
        <ellipse cx="50" cy="95" rx="20" ry="3" stroke="#EF4444" strokeWidth="4" />
      </svg>
  </div>
);

const ShopiooLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {/* Handle */}
        <path d="M8 6V4a4 4 0 0 1 8 0v2" />
        {/* Bag Body - Open Bottom */}
        <path d="M3 6h18v13a2 2 0 0 1-2 2h-4" />
        <path d="M9 21H5a2 2 0 0 1-2-2V6" />
        {/* Location Pin Inside */}
        <path d="M12 18.5c0 0-4-3-4-6.5a4 4 0 0 1 8 0c0 3.5-4 6.5-4 6.5Z" />
        <circle cx="12" cy="12" r="1.5" />
    </svg>
);

export const Header: React.FC<HeaderProps> = ({ userLocation, onSearch, onImageSearch, onLogout, onLocationClick, onMapClick, onOwnerClick }) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholders = ["Mobiles", "Shoes", "Beauty", "Watches", "Jewellery", "Furniture", "Electronics"];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchTrigger = () => onSearch(searchQuery);
  const handleKeyDown = (e: React.KeyboardEvent) => e.key === 'Enter' && handleSearchTrigger();
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (e.target.value === '') onSearch('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          onImageSearch(e.target.files[0]);
          setShowCameraOptions(false);
      }
      e.target.value = '';
  };

  const handleWebcamCapture = (file: File) => {
      onImageSearch(file);
      setShowWebcam(false);
      setShowCameraOptions(false);
  };

  return (
    <>
      <header className="bg-white text-gray-900 pt-3 pb-3 px-4 sticky top-0 z-50 shadow-sm border-b border-gray-100">
        {/* Top Row: Flex container for alignment */}
        <div className="flex justify-between items-center mb-3 gap-2">
          
          {/* Left Side: Logo */}
          <div className="flex items-center shrink-0 gap-2">
            <ShopiooLogo className="w-8 h-8" />
            <div className="flex items-baseline leading-none">
                <span className="text-xl font-black text-[#F97316] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>Shop</span>
                <span className="text-xl font-black text-[#0f172a] tracking-tighter" style={{ fontFamily: 'Inter, sans-serif' }}>ioo</span>
            </div>
          </div>

          {/* Right Side: Location Pill, Map Pin & Profile */}
          <div className="flex items-center gap-2 shrink-0 min-w-0 justify-end flex-1 ml-2">
             {/* Location Pill */}
             <button 
                onClick={onLocationClick}
                className="flex items-center gap-1 bg-[#0f392b] px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#154d39] transition-colors shrink min-w-0"
             >
                <Home className="w-3.5 h-3.5 text-white fill-white shrink-0" />
                <span className="hidden sm:inline text-[10px] font-black text-white shrink-0 uppercase">HOME</span>
                <span className="text-[10px] text-white/90 truncate font-medium max-w-[80px] sm:max-w-[150px]">
                    {userLocation && userLocation !== 'Locating...' ? userLocation : 'Set Location'}
                </span>
                <ChevronDown className="w-3 h-3 text-white/80 shrink-0" strokeWidth={2.5} />
             </button>

             {/* Map Pin Button */}
             <button 
                onClick={onMapClick} 
                className="w-10 h-10 flex items-center justify-center bg-red-50 rounded-full hover:bg-red-100 transition-all border border-red-200 shadow-sm active:scale-95 shrink-0"
                title="Open Map"
             >
                <RedMapPinIcon className="w-5 h-5" />
             </button>

             {/* User Profile */}
             <div className="relative shrink-0">
                <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100 transition border border-gray-200 shadow-sm active:scale-95">
                    <User className="w-5 h-5" strokeWidth={2} />
                </button>
                {isProfileOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)}></div>
                        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-xl py-1 z-50 border border-gray-100 animate-in fade-in slide-in-from-top-2">
                            <button onClick={() => { setIsProfileOpen(false); onOwnerClick(); }} className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold transition-colors">
                                <Store className="w-3.5 h-3.5" /> Dashboard
                            </button>
                            <button onClick={() => { setIsProfileOpen(false); onLogout(); }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors">
                                <LogOut className="w-3.5 h-3.5" /> Logout
                            </button>
                        </div>
                    </>
                )}
             </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="bg-white rounded-2xl flex items-center px-4 py-3 text-gray-700 border border-gray-200 focus-within:border-[#F97316] shadow-sm transition-all duration-300">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input type="text" placeholder={`Search "${placeholders[placeholderIndex]}"`} value={searchQuery} className="flex-1 bg-transparent outline-none text-sm placeholder-gray-400 text-gray-900 font-medium transition-all" onChange={handleInputChange} onKeyDown={handleKeyDown}/>
            
            <div className="flex items-center border-l border-gray-200 pl-3 ml-1 relative">
                <button 
                    onClick={() => setShowCameraOptions(!showCameraOptions)} 
                    className="p-1.5 hover:bg-gray-50 rounded-full transition-colors active:scale-90" 
                    title="Scan Product"
                >
                    <Camera className="w-5 h-5 text-[#F97316]" />
                </button>

                {showCameraOptions && (
                    <>
                        <div className="fixed inset-0 z-[60]" onClick={() => setShowCameraOptions(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[70] animate-in fade-in zoom-in-95">
                            <button 
                                onClick={() => setShowWebcam(true)}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                                <Camera className="w-3.5 h-3.5 text-[#F97316]" /> Take Photo
                            </button>
                            <div className="h-px bg-gray-50 mx-2 my-0.5"></div>
                            <button 
                                onClick={() => galleryInputRef.current?.click()}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5"
                            >
                                <ImageIcon className="w-3.5 h-3.5 text-gray-500" /> From Gallery
                            </button>
                        </div>
                    </>
                )}
            </div>
            
            {/* Hidden Input */}
            <input 
                type="file" 
                ref={galleryInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
            />
          </div>
        </div>
      </header>
      
      {showWebcam && (
          <WebcamCapture 
            onCapture={handleWebcamCapture} 
            onClose={() => setShowWebcam(false)} 
          />
      )}
    </>
  );
};