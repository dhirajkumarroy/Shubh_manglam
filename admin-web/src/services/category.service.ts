const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
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
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

class AdminCategoryService {
  private getToken(): string | null {
    return sessionStorage.getItem('admin_access_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data;
  }

  async listCategories(params: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<CategoryListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
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
}

export const adminCategoryService = new AdminCategoryService();
export default adminCategoryService;
