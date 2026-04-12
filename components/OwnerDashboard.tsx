import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, Shop, Item } from '../types';
import { getShops, saveShop, getItems, getAddressFromCoords, deleteItem, deleteShop, compressImage } from '../utils';
import { SmartLister } from './SmartLister';
import { WebcamCapture } from './WebcamCapture';
import { 
  Store, 
  ShoppingBag, 
  MapPin, 
  Camera, 
  X, 
  Map as MapIcon, 
  CreditCard, 
  Building2, 
  Send,
  ArrowLeft,
  Package,
  ChevronRight,
  Trash2,
  Loader2,
  Search,
  CheckCircle,
  AlertCircle,
  LocateFixed,
  Image as ImageIcon,
  Navigation
} from 'lucide-react';
import L from 'leaflet';

interface ShopMapPickerProps {
  initialLat: number;
  initialLng: number;
  initialSearch?: string;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, address: string) => void;
}

const ShopMapPicker: React.FC<ShopMapPickerProps> = ({ initialLat, initialLng, initialSearch, onClose, onConfirm }) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [address, setAddress] = useState('Locating...');
  const [currentLat, setCurrentLat] = useState(initialLat);
  const [currentLng, setCurrentLng] = useState(initialLng);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Use a callback ref to ensure the map initializes only when the DOM node is ready
  const mapContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !mapRef.current) {
        const map = L.map(node, { zoomControl: false }).setView([initialLat, initialLng], 16);
        
        // Use Google Maps Tiles for detailed street view
        L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            attribution: '&copy; Google Maps'
        }).addTo(map);

        L.control.zoom({ position: 'topright' }).addTo(map);

        const icon = L.divIcon({
            className: 'custom-pin',
            html: `<svg width="30" height="42" viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.2));">
                    <path d="M25 65C25 65 48 40.5 48 24C48 11.2975 37.7025 1 25 1C12.2975 1 2 11.2975 2 24C2 40.5 25 65 25 65Z" fill="#a82283" stroke="#8a1c6b" stroke-width="1.5"/>
                    <circle cx="25" cy="24" r="10" fill="white"/>
                </svg>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42],
        });

        const marker = L.marker([initialLat, initialLng], { draggable: true, icon }).addTo(map);
        markerRef.current = marker;

        const updateLocation = async (lat: number, lng: number) => {
            setCurrentLat(lat);
            setCurrentLng(lng);
            setAddress('Resolving...');
            try {
                const addr = await getAddressFromCoords(lat, lng);
                setAddress(typeof addr === 'string' ? addr : `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            } catch (e) {
                setAddress(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        };

        // Initial address resolve
        updateLocation(initialLat, initialLng);

        marker.on('dragend', (e) => {
            const { lat, lng } = e.target.getLatLng();
            updateLocation(lat, lng);
        });

        map.on('click', (e) => {
            marker.setLatLng(e.latlng);
            const { lat, lng } = e.latlng;
            updateLocation(lat, lng);
        });

        mapRef.current = map;
        
        // Ensure tiles load correctly by invalidating size after a brief delay
        setTimeout(() => {
            if (mapRef.current === map) {
                map.invalidateSize();
            }
        }, 200);
    }
  }, [initialLat, initialLng]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const query = searchQuery;
      if (!query.trim()) return;
      setIsSearching(true);

      try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
          const data = await response.json();
          
          if (data && data.length > 0) {
              const { lat, lon, display_name } = data[0];
              const newLat = parseFloat(lat);
              const newLng = parseFloat(lon);
              
              if (mapRef.current && markerRef.current) {
                  mapRef.current.setView([newLat, newLng], 16);
                  markerRef.current.setLatLng([newLat, newLng]);
                  setCurrentLat(newLat);
                  setCurrentLng(newLng);
                  
                  let niceAddress = display_name;
                  if (display_name && typeof display_name === 'string') {
                      const parts = display_name.split(',');
                      niceAddress = parts.slice(0, 3).join(', ');
                  }
                  setAddress(niceAddress);
              }
          } else {
              alert("Location not found");
          }
      } catch (error) {
          console.error("Search failed:", error);
          alert("Search failed. Please try again.");
      } finally {
          setIsSearching(false);
      }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            if (mapRef.current && markerRef.current) {
                mapRef.current.setView([latitude, longitude], 17);
                markerRef.current.setLatLng([latitude, longitude]);
                setCurrentLat(latitude);
                setCurrentLng(longitude);
                
                setAddress('Resolving...');
                const addr = await getAddressFromCoords(latitude, longitude);
                setAddress(addr);
            }
            setIsLocating(false);
        },
        (err) => {
            console.error(err);
            alert("Could not access location");
            setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
              <form onSubmit={handleSearch} className="flex-1 bg-white rounded-xl shadow-lg flex items-center p-1 border border-gray-100">
                  <Search className="w-5 h-5 text-gray-400 ml-3 shrink-0" />
                  <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search area, city..."
                      className="flex-1 bg-transparent p-3 text-sm outline-none font-bold text-gray-700 min-w-0"
                  />
                  <button 
                      type="submit" 
                      disabled={isSearching}
                      className="bg-[#a82283] text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-[#8a1c6b] transition-colors disabled:opacity-70"
                  >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go'}
                  </button>
              </form>
              <button onClick={onClose} className="bg-white p-3 rounded-xl shadow-lg text-black hover:bg-gray-50 border border-gray-100 shrink-0">
                  <X className="w-6 h-6" />
              </button>
          </div>
          
          <div className="flex-1 relative bg-gray-100 w-full h-full">
             <div ref={mapContainerRef} className="absolute inset-0 z-0 w-full h-full" />
             
             <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[400] pointer-events-none">
                 <div className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-gray-500 whitespace-nowrap">
                    Drag marker to adjust
                 </div>
             </div>

             <div className="absolute bottom-6 right-4 z-[400]">
                 <button 
                    onClick={handleLocateMe}
                    disabled={isLocating}
                    className="bg-white text-blue-600 px-4 py-2.5 rounded-xl shadow-md font-bold text-xs flex items-center gap-2 border border-blue-100 hover:bg-blue-50 transition-colors disabled:opacity-70"
                 >
                    {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}
                    Use my current location
                 </button>
             </div>
          </div>

          <div className="p-5 bg-white rounded-t-[2rem] shadow-[0_-4px_30px_rgba(0,0,0,0.1)] z-[400] border-t border-gray-50 relative">
              <div className="mb-5">
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">SELECTED LOCATION</p>
                  <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm shrink-0">
                         <MapPin className="w-5 h-5 text-[#a82283]" />
                      </div>
                      <p className="text-sm font-bold text-gray-900 leading-snug pt-0.5 line-clamp-2">{address}</p>
                  </div>
              </div>
              <button onClick={() => onConfirm(currentLat, currentLng, address)} className="w-full bg-[#a82283] text-white font-black py-4 rounded-2xl text-sm shadow-xl hover:bg-[#8a1c6b] active:scale-[0.98] transition-all">
                  Confirm Location
              </button>
          </div>
      </div>
  );
};

