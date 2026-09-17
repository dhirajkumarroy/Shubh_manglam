export interface CreateCategoryDto {
  parentId?: string | null;
  name: string;
  description?: string;
  icon?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  parentId?: string | null;
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
  parentId?: string | null;
  isActive?: boolean;
}

export interface CategoryItemResponse {
  id: string;
  parentId?: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  vendorCount?: number;
  subcategories?: CategoryItemResponse[];
  parent?: CategoryItemResponse | null;
  createdAt: Date;
  updatedAt: Date;
}
