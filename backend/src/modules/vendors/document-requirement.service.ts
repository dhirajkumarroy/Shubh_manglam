import { prisma } from '../../config/database';
import { DocumentType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export interface CreateDocumentRequirementDto {
  code: string;
  name: string;
  description?: string;
  documentType?: DocumentType;
  isRequired?: boolean;
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDocumentRequirementDto {
  name?: string;
  description?: string;
  documentType?: DocumentType;
  isRequired?: boolean;
  acceptedFileTypes?: string[];
  maxFileSizeMb?: number;
  isActive?: boolean;
  sortOrder?: number;
}

export class DocumentRequirementService {
  /**
   * Returns all active document requirements for Partner Onboarding (ordered by sortOrder).
   */
  async listActiveRequirements() {
    // Ensure default standard requirements exist in database
    await this.seedDefaultRequirementsIfEmpty();

    return prisma.documentRequirement.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Returns all document requirements for Admin Management.
   */
  async adminListRequirements() {
    await this.seedDefaultRequirementsIfEmpty();

    return prisma.documentRequirement.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: {
          select: { vendorDocuments: true },
        },
      },
    });
  }

  /**
   * Creates a new document requirement (Admin only).
   */
  async createRequirement(data: CreateDocumentRequirementDto) {
    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, '_');
    
    const existing = await prisma.documentRequirement.findUnique({
      where: { code: cleanCode },
    });

    if (existing) {
      throw new BadRequestError(`Document requirement with code '${cleanCode}' already exists.`);
    }

    const requirement = await prisma.documentRequirement.create({
      data: {
        code: cleanCode,
        name: data.name.trim(),
        description: data.description?.trim(),
        documentType: data.documentType || DocumentType.OTHER,
        isRequired: data.isRequired ?? true,
        acceptedFileTypes: data.acceptedFileTypes && data.acceptedFileTypes.length > 0 
          ? data.acceptedFileTypes 
          : ['image/jpeg', 'image/png', 'application/pdf'],
        maxFileSizeMb: data.maxFileSizeMb || 5,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    logger.info(`DocumentRequirementService: Created requirement ${requirement.code} (${requirement.name})`);
    return requirement;
  }

  /**
   * Updates an existing document requirement.
   */
  async updateRequirement(id: string, data: UpdateDocumentRequirementDto) {
    const existing = await prisma.documentRequirement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Document requirement not found.');
    }

    const updated = await prisma.documentRequirement.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.documentType !== undefined && { documentType: data.documentType }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.acceptedFileTypes !== undefined && { acceptedFileTypes: data.acceptedFileTypes }),
        ...(data.maxFileSizeMb !== undefined && { maxFileSizeMb: data.maxFileSizeMb }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    logger.info(`DocumentRequirementService: Updated requirement ${updated.code}`);
    return updated;
  }

  /**
   * Toggles active state of a document requirement.
   */
  async toggleActive(id: string) {
    const existing = await prisma.documentRequirement.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Document requirement not found.');
    }

    const updated = await prisma.documentRequirement.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    logger.info(`DocumentRequirementService: Toggled active state for ${updated.code} to ${updated.isActive}`);
    return updated;
  }

  /**
   * Deletes a document requirement if not currently attached to vendor documents.
   */
  async deleteRequirement(id: string) {
    const existing = await prisma.documentRequirement.findUnique({
      where: { id },
      include: { _count: { select: { vendorDocuments: true } } },
    });

    if (!existing) {
      throw new NotFoundError('Document requirement not found.');
    }

    if (existing._count.vendorDocuments > 0) {
      // Soft-disable instead of hard delete to preserve historical integrity
      const disabled = await prisma.documentRequirement.update({
        where: { id },
        data: { isActive: false },
      });
      return { message: 'Requirement has attached vendor documents; disabled instead of hard delete.', requirement: disabled };
    }

    await prisma.documentRequirement.delete({ where: { id } });
    return { message: 'Requirement deleted successfully.' };
  }

  /**
   * Seeds default standard requirements if the table is currently empty.
   */
  async seedDefaultRequirementsIfEmpty() {
    const count = await prisma.documentRequirement.count();
    if (count > 0) return;

    logger.info('DocumentRequirementService: Seeding initial standard document requirements...');

    const defaults = [
      {
        code: 'BUSINESS_REGISTRATION',
        name: 'Business Registration / Gumasta',
        description: 'Valid registration certificate, MSME/Udyam, or shop establishment certificate.',
        documentType: DocumentType.BUSINESS_REGISTRATION,
        isRequired: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSizeMb: 10,
        isActive: true,
        sortOrder: 1,
      },
      {
        code: 'GST_CERTIFICATE',
        name: 'GST Certificate',
        description: 'Government-issued GST registration certificate (Form REG-06).',
        documentType: DocumentType.TAX_DOCUMENT,
        isRequired: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSizeMb: 5,
        isActive: true,
        sortOrder: 2,
      },
      {
        code: 'PAN_CARD',
        name: 'PAN Card / Tax ID',
        description: 'Permanent Account Number card of proprietor or registered enterprise.',
        documentType: DocumentType.TAX_DOCUMENT,
        isRequired: true,
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSizeMb: 5,
        isActive: true,
        sortOrder: 3,
      },
      {
        code: 'IDENTITY_PROOF',
        name: 'Aadhaar / Identity Proof',
        description: 'Government photo identity proof (Aadhaar Card, Voter ID, or Passport).',
        documentType: DocumentType.IDENTITY_PROOF,
        isRequired: false,
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSizeMb: 5,
        isActive: true,
        sortOrder: 4,
      },
      {
        code: 'TRADE_LICENSE',
        name: 'Trade License / FSSAI / Other',
        description: 'Municipal trade license, health license, or FSSAI certificate (if food/catering).',
        documentType: DocumentType.CERTIFICATE,
        isRequired: false,
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSizeMb: 10,
        isActive: true,
        sortOrder: 5,
      },
    ];

    for (const d of defaults) {
      await prisma.documentRequirement.create({ data: d }).catch(() => {});
    }

    logger.info('DocumentRequirementService: Initial document requirements successfully seeded.');
  }
}

export const documentRequirementService = new DocumentRequirementService();
export default documentRequirementService;
