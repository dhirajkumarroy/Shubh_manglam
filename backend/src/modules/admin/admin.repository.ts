import { Prisma, VendorStatus, DocumentStatus } from '@prisma/client';
import prisma from '../../config/database';
import { UserQueryDto, AdminVendorQueryDto, AdminDashboardStats } from './admin.types';

export class AdminRepository {
  /**
   * Fetches full Shubh Mangalam dashboard statistics counts.
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const [
      totalUsers,
      totalCustomers,
      totalProviders,
      totalAdmins,
      totalActiveUsers,
      totalBlockedUsers,
      totalVerifiedUsers,
      totalVendors,
      totalApprovedVendors,
      totalPendingVendors,
      totalUnderReviewVendors,
      totalRejectedVendors,
      totalSuspendedVendors,
      totalEventTypes,
      totalCategories,
      recentUsers,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.user.count({ where: { role: 'VENDOR' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { status: 'ACTIVE', isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { emailVerified: true } }),
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: 'APPROVED' } }),
      prisma.vendor.count({ where: { status: 'PENDING' } }),
      prisma.vendor.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.vendor.count({ where: { status: 'REJECTED' } }),
      prisma.vendor.count({ where: { status: 'SUSPENDED' } }),
      prisma.eventType.count(),
      prisma.category.count(),
      prisma.user.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
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
          vendorProfile: {
            select: {
              id: true,
              businessName: true,
              status: true,
              isVerified: true,
            },
          },
        },
      }),
    ]);

    return {
      totalUsers,
      totalCustomers,
      totalProviders,
      totalAdmins,
      totalActiveUsers,
      totalBlockedUsers,
      totalVerifiedUsers,
      totalVendors,
      totalApprovedVendors,
      totalPendingVendors,
      totalUnderReviewVendors,
      totalRejectedVendors,
      totalSuspendedVendors,
      totalEventTypes,
      totalCategories,
      recentUsers,
    };
  }

  /**
   * Retrieves a paginated, filtered list of users sorted newest first.
   */
  async listUsers(dto: UserQueryDto): Promise<{ total: number; users: any[] }> {
    const { page, limit, search, email, name, role, status, isBlocked } = dto;
    const where: Prisma.UserWhereInput = {};

    if (search && search.trim() !== '') {
      const searchTrimmed = search.trim();
      where.OR = [
        { name: { contains: searchTrimmed, mode: 'insensitive' } },
        { email: { contains: searchTrimmed, mode: 'insensitive' } },
        { phone: { contains: searchTrimmed, mode: 'insensitive' } },
      ];
    } else {
      if (email) {
        where.email = { contains: email, mode: 'insensitive' };
      }
      if (name) {
        where.name = { contains: name, mode: 'insensitive' };
      }
    }

    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }
    if (typeof isBlocked === 'boolean') {
      where.isBlocked = isBlocked;
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

  // =========================================================================
  // Vendor Management Repository Methods
  // =========================================================================

  /**
   * Retrieves paginated vendors with multi-field search and filters.
   */
  async listVendors(query: AdminVendorQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.VendorWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified;
    }

    if (query.city) {
      where.city = { contains: query.city, mode: 'insensitive' };
    }

    if (query.categoryId) {
      where.categories = {
        some: { categoryId: query.categoryId },
      };
    }

    if (query.search) {
      where.OR = [
        { businessName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { user: { name: { contains: query.search, mode: 'insensitive' } } },
        { user: { email: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, vendors] = await prisma.$transaction([
      prisma.vendor.count({ where }),
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          categories: {
            include: { category: true },
          },
          documents: {
            select: {
              id: true,
              documentType: true,
              status: true,
            },
          },
          _count: {
            select: {
              services: true,
              bookings: true,
            },
          },
        },
      }),
    ]);

    return { total, page, limit, vendors };
  }

  /**
   * Retrieves full vendor details by vendor ID.
   */
  async getVendorById(vendorId: string) {
    return prisma.vendor.findUnique({
      where: { id: vendorId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
        categories: {
          include: { category: true },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            services: true,
            packages: true,
            bookings: true,
            reviews: true,
          },
        },
      },
    });
  }

  /**
   * Updates vendor status and verification flag.
   */
  async updateVendorStatus(vendorId: string, status: VendorStatus, isVerified?: boolean, isActive?: boolean) {
    const data: Prisma.VendorUpdateInput = { status };
    if (isVerified !== undefined) {
      data.isVerified = isVerified;
    }
    if (isActive !== undefined) {
      data.isActive = isActive;
    }

    return prisma.vendor.update({
      where: { id: vendorId },
      data,
      include: {
        user: true,
        categories: { include: { category: true } },
        documents: true,
      },
    });
  }

  /**
   * Updates a vendor document status.
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    rejectionReason?: string | null
  ) {
    return prisma.vendorDocument.update({
      where: { id: documentId },
      data: {
        status,
        rejectionReason: status === DocumentStatus.REJECTED ? rejectionReason : null,
      },
    });
  }

  /**
   * Finds a document by ID.
   */
  async findDocumentById(documentId: string) {
    return prisma.vendorDocument.findUnique({
      where: { id: documentId },
      include: {
        vendor: {
          include: { user: true },
        },
      },
    });
  }

  /**
   * Creates an audit log entry.
   */
  async createAuditLog(entry: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata || Prisma.JsonNull,
        ipAddress: entry.ipAddress,
      },
    });
  }
}

export default AdminRepository;
