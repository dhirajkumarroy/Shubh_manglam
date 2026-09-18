import * as SecureStore from 'expo-secure-store';
import {
  DocumentRequirementItem,
  VendorGalleryResponse,
  VendorGalleryItem,
  VendorReviewsResponse,
} from '../types';

export const API_BASE_URL = 'http://192.168.0.102:8000/api/v1';

export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const host = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${host}${cleanPath}`;
}


export interface ProviderAuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface ProviderVendorProfile {
  id: string;
  partnerAccountId?: string | null;
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
      let errMsg = data.message || 'API request failed';
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        const details = data.errors.map((e: any) => e.message || (e.field ? `${e.field}: invalid` : null)).filter(Boolean).join(', ');
        if (details) {
          errMsg = `${errMsg}: ${details}`;
        }
      }
      throw new Error(errMsg);
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

  static async getEventTypes(): Promise<any[]> {
    const res = await this.request<any[]>('/event-types', {
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

  // -------------------------------------------------------------------------
  // File Uploads (Multipart)
  // -------------------------------------------------------------------------

  static async uploadFile(
    endpoint: string,
    file: { uri: string; name: string; type: string }
  ): Promise<{ url: string; fileName: string; originalName: string; mimeType: string; size: number }> {
    const token = await this.getAccessToken();
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'File upload failed');
    }
    return data.data;
  }

  static async uploadDocumentFile(file: { uri: string; name: string; type: string }) {
    return this.uploadFile('/uploads/document', file);
  }

  static async uploadGalleryMediaFile(file: { uri: string; name: string; type: string }) {
    return this.uploadFile('/uploads/gallery', file);
  }

  // -------------------------------------------------------------------------
  // Document Requirements & Verification
  // -------------------------------------------------------------------------

  static async getDocumentRequirements(): Promise<DocumentRequirementItem[]> {
    const res = await this.request<DocumentRequirementItem[]>('/vendor/document-requirements', {
      method: 'GET',
    });
    return res.data;
  }

  static async addVendorDocument(body: {
    requirementId?: string;
    documentType?: string;
    documentUrl: string;
    originalFileName?: string;
    fileSize?: number;
    mimeType?: string;
  }): Promise<any> {
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

  // -------------------------------------------------------------------------
  // Partner Gallery
  // -------------------------------------------------------------------------

  static async getGallery(): Promise<VendorGalleryResponse> {
    const res = await this.request<VendorGalleryResponse>('/vendor/gallery', {
      method: 'GET',
    });
    return res.data;
  }

  static async addGalleryMedia(body: {
    mediaType: 'IMAGE' | 'VIDEO';
    url: string;
    thumbnailUrl?: string;
    caption?: string;
    serviceId?: string;
    sortOrder?: number;
  }): Promise<VendorGalleryItem> {
    const res = await this.request<VendorGalleryItem>('/vendor/gallery', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async updateGalleryMedia(
    id: string,
    body: { caption?: string; serviceId?: string | null; sortOrder?: number }
  ): Promise<VendorGalleryItem> {
    const res = await this.request<VendorGalleryItem>(`/vendor/gallery/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async deleteGalleryMedia(id: string): Promise<void> {
    await this.request(`/vendor/gallery/${id}`, {
      method: 'DELETE',
    });
  }

  static async reorderGallery(orderedIds: string[]): Promise<VendorGalleryItem[]> {
    const res = await this.request<VendorGalleryItem[]>('/vendor/gallery/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds }),
    });
    return res.data;
  }

  // -------------------------------------------------------------------------
  // Partner Reviews & Ratings
  // -------------------------------------------------------------------------

  static async getVendorReviews(
    vendorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<VendorReviewsResponse> {
    const res = await this.request<VendorReviewsResponse>(
      `/reviews/vendor/${vendorId}?page=${page}&limit=${limit}`,
      {
        method: 'GET',
      }
    );
    return res.data;
  }

  // =========================================================================
  // Vendor Catalog Management API (Phase 5)
  // =========================================================================

  static async getVendorServices(params?: Record<string, any>): Promise<{ pagination: any; services: any[] }> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await this.request<{ pagination: any; services: any[] }>(`/vendor/services${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async getVendorService(id: string): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${id}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async createService(body: any): Promise<any> {
    const res = await this.request<any>('/vendor/services', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async updateService(id: string, body: any): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async deleteService(id: string): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  static async addServiceImage(serviceId: string, body: { url: string; isPrimary?: boolean; sortOrder?: number }): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${serviceId}/images`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async listServiceImages(serviceId: string): Promise<any[]> {
    const res = await this.request<any[]>(`/vendor/services/${serviceId}/images`, {
      method: 'GET',
    });
    return res.data;
  }

  static async deleteServiceImage(serviceId: string, imageId: string): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${serviceId}/images/${imageId}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  static async setPrimaryServiceImage(serviceId: string, imageId: string): Promise<any> {
    const res = await this.request<any>(`/vendor/services/${serviceId}/images/${imageId}/primary`, {
      method: 'PATCH',
    });
    return res.data;
  }

  static async getVendorPackages(params?: Record<string, any>): Promise<{ pagination: any; packages: any[] }> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await this.request<{ pagination: any; packages: any[] }>(`/vendor/packages${query}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async getVendorPackage(id: string): Promise<any> {
    const res = await this.request<any>(`/vendor/packages/${id}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async createPackage(body: any): Promise<any> {
    const res = await this.request<any>('/vendor/packages', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async updatePackage(id: string, body: any): Promise<any> {
    const res = await this.request<any>(`/vendor/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async deletePackage(id: string): Promise<any> {
    const res = await this.request<any>(`/vendor/packages/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  }

  // =========================================================================
  // Inquiries & Bookings
  // =========================================================================

  static async getVendorInquiries(): Promise<any[]> {
    const res = await this.request<any[]>('/bookings/vendor', {
      method: 'GET',
    });
    return res.data || [];
  }

  static async respondToInquiry(
    bookingId: string,
    action: 'ACCEPT' | 'REJECT',
    vendorNote?: string
  ): Promise<any> {
    const res = await this.request<any>(`/bookings/${bookingId}/respond`, {
      method: 'PATCH',
      body: JSON.stringify({ action, vendorNote }),
    });
    return res.data;
  }

  // =========================================================================
  // Formal Quotations & Negotiation
  // =========================================================================

  static async getVendorQuotes(params?: Record<string, any>): Promise<{ quotes: any[]; total: number }> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await this.request<{ quotes: any[]; pagination: { total: number } }>(`/quotes${query}`, {
      method: 'GET',
    });
    return {
      quotes: res.data.quotes || [],
      total: res.data.pagination?.total || 0,
    };
  }

  static async getQuoteDetails(id: string): Promise<any> {
    const res = await this.request<any>(`/quotes/${id}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async createFormalQuote(body: any): Promise<any> {
    const res = await this.request<any>('/quotes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async reviseQuote(id: string, body: any): Promise<any> {
    const res = await this.request<any>(`/quotes/${id}/revise`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return res.data;
  }

  static async rejectQuote(id: string, reason?: string): Promise<any> {
    const res = await this.request<any>(`/quotes/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return res.data;
  }

  // =========================================================================
  // Formal Confirmed Bookings
  // =========================================================================

  static async getVendorBookings(params?: Record<string, any>): Promise<{ bookings: any[]; total: number }> {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    const res = await this.request<{ bookings: any[]; pagination: { total: number } }>(`/bookings${query}`, {
      method: 'GET',
    });
    return {
      bookings: res.data.bookings || [],
      total: res.data.pagination?.total || 0,
    };
  }

  static async getBookingDetails(id: string): Promise<any> {
    const res = await this.request<any>(`/bookings/${id}`, {
      method: 'GET',
    });
    return res.data;
  }

  static async updateBookingStatus(id: string, status: string, note?: string): Promise<any> {
    const res = await this.request<any>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    return res.data;
  }
}


