import apiClient from './apiClient';

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
  setToken(token: string | null) {
    apiClient.setTokens(token);
  }

  setTokens(accessToken: string | null, refreshToken?: string | null) {
    apiClient.setTokens(accessToken, refreshToken);
  }

  getToken(): string | null {
    return apiClient.getAccessToken();
  }

  getRefreshToken(): string | null {
    return apiClient.getRefreshToken();
  }

  async login(credentials: { email: string; password: string; mfaCode?: string }): Promise<AdminLoginResponse> {
    const data = await apiClient.request<AdminLoginResponse>('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (data.tokens?.accessToken) {
      this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    }
    return data;
  }

  async verifyMfa(code: string): Promise<void> {
    await apiClient.request('/auth/admin/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  }

  async me(): Promise<{ user: AdminUser }> {
    return apiClient.request<{ user: AdminUser }>('/auth/me', {
      method: 'GET',
    });
  }

  async refreshToken(): Promise<string> {
    return apiClient.refreshToken();
  }

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    try {
      if (refreshToken) {
        await apiClient.request('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearTokens();
    }
  }
}

export const adminAuthService = new AdminAuthService();
export default adminAuthService;
