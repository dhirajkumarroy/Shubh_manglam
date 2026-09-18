import { QuoteStatus } from '@prisma/client';

export interface QuoteItemInput {
  serviceId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface RequestQuoteDto {
  vendorId: string;
  eventId?: string;
  customerNotes?: string;
  requestedServiceIds?: string[];
  requestedPackageIds?: string[];
  requestedDate?: string;
  guestCount?: number;
  items?: QuoteItemInput[];
}

export type QuoteRequestDto = RequestQuoteDto;

export interface CreateQuoteDto {
  quoteRequestId?: string; // If fulfilling a prior REQUESTED quote
  quoteId?: string; // Alias for quoteRequestId
  customerId?: string;
  vendorId?: string;
  eventId?: string;
  validUntil: string;
  discount?: number;
  tax?: number;
  notes?: string;
  items: QuoteItemInput[];
}

export type CreateVendorQuoteDto = CreateQuoteDto;

export interface RequestRevisionDto {
  revisionNotes: string;
}

export type RevisionRequestDto = RequestRevisionDto;

export interface ReviseQuoteDto {
  validUntil?: string;
  discount?: number;
  tax?: number;
  notes?: string;
  items: QuoteItemInput[];
}

export interface QuoteQueryDto {
  page?: number;
  limit?: number;
  status?: QuoteStatus;
  vendorId?: string;
  customerId?: string;
  eventId?: string;
  search?: string;
}
