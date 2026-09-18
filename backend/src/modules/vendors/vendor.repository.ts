import { prisma } from '../../config/database';
import { VendorStatus, DocumentType, DocumentStatus, Prisma } from '@prisma/client';
import { UpdateVendorProfileDto } from './vendor.types';

export class VendorRepository {
  /**
   * Finds a vendor profile by associated user ID.
   */
  async findByUserId(userId: string) {
    return prisma.vendor.findUnique({
      where: { userId },
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
          include: {
            category: true,
          },
        },
        documents: {
          include: {
            requirement: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Finds a vendor by primary ID.
   */
  async findById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
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
          include: {
            category: true,
          },
        },
        documents: {
          include: {
            requirement: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Updates whitelisted vendor profile fields.
   */
  async updateProfile(id: string, data: UpdateVendorProfileDto) {
    const updateData: Prisma.VendorUpdateInput = {};

    if (data.businessName !== undefined) updateData.businessName = data.businessName;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.logo !== undefined) updateData.logo = data.logo;
    if (data.coverImage !== undefined) updateData.coverImage = data.coverImage;
    if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2;
    if (data.village !== undefined) updateData.village = data.village;
    if (data.locality !== undefined) updateData.locality = data.locality;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.district !== undefined) updateData.district = data.district;
    if (data.state !== undefined) updateData.state = data.state;
    if (data.pincode !== undefined) updateData.pincode = data.pincode;
    if (data.latitude !== undefined) updateData.latitude = new Prisma.Decimal(data.latitude);
    if (data.longitude !== undefined) updateData.longitude = new Prisma.Decimal(data.longitude);
    if (data.operatingRadiusKm !== undefined) {
      updateData.operatingRadiusKm = new Prisma.Decimal(data.operatingRadiusKm);
    }

    return prisma.vendor.update({
      where: { id },
      data: updateData,
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
          include: {
            category: true,
          },
        },
        documents: {
          include: {
            requirement: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Synchronizes vendor categories in a transaction.
   */
  async syncCategories(vendorId: string, categoryIds: string[]) {
    return prisma.$transaction(async (tx) => {
      await tx.vendorCategory.deleteMany({
        where: { vendorId },
      });

      await tx.vendorCategory.createMany({
        data: categoryIds.map((categoryId) => ({
          vendorId,
          categoryId,
        })),
      });

      return tx.vendor.findUniqueOrThrow({
        where: { id: vendorId },
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
            include: {
              category: true,
            },
          },
          documents: {
            include: {
              requirement: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });
  }

  /**
   * Adds a new vendor document.
   */
  async createDocument(
    vendorId: string,
    documentType: DocumentType,
    documentUrl: string,
    meta?: {
      requirementId?: string;
      originalFileName?: string;
      fileSize?: number;
      mimeType?: string;
    }
  ) {
    return prisma.vendorDocument.create({
      data: {
        vendorId,
        documentType,
        documentUrl,
        requirementId: meta?.requirementId || null,
        originalFileName: meta?.originalFileName || null,
        fileSize: meta?.fileSize || null,
        mimeType: meta?.mimeType || null,
        status: DocumentStatus.PENDING,
      },
      include: {
        requirement: true,
      },
    });
  }

  /**
   * Finds a document by ID.
   */
  async findDocumentById(documentId: string) {
    return prisma.vendorDocument.findUnique({
      where: { id: documentId },
    });
  }

  /**
   * Deletes a vendor document.
   */
  async deleteDocument(documentId: string) {
    return prisma.vendorDocument.delete({
      where: { id: documentId },
    });
  }

  /**
   * Updates vendor status (and verification flag).
   */
  async updateStatus(vendorId: string, status: VendorStatus, isVerified?: boolean) {
    const data: Prisma.VendorUpdateInput = { status };
    if (isVerified !== undefined) {
      data.isVerified = isVerified;
    }
    return prisma.vendor.update({
      where: { id: vendorId },
      data,
      include: {
        categories: { include: { category: true } },
        documents: true,
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

export default VendorRepository;
