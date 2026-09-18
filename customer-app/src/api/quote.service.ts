import apiClient from './client';

export type QuoteStatus =
  | 'DRAFT'
  | 'REQUESTED'
  | 'SENT'
  | 'VIEWED'
  | 'REVISION_REQUESTED'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface QuoteItem {
  id: string;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
  service?: {
    id: string;
    name: string;
    slug: string;
    basePrice?: number;
    images?: Array<{ url: string }>;
  };
}

export interface QuoteVersion {
  id: string;
  versionNumber: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string | null;
  revisionNotes?: string | null;
  itemsJson?: QuoteItem[];
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  vendorId: string;
  eventId?: string | null;
  status: QuoteStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil?: string | null;
  notes?: string | null;
  customerNotes?: string | null;
  revisionNotes?: string | null;
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  items?: QuoteItem[];
  versions?: QuoteVersion[];
  vendor?: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
    city: string;
    logo?: string | null;
    ratingAverage?: number;
    ratingCount?: number;
  };
  event?: {
    id: string;
    title: string;
    eventDate: string;
    guestCount?: number | null;
    addressLine1?: string;
    city?: string;
  } | null;
  booking?: {
    id: string;
    bookingNumber: string;
    status: string;
  } | null;
}

export interface RequestQuotePayload {
  vendorId: string;
  eventId?: string;
  customerNotes?: string;
  requestedServiceIds?: string[];
  guestCount?: number;
  requestedDate?: string;
}

export interface QuoteQueryFilters {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  search?: string;
}

export const quoteService = {
  /**
   * Submit a quote request to a vendor
   */
  async requestQuote(payload: RequestQuotePayload): Promise<Quote> {
    const response = await apiClient.post<{ data: Quote }>('/quotes/request', payload);
    return response.data.data;
  },

  /**
   * Fetch paginated list of quotes for the authenticated customer
   */
  async getCustomerQuotes(filters: QuoteQueryFilters = {}): Promise<{ quotes: Quote[]; total: number }> {
    const response = await apiClient.get<{ data: { quotes: Quote[]; pagination: { total: number } } }>(
      '/quotes',
      { params: filters }
    );
    return {
      quotes: response.data.data.quotes || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  /**
   * Get complete details of a quote including versions and items
   */
  async getQuoteDetails(quoteId: string): Promise<Quote> {
    const response = await apiClient.get<{ data: Quote }>(`/quotes/${quoteId}`);
    return response.data.data;
  },

  /**
   * Request a revision from the vendor
   */
  async requestRevision(quoteId: string, revisionNotes: string): Promise<Quote> {
    const response = await apiClient.post<{ data: Quote }>(`/quotes/${quoteId}/revision-request`, {
      revisionNotes,
    });
    return response.data.data;
  },

  /**
   * Accept a quote -> creates confirmed booking with snapshots
   */
  async acceptQuote(quoteId: string): Promise<{ quote: Quote; booking: any }> {
    const response = await apiClient.post<{ data: { quote: Quote; booking: any } }>(
      `/quotes/${quoteId}/accept`,
      {}
    );
    return response.data.data;
  },

  /**
   * Reject a quote
   */
  async rejectQuote(quoteId: string, reason?: string): Promise<Quote> {
    const response = await apiClient.post<{ data: Quote }>(`/quotes/${quoteId}/reject`, { reason });
    return response.data.data;
  },
};
