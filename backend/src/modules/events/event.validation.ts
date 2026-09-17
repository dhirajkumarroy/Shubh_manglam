import { z } from 'zod';
import { EventStatus, RequirementStatus } from '@prisma/client';

export const createEventTypeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  image: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const updateEventTypeSchema = createEventTypeSchema.partial();

export const mapCategoryToEventTypeSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  isRecommended: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const createEventSchema = z.object({
  eventTypeId: z.string().uuid('Invalid event type ID'),
  title: z.string().min(2, 'Event title must be at least 2 characters').max(200),
  description: z.string().optional(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid event date format',
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format').optional(),
  guestCount: z.number().int().positive().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  addressLine1: z.string().min(3, 'Address line 1 is required').max(255),
  city: z.string().min(2, 'City is required').max(100),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit Indian PIN code'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const updateEventSchema = z.object({
  eventTypeId: z.string().uuid('Invalid event type ID').optional(),
  title: z.string().min(2).max(200).optional(),
  description: z.string().optional(),
  eventDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid event date format',
  }).optional(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format').optional(),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format').optional(),
  guestCount: z.number().int().positive().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  addressLine1: z.string().min(3).max(255).optional(),
  city: z.string().min(2).max(100).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be a 6-digit Indian PIN code').optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  status: z.nativeEnum(EventStatus).optional(),
});

export const createEventRequirementSchema = z.object({
  categoryId: z.string().uuid('Invalid category ID'),
  quantity: z.number().int().positive().optional().default(1),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  notes: z.string().optional(),
});

export const updateEventRequirementSchema = z.object({
  quantity: z.number().int().positive().optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  notes: z.string().optional(),
  status: z.nativeEnum(RequirementStatus).optional(),
});
