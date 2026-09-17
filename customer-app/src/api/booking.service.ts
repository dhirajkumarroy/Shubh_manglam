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
};

export default bookingService;
