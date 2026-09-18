import * as XLSX from 'xlsx';

export interface ParsedCategoryRow {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ParsedSubcategoryRow {
  parentCategoryName: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface ParsedCelebrationRow {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
  mappedCategoryNames?: string[];
}

export interface ParsedImportData {
  categories: ParsedCategoryRow[];
  subcategories: ParsedSubcategoryRow[];
  celebrations: ParsedCelebrationRow[];
}

/**
 * Downloads a ready-to-use, multi-sheet sample Excel template
 */
export const downloadSmartImportTemplate = () => {
  const wb = XLSX.utils.book_new();

  // 1. Categories Sheet
  const categoriesData = [
    {
      'Category Name*': 'Catering & Halwai',
      'Slug (Optional)': 'catering-halwai',
      'Description': 'Traditional Indian sweets, wedding feasts & live food counters',
      'Icon (Emoji)': '🍲',
      'Sort Order': 1,
      'Active': 'TRUE',
    },
    {
      'Category Name*': 'Decorators & Tent',
      'Slug (Optional)': 'decorators-tent',
      'Description': 'Mandap decoration, floral arches, royal lighting & tent arrangements',
      'Icon (Emoji)': '🎪',
      'Sort Order': 2,
      'Active': 'TRUE',
    },
    {
      'Category Name*': 'Photography & Videography',
      'Slug (Optional)': 'photography-videography',
      'Description': 'Cinematic wedding films, pre-wedding shoots & drone coverage',
      'Icon (Emoji)': '📸',
      'Sort Order': 3,
      'Active': 'TRUE',
    },
    {
      'Category Name*': 'Beautician & Makeup',
      'Slug (Optional)': 'beautician-makeup',
      'Description': 'Bridal makeover, mehndi artists, hair styling & party makeup',
      'Icon (Emoji)': '💄',
      'Sort Order': 4,
      'Active': 'TRUE',
    },
    {
      'Category Name*': 'Music, DJ & Entertainment',
      'Slug (Optional)': 'music-dj-entertainment',
      'Description': 'Live dhol, celebrity singers, choreographers & sound systems',
      'Icon (Emoji)': '🎵',
      'Sort Order': 5,
      'Active': 'TRUE',
    }
  ];
  const wsCategories = XLSX.utils.json_to_sheet(categoriesData);
  wsCategories['!cols'] = [
    { wch: 28 }, // Category Name
    { wch: 22 }, // Slug
    { wch: 50 }, // Description
    { wch: 14 }, // Icon
    { wch: 12 }, // Sort Order
    { wch: 10 }, // Active
  ];
  XLSX.utils.book_append_sheet(wb, wsCategories, 'Categories');

  // 2. Subcategories Sheet
  const subcategoriesData = [
    {
      'Parent Category Name*': 'Catering & Halwai',
      'Subcategory Name*': 'Live Chaat & Street Food',
      'Slug (Optional)': 'live-chaat-street-food',
      'Description': 'Gol gappe, aloo tikki, pav bhaji & live street counters',
      'Icon (Emoji)': '🥟',
      'Sort Order': 1,
      'Active': 'TRUE',
    },
    {
      'Parent Category Name*': 'Catering & Halwai',
      'Subcategory Name*': 'Traditional Sweets & Mithai',
      'Slug (Optional)': 'traditional-sweets-mithai',
      'Description': 'Kaju katli, gulab jamun, jalebi & rabri',
      'Icon (Emoji)': '🍨',
      'Sort Order': 2,
      'Active': 'TRUE',
    },
    {
      'Parent Category Name*': 'Decorators & Tent',
      'Subcategory Name*': 'Mandap & Stage Setup',
      'Slug (Optional)': 'mandap-stage-setup',
      'Description': 'Royal wedding stage, hawan mandap & entry walkway',
      'Icon (Emoji)': '🏛️',
      'Sort Order': 1,
      'Active': 'TRUE',
    },
    {
      'Parent Category Name*': 'Decorators & Tent',
      'Subcategory Name*': 'Floral & Fairy Lights',
      'Slug (Optional)': 'floral-fairy-lights',
      'Description': 'Fresh marigold, orchid walls & ambient LED curtain lights',
      'Icon (Emoji)': '🌸',
      'Sort Order': 2,
      'Active': 'TRUE',
    },
    {
      'Parent Category Name*': 'Photography & Videography',
      'Subcategory Name*': 'Candid & Drone Shoots',
      'Slug (Optional)': 'candid-drone-shoots',
      'Description': 'Aerial 4K coverage and spontaneous emotion captures',
      'Icon (Emoji)': '🚁',
      'Sort Order': 1,
      'Active': 'TRUE',
    },
  ];
  const wsSubcategories = XLSX.utils.json_to_sheet(subcategoriesData);
  wsSubcategories['!cols'] = [
    { wch: 28 }, // Parent Category Name
    { wch: 28 }, // Subcategory Name
    { wch: 24 }, // Slug
    { wch: 45 }, // Description
    { wch: 14 }, // Icon
    { wch: 12 }, // Sort Order
    { wch: 10 }, // Active
  ];
  XLSX.utils.book_append_sheet(wb, wsSubcategories, 'Subcategories');

  // 3. Celebrations (Event Types) Sheet
  const celebrationsData = [
    {
      'Celebration Name*': 'Wedding Ceremony',
      'Slug (Optional)': 'wedding-ceremony',
      'Description': 'Grand Indian Vivah, Sangeet, Haldi & Reception',
      'Icon (Emoji)': '💍',
      'Sort Order': 1,
      'Active': 'TRUE',
      'Mapped Categories (Comma-separated)': 'Catering & Halwai, Decorators & Tent, Photography & Videography, Beautician & Makeup, Music, DJ & Entertainment',
    },
    {
      'Celebration Name*': 'Birthday Celebration',
      'Slug (Optional)': 'birthday-celebration',
      'Description': 'Themed kids birthdays, milestone parties & cake ceremonies',
      'Icon (Emoji)': '🎂',
      'Sort Order': 2,
      'Active': 'TRUE',
      'Mapped Categories (Comma-separated)': 'Catering & Halwai, Decorators & Tent, Music, DJ & Entertainment',
    },
    {
      'Celebration Name*': 'Corporate Gala & Conference',
      'Slug (Optional)': 'corporate-gala',
      'Description': 'Annual conventions, product launches & executive banquets',
      'Icon (Emoji)': '👔',
      'Sort Order': 3,
      'Active': 'TRUE',
      'Mapped Categories (Comma-separated)': 'Catering & Halwai, Photography & Videography, Music, DJ & Entertainment',
    },
    {
      'Celebration Name*': 'Anniversary & Milestones',
      'Slug (Optional)': 'anniversary-milestones',
      'Description': 'Silver jubilee, golden jubilee & romantic vow renewals',
      'Icon (Emoji)': '🥂',
      'Sort Order': 4,
      'Active': 'TRUE',
      'Mapped Categories (Comma-separated)': 'Catering & Halwai, Decorators & Tent, Photography & Videography',
    },
  ];
  const wsCelebrations = XLSX.utils.json_to_sheet(celebrationsData);
  wsCelebrations['!cols'] = [
    { wch: 28 }, // Celebration Name
    { wch: 22 }, // Slug
    { wch: 45 }, // Description
    { wch: 14 }, // Icon
    { wch: 12 }, // Sort Order
    { wch: 10 }, // Active
    { wch: 60 }, // Mapped Categories
  ];
  XLSX.utils.book_append_sheet(wb, wsCelebrations, 'Celebrations');

  // 4. Instructions Guide Sheet
  const instructionsData = [
    {
      'Column / Concept': 'How It Works',
      'Explanation': 'This template allows importing Categories, Subcategories, and Celebrations in a single upload.',
      'Tips': 'Leave Slug blank to auto-generate from Name.',
    },
    {
      'Column / Concept': 'Sheet: Categories',
      'Explanation': 'Top-level industry sectors (e.g. Catering, Decor, Beautician).',
      'Tips': 'Name is required. Unique per root level.',
    },
    {
      'Column / Concept': 'Sheet: Subcategories',
      'Explanation': 'Specific offerings mapped to a parent category.',
      'Tips': 'Parent Category Name must match a category in the Categories sheet or existing in database.',
    },
    {
      'Column / Concept': 'Sheet: Celebrations',
      'Explanation': 'Event occasions customers can plan (Wedding, Birthday, etc.).',
      'Tips': 'Use the Mapped Categories column to auto-link relevant categories.',
    },
  ];
  const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 22 }, { wch: 55 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Guide');

  // Generate file and trigger browser download
  XLSX.writeFile(wb, 'Shubh_Ausar_Smart_Import_Template.xlsx');
};

/**
 * Normalizes header keys to handle slight naming variations
 */
const findValue = (row: any, ...keys: string[]): any => {
  for (const k of keys) {
    if (row[k] !== undefined) return row[k];
    const match = Object.keys(row).find(
      (prop) => prop.toLowerCase().replace(/[^a-z0-9]/g, '') === k.toLowerCase().replace(/[^a-z0-9]/g, '')
    );
    if (match && row[match] !== undefined) return row[match];
  }
  return undefined;
};

/**
 * Parses an uploaded Excel / CSV file into structured categories, subcategories, and celebrations
 */
export const parseExcelFile = async (file: File): Promise<ParsedImportData> => {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const result: ParsedImportData = {
    categories: [],
    subcategories: [],
    celebrations: [],
  };

  for (const sheetName of wb.SheetNames) {
    const cleanSheetName = sheetName.toLowerCase().trim();
    const sheet = wb.Sheets[sheetName];
    if (!sheet) continue;

    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (cleanSheetName.includes('subcat')) {
      // Subcategories Sheet
      for (const row of rows) {
        const name = findValue(row, 'Subcategory Name*', 'Subcategory Name', 'name', 'subcategory');
        const parentCategoryName = findValue(row, 'Parent Category Name*', 'Parent Category Name', 'parent', 'category');
        if (!name || !parentCategoryName) continue;

        const slug = findValue(row, 'Slug (Optional)', 'slug');
        const description = findValue(row, 'Description', 'desc');
        const icon = findValue(row, 'Icon (Emoji)', 'Icon', 'icon');
        const sortOrder = Number(findValue(row, 'Sort Order', 'sort_order', 'order')) || 0;
        const activeRaw = findValue(row, 'Active', 'is_active', 'status');
        const isActive = activeRaw === undefined ? true : String(activeRaw).toLowerCase() !== 'false';

        result.subcategories.push({
          parentCategoryName: String(parentCategoryName).trim(),
          name: String(name).trim(),
          slug: slug ? String(slug).trim() : undefined,
          description: description ? String(description).trim() : undefined,
          icon: icon ? String(icon).trim() : undefined,
          sortOrder,
          isActive,
        });
      }
    } else if (cleanSheetName.includes('cat')) {
      // Top-level Categories Sheet
      for (const row of rows) {
        const name = findValue(row, 'Category Name*', 'Category Name', 'name', 'category');
        if (!name) continue;

        const slug = findValue(row, 'Slug (Optional)', 'slug');
        const description = findValue(row, 'Description', 'desc');
        const icon = findValue(row, 'Icon (Emoji)', 'Icon', 'icon');
        const sortOrder = Number(findValue(row, 'Sort Order', 'sort_order', 'order')) || 0;
        const activeRaw = findValue(row, 'Active', 'is_active', 'status');
        const isActive = activeRaw === undefined ? true : String(activeRaw).toLowerCase() !== 'false';

        result.categories.push({
          name: String(name).trim(),
          slug: slug ? String(slug).trim() : undefined,
          description: description ? String(description).trim() : undefined,
          icon: icon ? String(icon).trim() : undefined,
          sortOrder,
          isActive,
        });
      }
    } else if (cleanSheetName.includes('celeb') || cleanSheetName.includes('event')) {
      // Celebrations / Event Types Sheet
      for (const row of rows) {
        const name = findValue(row, 'Celebration Name*', 'Celebration Name', 'Event Type', 'name');
        if (!name) continue;

        const slug = findValue(row, 'Slug (Optional)', 'slug');
        const description = findValue(row, 'Description', 'desc');
        const icon = findValue(row, 'Icon (Emoji)', 'Icon', 'icon');
        const sortOrder = Number(findValue(row, 'Sort Order', 'sort_order', 'order')) || 0;
        const activeRaw = findValue(row, 'Active', 'is_active', 'status');
        const isActive = activeRaw === undefined ? true : String(activeRaw).toLowerCase() !== 'false';

        const mappedRaw = findValue(
          row,
          'Mapped Categories (Comma-separated)',
          'Mapped Categories',
          'categories',
          'mapping'
        );
        const mappedCategoryNames = mappedRaw
          ? String(mappedRaw)
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean)
          : [];

        result.celebrations.push({
          name: String(name).trim(),
          slug: slug ? String(slug).trim() : undefined,
          description: description ? String(description).trim() : undefined,
          icon: icon ? String(icon).trim() : undefined,
          sortOrder,
          isActive,
          mappedCategoryNames,
        });
      }
    }
  }

  return result;
};
