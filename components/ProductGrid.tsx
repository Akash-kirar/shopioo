import React from 'react';
import { Item, Shop, User } from '../types';
import { Heart, MapPin, Navigation, ShoppingCart } from 'lucide-react';

interface ProductGridProps {
  title: string;
  products: Item[];
  shops: Shop[];
  showDistance?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  currentUser?: User | null;
  onToggleLike?: (productId: string) => void;
  onToggleCart?: (productId: string) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ title, products, shops, showDistance = false, userLocation, currentUser, onToggleLike, onToggleCart }) => {
  const handleNavigate = (shop: Shop) => {
    if(shop) {
        let url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
        
        if (userLocation) {
            url += `&origin=${userLocation.lat},${userLocation.lng}`;
        }
        
        window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-[#fdf0f8] py-4 px-3 my-2">
      {title && (
         <div className="flex justify-between items-center px-1 mb-3">
            <h3 className="text-lg font-bold text-[#a82283]">{title}</h3>
            {products.length > 4 && <button className="text-xs bg-white border border-[#a82283] text-[#a82283] px-3 py-1 rounded-full font-bold">View All</button>}
         </div>
      )}
      
      {products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 text-sm bg-white rounded-xl border border-dashed border-gray-200 mx-1">
            <p>No items found nearby.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
            {products.map((product) => {
            const shop = shops.find(s => s.id === product.shopId);
            const isLiked = currentUser?.likedItems?.includes(product.id);
            const isInCart = currentUser?.cartItems?.includes(product.id);
            return (
            <div key={product.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative flex flex-col h-full active:scale-[0.98] transition-transform">
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleLike) onToggleLike(product.id);
                    }}
                    className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 z-10 transition-colors shadow-sm"
                >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleCart) onToggleCart(product.id);
                    }}
                    className="absolute top-11 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-purple-600 z-10 transition-colors shadow-sm"
                >
                    <ShoppingCart className={`w-3.5 h-3.5 ${isInCart ? 'fill-purple-600 text-purple-600' : ''}`} />
                </button>

                <div className="h-36 w-full flex items-center justify-center mb-3 bg-white rounded-xl overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                </div>

                <div className="flex-1 flex flex-col px-1">
                    {product.tag && (
                         <div className="mb-1">
                            <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md">
                                {product.tag}
                            </span>
                         </div>
                    )}
                    
                    <h4 className="text-sm font-bold text-gray-800 line-clamp-2 leading-tight mb-1">
                        {product.name}
                    </h4>
                    
                    {shop && (
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mb-2 font-medium">
                             <MapPin className="w-3 h-3 text-gray-400" />
                             <span className="truncate max-w-[100px]">{shop.name}</span>
                        </div>
                    )}

                    <div className="mt-auto">
                        <div className="flex items-baseline gap-1.5 mb-3">
                            <span className="text-base font-black text-gray-900">{product.price}</span>
                            {product.originalPrice && (
                                <span className="text-[10px] text-gray-400 line-through decoration-gray-400">{product.originalPrice}</span>
                            )}
                        </div>
                        
                        <div className="border-t border-dashed border-gray-200 pt-2.5 flex items-center justify-between">
                             {showDistance && product.distance !== undefined && product.distance < 9000 ? (
                                <span className="text-xs font-bold text-[#a82283] tracking-tight">{product.distance} km away</span>
                            ) : (
                                <span className="text-[10px] text-gray-400 font-bold">Get Directions</span>
                            )}
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if(shop) handleNavigate(shop);
                                }}
                                className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 active:bg-blue-200 transition-colors shadow-sm"
                                aria-label="Get Directions"
                            >
                                <Navigation className="w-3.5 h-3.5 fill-current" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            );
            })}
        </div>
      )}
    </div>
  );
};