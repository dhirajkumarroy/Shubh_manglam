import { prisma } from '../../config/database';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './category.types';
import { Prisma } from '@prisma/client';

export class CategoryRepository {
  /**
   * Lists all active root categories with their active subcategories.
   */
  async listActiveCategories() {
    return prisma.category.findMany({
      where: { 
        isActive: true,
        parentId: null,
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Lists subcategories for a specific parent category.
   */
  async listSubcategories(parentId: string) {
    return prisma.category.findMany({
      where: {
        parentId,
        isActive: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Lists categories for Admin with pagination, search, hierarchy, and filtering.
   */
  async listAllCategories(query: CategoryQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.CategoryWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [total, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          subcategories: {
            orderBy: { sortOrder: 'asc' },
            include: {
              _count: {
                select: {
                  subcategoryServices: true,
                },
              },
            },
          },
          _count: {
            select: {
              vendorCategories: true,
              services: true,
              subcategories: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, categories };
  }

  /**
   * Finds a category by its primary ID.
   */
  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        subcategories: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: {
            vendorCategories: true,
            services: true,
            subcategories: true,
          },
        },
      },
    });
  }

  /**
   * Finds a category by slug.
   */
  async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        subcategories: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  /**
   * Creates a new category or subcategory.
   */
  async createCategory(data: CreateCategoryDto & { slug: string }) {
    return prisma.category.create({
      data: {
        parentId: data.parentId ?? null,
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
      include: {
        parent: true,
        subcategories: true,
      },
    });
  }

  /**
   * Updates an existing category.
   */
  async updateCategory(id: string, data: UpdateCategoryDto & { slug?: string }) {
    return prisma.category.update({
      where: { id },
      data,
      include: {
        parent: true,
        subcategories: true,
      },
    });
  }

  /**
   * Soft deactivates category.
   */
  async deactivateCategory(id: string) {
    return prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Hard deletes category.
   */
  async deleteCategory(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }
}

export default CategoryRepository;
