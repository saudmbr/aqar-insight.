import { Platform } from 'react-native';

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN;
export const API_BASE = DOMAIN
  ? `https://${DOMAIN}`
  : Platform.OS === 'web'
  ? ''
  : 'https://24f6cca2-97a5-4cb7-90fe-09117eb86dda-00-2llx3yzs7zv0w.picard.replit.dev';

export const endpoints = {
  listings: `${API_BASE}/api/listings`,
  listing: (id: number) => `${API_BASE}/api/listings/${id}`,
  login: `${API_BASE}/api/auth/login`,
  register: `${API_BASE}/api/auth/register`,
  logout: `${API_BASE}/api/auth/logout`,
  user: `${API_BASE}/api/user`,
};

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number;
  listingType: 'sale' | 'rent';
  propertyType: string;
  region?: string;
  city?: string;
  district?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[] | null;
  sellerName?: string;
  marketerName?: string;
  marketerPhone?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  featured?: boolean;
  urgent?: boolean;
  verified?: boolean;
}

export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: string;
  phone?: string;
}

export interface ListingsApiResponse {
  data: Listing[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ListingsResponse {
  listings: Listing[];
  total: number;
  page: number;
  totalPages: number;
}

export const listingTypeLabel: Record<string, string> = {
  sale: 'للبيع',
  sell: 'للبيع',
  rent: 'للإيجار',
};

export const listingTypeColor: Record<string, string> = {
  sale: '#0F7BA0',
  sell: '#0F7BA0',
  rent: '#C9A84C',
};

export function formatPrice(price: number): string {
  if (price >= 1_000_000) {
    const m = price / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}م`;
  }
  if (price >= 1000) {
    const k = price / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}ك`;
  }
  return price.toLocaleString('ar-SA');
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchListings(params: URLSearchParams): Promise<ListingsResponse> {
  const raw = await apiFetch<ListingsApiResponse>(`${endpoints.listings}?${params}`);
  return {
    listings: raw.data ?? [],
    total: raw.total ?? 0,
    page: raw.page ?? 1,
    totalPages: Math.ceil((raw.total ?? 0) / (raw.pageSize ?? 10)),
  };
}
