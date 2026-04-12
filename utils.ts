import { User, Shop, Item } from './types';

// --- INDEXED DB SETUP ---
const DB_NAME = 'shopioo_db_v3';
const DB_VERSION = 1;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('users')) db.createObjectStore('users', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('shops')) db.createObjectStore('shops', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('items')) db.createObjectStore('items', { keyPath: 'id' });
    };
  });
};

const tx = <T>(storeName: string, mode: IDBTransactionMode, callback: (store: IDBObjectStore) => IDBRequest<T> | void): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    try {
        const db = await openDB();
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = callback(store);
        
        if (request) {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        } else {
            transaction.oncomplete = () => resolve(undefined as T);
            transaction.onerror = () => reject(transaction.error);
        }
    } catch(e) { reject(e); }
  });
};

// --- IMAGE COMPRESSION UTILS ---
export const compressImage = (base64Str: string, maxWidth = 600, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxWidth) {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
          resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

// --- GEOLOCATION UTILS ---
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; 
  return Number(d.toFixed(1));
};

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

// --- DATA ACCESS METHODS (ASYNC) ---
export const getItems = async (): Promise<Item[]> => {
    return (await tx<Item[]>('items', 'readonly', store => store.getAll())) || [];
};

export const getShops = async (): Promise<Shop[]> => {
    return (await tx<Shop[]>('shops', 'readonly', store => store.getAll())) || [];
};

export const getUsers = async (): Promise<User[]> => {
    return (await tx<User[]>('users', 'readonly', store => store.getAll())) || [];
};

export const saveItem = async (item: Item) => {
  try {
    await tx('items', 'readwrite', store => store.put(item));
  } catch (error) {
    console.error("Failed to save item:", error);
    alert("Database error");
  }
};

export const deleteItem = async (itemId: string) => {
  try {
    await tx('items', 'readwrite', store => store.delete(itemId));
  } catch (error) {
    console.error("Failed to delete item:", error);
  }
};

export const saveShop = async (shop: Shop) => {
  try {
    await tx('shops', 'readwrite', store => store.put(shop));
  } catch (error) {
    console.error("Failed to save shop:", error);
    alert("Database error");
  }
};

export const deleteShop = async (shopId: string) => {
  try {
    await tx('shops', 'readwrite', store => store.delete(shopId));
    // Also delete associated items
    const allItems = await getItems();
    const itemsToDelete = allItems.filter(i => i.shopId === shopId);
    for(const item of itemsToDelete) {
        await deleteItem(item.id);
    }
  } catch (error) {
    console.error("Failed to delete shop:", error);
  }
};

export const registerUser = async (user: User): Promise<boolean> => {
  try {
      const users = await getUsers();
      if (users.find(u => u.email === user.email)) return false;
      await tx('users', 'readwrite', store => store.put(user));
      return true;
  } catch (error) {
      console.error("Failed to register user", error);
      return false;
  }
};

export const updateUser = async (user: User) => {
  try {
    await tx('users', 'readwrite', store => store.put(user));
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
    }
  } catch (error) {
    console.error("Failed to update user:", error);
  }
};

export const loginUser = async (email: string, password?: string): Promise<User | undefined> => {
  const users = await getUsers();
  return users.find(u => u.email === email && u.password === password);
};

// Helper for session - keeps using localStorage for simple session persistence
const STORAGE_KEYS = {
  CURRENT_USER: 'shopioo_current_user_v2'
};

export const getCurrentUser = (): User | null => {
    const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return u ? JSON.parse(u) : null;
}

export const setCurrentUser = (user: User | null) => {
    if(user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    try {
      const controller = new AbortController();
      // Short timeout for primary to fallback quickly if needed
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Shopioo/1.0' }
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.address) {
            const rawParts = [
            data.address.suburb,
            data.address.neighbourhood,
            data.address.road,
            data.address.village,
            data.address.hamlet,
            data.address.city,
            data.address.town,
            data.address.state
            ];

            const parts = rawParts.filter((part): part is string => typeof part === 'string' && part.trim().length > 0);
            
            if (parts.length > 0) {
                return parts.slice(0, 2).join(', ');
            }
            if (data.display_name && typeof data.display_name === 'string') {
                return data.display_name.split(',').slice(0, 2).join(', ');
            }
        }
      }
    } catch (error) {
      // Nominatim failed, we will try fallback
      console.warn("Primary geocode failed, trying fallback...");
    }

    // Fallback to BigDataCloud (No API key required for client-side reverse geocoding)
    try {
        const fallbackRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
        if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            const parts = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean);
            if (parts.length > 0) return parts.slice(0, 2).join(', ');
        }
    } catch(e) {
        console.error("Fallback geocode failed", e);
    }

    // Return generic text instead of coordinates if all else fails
    return "Unknown Location";
};