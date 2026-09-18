import apiClient from './apiClient';

export interface VendorListItem {
  id: string;
  partnerAccountId?: string | null;
  userId: string;
  businessName: string;
  slug: string;
  phone: string;
  email: string | null;
  city: string;
  state: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified: boolean;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
  documentsCount: number;
  approvedDocumentsCount: number;
  servicesCount: number;
  bookingsCount: number;
  createdAt: string;
}

export interface VendorListResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  vendors: VendorListItem[];
}

export interface DocumentRequirement {
  id: string;
  code: string;
  name: string;
  description: string | null;
  documentType: string;
  isRequired: boolean;
  acceptedFileTypes: string[];
  maxFileSizeMb: number;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorDetailsResponse {
  id: string;
  partnerAccountId?: string | null;
  userId: string;
  businessName: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  logo: string | null;
  coverImage: string | null;
  addressLine1: string;
  addressLine2: string | null;
  village: string | null;
  locality: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  operatingRadiusKm: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  isVerified: boolean;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
    createdAt: string;
  };
  categories: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
  documents: {
    id: string;
    documentType: string;
    documentUrl: string;
    originalFileName?: string | null;
    fileSize?: number | null;
    mimeType?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    rejectionReason: string | null;
    createdAt: string;
    updatedAt: string;
    requirement?: DocumentRequirement | null;
  }[];
  counts: {
    services: number;
    packages: number;
    bookings: number;
    reviews: number;
  };
  createdAt: string;
  updatedAt: string;
}

class AdminVendorService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(endpoint, options);
  }

  async listVendors(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    city?: string;
    categoryId?: string;
    isVerified?: boolean;
  }): Promise<VendorListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.city) query.append('city', params.city);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.isVerified !== undefined) query.append('isVerified', String(params.isVerified));

    return this.request<VendorListResponse>(`/admin/vendors?${query.toString()}`);
  }

  async getVendor(vendorId: string): Promise<VendorDetailsResponse> {
    return this.request<VendorDetailsResponse>(`/admin/vendors/${vendorId}`);
  }

  async approveVendor(vendorId: string): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/approve`, {
      method: 'POST',
    });
  }

  async rejectVendor(vendorId: string, rejectionReason: string): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectionReason }),
    });
  }

  async moveToUnderReview(vendorId: string): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/under-review`, {
      method: 'POST',
    });
  }

  async suspendVendor(vendorId: string, reason?: string): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateVendor(vendorId: string): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/reactivate`, {
      method: 'POST',
    });
  }

  async reviewDocument(
    vendorId: string,
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string
  ): Promise<any> {
    return this.request(`/admin/vendors/${vendorId}/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejectionReason }),
    });
  }

  async getDashboardStats(): Promise<any> {
    return this.request('/admin/dashboard');
  }

  async getInquiryAnalytics(): Promise<any> {
    return this.request('/bookings/admin/analytics');
  }

  // Document Requirements Configuration
  async listDocumentRequirements(): Promise<DocumentRequirement[]> {
    return this.request<DocumentRequirement[]>('/admin/document-requirements');
  }

  async createDocumentRequirement(body: {
    code: string;
    name: string;
    description?: string;
    documentType: string;
    isRequired?: boolean;
    acceptedFileTypes?: string[];
    maxFileSizeMb?: number;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<DocumentRequirement> {
    return this.request<DocumentRequirement>('/admin/document-requirements', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async updateDocumentRequirement(
    id: string,
    body: Partial<DocumentRequirement>
  ): Promise<DocumentRequirement> {
    return this.request<DocumentRequirement>(`/admin/document-requirements/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async deleteDocumentRequirement(id: string): Promise<any> {
    return this.request(`/admin/document-requirements/${id}`, {
      method: 'DELETE',
    });
  }
}

export const adminVendorService = new AdminVendorService();
export default adminVendorService;
