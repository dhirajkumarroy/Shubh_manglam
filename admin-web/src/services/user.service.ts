import apiClient from './apiClient';

export interface UserItem {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';
  emailVerified: boolean;
  avatar: string | null;
  isBlocked: boolean;
  createdAt: string;
  updatedAt?: string;
  vendorProfile?: {
    id: string;
    businessName: string;
    status: string;
    isVerified: boolean;
  } | null;
}

export interface UserListResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  users: UserItem[];
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  isBlocked?: boolean;
}

class AdminUserService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(endpoint, options);
  }

  async listUsers(params: UserQueryParams = {}): Promise<UserListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search && params.search.trim()) query.append('search', params.search.trim());
    if (params.role && params.role !== 'ALL') query.append('role', params.role);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.isBlocked !== undefined) query.append('isBlocked', String(params.isBlocked));

    return this.request<UserListResponse>(`/admin/users?${query.toString()}`);
  }

  async getUserDetails(id: string): Promise<UserItem> {
    return this.request<UserItem>(`/admin/users/${id}`);
  }

  async blockUser(id: string): Promise<UserItem> {
    return this.request<UserItem>(`/admin/users/${id}/block`, {
      method: 'POST',
    });
  }

  async unblockUser(id: string): Promise<UserItem> {
    return this.request<UserItem>(`/admin/users/${id}/unblock`, {
      method: 'POST',
    });
  }
}

export const adminUserService = new AdminUserService();
export default adminUserService;
