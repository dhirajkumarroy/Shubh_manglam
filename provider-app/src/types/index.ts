export type RootStackParamList = {
  ProviderSplash: undefined;
  ProviderLogin: undefined;
  ProviderRegister: undefined;
  VendorOnboarding: undefined;
  ProviderHome: { vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' } | undefined;
};

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
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
