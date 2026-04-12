import React, { useState } from 'react';
import { Item, Shop, User } from '../types';
import { Heart, ShoppingCart, MessageCircle, Share2, MapPin, Navigation, Store, X } from 'lucide-react';

interface PlaySectionProps {
  items: Item[];
  shops: Shop[];
  currentUser?: User | null;
  onToggleLike?: (productId: string) => void;
  onToggleCart?: (productId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

interface Comment {
  id: string;
  username: string;
  text: string;
}

export const PlaySection: React.FC<PlaySectionProps> = ({ 
  items, 
  shops, 
  currentUser, 
  onToggleLike, 
  onToggleCart,
  userLocation
}) => {
  const [activeCommentItem, setActiveCommentItem] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({
    // Initial dummy comments for demonstration
    'default': [
      { id: '1', username: 'user_123', text: 'Is this available in other colors?' },
      { id: '2', username: 'shopaholic99', text: 'Looks amazing! 😍' }
    ]
  });

  const handleNavigate = (shop: Shop) => {
    if(shop) {
        let url = `https://www.google.com/maps/dir/?api=1&destination=${shop.latitude},${shop.longitude}`;
        
        if (userLocation) {
            url += `&origin=${userLocation.lat},${userLocation.lng}`;
        }
        
        window.open(url, '_blank');
    }
  };

  const handlePostComment = () => {
    if (!activeCommentItem || !newCommentText.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      username: currentUser?.name || 'Guest',
      text: newCommentText.trim()
    };

    setCommentsMap(prev => {
      const existingComments = prev[activeCommentItem] || prev['default'] || [];
      // If it's the first time commenting on this item and it doesn't have its own list,
      // copy the default list so we don't lose the dummy comments for effect, 
      // or just start fresh. Let's start fresh if no comments exist for this specific item,
      // but to keep the dummy ones visible, we'll initialize with them if empty.
      const currentItemComments = prev[activeCommentItem] ? prev[activeCommentItem] : [...(prev['default'] || [])];
      
      return {
        ...prev,
        [activeCommentItem]: [...currentItemComments, newComment]
      };
    });

    setNewCommentText('');
  };

  return (
    <div className="h-[calc(100vh-64px)] w-full bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar relative">
      {items.map((item) => {
        const shop = shops.find(s => s.id === item.shopId);
        const isLiked = currentUser?.likedItems?.includes(item.id);
        const isInCart = currentUser?.cartItems?.includes(item.id);
        
        return (
          <div key={item.id} className="h-full w-full snap-start snap-always relative flex items-center justify-center bg-zinc-900">
            {/* Background blur for better visual */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-30 blur-xl"
              style={{ backgroundImage: `url(${item.image})` }}
            />
            
            {/* Main Image */}
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-contain relative z-10"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 z-20 pointer-events-none" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-30">
              <button 
                onClick={() => onToggleLike && onToggleLike(item.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">Like</span>
              </button>

              <button 
                onClick={() => setActiveCommentItem(item.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">Comment</span>
              </button>

              <button 
                onClick={() => onToggleCart && onToggleCart(item.id)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
                  <ShoppingCart className={`w-6 h-6 ${isInCart ? 'fill-purple-500 text-purple-500' : 'text-white'}`} />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">Cart</span>
              </button>

              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: item.name,
                      text: `Check out ${item.name} at ${shop?.name}`,
                      url: window.location.href,
                    });
                  }
                }}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 group-active:scale-90 transition-transform">
                  <Share2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-white text-xs font-medium drop-shadow-md">Share</span>
              </button>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 bottom-24 right-20 z-30 text-white">
              {shop && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <Store className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-sm drop-shadow-md">{shop.name}</span>
                  <button 
                    onClick={() => handleNavigate(shop)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Navigation className="w-3 h-3" />
                    Directions
                  </button>
                </div>
              )}
              
              <h2 className="text-xl font-bold mb-1 drop-shadow-md line-clamp-2">{item.name}</h2>
              
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-black drop-shadow-md">{item.price}</span>
                {item.originalPrice && (
                  <span className="text-sm text-white/70 line-through drop-shadow-md">{item.originalPrice}</span>
                )}
              </div>
              
              {item.description && (
                <p className="text-sm text-white/90 line-clamp-2 drop-shadow-md">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Comments Modal */}
      {activeCommentItem && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none pb-16">
          <div className="absolute inset-0 bg-black/40 pointer-events-auto" onClick={() => setActiveCommentItem(null)} />
          <div className="bg-white w-full h-[60vh] rounded-t-3xl pointer-events-auto flex flex-col relative animate-in slide-in-from-bottom-full duration-300">
            <div className="flex justify-center p-3 border-b border-gray-100">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">Comments</h3>
              <button onClick={() => setActiveCommentItem(null)} className="text-gray-500 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {/* Render comments for the active item, or default dummy ones if none exist yet */}
              {(commentsMap[activeCommentItem] || commentsMap['default'] || []).map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-0.5">{comment.username}</p>
                    <p className="text-sm text-gray-800">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form 
              className="p-4 border-t border-gray-100"
              onSubmit={(e) => {
                e.preventDefault();
                handlePostComment();
              }}
            >
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a comment..." 
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#a82283]/20"
                />
                <button 
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${
                    newCommentText.trim() 
                      ? 'bg-[#a82283] text-white hover:bg-[#8a1c6b]' 
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
