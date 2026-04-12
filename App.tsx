import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CategoryRail } from './components/CategoryRail';
import { BannerSection } from './components/BannerSection';
import { ProductGrid } from './components/ProductGrid';
import { BottomNav } from './components/BottomNav';
import { Auth } from './components/Auth';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ShopDetails } from './components/ShopDetails';
import { SmartLister } from './components/SmartLister';
import { AIChat } from './components/AIChat';
import { PlaySection } from './components/PlaySection';
import { Category, AdBanner, Item, User, Shop } from './types';
import { getItems, getShops, getCurrentUser, setCurrentUser, calculateDistance, getAddressFromCoords, updateUser } from './utils';
import { Smartphone, Shirt, Footprints, Armchair, Sparkles, Watch, Monitor, X, MapPin, Search, Navigation, Store, LocateFixed, Loader2, Gem, Layers, Heart, ShoppingCart } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import L from 'leaflet';

const App: React.FC = () => {
  const [currentUser, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [items, setItems] = useState<Item[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationName, setLocationName] = useState('Tap to locate...');
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');
  const [detectedTags, setDetectedTags] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isOwnerView, setIsOwnerView] = useState(false);
  
  const [selectedMapShop, setSelectedMapShop] = useState<Shop | null>(null);
  const [selectedShopForDetails, setSelectedShopForDetails] = useState<Shop | null>(null);
  const [distanceToShop, setDistanceToShop] = useState<number | null>(null);
  
  const [mapSuggestions, setMapSuggestions] = useState<Shop[]>([]);
  const [activeMapCategory, setActiveMapCategory] = useState<string | null>(null);

  const mapRef = useRef<L.Map | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const shopMarkersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const getLocation = (e?: any) => {
    // Determine if this was triggered by a user click
    const isUserAction = e && (e.type === 'click' || e === true);

    if (!navigator.geolocation) {
      setLocationName('Not supported');
      return;
    }

    // Visual feedback for user action
    if (isUserAction || locationName === 'Tap to locate...') {
        setLocationName('Locating...');
    }

    const handleSuccess = async (pos: GeolocationPosition) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const address = await getAddressFromCoords(latitude, longitude);
        setLocationName(address);
    };

    const handleError = (error: GeolocationPositionError) => {
        let message = 'Tap to locate...';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permission Denied';
            if (isUserAction) {
                alert("Location access denied. Please enable location permissions in your browser settings.");
            }
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Position Unavailable';
            break;
          case error.TIMEOUT:
            if (!isUserAction) {
                 // Retry once with lower accuracy if it was an auto-load attempt
                 navigator.geolocation.getCurrentPosition(
                    handleSuccess, 
                    () => setLocationName('Tap to locate...'), 
                    { enableHighAccuracy: false, timeout: 10000 }
                 );
                 return;
            }
            message = 'Timeout';
            break;
        }
        
        setLocationName(message);
    };

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0 
    });
  };

  const triggerCurrentLocation = () => {
      setIsLocating(true);
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser");
          setIsLocating(false);
          return;
      }

      const onLocationFound = async (position: GeolocationPosition) => {
          const { latitude, longitude } = position.coords;
          const newLatLng = new L.LatLng(latitude, longitude);

          if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng(newLatLng);
              userMarkerRef.current.setZIndexOffset(1000); 
          }

          if (mapRef.current) {
              mapRef.current.flyTo(newLatLng, 17, { 
                  animate: true, 
                  duration: 1.5 
              });
          }

          setUserLocation({ lat: latitude, lng: longitude });
          setSelectedMapShop(null);
          if (routeLineRef.current) routeLineRef.current.remove();

          setLocationName('Resolving address...');
          const address = await getAddressFromCoords(latitude, longitude);
          setLocationName(address);
          setIsLocating(false);
      };

      const onError = (error: GeolocationPositionError) => {
           console.warn("High accuracy location failed, retrying with low accuracy...", error);
           
           navigator.geolocation.getCurrentPosition(
               onLocationFound,
               (finalError) => {
                   console.error("Location retrieval failed completely", finalError);
                   alert("Could not retrieve your location. Please check your GPS settings or permissions.");
                   setIsLocating(false);
               },
               { enableHighAccuracy: false, timeout: 20000, maximumAge: 0 }
           );
      };

      navigator.geolocation.getCurrentPosition(
          onLocationFound, 
          onError, 
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
  };

  const confirmPickedLocation = async () => {
    if (userMarkerRef.current) {
        const { lat, lng } = userMarkerRef.current.getLatLng();
        setUserLocation({ lat, lng });
        setLocationName('Resolving...');
        const address = await getAddressFromCoords(lat, lng);
        setLocationName(address);
        setShowMap(false);
    }
  };

  const handleMapInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMapSearchQuery(val);
    
    if (val.trim()) {
        const matches = shops.filter(s => 
            s.name.toLowerCase().includes(val.toLowerCase()) || 
            (s.category && s.category.toLowerCase().includes(val.toLowerCase()))
        ).slice(0, 5);
        setMapSuggestions(matches);
    } else {
        setMapSuggestions([]);
    }
  };

  const handleShopSuggestionClick = (shop: Shop) => {
    setMapSearchQuery(shop.name);
    setMapSuggestions([]);
    
    if (mapRef.current) {
       mapRef.current.flyTo([shop.latitude, shop.longitude], 18);
       setSelectedMapShop(shop);
       
       if (userMarkerRef.current) {
            const userPos = userMarkerRef.current.getLatLng();
            const dist = calculateDistance(userPos.lat, userPos.lng, shop.latitude, shop.longitude);
            setDistanceToShop(dist);

            if (routeLineRef.current) routeLineRef.current.remove();
            routeLineRef.current = L.polyline([
                [userPos.lat, userPos.lng],
                [shop.latitude, shop.longitude]
            ], { color: '#2563eb', weight: 5, opacity: 0.8, dashArray: '10, 10' }).addTo(mapRef.current);
       }
    }
  };

  const handleToggleLike = async (productId: string) => {
    if (!currentUser) {
      alert("Please login to like items.");
      return;
    }

    const likedItems = currentUser.likedItems || [];
    const isLiked = likedItems.includes(productId);
    
    const newLikedItems = isLiked 
      ? likedItems.filter(id => id !== productId)
      : [...likedItems, productId];

    const updatedUser = { ...currentUser, likedItems: newLikedItems };
    setUser(updatedUser);
    await updateUser(updatedUser);
  };

  const handleToggleCart = async (productId: string) => {
    if (!currentUser) {
      alert("Please login to add items to cart.");
      return;
    }

    const cartItems = currentUser.cartItems || [];
    const isInCart = cartItems.includes(productId);
    
    const newCartItems = isInCart 
      ? cartItems.filter(id => id !== productId)
      : [...cartItems, productId];

    const updatedUser = { ...currentUser, cartItems: newCartItems };
    setUser(updatedUser);
    await updateUser(updatedUser);
  };

  const handleMapSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setMapSuggestions([]);
    if (!mapSearchQuery.trim()) return;
    
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}`);
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            const newLat = parseFloat(lat);
            const newLng = parseFloat(lon);
            
            if (mapRef.current && userMarkerRef.current) {
                const newLatLng = new L.LatLng(newLat, newLng);
                mapRef.current.setView(newLatLng, 15);
                userMarkerRef.current.setLatLng(newLatLng);
                setSelectedMapShop(null);
                if (routeLineRef.current) routeLineRef.current.remove();
                
                let name = mapSearchQuery;
                if (data[0]?.display_name && typeof data[0].display_name === 'string') {
                    name = data[0].display_name.split(',').slice(0, 2).join(', ');
                }
                setLocationName(name);
                setUserLocation({ lat: newLat, lng: newLng });
            }
        }
    } catch (err) {
        console.error("Search failed", err);
    }
  };

  useEffect(() => {
    if (!showMap || !mapContainerRef.current) return;

    setMapSearchQuery('');
    setSelectedMapShop(null);
    setMapSuggestions([]);
    setActiveMapCategory(null);
    
    const initialLat = userLocation?.lat || 26.2183;
    const initialLng = userLocation?.lng || 78.1828;
    const initialZoom = userLocation ? 16 : 13;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView([initialLat, initialLng], initialZoom);
    
    L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    setTimeout(() => {
        if (mapRef.current === map) {
            map.invalidateSize();
        }
    }, 100);

    const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: `<svg width="24" height="34" viewBox="0 0 50 70" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 1px 2px rgba(0,0,0,0.3));">
                <path d="M25 65C25 65 48 40.5 48 24C48 11.2975 37.7025 1 25 1C12.2975 1 2 11.2975 2 24C2 40.5 25 65 25 65Z" fill="#DC2626" stroke="#B91C1C" stroke-width="1.5"/>
                <circle cx="25" cy="24" r="12" fill="white"/>
              </svg>`,
        iconSize: [24, 34],
        iconAnchor: [12, 34],
        popupAnchor: [0, -34]
    });

    const marker = L.marker([initialLat, initialLng], { draggable: true, icon: userIcon }).addTo(map);
    
    marker.on('dragend', () => {
         setSelectedMapShop(null);
         if (routeLineRef.current) routeLineRef.current.remove();
    });
    
    map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        setSelectedMapShop(null);
        if (routeLineRef.current) routeLineRef.current.remove();
    });

    mapRef.current = map; 
    userMarkerRef.current = marker;

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            userMarkerRef.current = null;
            shopMarkersRef.current = [];
            routeLineRef.current = null;
        }
    };
  }, [showMap]);

  useEffect(() => {
    if (!showMap || !mapRef.current) return;

    shopMarkersRef.current.forEach(m => m.remove());
    shopMarkersRef.current = [];

    const shopsToDisplay = activeMapCategory 
        ? shops.filter(s => s.category === activeMapCategory) 
        : shops;

    shopsToDisplay.forEach(shop => {
        const shopIcon = L.divIcon({
            className: 'custom-shop-icon',
            html: `<div style="background-color: #a82283; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); transition: transform 0.2s;">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
                   </div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
        });

        const marker = L.marker([shop.latitude, shop.longitude], { icon: shopIcon }).addTo(mapRef.current!);
        
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            setSelectedMapShop(shop);
            
            if (userMarkerRef.current) {
                const userPos = userMarkerRef.current.getLatLng();
                const dist = calculateDistance(userPos.lat, userPos.lng, shop.latitude, shop.longitude);
                setDistanceToShop(dist);

                if (routeLineRef.current) routeLineRef.current.remove();
                routeLineRef.current = L.polyline([
                    [userPos.lat, userPos.lng],
                    [shop.latitude, shop.longitude]
                ], { color: '#2563eb', weight: 5, opacity: 0.8, dashArray: '10, 10' }).addTo(mapRef.current!);
                
                mapRef.current!.fitBounds(routeLineRef.current.getBounds(), { padding: [100, 100], maxZoom: 16 });
            }
        });
        shopMarkersRef.current.push(marker);
    });
  }, [showMap, shops, activeMapCategory]);

  useEffect(() => {
    const u = getCurrentUser();
    if(u) setUser(u);
    refreshData();
  }, []);

  useEffect(() => {
    if (!isOwnerView) {
        refreshData();
    }
  }, [isOwnerView]);

  const refreshData = async () => {
      const allShops = await getShops();
      setShops(allShops);
      const allItems = await getItems();
      setItems(allItems);
  };

  useEffect(() => {
    if (userLocation && items.length > 0 && shops.length > 0) {
        const itemsWithDist = items.map(item => {
            const shop = shops.find(s => s.id === item.shopId);
            const dist = shop ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : 9999;
            return { ...item, distance: dist };
        }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
        setFilteredItems(itemsWithDist);
    } else {
        setFilteredItems(items);
    }
  }, [userLocation, items, shops]);

  const handleLogin = (u: User) => { setUser(u); setCurrentUser(u); refreshData(); };
  
  const handleLogout = () => { setUser(null); setCurrentUser(null); };

  const handleSearch = (query: string) => {
    setIsSearching(!!query);
    setSearchStatus(query ? `Searching for "${query}"` : '');
    setDetectedTags([]);
    if (!query) { refreshData(); return; }
    const lowerQ = query.toLowerCase();
    const results = items.filter(i => i.name.toLowerCase().includes(lowerQ) || i.tag?.toLowerCase().includes(lowerQ));
    setFilteredItems(results.map(item => {
         const shop = shops.find(s => s.id === item.shopId);
         const dist = (shop && userLocation) ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : 9999;
         return { ...item, distance: dist };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0)));
  };

  const handleImageSearch = async (file: File) => {
    setActiveTab('home'); // Switch to home to show results
    setIsSearching(true);
    setSearchStatus('Scanning product...');
    setDetectedTags([]);

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: file.type, data: base64Data } },
                        { text: `Analyze this product image for a shopping app.
                                 Return a valid JSON object with these specific fields:
                                 - category: Must be one of [Mobiles, Fashion, Shoes, Furniture, Beauty, Watches, Electronics, Jewellery, Grocery, Other]. Choose the closest match.
                                 - productType: A short string identifying the item (e.g. 'Sneaker', 'Sofa', 'Smartphone', 'Dress').
                                 - color: The dominant color name.
                                 - synonyms: An array of 5 synonyms for the productType (e.g. if 'Sneaker', return ['Shoes', 'Trainers', 'Footwear', 'Kicks', 'Running Shoes']).
                                 - visualTags: An array of 5 specific visual descriptors (e.g. 'leather', 'high-top', 'floral', 'modern', 'casual').`
                        }
                    ]
                },
                config: {
                    responseMimeType: "application/json"
                }
            });

            const analysis = JSON.parse(response.text);
            const { category, productType, color, visualTags, synonyms } = analysis;

            setSearchStatus(`Found: ${productType}`);
            setDetectedTags([category, color, ...(visualTags || []).slice(0, 2)]);

            const scoredItems = items.map(item => {
                let score = 0;
                const shop = shops.find(s => s.id === item.shopId);
                
                const itemText = (item.name + ' ' + (item.tag || '') + ' ' + (item.category || '')).toLowerCase();
                const shopCategory = (shop?.category || '').toLowerCase();
                const detectedCategory = category.toLowerCase();
                
                const isCategoryMatch = shopCategory.includes(detectedCategory) || (item.category && item.category.toLowerCase().includes(detectedCategory));
                
                if (isCategoryMatch) {
                    score += 30;
                } else {
                    score -= 10;
                }

                if (itemText.includes(productType.toLowerCase())) {
                    score += 20;
                }

                if (Array.isArray(synonyms)) {
                    synonyms.forEach((syn: string) => {
                         if (itemText.includes(syn.toLowerCase())) {
                             score += 15;
                         }
                    });
                }

                if (Array.isArray(visualTags)) {
                    visualTags.forEach((tag: string) => {
                        if (itemText.includes(tag.toLowerCase())) {
                            score += 5;
                        }
                    });
                }
                if (itemText.includes(color.toLowerCase())) {
                    score += 5;
                }

                return { ...item, matchScore: score };
            });

            const results = scoredItems
                .filter(i => i.matchScore > 0)
                .sort((a, b) => b.matchScore - a.matchScore)
                .map(({ matchScore, ...item }) => item);

            const finalResults = results.map(item => {
                 const shop = shops.find(s => s.id === item.shopId);
                 const dist = (shop && userLocation) ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : 9999;
                 return { ...item, distance: dist };
            });

            setFilteredItems(finalResults);
        };
    } catch (e) {
        console.error("Image search error:", e);
        setSearchStatus('Could not identify product. Try again.');
        setFilteredItems([]);
    }
  };

  const handleCategoryClick = async (categoryName: string) => {
    setActiveTab('home');
    setDetectedTags([]);
    
    if (categoryName === 'All') {
        setIsSearching(false);
        setSearchStatus('');
        
        if (userLocation && items.length > 0 && shops.length > 0) {
             const itemsWithDist = items.map(item => {
                const shop = shops.find(s => s.id === item.shopId);
                const dist = shop ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : 9999;
                return { ...item, distance: dist };
            }).sort((a, b) => (a.distance || 0) - (b.distance || 0));
            setFilteredItems(itemsWithDist);
        } else {
            setFilteredItems(items);
        }
        return;
    }

    setIsSearching(true);
    setSearchStatus(`Category: ${categoryName}`);
    
    // We can rely on 'items' state since it is loaded
    const currentItems = items; 

    const results = currentItems.filter(i => {
        const shop = shops.find(s => s.id === i.shopId);
        const matchesShopCategory = shop?.category === categoryName;
        const matchesItemCategory = i.category === categoryName || (i.tag && i.tag.includes(categoryName));
        return matchesShopCategory || matchesItemCategory;
    });

    const resultsWithDist = results.map(item => {
         const shop = shops.find(s => s.id === item.shopId);
         const dist = (shop && userLocation) ? calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude) : 9999;
         return { ...item, distance: dist };
    }).sort((a, b) => (a.distance || 0) - (b.distance || 0));

    setFilteredItems(resultsWithDist);
  };

  const categories: Category[] = [
    { id: '1', name: 'Mobiles', icon: Smartphone }, { id: '2', name: 'Fashion', icon: Shirt },
    { id: '3', name: 'Shoes', icon: Footprints }, { id: '4', name: 'Furniture', icon: Armchair },
    { id: '5', name: 'Beauty', icon: Sparkles }, { id: '6', name: 'Watches', icon: Watch },
    { id: '7', name: 'Electronics', icon: Monitor }, { id: '8', name: 'Jewellery', icon: Gem },
  ];
  
  const onlineAds: AdBanner[] = [{ id: 'o1', title: 'Summer Sale', subtitle: 'Up to 50% Off', image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80', type: 'online' }];
  const localAds: AdBanner[] = [{ id: 'l1', title: 'Nearby Fresh', subtitle: 'Organic items', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80', type: 'local' }];

  if (!currentUser) {
    return <Auth onLogin={handleLogin} />;
  }

  if (isOwnerView) {
      return <OwnerDashboard user={currentUser} onLogout={() => setIsOwnerView(false)} />;
  }

  return (
    <div className="min-h-screen pb-16 bg-white">
        {showMap && (
             <div className="fixed inset-0 z-[60] bg-white flex flex-col">
                     <div className="absolute top-4 left-4 right-4 z-[400] flex gap-2">
                        <form onSubmit={handleMapSearch} className="flex-1 flex relative shadow-lg">
                            <input 
                                type="text" 
                                value={mapSearchQuery}
                                onChange={handleMapInputChange} 
                                placeholder="Search shops or areas..." 
                                className="w-full bg-white text-gray-900 text-xs font-bold rounded-xl pl-10 pr-4 py-3.5 outline-none focus:ring-2 focus:ring-[#a82283] placeholder-gray-400 border border-gray-100"
                            />
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            
                            {mapSuggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[401] animate-in fade-in slide-in-from-top-1">
                                    {mapSuggestions.map(shop => (
                                        <button key={shop.id} onClick={() => handleShopSuggestionClick(shop)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors">
                                            <div className="bg-purple-50 p-2 rounded-lg"><Store className="w-4 h-4 text-[#a82283]" /></div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-900">{shop.name}</p>
                                                <p className="text-[10px] text-gray-500">{shop.category}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </form>
                        <button onClick={() => setShowMap(false)} className="bg-white p-3 rounded-xl text-gray-700 shadow-lg hover:bg-gray-50 transition-colors border border-gray-100"><X className="w-5 h-5"/></button>
                    </div>

                    <div className="absolute top-20 left-4 right-0 z-[399] overflow-x-auto no-scrollbar pl-1 pr-4">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setActiveMapCategory(null)}
                                className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border whitespace-nowrap transition-colors ${!activeMapCategory ? 'bg-[#a82283] text-white border-[#a82283]' : 'bg-white text-gray-700 border-gray-100'}`}
                            >
                                All Shops
                            </button>
                            {categories.map(cat => (
                                 <button 
                                    key={cat.id}
                                    onClick={() => setActiveMapCategory(cat.name === activeMapCategory ? null : cat.name)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border whitespace-nowrap transition-colors ${cat.name === activeMapCategory ? 'bg-[#a82283] text-white border-[#a82283]' : 'bg-white text-gray-700 border-gray-100'}`}
                                 >
                                    {cat.name}
                                 </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 bg-gray-100 relative">
                        <div ref={mapContainerRef} className="w-full h-full z-0" />
                        <button onClick={triggerCurrentLocation} className="absolute bottom-6 right-4 z-[400] bg-white text-blue-600 p-3 rounded-full shadow-lg hover:bg-gray-50 active:scale-90 transition-all border border-gray-100">
                           {isLocating ? <Loader2 className="w-6 h-6 animate-spin" /> : <LocateFixed className="w-6 h-6" />}
                        </button>
                    </div>
                    
                    <div className="p-5 bg-white border-t border-gray-100 z-[400]">
                         {selectedMapShop ? (
                             <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100 shrink-0">
                                        <Store className="w-6 h-6 text-[#a82283]" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-gray-900 truncate text-lg">{selectedMapShop.name}</h4>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                                                <Navigation className="w-3 h-3 fill-current" /> 
                                                {distanceToShop} km
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium truncate bg-gray-100 px-2 py-0.5 rounded-full">{selectedMapShop.category}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                     <button onClick={() => { setSelectedShopForDetails(selectedMapShop); }} className="bg-white border border-[#a82283] text-[#a82283] font-bold py-3 rounded-xl hover:bg-purple-50 transition-colors">
                                        View Products
                                     </button>
                                     <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedMapShop.latitude},${selectedMapShop.longitude}`, '_blank')} className="bg-[#a82283] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#901d70] flex items-center justify-center gap-2">
                                        <Navigation className="w-4 h-4" /> Navigate
                                    </button>
                                </div>
                             </div>
                         ) : (
                             <>
                                <div className="mb-5">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">SELECTED LOCATION</p>
                                    <div className="flex items-start gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm shrink-0">
                                            <MapPin className="w-5 h-5 text-[#a82283]" />
                                        </div>
                                        <p className="text-sm font-bold text-gray-900 leading-snug pt-0.5 line-clamp-2">{locationName}</p>
                                    </div>
                                </div>
                                <button onClick={confirmPickedLocation} className="w-full bg-[#a82283] text-white font-black py-4 rounded-2xl text-sm shadow-xl hover:bg-[#8a1c6b] active:scale-[0.98] transition-all">
                                    Confirm Location
                                </button>
                             </>
                         )}
                    </div>
             </div>
        )}

        {activeTab !== 'smart' && activeTab !== 'ai-chat' && (
            <Header 
                userLocation={locationName} 
                onSearch={handleSearch} 
                onImageSearch={handleImageSearch}
                onLogout={handleLogout}
                onLocationClick={getLocation}
                onMapClick={() => setShowMap(true)}
                onOwnerClick={() => setIsOwnerView(true)}
            />
        )}
        
        {activeTab === 'home' && (
            <main>
                <CategoryRail categories={categories} onCategoryClick={handleCategoryClick} />
                <BannerSection ads={[...onlineAds, ...localAds]} />
                
                {detectedTags.length > 0 && (
                    <div className="px-4 mb-2 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2">
                        {detectedTags.map((tag, idx) => (
                            <span key={idx} className="bg-purple-100 text-[#a82283] px-3 py-1 rounded-full text-[10px] font-bold capitalize">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
                
                <ProductGrid 
                    title={isSearching ? searchStatus : "Nearby Products"} 
                    products={filteredItems}
                    shops={shops}
                    showDistance={!!userLocation}
                    userLocation={userLocation}
                    currentUser={currentUser}
                    onToggleLike={handleToggleLike}
                    onToggleCart={handleToggleCart}
                />
            </main>
        )}
        
        {activeTab === 'play' && (
             <PlaySection 
                items={items}
                shops={shops}
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onToggleCart={handleToggleCart}
                userLocation={userLocation}
             />
        )}
        
        {activeTab === 'categories' && (
             <div className="p-4 grid grid-cols-4 gap-4">
                {categories.map(cat => (
                    <div key={cat.id} onClick={() => handleCategoryClick(cat.name)} className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 active:scale-95 transition-transform cursor-pointer">
                        <cat.icon className="w-8 h-8 text-[#a82283]" />
                        <span className="text-xs font-bold text-gray-700 text-center">{cat.name}</span>
                    </div>
                ))}
             </div>
        )}

        {activeTab === 'smart' && (
             <SmartLister />
        )}

        {activeTab === 'ai-chat' && (
             <AIChat 
                shops={shops} 
                items={items} 
                userLocation={userLocation} 
                locationName={locationName} 
             />
        )}

        {activeTab === 'cart' && (
             <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-gray-900 mb-6">Your Cart</h2>
                    {(!currentUser.cartItems || currentUser.cartItems.length === 0) ? (
                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-bold text-base">Your cart is empty.</p>
                            <p className="text-gray-400 text-sm mt-1">Explore products and add them to your cart.</p>
                            <button 
                                onClick={() => setActiveTab('home')}
                                className="mt-6 bg-[#a82283] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg active:scale-95 transition-transform"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="-mx-3">
                            <ProductGrid 
                                title="" 
                                products={items.filter(item => currentUser.cartItems?.includes(item.id))}
                                shops={shops}
                                showDistance={!!userLocation}
                                userLocation={userLocation}
                                currentUser={currentUser}
                                onToggleLike={handleToggleLike}
                                onToggleCart={handleToggleCart}
                            />
                        </div>
                    )}
                </div>
             </div>
        )}

        {activeTab === 'account' && (
             <div className="p-6">
                <div className="bg-gradient-to-br from-[#a82283] to-[#701a5b] rounded-3xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-1">Hello, {currentUser.name}</h2>
                        <p className="text-white/80 text-sm font-medium">{currentUser.email}</p>
                        <button onClick={() => setIsOwnerView(true)} className="mt-6 bg-white text-[#a82283] px-6 py-2.5 rounded-xl font-black text-sm shadow-lg active:scale-95 transition-transform flex items-center gap-2">
                             <Store className="w-4 h-4" /> {currentUser.role === 'owner' ? 'Manage Shop' : 'Register Shop'}
                        </button>
                    </div>
                    <Sparkles className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
                </div>
                
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Liked Items</h3>
                    {(!currentUser.likedItems || currentUser.likedItems.length === 0) ? (
                        <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Heart className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500 font-bold text-sm">No liked items yet.</p>
                            <p className="text-gray-400 text-xs mt-1">Items you like will appear here.</p>
                        </div>
                    ) : (
                        <div className="-mx-3">
                            <ProductGrid 
                                title="" 
                                products={items.filter(item => currentUser.likedItems?.includes(item.id))}
                                shops={shops}
                                showDistance={!!userLocation}
                                userLocation={userLocation}
                                currentUser={currentUser}
                                onToggleLike={handleToggleLike}
                                onToggleCart={handleToggleCart}
                            />
                        </div>
                    )}
                </div>
                
                <button onClick={handleLogout} className="w-full bg-gray-100 text-gray-900 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                    Log Out
                </button>
             </div>
        )}

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {selectedShopForDetails && (
            <ShopDetails 
                shop={selectedShopForDetails} 
                items={items.filter(i => i.shopId === selectedShopForDetails.id)}
                userLocation={userLocation} 
                onClose={() => setSelectedShopForDetails(null)} 
                currentUser={currentUser}
                onToggleLike={handleToggleLike}
                onToggleCart={handleToggleCart}
            />
        )}
    </div>
  );
};

export default App;