const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | string;
  avatar?: string | null;
}

export interface AdminLoginResponse {
  user: AdminUser;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  mfaRequired?: boolean;
  tempToken?: string;
}

class AdminAuthService {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      sessionStorage.setItem('admin_access_token', token);
    } else {
      sessionStorage.removeItem('admin_access_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = sessionStorage.getItem('admin_access_token');
    }
    return this.token;
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

  async login(credentials: { email: string; password: string; mfaCode?: string }): Promise<AdminLoginResponse> {
    const data = await this.request<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.tokens?.accessToken) {
      this.setToken(data.tokens.accessToken);
    }
    return data;
  }

  async verifyMfa(code: string): Promise<void> {
    await this.request('/auth/admin/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async me(): Promise<{ user: AdminUser }> {
    return this.request<{ user: AdminUser }>('/auth/me', {
      method: 'GET',
    });
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.setToken(null);
    }
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;
