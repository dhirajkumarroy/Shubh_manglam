import { AdminRepository } from './admin.repository';
import { NotificationService } from '../notifications/notification.service';
import { CategoryService } from '../categories/category.service';
import {
  UserQueryDto,
  AdminVendorQueryDto,
  AdminDashboardStats,
} from './admin.types';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto,
} from '../categories/category.types';
import { NotFoundError, BadRequestError } from '../../common/utils/app-error';
import { validateVendorTransition } from '../vendors/vendor.constants';
import { VendorStatus, DocumentStatus } from '@prisma/client';
import logger from '../../config/logger';

export class AdminService {
  private adminRepository: AdminRepository;
  private notificationService: NotificationService;
  private categoryService: CategoryService;

  constructor() {
    this.adminRepository = new AdminRepository();
    this.notificationService = new NotificationService();
    this.categoryService = new CategoryService();
  }

  /**
   * Retrieves dashboard statistics for Shubh Ausar.
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    logger.info('AdminService: Fetching Shubh Ausar dashboard stats');
    return this.adminRepository.getDashboardStats();
  }

  /**
   * Retrieves paginated users list.
   */
  async listUsers(dto: UserQueryDto) {
    logger.info(`AdminService: Listing users (page: ${dto.page}, limit: ${dto.limit})`);
    const { total, users } = await this.adminRepository.listUsers(dto);
    const totalPages = Math.ceil(total / dto.limit);

    return {
      pagination: {
        total,
        page: dto.page,
        limit: dto.limit,
        totalPages,
      },
      users,
    };
  }

