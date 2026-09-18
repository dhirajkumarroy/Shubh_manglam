import { VendorStatus, DocumentType, DocumentStatus } from '@prisma/client';

export interface UpdateVendorProfileDto {
  businessName?: string;
  description?: string;
  phone?: string;
  email?: string;
  logo?: string;
  coverImage?: string;
  addressLine1?: string;
  addressLine2?: string | null;
  village?: string | null;
  locality?: string | null;
  city?: string;
  district?: string | null;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  operatingRadiusKm?: number;
}


export interface SyncVendorCategoriesDto {
  categoryIds: string[];
}

export interface CreateVendorDocumentDto {
  documentType: DocumentType;
  documentUrl: string;
}

export interface ProfileCompletenessResult {
  profileCompleted: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export interface VendorProfileResponse {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description: string | null;
  phone: string;
  email: string | null;
  logo: string | null;
  coverImage: string | null;
  addressLine1: string;
  addressLine2: string | null;
  village: string | null;
  locality: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  pincode: string;
  latitude: number;
  longitude: number;
  operatingRadiusKm: number;
  status: VendorStatus;
  isVerified: boolean;
  isActive: boolean;
  ratingAverage: number;
  ratingCount: number;
  categories: {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    icon: string | null;
  }[];
  documents: {
    id: string;
    documentType: DocumentType;
    documentUrl: string;
    status: DocumentStatus;
    rejectionReason: string | null;
    createdAt: Date;
  }[];
  completeness: ProfileCompletenessResult;
  user?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string | null;
  };
}
