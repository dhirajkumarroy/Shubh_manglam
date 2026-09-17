export interface MarketplaceVendorQueryDto {
  eventType?: string;
  category?: string;
  categoryId?: string;
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
}

export interface MarketplaceServiceQueryDto {
  categoryId?: string;
  vendorId?: string;
  eventTypeId?: string;
  search?: string;
  city?: string;
  pricingType?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'popular' | 'rating' | 'newest';
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
