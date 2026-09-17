export interface CreateCategoryDto {
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CategoryQueryDto {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CategoryItemResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  vendorCount?: number;
  createdAt: Date;
  updatedAt: Date;
}
