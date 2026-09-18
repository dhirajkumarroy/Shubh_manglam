import apiClient from './client';

export interface CreateInquiryPayload {
  vendorId: string;
  serviceId?: string;
  occasion: string;
  eventDate: string;
  guestCount?: number;
  location?: string;
  notes?: string;
  estimatedBudget?: number;
}

export interface CustomerInquiryItem {
  id: string;
  bookingNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
  vendor?: {
    id: string;
    businessName: string;
    phone: string;
    email: string;
    city: string;
    logo?: string;
    categories?: Array<{ category: { name: string } }>;
  };
  inquiryDetails?: {
    occasion?: string;
    eventDate?: string;
    guestCount?: number;
    location?: string;
    notes?: string;
    serviceName?: string;
  };
  items?: Array<{
    name: string;
    totalPrice?: number;
  }>;
  vendorNote?: string;
  confirmedAt?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface BookingSnapshotItem {
  id: string;
  serviceId?: string | null;
  packageId?: string | null;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string | null;
}

export interface CustomerBooking {
  id: string;
  bookingNumber: string;
  eventId?: string | null;
  customerId: string;
  vendorId: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REJECTED';
  subtotal: number;
  discount: number;
  tax: number;
  platformFee: number;
  total: number;
  customerNote?: string | null;
  vendorNote?: string | null;
  confirmedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  items: BookingSnapshotItem[];
  vendor: {
    id: string;
    businessName: string;
    phone: string;
    email?: string;
    city: string;
    logo?: string | null;
  };
  event?: {
    id: string;
    title: string;
    eventDate: string;
    guestCount?: number | null;
    addressLine1?: string;
    city?: string;
    pincode?: string;
  } | null;
  payments?: Array<{
    id: string;
    amount: number;
    status: string;
    provider: string;
    createdAt: string;
  }>;
}

export const bookingService = {
  async createInquiry(payload: CreateInquiryPayload): Promise<CustomerInquiryItem> {
    const response = await apiClient.post<{ data: CustomerInquiryItem }>('/bookings/inquiries', payload);
    return response.data.data;
  },

  async getCustomerInquiries(): Promise<CustomerInquiryItem[]> {
    const response = await apiClient.get<{ data: CustomerInquiryItem[] }>('/bookings/customer');
    return response.data.data || [];
  },

  async cancelInquiry(bookingId: string): Promise<CustomerInquiryItem> {
    const response = await apiClient.patch<{ data: CustomerInquiryItem }>(`/bookings/${bookingId}/cancel`);
    return response.data.data;
  },

  async getCustomerBookings(filters: { status?: string; page?: number } = {}): Promise<{ bookings: CustomerBooking[]; total: number }> {
    const response = await apiClient.get<{ data: { bookings: CustomerBooking[]; pagination: { total: number } } }>(
      '/bookings',
      { params: filters }
    );
    return {
      bookings: response.data.data.bookings || [],
      total: response.data.data.pagination?.total || 0,
    };
  },

  async getBookingDetails(bookingId: string): Promise<CustomerBooking> {
    const response = await apiClient.get<{ data: CustomerBooking }>(`/bookings/${bookingId}`);
    return response.data.data;
  },

  async cancelBooking(bookingId: string, note?: string): Promise<CustomerBooking> {
    const response = await apiClient.patch<{ data: CustomerBooking }>(`/bookings/${bookingId}/status`, {
      status: 'CANCELLED',
      note,
    });
    return response.data.data;
  },
};

export default bookingService;
