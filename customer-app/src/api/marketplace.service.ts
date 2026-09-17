import apiClient from './client';
import { Category, ServiceItem, PackageItem } from './catalog.service';

export interface MarketplaceVendorItem {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  logo: string | null;
  coverImage: string | null;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  operatingRadiusKm: number;
  ratingAverage: number;
  ratingCount: number;
  distanceKm: number | null;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }>;
  createdAt: string;
}

export interface MarketplaceVendorDetail {
  id: string;
  businessName: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  logo: string | null;
  coverImage: string | null;
  addressLine1: string;
  city: string;
  district: string | null;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  operatingRadiusKm: number;
  ratingAverage: number;
  ratingCount: number;
  distanceKm: number | null;
  categories: Category[];
  services: ServiceItem[];
  packages: PackageItem[];
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    customerName: string;
    customerAvatar: string | null;
  }>;
}

export interface MarketplaceCategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  sortOrder: number;
  vendorCount: number;
  serviceCount: number;
}

export const MarketplaceService = {
  async getVendors(params?: {
    category?: string;
    categoryId?: string;
    eventType?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
    city?: string;
    search?: string;
    minRating?: number;
    sort?: 'nearest' | 'rating' | 'newest' | 'relevance';
    page?: number;
    limit?: number;
  }): Promise<{ pagination: any; vendors: MarketplaceVendorItem[] }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { pagination: any; vendors: MarketplaceVendorItem[] };
    }>('/marketplace/vendors', { params });
    return res.data.data || { pagination: {}, vendors: [] };
  },

  async getVendorById(
    vendorId: string,
    coords?: { latitude?: number; longitude?: number }
  ): Promise<MarketplaceVendorDetail> {
    const params = coords?.latitude && coords?.longitude ? { lat: coords.latitude, lon: coords.longitude } : undefined;
    const res = await apiClient.get<{ success: boolean; data: MarketplaceVendorDetail }>(
      `/marketplace/vendors/${vendorId}`,
      { params }
    );
    return res.data.data;
  },

  async getCategories(params?: {
    eventTypeId?: string;
    search?: string;
  }): Promise<MarketplaceCategorySummary[]> {
    const res = await apiClient.get<{ success: boolean; data: MarketplaceCategorySummary[] }>(
      '/marketplace/categories',
      { params }
    );
    return res.data.data || [];
  },

  async getServices(params?: {
    categoryId?: string;
    vendorId?: string;
    eventTypeId?: string;
    search?: string;
    city?: string;
    pricingType?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ pagination: any; services: ServiceItem[] }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { pagination: any; services: ServiceItem[] };
    }>('/marketplace/services', { params });
    return res.data.data || { pagination: {}, services: [] };
  },

  async getServiceById(id: string): Promise<ServiceItem> {
    const res = await apiClient.get<{ success: boolean; data: ServiceItem }>(`/marketplace/services/${id}`);
    return res.data.data;
  },

  async getPackages(params?: {
    vendorId?: string;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    page?: number;
    limit?: number;
  }): Promise<{ pagination: any; packages: PackageItem[] }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { pagination: any; packages: PackageItem[] };
    }>('/marketplace/packages', { params });
    return res.data.data || { pagination: {}, packages: [] };
  },

  async getPackageById(id: string): Promise<PackageItem> {
    const res = await apiClient.get<{ success: boolean; data: PackageItem }>(`/marketplace/packages/${id}`);
    return res.data.data;
  },
};

export default MarketplaceService;
