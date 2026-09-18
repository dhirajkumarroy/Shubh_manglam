import apiClient from './apiClient';

export interface AdminQuoteItem {
  id: string;
  quoteNumber: string;
  customerId: string;
  vendorId: string;
  eventId?: string | null;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currentVersion: number;
  notes?: string | null;
  customerNotes?: string | null;
  revisionNotes?: string | null;
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  vendor?: {
    id: string;
    businessName: string;
    city: string;
    logo?: string | null;
  };
  event?: {
    id: string;
    title: string;
    eventDate: string;
    guestCount?: number | null;
  } | null;
  items?: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
  }>;
  versions?: Array<{
    id: string;
    versionNumber: number;
    total: number;
    subtotal: number;
    discount: number;
    notes?: string | null;
    revisionNotes?: string | null;
    createdAt: string;
  }>;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  } | null;
}

export interface AdminBookingItem {
  id: string;
  bookingNumber: string;
  customerId: string;
  vendorId: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  customerNote?: string | null;
  vendorNote?: string | null;
  confirmedAt?: string | null;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  vendor: {
    id: string;
    businessName: string;
    city: string;
  };
  event?: {
    id: string;
    title: string;
    eventDate: string;
    guestCount?: number | null;
  } | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    notes?: string | null;
  }>;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
  }>;
}

export interface TransactionListResponse<T> {
  quotes?: T[];
  bookings?: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const transactionService = {
  async getQuotes(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{ quotes: AdminQuoteItem[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const data = await apiClient.request<any>(`/quotes?${query.toString()}`, {
      method: 'GET',
    });
    return {
      quotes: data.quotes || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getQuoteDetails(id: string): Promise<AdminQuoteItem> {
    return apiClient.request<AdminQuoteItem>(`/quotes/${id}`, {
      method: 'GET',
    });
  },

  async getBookings(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<{ bookings: AdminBookingItem[]; pagination: any }> {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const data = await apiClient.request<any>(`/bookings?${query.toString()}`, {
      method: 'GET',
    });
    return {
      bookings: data.bookings || [],
      pagination: data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
    };
  },

  async getBookingDetails(id: string): Promise<AdminBookingItem> {
    return apiClient.request<AdminBookingItem>(`/bookings/${id}`, {
      method: 'GET',
    });
  },

  async updateBookingStatus(id: string, status: string, note?: string): Promise<any> {
    return apiClient.request<any>(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },
};

export default transactionService;
