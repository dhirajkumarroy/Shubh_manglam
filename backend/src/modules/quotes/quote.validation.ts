import { z } from 'zod';
import { QuoteStatus } from '@prisma/client';

export const quoteItemInputSchema = z.object({
  serviceId: z.string().uuid('Invalid service ID format').optional(),
  description: z.string().min(1, 'Item description is required').max(300),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative'),
  notes: z.string().max(500).optional(),
});

export const requestQuoteSchema = z.object({
  vendorId: z.string().uuid('Invalid vendor ID format'),
  eventId: z.string().uuid('Invalid event ID format').optional(),
  customerNotes: z.string().max(2000).optional(),
  requestedServiceIds: z.array(z.string().uuid('Invalid service ID format')).optional(),
  requestedPackageIds: z.array(z.string().uuid('Invalid package ID format')).optional(),
  requestedDate: z.string().optional(),
  guestCount: z.number().int().positive().optional(),
});

export const createQuoteSchema = z.object({
  quoteRequestId: z.string().uuid('Invalid quote request ID format').optional(),
  customerId: z.string().uuid('Invalid customer ID format').optional(),
  eventId: z.string().uuid('Invalid event ID format').optional(),
  validUntil: z.string().refine(
    (val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(),
    'Validity date must be a valid future date'
  ),
  discount: z.number().min(0, 'Discount cannot be negative').default(0),
  tax: z.number().min(0, 'Tax cannot be negative').default(0),
  notes: z.string().max(2000).optional(),
  items: z.array(quoteItemInputSchema).min(1, 'Quote must have at least one line item'),
});

export const requestRevisionSchema = z.object({
  revisionNotes: z
    .string()
    .min(5, 'Revision notes must be at least 5 characters')
    .max(1500, 'Revision notes cannot exceed 1500 characters'),
});

export const reviseQuoteSchema = z.object({
  validUntil: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)) && new Date(val) > new Date(), 'Validity date must be a valid future date')
    .optional(),
  discount: z.number().min(0, 'Discount cannot be negative').optional(),
  tax: z.number().min(0, 'Tax cannot be negative').optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(quoteItemInputSchema).min(1, 'Quote must have at least one line item'),
});

export const quoteQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  status: z.nativeEnum(QuoteStatus).optional(),
  vendorId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  eventId: z.string().uuid().optional(),
  search: z.string().optional(),
});
