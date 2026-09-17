import apiClient from './apiClient';

export interface AdminServiceItem {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  pricingType: string;
  basePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  durationMinutes: number | null;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
    status: string;
    isActive: boolean;
  };
  primaryImage?: string | null;
  images?: any[];
}

export interface AdminPackageItem {
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
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    city: string;
    state: string;
    ratingAverage: number;
    ratingCount: number;
    status: string;
    isActive: boolean;
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
      };
    };
  }>;
}

class AdminCatalogService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(endpoint, options);
  }

  async listServices(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    vendorId?: string;
    isActive?: boolean;
  }): Promise<{ pagination: any; services: AdminServiceItem[] }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.categoryId) query.append('categoryId', params.categoryId);
    if (params?.vendorId) query.append('vendorId', params.vendorId);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ pagination: any; services: AdminServiceItem[] }>(`/admin/services${qs}`);
  }

  async updateServiceStatus(id: string, isActive: boolean): Promise<AdminServiceItem> {
    return this.request<AdminServiceItem>(`/admin/services/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }

  async listPackages(params?: {
    page?: number;
    limit?: number;
    search?: string;
    vendorId?: string;
    isActive?: boolean;
  }): Promise<{ pagination: any; packages: AdminPackageItem[] }> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.search) query.append('search', params.search);
    if (params?.vendorId) query.append('vendorId', params.vendorId);
    if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));

    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ pagination: any; packages: AdminPackageItem[] }>(`/admin/packages${qs}`);
  }

  async updatePackageStatus(id: string, isActive: boolean): Promise<AdminPackageItem> {
    return this.request<AdminPackageItem>(`/admin/packages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  }
}

export const adminCatalogService = new AdminCatalogService();
export default adminCatalogService;
