import apiClient from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface ServiceItem {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  pricingType: 'FIXED' | 'PER_PERSON' | 'PER_UNIT' | 'PER_DAY' | 'PER_HOUR' | 'CUSTOM_QUOTE';
  basePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  durationMinutes: number | null;
  isAvailable: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    city: string;
    state: string;
    ratingAverage: number;
    ratingCount: number;
  };
  primaryImage?: string | null;
  images?: Array<{
    id: string;
    url: string;
    isPrimary: boolean;
    sortOrder: number;
  }>;
}

export interface PackageItem {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  durationMinutes: number | null;
  isActive: boolean;
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    city: string;
    state: string;
    ratingAverage: number;
    ratingCount: number;
  };
  services: Array<{
    id: string;
    serviceId: string;
    quantity: number;
    service: {
      id: string;
      name: string;
      pricingType: string;
      basePrice: number | null;
      category: {
        id: string;
        name: string;
        icon: string | null;
      };
    };
  }>;
}

export const CatalogService = {
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<{ success: boolean; data: Category[] }>('/categories');
    return res.data.data || [];
  },

  async getServices(params?: {
    categoryId?: string;
    search?: string;
    city?: string;
    pricingType?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<{ pagination: any; services: ServiceItem[] }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { pagination: any; services: ServiceItem[] };
    }>('/services', { params });
    return res.data.data || { pagination: {}, services: [] };
  },

  async getServiceById(idOrSlug: string): Promise<ServiceItem> {
    const res = await apiClient.get<{ success: boolean; data: ServiceItem }>(`/services/${idOrSlug}`);
    return res.data.data;
  },

  async getPackages(params?: {
    search?: string;
    vendorId?: string;
    sortBy?: string;
  }): Promise<{ pagination: any; packages: PackageItem[] }> {
    const res = await apiClient.get<{
      success: boolean;
      data: { pagination: any; packages: PackageItem[] };
    }>('/packages', { params });
    return res.data.data || { pagination: {}, packages: [] };
  },

  async getPackageById(idOrSlug: string): Promise<PackageItem> {
    const res = await apiClient.get<{ success: boolean; data: PackageItem }>(`/packages/${idOrSlug}`);
    return res.data.data;
  },
};

export default CatalogService;
