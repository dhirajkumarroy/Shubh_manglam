import { prisma } from '../../config/database';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './category.types';
import { Prisma } from '@prisma/client';

export class CategoryRepository {
  /**
   * Lists all active categories for the public marketplace and provider onboarding.
   */
  async listActiveCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Lists categories for Admin with pagination, search, and filtering.
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
          _count: {
            select: {
              vendorCategories: true,
              services: true,
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
        _count: {
          select: {
            vendorCategories: true,
            services: true,
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
    });
  }

  /**
   * Creates a new category.
   */
  async createCategory(data: CreateCategoryDto & { slug: string }) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
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
