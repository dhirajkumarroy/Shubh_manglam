import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const updateVendorProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(100).optional(),
  description: z.string().max(2000).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/, 'Invalid phone number format').optional(),
  email: z.string().email('Invalid email address').optional(),
  logo: z.string().url('Invalid logo URL').or(z.string().startsWith('/uploads/')).or(z.string().startsWith('uploads/')).optional(),
  coverImage: z.string().url('Invalid cover image URL').or(z.string().startsWith('/uploads/')).or(z.string().startsWith('uploads/')).optional(),
  addressLine1: z.string().min(3, 'Address line 1 must be at least 3 characters').max(200).optional(),
  addressLine2: z.string().max(200).optional().nullable(),
  village: z.string().max(100).optional().nullable(),
  locality: z.string().max(100).optional().nullable(),
  city: z.string().min(2, 'City is required').max(100).optional(),
  district: z.string().max(100).optional().nullable(),
  state: z.string().min(2, 'State is required').max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  operatingRadiusKm: z.number().min(1).max(500).optional(),
});

export const syncVendorCategoriesSchema = z.object({
  categoryIds: z.array(z.string().uuid('Category ID must be a valid UUID')).min(1, 'Select at least one category'),
});

export const createVendorDocumentSchema = z.object({
  documentType: z.nativeEnum(DocumentType, {
    errorMap: () => ({ message: 'Invalid document type. Allowed: BUSINESS_REGISTRATION, IDENTITY_PROOF, ADDRESS_PROOF, TAX_DOCUMENT, CERTIFICATE, OTHER' }),
  }).optional().default(DocumentType.OTHER),
  documentUrl: z.string().min(1, 'Document URL is required'),
  requirementId: z.string().uuid().optional(),
  originalFileName: z.string().optional(),
  fileSize: z.number().optional(),
  mimeType: z.string().optional(),
});

export const addGalleryMediaSchema = z.object({
  mediaType: z.enum(['IMAGE', 'VIDEO'], {
    errorMap: () => ({ message: 'mediaType must be IMAGE or VIDEO' }),
  }),
  url: z.string().min(1, 'Media URL is required'),
  thumbnailUrl: z.string().optional(),
  caption: z.string().max(300, 'Caption must be under 300 characters').optional(),
  serviceId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateGalleryMediaSchema = z.object({
  caption: z.string().max(300, 'Caption must be under 300 characters').optional().nullable(),
  serviceId: z.string().uuid().optional().nullable(),
  sortOrder: z.number().int().optional(),
});

export const reorderGallerySchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.number().int(),
    })
  ).min(1, 'At least one gallery item required for reordering'),
});
