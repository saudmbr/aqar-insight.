import client, { API_BASE } from './httpClient';

export { API_BASE };

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
  requestUploadUrl: `${API_BASE}/api/storage/uploads/request-url`,
  userReports: `${API_BASE}/api/user-reports`,
  adminUsers: `${API_BASE}/api/admin/users`,
  adminUserRole: (id: number) => `${API_BASE}/api/admin/users/${id}/role`,
  adminReports: `${API_BASE}/api/admin/reports`,
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
  images?: string[] | string | null;
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

export interface FavoriteRecord {
  favoriteId: number;
  createdAt?: string;
  listing: Listing;
}

export interface ListingBenchmarkResponse {
  listing: {
    id: number;
    price: number;
    pricePerSqm: number;
    areaSqm?: number | null;
    city?: string | null;
    district?: string | null;
    propertyType?: string | null;
  };
  districtBenchmark: {
    count: number;
    avgPrice: number;
    avgPricePerSqm: number;
  } | null;
  cityBenchmark: {
    count: number;
    avgPrice: number;
    avgPricePerSqm: number;
  };
  typeBenchmark: {
    count: number;
    avgPrice: number;
    avgPricePerSqm: number;
  } | null;
  position: {
    vsDistrict: { pct: number; label: string; usedPsm: boolean } | null;
    vsCity: { pct: number; label: string; usedPsm: boolean } | null;
    vsType: { pct: number; label: string; usedPsm: boolean } | null;
  };
  hasSufficientData: boolean;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  fullName?: string;
  role: string;
  phone?: string;
}

export interface AdminUser {
  id: number;
  fullName?: string | null;
  username: string;
  email?: string | null;
  role: string;
  createdAt: string;
}

export interface UserReport {
  id: number;
  reporterId: number | null;
  targetType: string;
  targetId: number;
  targetTitle?: string | null;
  reason: string;
  details?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface Marketer {
  id: number;
  userId?: number;
  fullName?: string;
  username?: string;
  officeName?: string;
  bio?: string;
  city?: string;
  servedAreas?: string[] | string | null;
  specialties?: string[] | string | null;
  yearsExperience?: number;
  photo?: string | null;
  coverImage?: string | null;
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
  region?: string;
  district?: string;
  description?: string;
  startingPrice?: number;
  portfolioImages?: string[] | string | null;
  coverImage?: string | null;
  profileImage?: string | null;
  coveredAreas?: string[] | string | null;
  contactPhone?: string | null;
  whatsapp?: string | null;
  workingHours?: string | null;
  status?: string | null;
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

export interface AdminReportsResponse {
  period: string;
  overview: {
    totalUsers: number;
    totalListings: number;
    activeListings: number;
    archivedListings: number;
    totalRequests: number;
    totalServices: number;
    totalMarketers: number;
    totalFavorites: number;
    newUsers: number;
    newListings: number;
    newRequests: number;
    newServices: number;
  };
  users: {
    byRole: Array<{ role: string; count: number }>;
  };
  listings: {
    byStatus: Array<{ status: string; count: number }>;
    byCity: Array<{ city: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byListingType: Array<{ type: string; count: number }>;
    priceStats: {
      avg_price?: number;
      min_price?: number;
      max_price?: number;
      avg_psm?: number;
    };
    featuredCount: number;
    verifiedCount: number;
    topByViews: Array<{ id: number; title: string; city?: string; views: number }>;
  };
  requests: {
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    byCity: Array<{ city: string; count: number }>;
  };
  services: {
    byCategory: Array<{ category: string; count: number }>;
    byCity: Array<{ city: string; count: number }>;
  };
  market: {
    byCities: Array<{ city: string; avg_price: number; avg_psm: number; count: number }>;
    byDistricts: Array<{ district: string; city?: string; avg_price: number; avg_psm: number; count: number }>;
  };
  operational: {
    activeSessions: number;
  };
  alerts: Array<{
    type: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
  }>;
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

export function resolveMediaUrl(path?: string | null): string | null {
  if (!path) return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/objects/')) return `${API_BASE}/api/storage${trimmed}`;
  if (trimmed.startsWith('/')) return `${API_BASE}${trimmed}`;
  return trimmed;
}

export function parseMediaList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    } catch {}
    return trimmed
      .split(/\r?\n|،|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

export function resolveMediaList(raw: unknown): string[] {
  return parseMediaList(raw)
    .map((path) => resolveMediaUrl(path))
    .filter((path): path is string => Boolean(path));
}

export function parseStringList(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item ?? '').trim()).filter(Boolean);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
      }
    } catch {}
    return trimmed.split(/[،,]/).map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const method = (options?.method ?? 'GET') as string;
  const body = options?.body as string | undefined;
  try {
    const res = await client.request<T>({
      url,
      method,
      data: body ? JSON.parse(body) : undefined,
      headers: options?.headers as Record<string, string> | undefined,
    });
    return res.data;
  } catch (err: any) {
    const responseData = err?.response?.data;
    const htmlResponse =
      typeof responseData === 'string' &&
      responseData.trim().startsWith('<');
    const msg =
      (typeof responseData === 'object' ? responseData?.message : undefined) ||
      (typeof responseData === 'object' ? responseData?.error : undefined) ||
      (htmlResponse
        ? 'The API returned HTML instead of JSON. Make sure the backend is running and the mobile app is using the correct API base.'
        : undefined) ||
      err?.message ||
      'حدث خطأ في الاتصال';
    throw new Error(msg);
  }
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
