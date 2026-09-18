import apiClient from './apiClient';

export interface CategoryItem {
  id: string;
  parentId?: string | null;
  parent?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  subcategories?: CategoryItem[];
  subcategoryCount?: number;
  vendorCount: number;
  serviceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  categories: CategoryItem[];
}

export interface CreateCategoryPayload {
  parentId?: string | null;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  parentId?: string | null;
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

class AdminCategoryService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(endpoint, options);
  }

  async listCategories(params: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string | null;
    isActive?: boolean;
  }): Promise<CategoryListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.parentId !== undefined && params.parentId !== null) query.append('parentId', params.parentId);
    if (params.isActive !== undefined) query.append('isActive', String(params.isActive));

    return this.request<CategoryListResponse>(`/admin/categories?${query.toString()}`);
  }

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryItem> {
    return this.request<CategoryItem>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryItem> {
    return this.request<CategoryItem>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteCategory(id: string): Promise<any> {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkSmartImport(payload: {
    mode?: 'UPSERT' | 'CREATE_ONLY';
    categories?: any[];
    subcategories?: any[];
    celebrations?: any[];
  }): Promise<{
    summary: {
      categoriesCreated: number;
      categoriesUpdated: number;
      subcategoriesCreated: number;
      subcategoriesUpdated: number;
      celebrationsCreated: number;
      celebrationsUpdated: number;
      mappingsCreated: number;
      totalProcessed: number;
    };
    errors: Array<{
      sheet: string;
      item: string;
      error: string;
    }>;
  }> {
    return this.request('/admin/smart-import', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

export const adminCategoryService = new AdminCategoryService();
export default adminCategoryService;