  /**
   * Retrieves user details.
   */
  async getUserDetails(id: string) {
    logger.info(`AdminService: Fetching user details for ID: ${id}`);
    const user = await this.adminRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError('User not found.');
    }
    return user;
  }

  /**
   * Blocks a user and triggers a notification.
   */
  async blockUser(id: string) {
    logger.info(`AdminService: Blocking user ID: ${id}`);
    const userExists = await this.adminRepository.getUserById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    const updatedUser = await this.adminRepository.updateUserBlockStatus(id, true);

    this.notificationService.createNotification(id, {
      title: 'Account Blocked',
      message: 'Your account has been blocked by an administrator.',
      type: 'SYSTEM',
    }).catch((err) => logger.error(`Failed to trigger block notification for user ${id}`, err));

    return updatedUser;
  }

  /**
   * Unblocks a user.
   */
  async unblockUser(id: string) {
    logger.info(`AdminService: Unblocking user ID: ${id}`);
    const userExists = await this.adminRepository.getUserById(id);
    if (!userExists) {
      throw new NotFoundError('User not found.');
    }

    return this.adminRepository.updateUserBlockStatus(id, false);
  }

  // =========================================================================
  // Vendor Governance Methods
  // =========================================================================

  /**
   * Lists vendors with server-side pagination, search, and filters.
   */
  async listVendors(dto: AdminVendorQueryDto) {
    logger.info(`AdminService: Listing vendors (page: ${dto.page}, limit: ${dto.limit}, status: ${dto.status || 'ALL'})`);
    const { total, page, limit, vendors } = await this.adminRepository.listVendors(dto);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      vendors: vendors.map((v) => ({
        id: v.id,
        userId: v.userId,
        businessName: v.businessName,
        slug: v.slug,
        phone: v.phone,
        email: v.email,
        city: v.city,
        state: v.state,
        status: v.status,
        isVerified: v.isVerified,
        isActive: v.isActive,
        ratingAverage: Number(v.ratingAverage),
        ratingCount: v.ratingCount,
        owner: {
          id: v.user.id,
          name: v.user.name,
          email: v.user.email,
          phone: v.user.phone,
          avatar: v.user.avatar,
        },
        categories: v.categories.map((c) => ({
          id: c.categoryId,
          name: c.category.name,
          slug: c.category.slug,
          icon: c.category.icon,
        })),
        documentsCount: v.documents.length,
        approvedDocumentsCount: v.documents.filter((d) => d.status === 'APPROVED').length,
        servicesCount: v._count.services,
        bookingsCount: v._count.bookings,
        createdAt: v.createdAt,
      })),
    };
  }

  /**
   * Retrieves full vendor details for admin inspection.
   */
  async getVendorDetails(vendorId: string) {
    logger.info(`AdminService: Fetching vendor details for ID: ${vendorId}`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    return {
      id: vendor.id,
      userId: vendor.userId,
      businessName: vendor.businessName,
      slug: vendor.slug,
      description: vendor.description,
      phone: vendor.phone,
      email: vendor.email,
      logo: vendor.logo,
      coverImage: vendor.coverImage,
      addressLine1: vendor.addressLine1,
      addressLine2: vendor.addressLine2,
      village: vendor.village,
      locality: vendor.locality,
      city: vendor.city,
      district: vendor.district,
      state: vendor.state,
      country: vendor.country,
      pincode: vendor.pincode,
      latitude: Number(vendor.latitude),
      longitude: Number(vendor.longitude),
      operatingRadiusKm: Number(vendor.operatingRadiusKm),
      status: vendor.status,
      isVerified: vendor.isVerified,
      isActive: vendor.isActive,
      ratingAverage: Number(vendor.ratingAverage),
      ratingCount: vendor.ratingCount,
      owner: vendor.user,
      categories: vendor.categories.map((c) => ({
        id: c.categoryId,
        name: c.category.name,
        slug: c.category.slug,
        icon: c.category.icon,
      })),
      documents: vendor.documents.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        documentUrl: d.documentUrl,
        status: d.status,
        rejectionReason: d.rejectionReason,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      })),
      counts: vendor._count,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,
    };
  }

  /**
   * Approves a vendor account.
   */
  async approveVendor(vendorId: string, adminUserId?: string) {
    logger.info(`AdminService: Approving vendor ID: ${vendorId}`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    validateVendorTransition(vendor.status, VendorStatus.APPROVED);

    const updated = await this.adminRepository.updateVendorStatus(vendorId, VendorStatus.APPROVED, true, true);

    // Audit Log
    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: 'VENDOR_APPROVED',
      entity: 'Vendor',
      entityId: vendorId,
      metadata: { previousStatus: vendor.status },
    });

    // Notify Vendor
    await this.notificationService.createNotification(vendor.userId, {
      title: 'Congratulations! Vendor Account Approved',
      message: 'Your Shubh Ausar vendor account has been verified and approved. You can now operate and accept bookings.',
      type: 'VENDOR_APPROVED',
    }).catch(() => {});

    return updated;
  }

  /**
   * Rejects a vendor application with mandatory reason.
   */
  async rejectVendor(vendorId: string, rejectionReason: string, adminUserId?: string) {
    logger.info(`AdminService: Rejecting vendor ID: ${vendorId}`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    if (!rejectionReason || rejectionReason.trim().length < 5) {
      throw new BadRequestError('Rejection reason must be at least 5 characters.');
    }

    validateVendorTransition(vendor.status, VendorStatus.REJECTED);

    const updated = await this.adminRepository.updateVendorStatus(vendorId, VendorStatus.REJECTED, false);

    // Audit Log
    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: 'VENDOR_REJECTED',
      entity: 'Vendor',
      entityId: vendorId,
      metadata: { previousStatus: vendor.status, rejectionReason },
    });

    // Notify Vendor with rejection reason
    await this.notificationService.createNotification(vendor.userId, {
      title: 'Vendor Application Requires Changes',
      message: `Your vendor application could not be approved for the following reason: ${rejectionReason}`,
      type: 'SYSTEM',
    }).catch(() => {});

    return updated;
  }

  /**
   * Moves a vendor to UNDER_REVIEW status.
   */
  async moveToUnderReview(vendorId: string, adminUserId?: string) {
    logger.info(`AdminService: Moving vendor ${vendorId} to UNDER_REVIEW`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    validateVendorTransition(vendor.status, VendorStatus.UNDER_REVIEW);

    const updated = await this.adminRepository.updateVendorStatus(vendorId, VendorStatus.UNDER_REVIEW);

    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: 'VENDOR_UNDER_REVIEW',
      entity: 'Vendor',
      entityId: vendorId,
    });

    return updated;
  }

  /**
   * Suspends an active/approved vendor account.
   */
  async suspendVendor(vendorId: string, reason?: string, adminUserId?: string) {
    logger.info(`AdminService: Suspending vendor ID: ${vendorId}`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    validateVendorTransition(vendor.status, VendorStatus.SUSPENDED);

    const updated = await this.adminRepository.updateVendorStatus(vendorId, VendorStatus.SUSPENDED, undefined, false);

    // Audit Log
    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: 'VENDOR_SUSPENDED',
      entity: 'Vendor',
      entityId: vendorId,
      metadata: { reason },
    });

    // Notify Vendor
    await this.notificationService.createNotification(vendor.userId, {
      title: 'Vendor Account Suspended',
      message: reason
        ? `Your vendor account has been suspended: ${reason}`
        : 'Your vendor account has been suspended by an administrator.',
      type: 'SYSTEM',
    }).catch(() => {});

    return updated;
  }

  /**
   * Reactivates a suspended vendor.
   */
  async reactivateVendor(vendorId: string, adminUserId?: string) {
    logger.info(`AdminService: Reactivating suspended vendor ID: ${vendorId}`);
    const vendor = await this.adminRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new NotFoundError('Vendor not found.');
    }

    validateVendorTransition(vendor.status, VendorStatus.APPROVED);

    const updated = await this.adminRepository.updateVendorStatus(vendorId, VendorStatus.APPROVED, true, true);

    // Audit Log
    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: 'VENDOR_REACTIVATED',
      entity: 'Vendor',
      entityId: vendorId,
    });

    // Notify Vendor
    await this.notificationService.createNotification(vendor.userId, {
      title: 'Vendor Account Reactivated',
      message: 'Your vendor account has been reactivated. You can resume marketplace operations.',
      type: 'VENDOR_APPROVED',
    }).catch(() => {});

    return updated;
  }

  /**
   * Reviews a vendor document (Approve or Reject with reason).
   */
  async reviewVendorDocument(
    vendorId: string,
    documentId: string,
    status: 'APPROVED' | 'REJECTED',
    rejectionReason?: string,
    adminUserId?: string
  ) {
    logger.info(`AdminService: Reviewing document ${documentId} for vendor ${vendorId} -> ${status}`);
    const document = await this.adminRepository.findDocumentById(documentId);
    if (!document || document.vendorId !== vendorId) {
      throw new NotFoundError('Document not found for this vendor.');
    }

    if (status === 'REJECTED' && (!rejectionReason || rejectionReason.trim().length < 3)) {
      throw new BadRequestError('Rejection reason is required when rejecting a document.');
    }

    const docStatus = status === 'APPROVED' ? DocumentStatus.APPROVED : DocumentStatus.REJECTED;
    const updated = await this.adminRepository.updateDocumentStatus(
      documentId,
      docStatus,
      rejectionReason
    );

    // Audit Log
    await this.adminRepository.createAuditLog({
      userId: adminUserId,
      action: status === 'APPROVED' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
      entity: 'VendorDocument',
      entityId: documentId,
      metadata: { vendorId, documentType: document.documentType, rejectionReason },
    });

    // Notify vendor
    await this.notificationService.createNotification(document.vendor.userId, {
      title: status === 'APPROVED' ? 'Document Approved' : 'Document Rejected',
      message:
        status === 'APPROVED'
          ? `Your document (${document.documentType}) has been verified and approved.`
          : `Your document (${document.documentType}) was rejected: ${rejectionReason}`,
      type: 'SYSTEM',
    }).catch(() => {});

    return updated;
  }

  // =========================================================================
  // Admin Category Delegation Methods
  // =========================================================================

  async listCategories(query: CategoryQueryDto) {
    return this.categoryService.listAllCategories(query);
  }

  async createCategory(dto: CreateCategoryDto, adminUserId?: string) {
    return this.categoryService.createCategory(dto, adminUserId);
  }

  async updateCategory(id: string, dto: UpdateCategoryDto, adminUserId?: string) {
    return this.categoryService.updateCategory(id, dto, adminUserId);
  }

  async removeCategory(id: string, adminUserId?: string) {
    return this.categoryService.removeCategory(id, adminUserId);
  }
}

export default AdminService;
