const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

const ACCESS_TOKEN_KEY = 'admin_access_token';
const REFRESH_TOKEN_KEY = 'admin_refresh_token';

// Migrate any legacy tokens from sessionStorage to localStorage
try {
  const legacyAccess = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (legacyAccess && !localStorage.getItem(ACCESS_TOKEN_KEY)) {
    localStorage.setItem(ACCESS_TOKEN_KEY, legacyAccess);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  }
} catch {
  // Ignore storage access errors in restricted contexts
}

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (err: any) => void;
}

class ApiClient {
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];

  getAccessToken(): string | null {
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setTokens(accessToken: string | null, refreshToken?: string | null): void {
    try {
      if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        // Also keep sessionStorage in sync for legacy compatibility
        sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      } else {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      }

      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else if (refreshToken === null) {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to set auth tokens in storage', e);
    }
  }

  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear auth tokens from storage', e);
    }
  }

  private processQueue(error: any, token: string | null = null): void {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else if (token) {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }

  async refreshToken(): Promise<string> {
    const currentRefreshToken = this.getRefreshToken();
    if (!currentRefreshToken) {
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('admin_auth_logout'));
      throw new Error('No refresh token available');
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      const body = await res.json();
      if (!res.ok || !body?.data?.accessToken) {
        throw new Error(body?.message || 'Failed to refresh token');
      }

      const { accessToken, refreshToken: newRefreshToken } = body.data;
      this.setTokens(accessToken, newRefreshToken || currentRefreshToken);
      return accessToken;
    } catch (err) {
      this.clearTokens();
      window.dispatchEvent(new CustomEvent('admin_auth_logout'));
      throw err;
    }
  }

  async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isAuthEndpoint =
      endpoint.startsWith('/auth/admin/login') ||
      endpoint.startsWith('/auth/refresh') ||
      endpoint.startsWith('/auth/logout');

    const execute = async (token: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
      };

      // Set Content-Type only if body is not FormData
      if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    };

    let token = this.getAccessToken();
    let res = await execute(token);

    // If 401 Unauthorized occurs on non-auth endpoint, attempt silent token refresh
    if (res.status === 401 && !isAuthEndpoint) {
      const rToken = this.getRefreshToken();
      if (!rToken) {
        this.clearTokens();
        window.dispatchEvent(new CustomEvent('admin_auth_logout'));
        throw new Error('Session expired. Please log in again.');
      }

      if (this.isRefreshing) {
        // Wait for active refresh request to resolve
        try {
          const newToken = await new Promise<string>((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          });
          res = await execute(newToken);
        } catch (queueErr) {
          throw queueErr;
        }
      } else {
        this.isRefreshing = true;
        try {
          const newToken = await this.refreshToken();
          this.processQueue(null, newToken);
          res = await execute(newToken);
        } catch (refreshErr) {
          this.processQueue(refreshErr, null);
          throw refreshErr;
        } finally {
          this.isRefreshing = false;
        }
      }
    }

    if (res.status === 204) {
      return null as T;
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return null as T;
    }

    if (!res.ok) {
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data.data !== undefined ? data.data : data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
