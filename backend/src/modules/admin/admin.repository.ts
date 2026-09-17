import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { UserQueryDto } from './admin.types';

export class AdminRepository {
  /**
   * Fetches Shubh Mangalam dashboard statistics counts.
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalVendors: number;
    totalApprovedVendors: number;
    totalPendingVendors: number;
    totalEventTypes: number;
    totalCategories: number;
  }> {
    const [
      totalUsers,
      totalVendors,
      totalApprovedVendors,
      totalPendingVendors,
      totalEventTypes,
      totalCategories,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'APPROVED' } }),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
      prisma.eventType.count(),
      prisma.category.count(),
    ]);

    return {
      totalUsers,
      totalVendors,
      totalApprovedVendors,
      totalPendingVendors,
      totalEventTypes,
      totalCategories,
    };
  }

  /**
   * Retrieves a paginated, filtered list of users sorted newest first.
   */
  async listUsers(dto: UserQueryDto): Promise<{ total: number; users: any[] }> {
    const { page, limit, email, name } = dto;
    const where: Prisma.UserWhereInput = {};

    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }
    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    const [total, users] = await prisma.$transaction([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          role: true,
          status: true,
          emailVerified: true,
          avatar: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              status: true,
              isVerified: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return { total, users };
  }

  /**
   * Retrieves full profile information for a specific user ID.
   */
  async getUserById(id: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        avatar: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
        vendorProfile: true,
      },
    });
  }

  /**
   * Updates user isBlocked status.
   */
  async updateUserBlockStatus(id: string, isBlocked: boolean): Promise<any> {
    return prisma.user.update({
      where: { id },
      data: { isBlocked },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        avatar: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export default AdminRepository;
