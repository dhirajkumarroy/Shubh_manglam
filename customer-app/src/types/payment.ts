import { Booking } from './booking';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface Payment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  providerSignature: string | null;
  status: PaymentStatus;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  bookingId: string;
}

export interface RazorpayOrderDetails {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  attempts: number;
  notes: {
    bookingId: string;
    customerId: string;
  };
  created_at: number;
}

export interface CreateOrderResponse {
  payment: Payment;
  razorpayOrder: RazorpayOrderDetails;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface VerifyPaymentResponse {
  payment: Payment;
  booking: Booking;
}

export interface MyPaymentsResponse {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  payments: Payment[];
}
