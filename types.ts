import { LucideIcon } from 'lucide-react';

export type UserRole = 'user' | 'owner';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  likedItems?: string[];
  cartItems?: string[];
}

export interface Shop {
  id: string;
  ownerId: string;
  ownerName: string;
  name: string;
  address: string;
  phone?: string;
  category?: string;
  gstNumber?: string;
  bankInfo?: string;
  latitude: number;
  longitude: number;
  image?: string;
  openingTime?: string;
  closingTime?: string;
}

export interface Item {
  id: string;
  shopId: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  tag?: string;
  category?: string;
  distance?: number; // Calculated at runtime
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: LucideIcon;
}

export interface AdBanner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  type: 'online' | 'local' | 'sponsored';
}

// --- Smart Shop Types ---

export interface ProductData {
  title: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  color: string;
  tags: string[];
  condition: 'New' | 'Like New' | 'Used' | 'Refurbished';
  sources?: string[];
}

export interface ListingStep {
  current: 'capture' | 'analyzing' | 'review' | 'success';
}

export interface AnalysisResult {
  data: ProductData | null;
  imagePreview: string | null;
}
