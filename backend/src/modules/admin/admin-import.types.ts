export interface ImportCategoryItem {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ImportSubcategoryItem {
  parentCategoryName: string;
  parentCategorySlug?: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ImportCelebrationItem {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  mappedCategoryNames?: string[];
}

export interface SmartImportPayload {
  mode?: 'UPSERT' | 'CREATE_ONLY';
  categories?: ImportCategoryItem[];
  subcategories?: ImportSubcategoryItem[];
  celebrations?: ImportCelebrationItem[];
}

export interface SmartImportResult {
  success: boolean;
  summary: {
    categoriesCreated: number;
    categoriesUpdated: number;
    subcategoriesCreated: number;
    subcategoriesUpdated: number;
    celebrationsCreated: number;
    celebrationsUpdated: number;
    mappingsCreated: number;
    totalProcessed: number;
  };
  errors: Array<{
    sheet: string;
    item: string;
    error: string;
  }>;
}
