import { VendorRepository } from './vendor.repository';
import { NotificationService } from '../notifications/notification.service';
import { prisma } from '../../config/database';
import {
  UpdateVendorProfileDto,
  ProfileCompletenessResult,
  VendorProfileResponse,
} from './vendor.types';
import { validateVendorTransition } from './vendor.constants';
import { VendorStatus, DocumentType } from '@prisma/client';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class VendorService {
  private vendorRepo: VendorRepository;
  private notificationService: NotificationService;

  constructor() {
    this.vendorRepo = new VendorRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Calculates profile completeness percentage and identifies missing fields.
   */
  calculateProfileCompleteness(vendor: any): ProfileCompletenessResult {
    const missingFields: string[] = [];
    let score = 0;

    // 1. Business Name (10)
    if (vendor.businessName && vendor.businessName.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('Business Name');
    }

    // 2. Description (10)
    if (vendor.description && vendor.description.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('Business Description');
    }

    // 3. Phone (10)
    if (vendor.phone && vendor.phone.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('Phone Number');
    }

    // 4. Address Line 1 (10)
    if (vendor.addressLine1 && vendor.addressLine1.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('Address Line 1');
    }

    // 5. City (10)
    if (vendor.city && vendor.city.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('City');
    }

    // 6. State (10)
    if (vendor.state && vendor.state.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('State');
    }

    // 7. Pincode (10)
    if (vendor.pincode && vendor.pincode.trim().length > 0) {
      score += 10;
    } else {
      missingFields.push('Pincode');
    }

    // 8. Location Coordinates (10)
    const lat = vendor.latitude ? Number(vendor.latitude) : 0;
    const lng = vendor.longitude ? Number(vendor.longitude) : 0;
    if (lat !== 0 && lng !== 0) {
      score += 10;
    } else {
      missingFields.push('Location Coordinates (GPS)');
    }

    // 9. Categories (10)
    if (vendor.categories && vendor.categories.length > 0) {
      score += 10;
    } else {
      missingFields.push('At least one Category');
    }

    // 10. Documents (10)
    if (vendor.documents && vendor.documents.length > 0) {
      score += 10;
    } else {
      missingFields.push('At least one Verification Document');
    }

    return {
      profileCompleted: missingFields.length === 0,
      completionPercentage: score,
      missingFields,
    };
  }

  /**
   * Helper to format vendor profile response with numeric decimals and completeness.
   */
  private formatVendorResponse(vendor: any): VendorProfileResponse {
    const completeness = this.calculateProfileCompleteness(vendor);

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
      categories: (vendor.categories || []).map((vc: any) => ({
        id: vc.id,
        categoryId: vc.categoryId,
        name: vc.category.name,
        slug: vc.category.slug,
        icon: vc.category.icon,
      })),
      documents: (vendor.documents || []).map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        documentUrl: doc.documentUrl,
        status: doc.status,
        rejectionReason: doc.rejectionReason,
        createdAt: doc.createdAt,
      })),
      completeness,
    };
  }

  /**
   * Retrieves profile for the authenticated vendor.
   */
  async getOwnProfile(userId: string): Promise<VendorProfileResponse> {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }
    return this.formatVendorResponse(vendor);
  }

  /**
   * Updates profile fields for the authenticated vendor.
   */
  async updateOwnProfile(userId: string, data: UpdateVendorProfileDto): Promise<VendorProfileResponse> {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }

    const updated = await this.vendorRepo.updateProfile(vendor.id, data);
    logger.info(`VendorService: Updated profile for vendor ${vendor.id} (user ${userId})`);

    return this.formatVendorResponse(updated);
  }

  /**
   * Synchronizes selected categories for the authenticated vendor.
   */
  async syncOwnCategories(userId: string, categoryIds: string[]): Promise<VendorProfileResponse> {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }

    // Verify that all requested category IDs exist in the database
    const validCategories = await prisma.category.findMany({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
      select: { id: true },
    });

    if (validCategories.length !== categoryIds.length) {
      throw new BadRequestError('One or more selected categories do not exist or are inactive.');
    }

    const updated = await this.vendorRepo.syncCategories(vendor.id, categoryIds);
    logger.info(`VendorService: Synced ${categoryIds.length} categories for vendor ${vendor.id}`);

    return this.formatVendorResponse(updated);
  }

  /**
   * Adds a verification document for the authenticated vendor.
   */
  async addDocument(userId: string, documentType: DocumentType, documentUrl: string) {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }

    const document = await this.vendorRepo.createDocument(vendor.id, documentType, documentUrl);
    logger.info(`VendorService: Uploaded document ${document.id} (${documentType}) for vendor ${vendor.id}`);

    return document;
  }

  /**
   * Deletes a verification document owned by the authenticated vendor.
   */
  async deleteDocument(userId: string, documentId: string) {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }

    const document = await this.vendorRepo.findDocumentById(documentId);
    if (!document) {
      throw new NotFoundError('Document not found.');
    }

    if (document.vendorId !== vendor.id) {
      throw new ForbiddenError('You are not authorized to delete this document.');
    }

    await this.vendorRepo.deleteDocument(documentId);
    logger.info(`VendorService: Deleted document ${documentId} for vendor ${vendor.id}`);

    return { message: 'Document deleted successfully.' };
  }

  /**
   * Submits vendor profile for review.
   * Allowed from PENDING or REJECTED status.
   */
  async submitForReview(userId: string): Promise<VendorProfileResponse> {
    const vendor = await this.vendorRepo.findByUserId(userId);
    if (!vendor) {
      throw new NotFoundError('Vendor profile not found for this user.');
    }

    validateVendorTransition(vendor.status, VendorStatus.UNDER_REVIEW);

    const completeness = this.calculateProfileCompleteness(vendor);
    if (!completeness.profileCompleted) {
      throw new BadRequestError(
        `Cannot submit for review: Profile is incomplete (${completeness.completionPercentage}%). Missing: ${completeness.missingFields.join(', ')}`
      );
    }

    const updated = await this.vendorRepo.updateStatus(vendor.id, VendorStatus.UNDER_REVIEW);

    // Record Audit Log
    await this.vendorRepo.createAuditLog({
      userId,
      action: 'VENDOR_SUBMITTED_FOR_REVIEW',
      entity: 'Vendor',
      entityId: vendor.id,
      metadata: {
        previousStatus: vendor.status,
        newStatus: VendorStatus.UNDER_REVIEW,
      },
    });

    // Notify Vendor
    await this.notificationService.createNotification(userId, {
      title: 'Application Submitted for Review',
      message: 'Your vendor profile has been submitted to the Shubh Mangalam administrative team for review.',
      type: 'SYSTEM',
    }).catch(() => {});

    logger.info(`VendorService: Vendor ${vendor.id} submitted profile for review`);

    return this.formatVendorResponse(updated);
  }
}

export default VendorService;
