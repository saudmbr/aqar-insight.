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
  listingStatus: (id: number) => `${API_BASE}/api/listings/${id}/status`,
  listingSimilar: (id: number) => `${API_BASE}/api/listings/${id}/similar`,
  mapPins: `${API_BASE}/api/listings/map-pins`,
  login: `${API_BASE}/api/auth/login`,
  register: `${API_BASE}/api/auth/signup`,
  logout: `${API_BASE}/api/auth/logout`,
  me: `${API_BASE}/api/auth/me`,
  profile: `${API_BASE}/api/auth/profile`,
  password: `${API_BASE}/api/auth/password`,
  forgotPassword: `${API_BASE}/api/auth/forgot-password`,
  resetPassword: `${API_BASE}/api/auth/reset-password`,
  marketers: `${API_BASE}/api/marketers`,
  marketer: (id: number) => `${API_BASE}/api/marketers/${id}`,
  marketerListings: (id: number) => `${API_BASE}/api/marketers/${id}/listings`,
  marketerRatings: (id: number) => `${API_BASE}/api/marketers/${id}/ratings`,
  myMarketerProfile: `${API_BASE}/api/marketers/my/profile`,
  services: `${API_BASE}/api/service-providers`,
  service: (id: number) => `${API_BASE}/api/service-providers/${id}`,
  myServiceProfile: `${API_BASE}/api/service-providers/my/profile`,
  requests: `${API_BASE}/api/customer-requests`,
  request: (id: number) => `${API_BASE}/api/customer-requests/${id}`,
  myRequests: `${API_BASE}/api/customer-requests/my/requests`,
  myListings: `${API_BASE}/api/listings/my/listings`,
  filterOptions: `${API_BASE}/api/listings/meta/options`,
  analyticsInsights: `${API_BASE}/api/analytics/listings-insights`,
  analyticsTrends: `${API_BASE}/api/analytics/listings-trends`,
  analyticsDistricts: `${API_BASE}/api/analytics/listings-districts-map`,
  analyticsFilterOptions: `${API_BASE}/api/analytics/listings-filter-options`,
  listingBenchmark: (id: number) => `${API_BASE}/api/analytics/listing-benchmark/${id}`,
  platformRating: `${API_BASE}/api/platform-rating`,
  favorites: `${API_BASE}/api/favorites`,
  toggleFavorite: (id: number) => `${API_BASE}/api/favorites/${id}/toggle`,
  favoriteStatus: (id: number) => `${API_BASE}/api/favorites/${id}/status`,
  userReports: `${API_BASE}/api/user-reports`,
  districtComparison: `${API_BASE}/api/districts/comparison`,
  districtCities: `${API_BASE}/api/districts/cities`,
};

export interface Listing {
  id: number;
  title: string;
  description?: string;
  price: number;
  listingType: 'sale' | 'rent' | string;
  propertyType: string;
  region?: string;
  city?: string;
  markaz?: string;
  district?: string;
  areaSqm?: number;
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
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
  status?: string;
  pricePerSqm?: number;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  phone?: string;
}

export interface Marketer {
  id: number;
  userId?: number;
  fullName?: string;
  username?: string;
  officeName?: string;
  bio?: string;
  city?: string;
  servedAreas?: string[];
  specialties?: string[];
  yearsExperience?: number;
  photo?: string;
  coverImage?: string;
  whatsapp?: string;
  phone?: string;
  verified?: boolean;
  activeListingsCount?: number;
  createdAt?: string;
}

export interface ServiceProvider {
  id: number;
  businessName: string;
  category: string;
  city?: string;
  description?: string;
  startingPrice?: number;
  portfolioImages?: string[] | null;
  coverImage?: string;
  profileImage?: string;
  verified?: boolean;
  ratingAvg?: number;
  ratingCount?: number;
  createdAt?: string;
  userId?: number;
  websiteUrl?: string;
}

export interface CustomerRequest {
  id: number;
  title: string;
  description?: string;
  requestType: 'property' | 'service' | 'marketer' | string;
  city?: string;
  region?: string;
  district?: string;
  budgetMin?: number;
  budgetMax?: number;
  contactPhone?: string;
  contactWhatsapp?: string;
  posterName?: string;
  status: 'open' | 'closed' | string;
  createdAt: string;
  images?: string[] | null;
  userId?: number;
}

export interface AnalyticsKpis {
  totalListings: number;
  avgPrice: number;
  medianPrice: number;
  avgPricePerSqm: number;
  saleCount: number;
  rentCount: number;
  investCount?: number;
  newLast7Days: number;
  newLast30Days: number;
  turnoverRate: number;
  areaDataRate?: number;
  maxPrice?: number;
  minPrice?: number;
}

export interface AnalyticsInsights {
  kpis: AnalyticsKpis;
  byRegion?: Array<{ region?: string; name?: string; count: number; avgPrice: number }>;
  byCity?: Array<{ city?: string; name?: string; count: number; avgPrice: number }>;
  byPropertyType?: Array<{ propertyType: string; count: number; avgPrice: number; percentage?: number }>;
  byListingType?: Array<{ listingType?: string; name?: string; count: number }>;
  smartInsights?: string[];
  marketScore?: { score: number; label: string; components: Record<string, number>; explanation?: string };
  supplyDemand?: { activityRatio: number; marketBalance: number; marketBalanceLabel: string };
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

export interface MapPin {
  id: number;
  latitude: number;
  longitude: number;
  price: number;
  listingType: string;
}

export const listingTypeLabel: Record<string, string> = {
  sale: 'للبيع',
  sell: 'للبيع',
  rent: 'للإيجار',
  installment: 'تقسيط',
  investment: 'استثمار',
  auction: 'مزاد',
};

export const listingTypeColor: Record<string, string> = {
  sale: '#0F7BA0',
  sell: '#0F7BA0',
  rent: '#C9A84C',
};

export const REQUEST_TYPE_LABELS: Record<string, string> = {
  property: 'عقار',
  service: 'خدمة',
  marketer: 'مسوّق',
};

export const SERVICE_CATEGORY_ICONS: Record<string, string> = {
  construction: '🏗️',
  interior_design: '🛋️',
  maintenance: '🔧',
  property_management: '🏢',
  landscaping: '🌿',
  electrical: '⚡',
  plumbing: '🚿',
  painting: '🎨',
  cleaning: '🧹',
  security: '🔒',
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

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}م`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}ك`;
  return n.toLocaleString();
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      try { msg = (await res.text()) || msg; } catch { /* ignore */ }
    }
    throw new Error(msg);
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

export const SAUDI_REGIONS = [
  'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'القصيم',
  'المنطقة الشرقية', 'عسير', 'تبوك', 'حائل', 'الحدود الشمالية',
  'جازان', 'نجران', 'الباحة', 'الجوف',
];

export const PROPERTY_TYPES = [
  'شقة', 'فيلا', 'أرض', 'دور', 'مبنى', 'استراحة',
  'مزرعة', 'محل تجاري', 'مكتب', 'مستودع',
];
