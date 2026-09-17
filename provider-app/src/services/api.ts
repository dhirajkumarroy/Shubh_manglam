import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = 'http://10.44.62.6:8000/api/v1';

export interface ProviderAuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface ProviderVendorProfile {
  id: string;
  businessName: string;
  slug: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified: boolean;
  isActive: boolean;
}

export interface ProviderAuthData {
  user: ProviderAuthUser;
  vendor?: ProviderVendorProfile | null;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
}

export class ProviderApiService {
  static async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await SecureStore.setItemAsync('provider_access_token', accessToken);
    if (refreshToken) {
      await SecureStore.setItemAsync('provider_refresh_token', refreshToken);
    }
  }

  static async getAccessToken(): Promise<string | null> {
    return SecureStore.getItemAsync('provider_access_token');
  }

  static async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync('provider_refresh_token');
  }

  static async clearTokens(): Promise<void> {
    await SecureStore.deleteItemAsync('provider_access_token');
    await SecureStore.deleteItemAsync('provider_refresh_token');
  }

  static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<{ success: boolean; message: string; data: T }> {
    const token = await this.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Auto-refresh on 401
    if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login')) {
      const refreshToken = await this.getRefreshToken();
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const { accessToken, refreshToken: newRefresh } = refreshData.data;
            await this.setTokens(accessToken, newRefresh);

            headers['Authorization'] = `Bearer ${accessToken}`;
            response = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
          } else {
            await this.clearTokens();
          }
        } catch {
          await this.clearTokens();
        }
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    return data;
  }

  static async register(body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    businessName: string;
    city?: string;
  }): Promise<ProviderAuthData> {
    const res = await this.request<ProviderAuthData>('/auth/provider/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.data.tokens) {
      await this.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  }

  static async login(body: { email: string; password: string }): Promise<ProviderAuthData> {
    const res = await this.request<ProviderAuthData>('/auth/provider/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.data.tokens) {
      await this.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  }

  static async googleLogin(body: {
    idToken: string;
    email?: string;
    name?: string;
    businessName?: string;
  }): Promise<ProviderAuthData> {
    const res = await this.request<ProviderAuthData>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({
        ...body,
        role: 'VENDOR',
      }),
    });
    if (res.data.tokens) {
      await this.setTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
    }
    return res.data;
  }

  static async me(): Promise<ProviderAuthData> {
    const res = await this.request<ProviderAuthData>('/auth/me', {
      method: 'GET',
    });
    return res.data;
  }

  static async logout(): Promise<void> {
    const refreshToken = await this.getRefreshToken();
    if (refreshToken) {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      }).catch(() => {});
    }
    await this.clearTokens();
  }

  // =========================================================================
  // Vendor Profile & Onboarding API
  // =========================================================================

  static async getVendorProfile(): Promise<any> {
    const res = await this.request<any>('/vendor/profile', {
      method: 'GET',
    });
    return res.data;
  }

  static async updateVendorProfile(body: any): Promise<any> {
    const res = await this.request<any>('/vendor/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async getCategories(): Promise<any[]> {
    const res = await this.request<any[]>('/categories', {
      method: 'GET',
    });
    return res.data;
  }

  static async updateVendorCategories(categoryIds: string[]): Promise<any> {
    const res = await this.request<any>('/vendor/categories', {
      method: 'PUT',
      body: JSON.stringify({ categoryIds }),
    });
    return res.data;
  }

  static async addVendorDocument(body: { documentType: string; documentUrl: string }): Promise<any> {
    const res = await this.request<any>('/vendor/documents', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async deleteVendorDocument(documentId: string): Promise<any> {
    const res = await this.request<any>(`/vendor/documents/${documentId}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  static async submitForReview(): Promise<any> {
    const res = await this.request<any>('/vendor/submit-for-review', {
      method: 'POST',
    });
    return res.data;
  }
}

