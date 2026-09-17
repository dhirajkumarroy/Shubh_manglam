export type RootStackParamList = {
  ProviderSplash: undefined;
  ProviderLogin: undefined;
  ProviderRegister: undefined;
  VendorOnboarding: undefined;
  ProviderHome: { vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' } | undefined;
  CatalogDashboard: undefined;
  ServiceForm: { serviceId?: string } | undefined;
  ServiceImages: { serviceId: string; serviceName: string };
  PackageForm: { packageId?: string } | undefined;
};

export interface CatalogServiceItem {
  id: string;
  vendorId: string;
  categoryId: string;
  subcategoryId?: string | null;
  eventTypeId?: string | null;
  name: string;
  slug: string;
  description: string | null;
  pricingType: 'FIXED' | 'PER_PERSON' | 'PER_UNIT' | 'PER_DAY' | 'PER_HOUR' | 'CUSTOM_QUOTE';
  basePrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  durationMinutes: number | null;
  isAvailable: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
    icon?: string | null;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  eventType?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  primaryImage?: string | null;
  images?: any[];
}

export interface EventType {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  image?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CatalogPackageItem {
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
  services: {
    id: string;
    serviceId: string;
    quantity: number;
    service: {
      id: string;
      name: string;
      pricingType: string;
      basePrice: number | null;
    };
  }[];
}

export interface ServiceCategory {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  subcategories?: ServiceCategory[];
}

export interface VendorDocumentItem {
  id: string;
  documentType: 'BUSINESS_REGISTRATION' | 'IDENTITY_PROOF' | 'ADDRESS_PROOF' | 'TAX_DOCUMENT' | 'CERTIFICATE' | 'OTHER';
  documentUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string | null;
  createdAt: string;
}

export interface ProfileCompleteness {
  profileCompleted: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export interface FullVendorProfile {
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
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
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
  documents: VendorDocumentItem[];
  completeness: ProfileCompleteness;
}
