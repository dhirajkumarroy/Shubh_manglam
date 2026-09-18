import prisma from '../../config/database';
import logger from '../../config/logger';
import { 
  SmartImportPayload, 
  SmartImportResult
} from './admin-import.types';

export class AdminImportService {
  /**
   * Helper to generate a clean URL/identifier slug from any display name
   */
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[\s\W-]+/g, '-') // Replace spaces and non-alphanumeric chars with hyphen
      .replace(/^-+|-+$/g, '');   // Remove leading/trailing hyphens
  }

  /**
   * Executes bulk smart import of categories, subcategories, and celebrations
   */
  async executeSmartImport(
    payload: SmartImportPayload,
    adminUserId?: string,
    ipAddress?: string
  ): Promise<SmartImportResult> {
    const mode = payload.mode || 'UPSERT';
    const categories = payload.categories || [];
    const subcategories = payload.subcategories || [];
    const celebrations = payload.celebrations || [];

    const result: SmartImportResult = {
      success: true,
      summary: {
        categoriesCreated: 0,
        categoriesUpdated: 0,
        subcategoriesCreated: 0,
        subcategoriesUpdated: 0,
        celebrationsCreated: 0,
        celebrationsUpdated: 0,
        mappingsCreated: 0,
        totalProcessed: 0,
      },
      errors: [],
    };

    logger.info(`AdminImportService: Starting import with mode=${mode}. Categories=${categories.length}, Subcategories=${subcategories.length}, Celebrations=${celebrations.length}`);

    // Cache map for created/existing parent categories (name lowercase -> category object)
    const categoryCache = new Map<string, any>();

    // Preload existing top-level categories
    const existingRoots = await prisma.category.findMany({
      where: { parentId: null },
    });
    for (const cat of existingRoots) {
      categoryCache.set(cat.name.toLowerCase().trim(), cat);
      categoryCache.set(cat.slug.toLowerCase().trim(), cat);
    }

    // -------------------------------------------------------------
    // PHASE 1: Process Top-Level Categories
    // -------------------------------------------------------------
    for (const item of categories) {
      result.summary.totalProcessed++;
      const name = item.name?.trim();
      if (!name) {
        result.errors.push({
          sheet: 'Categories',
          item: 'Empty Name',
          error: 'Category name is required.',
        });
        continue;
      }

      const slug = item.slug?.trim() ? this.slugify(item.slug) : this.slugify(name);

      try {
        const existing = await prisma.category.findFirst({
          where: {
            OR: [
              { slug },
              { name: { equals: name, mode: 'insensitive' }, parentId: null },
            ],
          },
        });

        if (existing) {
          if (mode === 'UPSERT') {
            const updated = await prisma.category.update({
              where: { id: existing.id },
              data: {
                name,
                description: item.description?.trim() || existing.description,
                icon: item.icon?.trim() || existing.icon,
                sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : existing.sortOrder,
                isActive: typeof item.isActive === 'boolean' ? item.isActive : existing.isActive,
              },
            });
            categoryCache.set(name.toLowerCase(), updated);
            categoryCache.set(updated.slug.toLowerCase(), updated);
            result.summary.categoriesUpdated++;
          }
        } else {
          const created = await prisma.category.create({
            data: {
              name,
              slug,
              description: item.description?.trim() || null,
              icon: item.icon?.trim() || '🎪',
              sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
              isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
            },
          });
          categoryCache.set(name.toLowerCase(), created);
          categoryCache.set(slug.toLowerCase(), created);
          result.summary.categoriesCreated++;
        }
      } catch (err: any) {
        logger.error(`Failed to import category ${name}: ${err.message}`);
        result.errors.push({
          sheet: 'Categories',
          item: name,
          error: err.message || 'Failed to save category',
        });
      }
    }

    // -------------------------------------------------------------
    // PHASE 2: Process Subcategories
    // -------------------------------------------------------------
    for (const item of subcategories) {
      result.summary.totalProcessed++;
      const name = item.name?.trim();
      const parentName = item.parentCategoryName?.trim();
      const parentSlug = item.parentCategorySlug?.trim();

      if (!name) {
        result.errors.push({
          sheet: 'Subcategories',
          item: 'Empty Name',
          error: 'Subcategory name is required.',
        });
        continue;
      }

      if (!parentName && !parentSlug) {
        result.errors.push({
          sheet: 'Subcategories',
          item: name,
          error: 'Parent category name or slug is required for subcategories.',
        });
        continue;
      }

      // Lookup parent category
      let parent = null;
      if (parentName && categoryCache.has(parentName.toLowerCase())) {
        parent = categoryCache.get(parentName.toLowerCase());
      } else if (parentSlug && categoryCache.has(parentSlug.toLowerCase())) {
        parent = categoryCache.get(parentSlug.toLowerCase());
      } else {
        parent = await prisma.category.findFirst({
          where: {
            parentId: null,
            OR: [
              ...(parentName ? [{ name: { equals: parentName, mode: 'insensitive' as const } }] : []),
              ...(parentSlug ? [{ slug: parentSlug }] : []),
            ],
          },
        });
        if (parent) {
          if (parentName) categoryCache.set(parentName.toLowerCase(), parent);
          categoryCache.set(parent.slug.toLowerCase(), parent);
        }
      }

      if (!parent) {
        result.errors.push({
          sheet: 'Subcategories',
          item: name,
          error: `Parent category '${parentName || parentSlug}' could not be found.`,
        });
        continue;
      }

      const slug = item.slug?.trim() ? this.slugify(item.slug) : this.slugify(`${parent.name}-${name}`);

      try {
        const existing = await prisma.category.findFirst({
          where: {
            parentId: parent.id,
            OR: [
              { slug },
              { name: { equals: name, mode: 'insensitive' } },
            ],
          },
        });

        if (existing) {
          if (mode === 'UPSERT') {
            await prisma.category.update({
              where: { id: existing.id },
              data: {
                name,
                description: item.description?.trim() || existing.description,
                icon: item.icon?.trim() || existing.icon,
                sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : existing.sortOrder,
                isActive: typeof item.isActive === 'boolean' ? item.isActive : existing.isActive,
              },
            });
            result.summary.subcategoriesUpdated++;
          }
        } else {
          await prisma.category.create({
            data: {
              parentId: parent.id,
              name,
              slug,
              description: item.description?.trim() || null,
              icon: item.icon?.trim() || '📂',
              sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
              isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
            },
          });
          result.summary.subcategoriesCreated++;
        }
      } catch (err: any) {
        logger.error(`Failed to import subcategory ${name}: ${err.message}`);
        result.errors.push({
          sheet: 'Subcategories',
          item: `${parent.name} > ${name}`,
          error: err.message || 'Failed to save subcategory',
        });
      }
    }

    // -------------------------------------------------------------
    // PHASE 3: Process Celebrations (Event Types) & Category Mappings
    // -------------------------------------------------------------
    for (const item of celebrations) {
      result.summary.totalProcessed++;
      const name = item.name?.trim();
      if (!name) {
        result.errors.push({
          sheet: 'Celebrations',
          item: 'Empty Name',
          error: 'Celebration type name is required.',
        });
        continue;
      }

      const slug = item.slug?.trim() ? this.slugify(item.slug) : this.slugify(name);

      try {
        let eventType = await prisma.eventType.findFirst({
          where: {
            OR: [
              { slug },
              { name: { equals: name, mode: 'insensitive' } },
            ],
          },
        });

        if (eventType) {
          if (mode === 'UPSERT') {
            eventType = await prisma.eventType.update({
              where: { id: eventType.id },
              data: {
                name,
                description: item.description?.trim() || eventType.description,
                icon: item.icon?.trim() || eventType.icon,
                sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : eventType.sortOrder,
                isActive: typeof item.isActive === 'boolean' ? item.isActive : eventType.isActive,
              },
            });
            result.summary.celebrationsUpdated++;
          }
        } else {
          eventType = await prisma.eventType.create({
            data: {
              name,
              slug,
              description: item.description?.trim() || null,
              icon: item.icon?.trim() || '🎉',
              sortOrder: typeof item.sortOrder === 'number' ? item.sortOrder : 0,
              isActive: typeof item.isActive === 'boolean' ? item.isActive : true,
            },
          });
          result.summary.celebrationsCreated++;
        }

        // Process mapped categories if provided
        if (eventType && item.mappedCategoryNames && item.mappedCategoryNames.length > 0) {
          for (const rawCatName of item.mappedCategoryNames) {
            const catName = rawCatName.trim();
            if (!catName) continue;

            let cat = categoryCache.get(catName.toLowerCase());
            if (!cat) {
              cat = await prisma.category.findFirst({
                where: {
                  OR: [
                    { name: { equals: catName, mode: 'insensitive' } },
                    { slug: this.slugify(catName) },
                  ],
                },
              });
              if (cat) {
                categoryCache.set(catName.toLowerCase(), cat);
              }
            }

            if (cat) {
              await prisma.eventTypeCategory.upsert({
                where: {
                  eventTypeId_categoryId: {
                    eventTypeId: eventType.id,
                    categoryId: cat.id,
                  },
                },
                create: {
                  eventTypeId: eventType.id,
                  categoryId: cat.id,
                  isRecommended: true,
                  sortOrder: 0,
                },
                update: {
                  isRecommended: true,
                },
              });
              result.summary.mappingsCreated++;
            }
          }
        }
      } catch (err: any) {
        logger.error(`Failed to import celebration ${name}: ${err.message}`);
        result.errors.push({
          sheet: 'Celebrations',
          item: name,
          error: err.message || 'Failed to save celebration type',
        });
      }
    }

    // -------------------------------------------------------------
    // PHASE 4: Audit Logging
    // -------------------------------------------------------------
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId || null,
          action: 'SMART_EXCEL_IMPORT',
          entity: 'CATALOG_HIERARCHY',
          metadata: {
            mode,
            summary: result.summary,
            errorsCount: result.errors.length,
          },
          ipAddress: ipAddress || null,
        },
      });
    } catch (auditErr) {
      logger.warn(`Failed to write smart import audit log: ${auditErr}`);
    }

    logger.info(`AdminImportService: Completed import. Success Summary: ${JSON.stringify(result.summary)}`);
    return result;
  }
}

export const adminImportService = new AdminImportService();
export default adminImportService;
