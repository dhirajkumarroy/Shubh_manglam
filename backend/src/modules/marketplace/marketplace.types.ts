export interface MarketplaceVendorQueryDto {
  eventType?: string;
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  search?: string;
  q?: string;
  minRating?: number;
  sort?: 'nearest' | 'rating' | 'newest' | 'relevance';
  page?: number;
  limit?: number;
}

export interface MarketplaceCategoryQueryDto {
  eventTypeId?: string;
  search?: string;
  parentId?: string | null;
}

export interface MarketplaceServiceQueryDto {
  categoryId?: string;
  subcategoryId?: string;
  vendorId?: string;
  eventTypeId?: string;
  search?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  pricingType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'nearest' | 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface MarketplacePackageQueryDto {
  vendorId?: string;
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
  page?: number;
  limit?: number;
}
