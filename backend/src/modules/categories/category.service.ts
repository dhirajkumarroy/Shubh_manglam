import { CategoryRepository } from './category.repository';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './category.types';
import { NotFoundError, ConflictError } from '../../common/utils/app-error';
import { prisma } from '../../config/database';
import logger from '../../config/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CategoryService {
  private categoryRepo: CategoryRepository;

  constructor() {
    this.categoryRepo = new CategoryRepository();
  }

  /**
   * Public / Provider: Lists active categories.
   */
  async listActiveCategories() {
    logger.info('CategoryService: Fetching all active categories from database');
    return this.categoryRepo.listActiveCategories();
  }

  /**
   * Admin: Lists all categories with pagination, search and filters.
   */
  async listAllCategories(query: CategoryQueryDto) {
    logger.info(`CategoryService: Admin listing categories (page: ${query.page}, limit: ${query.limit})`);
    const { total, page, limit, categories } = await this.categoryRepo.listAllCategories(query);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      categories: categories.map((c) => ({
        id: c.id,
        parentId: c.parentId,
        parent: c.parent,
        name: c.name,
        slug: c.slug,
        description: c.description,
        icon: c.icon,
        image: c.image,
        isActive: c.isActive,
        sortOrder: c.sortOrder,
        subcategories: c.subcategories,
        subcategoryCount: c._count.subcategories,
        vendorCount: c._count.vendorCategories,
        serviceCount: c._count.services,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
    };
  }

  /**
   * Retrieves single category by ID.
   */
  async getCategoryById(id: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found.');
    }
    return category;
  }

  /**
   * Admin: Creates a new category or subcategory.
   */
  async createCategory(dto: CreateCategoryDto, adminUserId?: string) {
    logger.info(`CategoryService: Creating category '${dto.name}' (parent: ${dto.parentId || 'root'})`);
    
    if (dto.parentId) {
      const parent = await this.categoryRepo.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category not found.');
      }
    }

    let slug = slugify(dto.name);
    const existing = await this.categoryRepo.findBySlug(slug);
    if (existing) {
      if (dto.parentId) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
      } else {
        throw new ConflictError(`A category with name '${dto.name}' already exists.`);
      }
    }

    const category = await this.categoryRepo.createCategory({
      ...dto,
      slug,
    });

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'CATEGORY_CREATED',
          entity: 'Category',
          entityId: category.id,
          metadata: { name: category.name, slug: category.slug },
        },
      });
    }

    return category;
  }

  /**
   * Admin: Updates an existing category.
   */
  async updateCategory(id: string, dto: UpdateCategoryDto, adminUserId?: string) {
    const existing = await this.categoryRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Category not found.');
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== existing.name) {
      slug = slugify(dto.name);
      const duplicateSlug = await this.categoryRepo.findBySlug(slug);
      if (duplicateSlug && duplicateSlug.id !== id) {
        throw new ConflictError(`Another category with name '${dto.name}' already exists.`);
      }
    }

    const updated = await this.categoryRepo.updateCategory(id, {
      ...dto,
      ...(slug ? { slug } : {}),
    });

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'CATEGORY_UPDATED',
          entity: 'Category',
          entityId: id,
          metadata: { changes: dto as any },
        },
      });
    }

    return updated;
  }


  /**
   * Admin: Safely deletes or deactivates category.
   * If vendors or services reference this category, soft-deactivates it.
   */
  async removeCategory(id: string, adminUserId?: string) {
    const category = await this.categoryRepo.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found.');
    }

    const references = (category._count.vendorCategories || 0) + (category._count.services || 0);

    if (references > 0) {
      logger.info(`CategoryService: Category ${id} has ${references} references. Deactivating instead of deleting.`);
      const deactivated = await this.categoryRepo.deactivateCategory(id);

      if (adminUserId) {
        await prisma.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'CATEGORY_DEACTIVATED',
            entity: 'Category',
            entityId: id,
            metadata: { reason: 'Has active references', references },
          },
        });
      }

      return {
        action: 'DEACTIVATED',
        message: `Category has ${references} active references. It has been deactivated to preserve relational integrity.`,
        category: deactivated,
      };
    }

    const deleted = await this.categoryRepo.deleteCategory(id);

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'CATEGORY_DELETED',
          entity: 'Category',
          entityId: id,
        },
      });
    }

    return {
      action: 'DELETED',
      message: 'Category deleted successfully.',
      category: deleted,
    };
  }
}

export default CategoryService;
