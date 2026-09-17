import { CatalogRepository } from './catalog.repository';
import { prisma } from '../../config/database';
import {
  CreateServiceDto,
  UpdateServiceDto,
  ServiceQueryDto,
  CreatePackageDto,
  UpdatePackageDto,
  PackageQueryDto,
  CreateServiceImageDto,
  UpdateServiceImageDto,
  ServiceItemResponse,
  PackageItemResponse,
} from './catalog.types';
import {
  createServiceSchema,
  updateServiceSchema,
  createPackageSchema,
  updatePackageSchema,
} from './catalog.validation';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../common/utils/app-error';
import { Prisma } from '@prisma/client';
import logger from '../../config/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CatalogService {
  private repo: CatalogRepository;

  constructor() {
    this.repo = new CatalogRepository();
  }

  // =========================================================================
  // Helpers
  // =========================================================================

  private async generateUniqueServiceSlug(vendorId: string, name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;

    while (await this.repo.findServiceByVendorAndSlug(vendorId, slug)) {
      counter++;
      slug = `${base}-${counter}`;
    }
    return slug;
  }

  private async generateUniquePackageSlug(vendorId: string, name: string): Promise<string> {
    const base = slugify(name);
    let slug = base;
    let counter = 1;

    while (await this.repo.findPackageByVendorAndSlug(vendorId, slug)) {
      counter++;
      slug = `${base}-${counter}`;
    }
    return slug;
  }

  private formatServiceResponse(s: any): ServiceItemResponse {
    return {
      id: s.id,
      vendorId: s.vendorId,
      categoryId: s.categoryId,
      name: s.name,
      slug: s.slug,
      description: s.description,
      pricingType: s.pricingType,
      basePrice: s.basePrice ? Number(s.basePrice) : null,
      minPrice: s.minPrice ? Number(s.minPrice) : null,
      maxPrice: s.maxPrice ? Number(s.maxPrice) : null,
      minQuantity: s.minQuantity,
      maxQuantity: s.maxQuantity,
      durationMinutes: s.durationMinutes,
      isAvailable: s.isAvailable,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      category: {
        id: s.category.id,
        name: s.category.name,
        slug: s.category.slug,
        icon: s.category.icon,
      },
      vendor: s.vendor
        ? {
            id: s.vendor.id,
            businessName: s.vendor.businessName,
            slug: s.vendor.slug,
            city: s.vendor.city,
            state: s.vendor.state,
            ratingAverage: Number(s.vendor.ratingAverage),
            ratingCount: s.vendor.ratingCount,
          }
        : undefined,
      primaryImage: s.images && s.images.length > 0 ? s.images[0].url : null,
      images: s.images
        ? s.images.map((img: any) => ({
            id: img.id,
            serviceId: img.serviceId,
            url: img.url,
            publicId: img.publicId,
            sortOrder: img.sortOrder,
            isPrimary: img.isPrimary,
            createdAt: img.createdAt,
          }))
        : undefined,
    };
  }

  private formatPackageResponse(p: any): PackageItemResponse {
    return {
      id: p.id,
      vendorId: p.vendorId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
      discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
      durationMinutes: p.durationMinutes,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      vendor: p.vendor
        ? {
            id: p.vendor.id,
            businessName: p.vendor.businessName,
            slug: p.vendor.slug,
            city: p.vendor.city,
            state: p.vendor.state,
            ratingAverage: Number(p.vendor.ratingAverage),
            ratingCount: p.vendor.ratingCount,
          }
        : undefined,
      services: (p.services || []).map((ps: any) => ({
        id: ps.id,
        serviceId: ps.serviceId,
        quantity: ps.quantity,
        service: {
          id: ps.service.id,
          name: ps.service.name,
          pricingType: ps.service.pricingType,
          basePrice: ps.service.basePrice ? Number(ps.service.basePrice) : null,
          category: {
            id: ps.service.category.id,
            name: ps.service.category.name,
            icon: ps.service.category.icon,
          },
        },
      })),
    };
  }

  // =========================================================================
  // Vendor Service Operations
  // =========================================================================

  async createService(vendorId: string, dto: CreateServiceDto, userId?: string): Promise<ServiceItemResponse> {
    logger.info(`CatalogService: Vendor ${vendorId} creating service '${dto.name}'`);

    // Validate pricing and schema rules
    createServiceSchema.parse(dto);

    // 1. Verify category exists and is active
    const category = await prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category || !category.isActive) {
      throw new BadRequestError('Selected category does not exist or is currently inactive.');
    }

    // 2. Ensure VendorCategory relation exists (auto-link vendor to category)
    await prisma.vendorCategory.upsert({
      where: {
        vendorId_categoryId: { vendorId, categoryId: dto.categoryId },
      },
      update: {},
      create: { vendorId, categoryId: dto.categoryId },
    });

    // 3. Generate unique slug
    const slug = await this.generateUniqueServiceSlug(vendorId, dto.name);

    // 4. Create service
    const service = await this.repo.createService(vendorId, slug, dto);

    // 5. Audit Log
    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SERVICE_CREATED',
          entity: 'Service',
          entityId: service.id,
          metadata: { name: service.name, pricingType: service.pricingType },
        },
      });
    }

    return this.formatServiceResponse(service);
  }

  async getVendorService(vendorId: string, serviceId: string): Promise<ServiceItemResponse> {
    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    if (service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to view this service.');
    }
    return this.formatServiceResponse(service);
  }

  async listVendorServices(vendorId: string, query: ServiceQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = { vendorId };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.pricingType) where.pricingType = query.pricingType;
    if (query.isAvailable !== undefined) where.isAvailable = query.isAvailable;
    if (query.isActive !== undefined) where.isActive = query.isActive;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };

    const { total, services } = await this.repo.listServices(where, skip, limit, orderBy);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      services: services.map((s) => this.formatServiceResponse(s)),
    };
  }

  async updateVendorService(vendorId: string, serviceId: string, dto: UpdateServiceDto, userId?: string) {
    updateServiceSchema.parse(dto);

    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    if (service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this service.');
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== service.name) {
      slug = await this.generateUniqueServiceSlug(vendorId, dto.name);
    }

    if (dto.categoryId && dto.categoryId !== service.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category || !category.isActive) {
        throw new BadRequestError('Selected category does not exist or is currently inactive.');
      }
      await prisma.vendorCategory.upsert({
        where: {
          vendorId_categoryId: { vendorId, categoryId: dto.categoryId },
        },
        update: {},
        create: { vendorId, categoryId: dto.categoryId },
      });
    }

    const updated = await this.repo.updateService(serviceId, {
      ...dto,
      ...(slug ? { slug } : {}),
    });

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SERVICE_UPDATED',
          entity: 'Service',
          entityId: serviceId,
          metadata: { changes: dto as any },
        },
      });
    }

    return this.formatServiceResponse(updated);
  }

  async deleteVendorService(vendorId: string, serviceId: string, userId?: string) {
    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    if (service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to delete this service.');
    }

    const updated = await this.repo.softDeleteService(serviceId);

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'SERVICE_DEACTIVATED',
          entity: 'Service',
          entityId: serviceId,
        },
      });
    }

    return { message: 'Service deactivated successfully.', service: updated };
  }

  // =========================================================================
  // Service Images Operations
  // =========================================================================

  async addServiceImage(vendorId: string, serviceId: string, dto: CreateServiceImageDto) {
    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    if (service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to add images to this service.');
    }

    return this.repo.createServiceImage(serviceId, dto);
  }

  async listServiceImages(vendorId: string, serviceId: string) {
    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }
    if (service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to view images for this service.');
    }

    return this.repo.listServiceImages(serviceId);
  }

  async updateServiceImage(vendorId: string, serviceId: string, imageId: string, dto: UpdateServiceImageDto) {
    const image = await this.repo.findImageById(imageId);
    if (!image || image.serviceId !== serviceId) {
      throw new NotFoundError('Image not found.');
    }
    if (image.service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this image.');
    }

    return this.repo.updateServiceImage(imageId, serviceId, dto);
  }

  async deleteServiceImage(vendorId: string, serviceId: string, imageId: string) {
    const image = await this.repo.findImageById(imageId);
    if (!image || image.serviceId !== serviceId) {
      throw new NotFoundError('Image not found.');
    }
    if (image.service.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to delete this image.');
    }

    await this.repo.deleteServiceImage(imageId);
    return { message: 'Image deleted successfully.' };
  }

  // =========================================================================
  // Vendor Package Operations
  // =========================================================================

  async createPackage(vendorId: string, dto: CreatePackageDto, userId?: string): Promise<PackageItemResponse> {
    logger.info(`CatalogService: Vendor ${vendorId} creating package '${dto.name}'`);
    createPackageSchema.parse(dto);

    // 1. Verify cross-vendor security: all included services must belong to this vendor!
    const serviceIds = Array.from(new Set(dto.services.map((s) => s.serviceId)));
    const ownedCount = await this.repo.countVendorOwnedServices(vendorId, serviceIds);

    if (ownedCount !== serviceIds.length) {
      throw new BadRequestError(
        'One or more included services do not belong to this vendor or are inactive. Cross-vendor packaging is prohibited.'
      );
    }

    // 2. Calculate discount percentage if originalPrice is given
    let discountPercent: number | undefined;
    if (dto.originalPrice && dto.originalPrice > dto.price) {
      discountPercent = Number((((dto.originalPrice - dto.price) / dto.originalPrice) * 100).toFixed(2));
    }

    // 3. Generate unique slug
    const slug = await this.generateUniquePackageSlug(vendorId, dto.name);

    // 4. Create package & package services atomically
    const pkg = await this.repo.createPackage(vendorId, slug, dto, discountPercent);

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PACKAGE_CREATED',
          entity: 'Package',
          entityId: pkg!.id,
          metadata: { name: pkg!.name, price: Number(pkg!.price) },
        },
      });
    }

    return this.formatPackageResponse(pkg);
  }

  async getVendorPackage(vendorId: string, packageId: string): Promise<PackageItemResponse> {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to view this package.');
    }
    return this.formatPackageResponse(pkg);
  }

  async listVendorPackages(vendorId: string, query: PackageQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PackageWhereInput = { vendorId };
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.PackageOrderByWithRelationInput = { createdAt: 'desc' };

    const { total, packages } = await this.repo.listPackages(where, skip, limit, orderBy);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      packages: packages.map((p) => this.formatPackageResponse(p)),
    };
  }

  async updateVendorPackage(vendorId: string, packageId: string, dto: UpdatePackageDto, userId?: string) {
    updatePackageSchema.parse(dto);

    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this package.');
    }

    // Verify services if provided
    if (dto.services) {
      const serviceIds = Array.from(new Set(dto.services.map((s) => s.serviceId)));
      const ownedCount = await this.repo.countVendorOwnedServices(vendorId, serviceIds);
      if (ownedCount !== serviceIds.length) {
        throw new BadRequestError('One or more included services do not belong to this vendor.');
      }
    }

    let slug: string | undefined;
    if (dto.name && dto.name !== pkg.name) {
      slug = await this.generateUniquePackageSlug(vendorId, dto.name);
    }

    const effectivePrice = dto.price !== undefined ? dto.price : Number(pkg.price);
    const effectiveOriginalPrice = dto.originalPrice !== undefined ? dto.originalPrice : (pkg.originalPrice ? Number(pkg.originalPrice) : undefined);

    let discountPercent: number | undefined;
    if (effectiveOriginalPrice && effectiveOriginalPrice > effectivePrice) {
      discountPercent = Number((((effectiveOriginalPrice - effectivePrice) / effectiveOriginalPrice) * 100).toFixed(2));
    }

    const updated = await this.repo.updatePackage(packageId, dto, discountPercent, slug);

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PACKAGE_UPDATED',
          entity: 'Package',
          entityId: packageId,
          metadata: { changes: dto as any },
        },
      });
    }

    return this.formatPackageResponse(updated);
  }

  async deleteVendorPackage(vendorId: string, packageId: string, userId?: string) {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to delete this package.');
    }

    const updated = await this.repo.softDeletePackage(packageId);

    if (userId) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: 'PACKAGE_DEACTIVATED',
          entity: 'Package',
          entityId: packageId,
        },
      });
    }

    return { message: 'Package deactivated successfully.', package: updated };
  }

  // =========================================================================
  // Package Services Operations (Granular)
  // =========================================================================

  async addServiceToPackage(vendorId: string, packageId: string, serviceId: string, quantity: number = 1) {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this package.');
    }

    // Verify service belongs to this vendor
    const service = await this.repo.findServiceById(serviceId);
    if (!service || service.vendorId !== vendorId || !service.isActive) {
      throw new BadRequestError('Service does not belong to this vendor or is inactive.');
    }

    return this.repo.addServiceToPackage(packageId, serviceId, quantity);
  }

  async removeServiceFromPackage(vendorId: string, packageId: string, serviceId: string) {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this package.');
    }

    await this.repo.removeServiceFromPackage(packageId, serviceId);
    return { message: 'Service removed from package successfully.' };
  }

  async updatePackageService(vendorId: string, packageId: string, serviceId: string, quantity: number) {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }
    if (pkg.vendorId !== vendorId) {
      throw new ForbiddenError('You are not authorized to modify this package.');
    }

    return this.repo.updatePackageService(packageId, serviceId, quantity);
  }

  async setPrimaryServiceImage(vendorId: string, serviceId: string, imageId: string) {
    return this.updateServiceImage(vendorId, serviceId, imageId, { isPrimary: true });
  }

  // =========================================================================
  // Public Customer Discovery Catalog
  // =========================================================================

  async listPublicServices(query: ServiceQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const vendorWhere: Prisma.VendorWhereInput = {
      status: 'APPROVED',
      isActive: true,
    };
    if (query.city) {
      vendorWhere.city = { contains: query.city, mode: 'insensitive' };
    }

    // Customer only sees active and available services from approved, active vendors
    const where: Prisma.ServiceWhereInput = {
      isActive: true,
      isAvailable: true,
      category: { isActive: true },
      vendor: vendorWhere,
    };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.pricingType) where.pricingType = query.pricingType;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) where.basePrice.gte = new Prisma.Decimal(query.minPrice);
      if (query.maxPrice !== undefined) where.basePrice.lte = new Prisma.Decimal(query.maxPrice);
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'price_asc') orderBy = { basePrice: 'asc' };
    else if (query.sortBy === 'price_desc') orderBy = { basePrice: 'desc' };
    else if (query.sortBy === 'name_asc') orderBy = { name: 'asc' };

    const { total, services } = await this.repo.listServices(where, skip, limit, orderBy);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      services: services.map((s) => this.formatServiceResponse(s)),
    };
  }

  async getPublicServiceDetails(serviceId: string): Promise<ServiceItemResponse> {
    const service = await this.repo.findServiceById(serviceId);
    if (!service || !service.isActive || !service.isAvailable || service.vendor.status !== 'APPROVED' || !service.vendor.isActive) {
      throw new NotFoundError('Service not found or is currently unavailable.');
    }
    return this.formatServiceResponse(service);
  }

  async listPublicPackages(query: PackageQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PackageWhereInput = {
      isActive: true,
      vendor: {
        status: 'APPROVED',
        isActive: true,
      },
    };

    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: Prisma.PackageOrderByWithRelationInput = { createdAt: 'desc' };
    if (query.sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (query.sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (query.sortBy === 'name_asc') orderBy = { name: 'asc' };

    const { total, packages } = await this.repo.listPackages(where, skip, limit, orderBy);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      packages: packages.map((p) => this.formatPackageResponse(p)),
    };
  }

  async getPublicPackageDetails(packageId: string): Promise<PackageItemResponse> {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg || !pkg.isActive || pkg.vendor.status !== 'APPROVED' || !pkg.vendor.isActive) {
      throw new NotFoundError('Package not found or is currently unavailable.');
    }
    return this.formatPackageResponse(pkg);
  }

  // =========================================================================
  // Admin Catalog Moderation
  // =========================================================================

  async listAdminServices(query: ServiceQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceWhereInput = {};
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { vendor: { businessName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const { total, services } = await this.repo.listServices(where, skip, limit, { createdAt: 'desc' });

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      services: services.map((s) => this.formatServiceResponse(s)),
    };
  }

  async moderateServiceStatus(serviceId: string, isActive: boolean, adminUserId?: string) {
    const service = await this.repo.findServiceById(serviceId);
    if (!service) {
      throw new NotFoundError('Service not found.');
    }

    const updated = await this.repo.updateService(serviceId, { isActive });

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: isActive ? 'SERVICE_REACTIVATED' : 'SERVICE_DEACTIVATED',
          entity: 'Service',
          entityId: serviceId,
          metadata: { previousState: service.isActive, newState: isActive },
        },
      });
    }

    return this.formatServiceResponse(updated);
  }

  async listAdminPackages(query: PackageQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.PackageWhereInput = {};
    if (query.vendorId) where.vendorId = query.vendorId;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { vendor: { businessName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const { total, packages } = await this.repo.listPackages(where, skip, limit, { createdAt: 'desc' });

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      packages: packages.map((p) => this.formatPackageResponse(p)),
    };
  }

  async moderatePackageStatus(packageId: string, isActive: boolean, adminUserId?: string) {
    const pkg = await this.repo.findPackageById(packageId);
    if (!pkg) {
      throw new NotFoundError('Package not found.');
    }

    const updated = await this.repo.updatePackage(packageId, { isActive });

    if (adminUserId) {
      await prisma.auditLog.create({
        data: {
          userId: adminUserId,
          action: isActive ? 'PACKAGE_REACTIVATED' : 'PACKAGE_DEACTIVATED',
          entity: 'Package',
          entityId: packageId,
          metadata: { previousState: pkg.isActive, newState: isActive },
        },
      });
    }

    return this.formatPackageResponse(updated);
  }
}

export default CatalogService;
