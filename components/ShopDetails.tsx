import React, { useMemo } from 'react';
import { Shop, Item, User } from '../types';
import { calculateDistance } from '../utils';
import { X, MapPin, Phone, Navigation, Star, Clock, Share2, Store } from 'lucide-react';
import { ProductGrid } from './ProductGrid';

interface ShopDetailsProps {
  shop: Shop;
  items: Item[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
  currentUser?: User | null;
  onToggleLike?: (productId: string) => void;
  onToggleCart?: (productId: string) => void;
}

export const ShopDetails: React.FC<ShopDetailsProps> = ({ shop, items, userLocation, onClose, currentUser, onToggleLike, onToggleCart }) => {
  
  const distance = useMemo(() => {
    if (userLocation) {
        return calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude);
    }
    return null;
  }, [userLocation, shop]);

  const handleNavigate = () => {
     let url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
     if (userLocation) {
        url += `&origin=${userLocation.lat},${userLocation.lng}`;
     }
     window.open(url, '_blank');
  };

  const handleCall = () => {
    if (shop.phone) window.location.href = `tel:${shop.phone}`;
    else alert("Phone number not available");
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-in slide-in-from-bottom-5 duration-300">
      <div className="relative h-48 sm:h-64 bg-gray-200">
        {shop.image ? (
            <img src={shop.image} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-purple-200 text-[#a82283] opacity-50">
                <Store className="w-16 h-16" />
            </div>
        )}
        
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start bg-gradient-to-b from-black/50 to-transparent">
            <button onClick={onClose} className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg">
                <X className="w-6 h-6" />
            </button>
            <div className="flex gap-2">
                <button className="bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg">
                    <Share2 className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>

      <div className="-mt-6 relative z-10 bg-white rounded-t-3xl px-5 pt-6 pb-20 min-h-screen shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
         <div className="mb-6 border-b border-gray-100 pb-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 leading-tight mb-1">{shop.name}</h1>
                    <p className="text-sm text-gray-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> {shop.address}
                    </p>
                </div>
                <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 border border-green-100">
                    <span className="text-xs font-black">4.5</span>
                    <Star className="w-3 h-3 fill-current" />
                </div>
            </div>

            <div className="flex items-center gap-4 mt-4 text-sm">
                 <div className="flex items-center gap-1.5 text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                     <Clock className="w-3.5 h-3.5" />
                     {shop.openingTime && shop.closingTime ? (
                         <span className="text-xs">{shop.openingTime} - {shop.closingTime}</span>
                     ) : (
                         <span className="text-xs">Open Now</span>
                     )}
                 </div>
                 {distance && (
                     <div className="text-gray-500 text-xs font-bold flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                         {distance} km away
                     </div>
                 )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
                <button onClick={handleCall} className="flex items-center justify-center gap-2 bg-purple-50 text-[#a82283] font-bold py-3.5 rounded-xl hover:bg-purple-100 transition-colors border border-purple-100">
                    <Phone className="w-4 h-4" /> Call Shop
                </button>
                <button onClick={handleNavigate} className="flex items-center justify-center gap-2 bg-[#a82283] text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-[#8e1d6f] transition-colors">
                    <Navigation className="w-4 h-4" /> Get Directions
                </button>
            </div>
         </div>

         <div>
            <h2 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-[#a82283]" />
                Products <span className="text-gray-400 font-medium text-sm">({items.length})</span>
            </h2>
            {items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    <p className="text-gray-400 font-bold text-sm">No products available yet.</p>
                </div>
            ) : (
                <div className="-mx-3">
                    <ProductGrid 
                        title=""
                        products={items}
                        shops={[shop]}
                        showDistance={false}
                        currentUser={currentUser}
                        onToggleLike={onToggleLike}
                        onToggleCart={onToggleCart}
                    />
                </div>
            )}
         </div>
      </div>
    </div>
  );
};