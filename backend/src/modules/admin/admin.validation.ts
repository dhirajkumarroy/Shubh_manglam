import { z } from 'zod';
import { VendorStatus } from '@prisma/client';


export const userQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  email: z.string().optional(),
  name: z.string().optional(),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format. Must be a valid UUID.'),
});

export const vendorIdParamSchema = z.object({
  vendorId: z.string().uuid('Invalid Vendor ID format. Must be a valid UUID.'),
});

export const vendorDocumentParamsSchema = z.object({
  vendorId: z.string().uuid('Invalid Vendor ID format.'),
  documentId: z.string().uuid('Invalid Document ID format.'),
});

export const adminVendorQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  city: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  isVerified: z.preprocess((val) => {
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
});

export const rejectVendorSchema = z.object({
  rejectionReason: z
    .string()
    .min(5, 'Rejection reason must be at least 5 characters')
    .max(1000, 'Rejection reason cannot exceed 1000 characters'),
});

export const suspendVendorSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const reviewDocumentSchema = z
  .object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'REJECTED' && (!data.rejectionReason || data.rejectionReason.trim().length < 3)) {
        return false;
      }
      return true;
    },
    {
      message: 'Rejection reason is required when rejecting a document.',
      path: ['rejectionReason'],
    }
  );
