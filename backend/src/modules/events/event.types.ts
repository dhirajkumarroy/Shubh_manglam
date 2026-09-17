import { EventStatus, RequirementStatus } from '@prisma/client';

export interface CreateEventTypeDto {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateEventTypeDto {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface MapCategoryToEventTypeDto {
  categoryId: string;
  isRecommended?: boolean;
  sortOrder?: number;
}

export interface CreateEventDto {
  eventTypeId: string;
  title: string;
  description?: string;
  eventDate: string; // ISO-8601 or YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  addressLine1: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateEventDto {
  eventTypeId?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  addressLine1?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status?: EventStatus;
}

export interface CreateEventRequirementDto {
  categoryId: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
}

export interface UpdateEventRequirementDto {
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
  status?: RequirementStatus;
}
