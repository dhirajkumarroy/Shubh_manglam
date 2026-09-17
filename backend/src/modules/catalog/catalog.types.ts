import { PricingType } from '@prisma/client';

// =========================================================================
// Service DTOs
// =========================================================================

export interface CreateServiceDto {
  categoryId: string;
  name: string;
  description?: string;
  pricingType: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  durationMinutes?: number;
  isAvailable?: boolean;
  isActive?: boolean;
}

export interface UpdateServiceDto {
  categoryId?: string;
  name?: string;
  description?: string;
  pricingType?: PricingType;
  basePrice?: number;
  minPrice?: number;
  maxPrice?: number;
  minQuantity?: number;
  maxQuantity?: number;
  durationMinutes?: number;
  isAvailable?: boolean;
  isActive?: boolean;
}

export interface ServiceQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  vendorId?: string;
  pricingType?: PricingType;
  minPrice?: number;
  maxPrice?: number;
  isAvailable?: boolean;
  isActive?: boolean;
  city?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
}

export interface CreateServiceImageDto {
  url: string;
  publicId?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateServiceImageDto {
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ServiceImageResponse {
  id: string;
  serviceId: string;
  url: string;
  publicId?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}

export interface ServiceItemResponse {
  id: string;
  vendorId: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  pricingType: PricingType;
  basePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  durationMinutes: number | null;
  isAvailable: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
  };
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    city: string;
    state: string;
    ratingAverage: number;
    ratingCount: number;
  };
  primaryImage?: string | null;
  images?: ServiceImageResponse[];
}

// =========================================================================
// Package DTOs
// =========================================================================

export interface PackageServiceInput {
  serviceId: string;
  quantity?: number;
}

export interface CreatePackageDto {
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  durationMinutes?: number;
  isActive?: boolean;
  services: PackageServiceInput[];
}

export interface UpdatePackageDto {
  name?: string;
  description?: string;
  price?: number;
  originalPrice?: number;
  durationMinutes?: number;
  isActive?: boolean;
  services?: PackageServiceInput[];
}

export interface PackageQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  vendorId?: string;
  isActive?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'newest';
}

export interface PackageItemResponse {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  vendor?: {
    id: string;
    businessName: string;
    slug: string;
    city: string;
    state: string;
    ratingAverage: number;
    ratingCount: number;
  };
  services: {
    id: string;
    serviceId: string;
    quantity: number;
    service: {
      id: string;
      name: string;
      pricingType: PricingType;
      basePrice: number | null;
      category: {
        id: string;
        name: string;
        icon: string | null;
      };
    };
  }[];
}