interface OwnerDashboardProps {
  user: User;
  onLogout: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<'list' | 'add-shop' | 'add-item' | 'shop-details'>('list');
  const [myShops, setMyShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [shopItems, setShopItems] = useState<Item[]>([]);
  const [shopCounts, setShopCounts] = useState<Record<string, number>>({});
  
  const [ownerName, setOwnerName] = useState('');
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [shopImage, setShopImage] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');

  const [showMapPicker, setShowMapPicker] = useState(false);
  
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  
  // Custom Delete Modal State
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    type: 'shop' | 'item';
    id: string;
    title: string;
  } | null>(null);

  // Shop Image Camera Handling
  const [showWebcam, setShowWebcam] = useState(false);
  const [showShopImageOptions, setShowShopImageOptions] = useState(false);
  const shopImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchShopsAndCounts = async () => {
        const allShops = await getShops();
        const userShops = allShops.filter(s => s.ownerId === user.id);
        setMyShops(userShops);

        const allItems = await getItems();
        const counts: Record<string, number> = {};
        userShops.forEach(s => {
            counts[s.id] = allItems.filter(i => i.shopId === s.id).length;
        });
        setShopCounts(counts);
    };
    fetchShopsAndCounts();
  }, [user.id, view]);

  useEffect(() => {
    if (selectedShop) {
        const fetchItems = async () => {
            const allItems = await getItems();
            setShopItems(allItems.filter(item => item.shopId === selectedShop.id));
        };
        fetchItems();
    }
  }, [selectedShop, view]);

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setFormError('');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
            const { latitude, longitude } = pos.coords;
            setShopLat(latitude);
            setShopLng(longitude);
            setIsLocating(false);
            
            // Always update address to match GPS location when explicit 'Locate Me' is clicked
            try {
                const addr = await getAddressFromCoords(latitude, longitude);
                setShopAddress(addr);
            } catch (err) {
                console.error("Address lookup failed", err);
            }
        }, 
        () => {
            alert("Could not get location. Try using the Map Pin.");
            setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
        alert("Geolocation is not supported. Please use the Map Pin.");
    }
  };

  const handleShopImageFile = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
          const compressed = await compressImage(reader.result as string);
          setShopImage(compressed);
      };
      reader.readAsDataURL(file);
      setShowShopImageOptions(false);
      setShowWebcam(false);
  };

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    if (!shopName) { setFormError("Shop Name is required."); setIsSubmitting(false); return; }
    if (!shopCategory) { setFormError("Please select a Shop Category."); setIsSubmitting(false); return; }
    if (!shopAddress) { setFormError("Please set the store location using the buttons below."); setIsSubmitting(false); return; }
    
    let finalLat = shopLat;
    let finalLng = shopLng;

    // Auto-resolve location if address is provided but no pin set
    // This fixes the issue where users type address but forget to pin it
    if ((!finalLat || !finalLng) && shopAddress) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(shopAddress)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                finalLat = parseFloat(data[0].lat);
                finalLng = parseFloat(data[0].lon);
                // Also update the state so the checkmark appears next time
                setShopLat(finalLat);
                setShopLng(finalLng);
            } else {
                 setFormError("Address not found on map. Please click 'Map Pin' to set location manually.");
                 setIsSubmitting(false);
                 return;
            }
        } catch (err) {
            console.warn("Could not geocode address automatically", err);
            setFormError("Could not verify address automatically. Please click 'Map Pin' to set location.");
            setIsSubmitting(false);
            return;
        }
    }

    if (!finalLat || !finalLng) { 
        setFormError("Location missing. Please click 'Map Pin' to set store location."); 
        setIsSubmitting(false); 
        return; 
    }
    
    try {
        const newShop: Shop = {
            id: Date.now().toString(),
            ownerId: user.id,
            ownerName: ownerName || user.name,
            name: shopName,
            phone: shopPhone,
            address: shopAddress,
            category: shopCategory,
            gstNumber,
            bankInfo,
            latitude: finalLat,
            longitude: finalLng,
            image: shopImage || undefined,
            openingTime,
            closingTime
        };

        await saveShop(newShop);
        alert("Shop Profile Created!");
        
        // Reset form
        setShopName(''); setShopCategory(''); setShopPhone(''); setShopAddress(''); setGstNumber(''); setBankInfo(''); setShopLat(null); setShopLng(null); setShopImage('');
        setOwnerName(''); setOpeningTime(''); setClosingTime('');
        
        setView('list');
    } catch (err) {
        setFormError("Failed to create shop. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteItemClick = (e: React.MouseEvent, item: Item) => {
    e.stopPropagation();
    setDeleteConfirmation({ type: 'item', id: item.id, title: item.name });
  };

  const handleDeleteShopClick = (e: React.MouseEvent, shop: Shop) => {
    e.stopPropagation(); 
    setDeleteConfirmation({ type: 'shop', id: shop.id, title: shop.name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const { type, id } = deleteConfirmation;
    
    // Optimistically close modal
    setDeleteConfirmation(null);
    
    // Add to deletingIds to show spinner
    setDeletingIds(prev => new Set(prev).add(id));

    try {
        if (type === 'shop') {
            await deleteShop(id);
            setMyShops(current => current.filter(s => s.id !== id)); 
            if (selectedShop?.id === id) {
              setSelectedShop(null);
              setView('list');
            }
        } else {
            await deleteItem(id);
            setShopItems(current => current.filter(item => item.id !== id));
        }
    } catch (err) {
        alert("Failed to delete.");
        console.error(err);
    } finally {
        setDeletingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }
  };

  const openShopDetails = (shop: Shop) => {
    setSelectedShop(shop);
    setView('shop-details');
  };

  const handleSmartListerSuccess = async () => {
    if (selectedShop) {
        const allItems = await getItems();
        setShopItems(allItems.filter(item => item.shopId === selectedShop.id));
        setView('shop-details');
    } else {
        setView('list');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] pb-24">
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm border-b border-gray-100">
        <h1 className="text-[#a82283] font-black text-lg tracking-tight">Owner Dashboard</h1>
        <button onClick={onLogout} className="bg-gray-100 text-black px-4 py-1.5 rounded-lg text-xs font-black hover:bg-gray-200 transition-colors">Back</button>
      </header>

      <main className="max-w-2xl mx-auto p-4 md:p-8">
        {view === 'list' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-black">My Business</h2>
              <div className="flex gap-2">
                  <button onClick={() => setView('add-shop')} className="bg-[#a82283] text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5" /> + Shop
                  </button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {myShops.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-200">
                    <Store className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold text-sm">No shops found.</p>
                    <button onClick={() => setView('add-shop')} className="mt-3 text-[#a82283] font-black text-xs hover:underline">Register your first shop</button>
                 </div>
              ) : (
                myShops.map(shop => (
                  <div key={shop.id} onClick={() => openShopDetails(shop)} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all cursor-pointer group relative">
                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 border border-purple-100 overflow-hidden relative">
                      {shop.image ? <img src={shop.image} className="w-full h-full object-cover" /> : <Store className="text-[#a82283] w-7 h-7" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-black text-base truncate group-hover:text-[#a82283] transition-colors">{shop.name}</h3>
                      <p className="text-xs text-gray-600 font-bold truncate flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {shop.address}</p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-block text-[10px] bg-purple-50 text-[#a82283] px-2 py-0.5 rounded-md font-bold">
                            View Items
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                            <Package className="w-3 h-3" /> {shopCounts[shop.id] || 0} Products
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-black transition-colors" />
                        <button 
                            onClick={(e) => handleDeleteShopClick(e, shop)}
                            disabled={deletingIds.has(shop.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all z-10 disabled:opacity-50"
                            title="Delete Shop"
                            type="button"
                        >
                            {deletingIds.has(shop.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {view === 'shop-details' && selectedShop && (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => { setSelectedShop(null); setView('list'); }} className="p-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
                        <ArrowLeft className="w-5 h-5 text-black" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black text-black">{selectedShop.name}</h2>
                        <p className="text-xs font-bold text-gray-500">Managing Inventory</p>
                    </div>
                    <button 
                        onClick={(e) => handleDeleteShopClick(e, selectedShop)}
                        disabled={deletingIds.has(selectedShop.id)}
                        className="ml-auto bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="Delete Shop"
                        type="button"
                    >
                        {deletingIds.has(selectedShop.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-base font-black text-black flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#a82283]" /> 
                            Products ({shopItems.length})
                        </h3>
                        <button onClick={() => setView('add-item')} className="text-[11px] font-black bg-[#a82283] text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-[#8a1c6b] transition-colors shadow-lg active:scale-95">
                            <Camera className="w-3.5 h-3.5" />
                            AI Scan Item
                        </button>
                    </div>

                    {shopItems.length === 0 ? (
                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-3xl">
                            <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-400">No items in this shop yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {shopItems.map(item => (
                                <div key={item.id} className="flex gap-4 p-3 bg-white rounded-2xl border border-gray-100 items-center shadow-sm hover:shadow-md transition-all">
                                    <div className="w-16 h-16 shrink-0 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center">
                                         <img src={item.image} className="w-full h-full object-cover mix-blend-multiply" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-sm text-gray-900 leading-tight mb-1 truncate">{item.name}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-black text-[#a82283]">{item.price}</span>
                                            {item.originalPrice && <span className="text-[10px] text-gray-400 line-through">{item.originalPrice}</span>}
                                        </div>
                                        {item.tag && <span className="inline-block mt-1.5 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-0.5 rounded-md border border-green-100">{item.tag}</span>}
                                    </div>
                                    <button 
                                      onClick={(e) => handleDeleteItemClick(e, item)}
                                      disabled={deletingIds.has(item.id)}
                                      className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-500 rounded-full hover:bg-red-100 active:scale-95 transition-all shadow-sm disabled:opacity-50 disabled:scale-100"
                                      title="Delete Product"
                                      type="button"
                                    >
                                        {deletingIds.has(item.id) ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {view === 'add-shop' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-50 overflow-hidden">
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-3 mb-10">
                <button onClick={() => setView('list')} className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5 text-black" />
                </button>
                <h2 className="text-2xl font-black text-black tracking-tight">Register Shop</h2>
              </div>
              
              {formError && (
                  <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-in slide-in-from-top-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      {formError}
                  </div>
              )}

              <form onSubmit={handleAddShop} className="space-y-8">
                
                <section>
                    <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-4 block">OWNER NAME</label>
                    <input 
                        type="text" 
                        placeholder="Enter Owner Name"
                        value={ownerName} 
                        onChange={e => { setOwnerName(e.target.value); setFormError(''); }}
                        className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                    />
                </section>

                <section>
                  <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-4 block">SHOP DETAILS</label>
                  
                  <div className="flex gap-4 mb-4">
                    <input 
                        type="text" 
                        placeholder="Shop Name" 
                        required 
                        value={shopName} 
                        onChange={e => { setShopName(e.target.value); setFormError(''); }} 
                        onClick={() => {
                            if (!shopLat || !shopLng) {
                                handleGetCurrentLocation();
                            }
                        }}
                        className="flex-1 bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                    />
                    
                    <div className="relative">
                        <button 
                            type="button"
                            onClick={() => setShowShopImageOptions(!showShopImageOptions)}
                            className="w-16 h-16 bg-white border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center cursor-pointer hover:border-[#a82283] transition overflow-hidden"
                        >
                            {shopImage ? <img src={shopImage} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-black" />}
                        </button>

                        {showShopImageOptions && (
                            <>
                                <div className="fixed inset-0 z-[50]" onClick={() => setShowShopImageOptions(false)}></div>
                                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in-95">
                                    <button 
                                        type="button"
                                        onClick={() => { setShowWebcam(true); setShowShopImageOptions(false); }}
                                        className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <Camera className="w-4 h-4 text-[#a82283]" /> Take Photo
                                    </button>
                                    <div className="h-px bg-gray-50 mx-2 my-0.5"></div>
                                    <button 
                                        type="button"
                                        onClick={() => shopImageInputRef.current?.click()}
                                        className="w-full text-left px-4 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                    >
                                        <ImageIcon className="w-4 h-4 text-gray-500" /> From Gallery
                                    </button>
                                </div>
                            </>
                        )}
                        <input 
                            type="file" 
                            ref={shopImageInputRef}
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleShopImageFile(file);
                            }} 
                        />
                    </div>
                  </div>

                  <div className="relative mb-4">
                     <select 
                        value={shopCategory} 
                        onChange={e => { setShopCategory(e.target.value); setFormError(''); }} 
                        className={`w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black outline-none focus:ring-2 focus:ring-[#a82283]/10 appearance-none ${!shopCategory ? 'text-gray-400' : 'text-black'}`}
                     >
                        <option value="" disabled>Select Shop Category</option>
                        <option value="Mobiles">Mobiles</option>
                        <option value="Fashion">Fashion</option>
                        <option value="Shoes">Shoes</option>
                        <option value="Jewellery">Jewellery</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Beauty">Beauty</option>
                        <option value="Watches">Watches</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Grocery">Grocery</option>
                        <option value="Other">Other</option>
                     </select>
                     <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                  </div>

                  <div className="flex gap-4 mb-4">
                      <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-400 mb-1.5 block ml-1">OPENING TIME</label>
                          <input 
                              type="time" 
                              value={openingTime} 
                              onChange={e => setOpeningTime(e.target.value)} 
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                          />
                      </div>
                      <div className="flex-1">
                          <label className="text-[10px] font-bold text-gray-400 mb-1.5 block ml-1">CLOSING TIME</label>
                          <input 
                              type="time" 
                              value={closingTime} 
                              onChange={e => setClosingTime(e.target.value)} 
                              className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                          />
                      </div>
                  </div>

                  <input 
                    type="tel" 
                    placeholder="Phone Number (Optional)" 
                    value={shopPhone} 
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      if (val.length <= 10) {
                        setShopPhone(val);
                      }
                    }} 
                    maxLength={10}
                    className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 px-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10 mb-4" 
                  />
                </section>

                <section>
                    <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-4 block">BUSINESS INFO</label>
                    
                    <div className="relative mb-4">
                        <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="GST Number" 
                            value={gstNumber} 
                            onChange={e => setGstNumber(e.target.value)} 
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                        />
                    </div>

                    <div className="relative">
                        <Building2 className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Bank Info (Account No, IFSC, Branch Name)" 
                            value={bankInfo} 
                            onChange={e => setBankInfo(e.target.value)} 
                            className="w-full bg-[#f8fafc] border border-gray-200 rounded-2xl py-4 pl-14 pr-6 text-sm font-black text-black outline-none focus:ring-2 focus:ring-[#a82283]/10" 
                        />
                    </div>
                </section>

                <section>
                    <label className="text-[11px] font-black text-black uppercase tracking-[0.2em] mb-4 block">LOCATION</label>
                    <div className="flex gap-4">
                        <button 
                            type="button" 
                            onClick={handleGetCurrentLocation} 
                            disabled={isLocating}
                            className={`flex-1 font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-70 border ${
                                shopLat && shopLng ? 'bg-green-50 text-green-700 border-green-100' : 'bg-[#fdf0f8] text-[#a82283] border-transparent hover:bg-[#fae3f1]'
                            }`}
                        >
                            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : (shopLat && shopLng ? <CheckCircle className="w-4 h-4" /> : <Navigation className="w-4 h-4" />)}
                            {isLocating ? 'Locating...' : (shopLat && shopLng ? 'Location Set' : 'Locate Me')}
                        </button>
                        <button type="button" onClick={() => setShowMapPicker(true)} className="flex-[0.6] bg-white border border-gray-200 text-black font-black text-xs py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm">
                            <MapIcon className="w-4 h-4" /> Map Pin
                        </button>
                    </div>
                    {(shopLat && shopLng) && (
                        <div className="mt-2 flex items-center gap-2 text-[10px] text-green-600 font-bold bg-green-50 px-3 py-1.5 rounded-lg w-fit">
                            <MapPin className="w-3 h-3" /> 
                            {shopAddress ? shopAddress : `Location set: ${shopLat.toFixed(4)}, ${shopLng.toFixed(4)}`}
                        </div>
                    )}
                </section>
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-[#a82283] text-white font-black py-5 rounded-[1.5rem] text-base shadow-xl active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Creating...
                        </>
                    ) : (
                        'Create Shop Profile'
                    )}
                </button>
              </form>
            </div>
          </div>
        )}

        {view === 'add-item' && (
           <SmartLister 
              shopId={selectedShop?.id} 
              onClose={() => setView(selectedShop ? 'shop-details' : 'list')}
              onSuccess={handleSmartListerSuccess}
           />
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-[2rem] w-full max-w-[320px] p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 scale-100">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-lg">
                      <Trash2 className="w-10 h-10 text-red-500" strokeWidth={2.5} />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Delete {deleteConfirmation.type === 'shop' ? 'Shop' : 'Item'}?</h3>
                  <p className="text-gray-500 text-sm font-medium mb-8 leading-relaxed">
                      Are you sure you want to delete <br/>
                      <span className="text-gray-900 font-bold">"{deleteConfirmation.title}"</span>?
                      {deleteConfirmation.type === 'shop' && <span className="block mt-1 text-red-500 text-xs">All products inside will also be deleted.</span>}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <button 
                          onClick={() => setDeleteConfirmation(null)}
                          className="py-3.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="py-3.5 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-colors active:scale-95"
                      >
                          Yes, Delete
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showMapPicker && (
         <ShopMapPicker 
            initialLat={shopLat || 26.2183} 
            initialLng={shopLng || 78.1828} 
            initialSearch={shopAddress}
            onClose={() => setShowMapPicker(false)}
            onConfirm={(lat, lng, address) => {
                setShopLat(lat);
                setShopLng(lng);
                if(address) setShopAddress(address);
                setShowMapPicker(false);
            }}
         />
      )}

      {showWebcam && (
          <WebcamCapture 
            onCapture={handleShopImageFile}
            onClose={() => setShowWebcam(false)} 
          />
      )}
    </div>
  );
};