import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';
import {
  CreateServiceDto,
  UpdateServiceDto,
  CreatePackageDto,
  UpdatePackageDto,
  CreateServiceImageDto,
  UpdateServiceImageDto,
} from './catalog.types';

export class CatalogRepository {
  // =========================================================================
  // Services
  // =========================================================================

  async createService(vendorId: string, slug: string, dto: CreateServiceDto) {
    return prisma.service.create({
      data: {
        vendorId,
        categoryId: dto.categoryId,
        subcategoryId: dto.subcategoryId ?? null,
        eventTypeId: dto.eventTypeId ?? null,
        name: dto.name,
        slug,
        description: dto.description,
        pricingType: dto.pricingType,
        basePrice: dto.basePrice !== undefined ? new Prisma.Decimal(dto.basePrice) : null,
        minPrice: dto.minPrice !== undefined ? new Prisma.Decimal(dto.minPrice) : null,
        maxPrice: dto.maxPrice !== undefined ? new Prisma.Decimal(dto.maxPrice) : null,
        minQuantity: dto.minQuantity ?? 1,
        maxQuantity: dto.maxQuantity,
        durationMinutes: dto.durationMinutes,
        isAvailable: dto.isAvailable ?? true,
        isActive: dto.isActive ?? true,
      },
      include: {
        category: true,
        subcategory: true,
        eventType: true,
        images: true,
      },
    });
  }

  async findServiceById(id: string) {
    return prisma.service.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        eventType: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            ratingAverage: true,
            ratingCount: true,
            status: true,
            isActive: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });
  }

  async findServiceByVendorAndSlug(vendorId: string, slug: string) {
    return prisma.service.findUnique({
      where: {
        vendorId_slug: { vendorId, slug },
      },
      include: {
        category: true,
        subcategory: true,
        eventType: true,
      },
    });
  }

  async listServices(where: Prisma.ServiceWhereInput, skip: number, take: number, orderBy: Prisma.ServiceOrderByWithRelationInput) {
    const [total, services] = await prisma.$transaction([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: true,
          subcategory: true,
          eventType: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              city: true,
              state: true,
              ratingAverage: true,
              ratingCount: true,
              status: true,
              isActive: true,
            },
          },
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
    ]);

    return { total, services };
  }

  async updateService(id: string, data: UpdateServiceDto & { slug?: string }) {
    const updateData: Prisma.ServiceUpdateInput = {};

    if (data.categoryId !== undefined) updateData.category = { connect: { id: data.categoryId } };
    if (data.subcategoryId !== undefined) {
      if (data.subcategoryId === null) {
        updateData.subcategory = { disconnect: true };
      } else {
        updateData.subcategory = { connect: { id: data.subcategoryId } };
      }
    }
    if (data.eventTypeId !== undefined) {
      if (data.eventTypeId === null) {
        updateData.eventType = { disconnect: true };
      } else {
        updateData.eventType = { connect: { id: data.eventTypeId } };
      }
    }
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.pricingType !== undefined) updateData.pricingType = data.pricingType;
    if (data.basePrice !== undefined) {
      updateData.basePrice = data.basePrice !== null ? new Prisma.Decimal(data.basePrice) : null;
    }
    if (data.minPrice !== undefined) {
      updateData.minPrice = data.minPrice !== null ? new Prisma.Decimal(data.minPrice) : null;
    }
    if (data.maxPrice !== undefined) {
      updateData.maxPrice = data.maxPrice !== null ? new Prisma.Decimal(data.maxPrice) : null;
    }
    if (data.minQuantity !== undefined) updateData.minQuantity = data.minQuantity;
    if (data.maxQuantity !== undefined) updateData.maxQuantity = data.maxQuantity;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
        eventType: true,
        images: true,
      },
    });
  }

  async softDeleteService(id: string) {
    return prisma.service.update({
      where: { id },
      data: { isActive: false, isAvailable: false },
    });
  }

  // =========================================================================
  // Service Images
  // =========================================================================

  async createServiceImage(serviceId: string, dto: CreateServiceImageDto) {
    return prisma.$transaction(async (tx) => {
      // If marked as primary, demote any current primary image
      if (dto.isPrimary) {
        await tx.serviceImage.updateMany({
          where: { serviceId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.serviceImage.create({
        data: {
          serviceId,
          url: dto.url,
          publicId: dto.publicId,
          sortOrder: dto.sortOrder ?? 0,
          isPrimary: dto.isPrimary ?? false,
        },
      });
    });
  }

  async listServiceImages(serviceId: string) {
    return prisma.serviceImage.findMany({
      where: { serviceId },
      orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async findImageById(id: string) {
    return prisma.serviceImage.findUnique({
      where: { id },
      include: { service: true },
    });
  }

  async updateServiceImage(id: string, serviceId: string, dto: UpdateServiceImageDto) {
    return prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.serviceImage.updateMany({
          where: { serviceId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      return tx.serviceImage.update({
        where: { id },
        data: {
          sortOrder: dto.sortOrder,
          isPrimary: dto.isPrimary,
        },
      });
    });
  }

  async deleteServiceImage(id: string) {
    return prisma.serviceImage.delete({
      where: { id },
    });
  }

  // =========================================================================
  // Packages
  // =========================================================================

  async createPackage(
    vendorId: string,
    slug: string,
    dto: CreatePackageDto,
    discountPercent?: number
  ) {
    return prisma.$transaction(async (tx) => {
      const pkg = await tx.package.create({
        data: {
          vendorId,
          name: dto.name,
          slug,
          description: dto.description,
          price: new Prisma.Decimal(dto.price),
          originalPrice: dto.originalPrice !== undefined ? new Prisma.Decimal(dto.originalPrice) : null,
          discountPercent: discountPercent !== undefined ? new Prisma.Decimal(discountPercent) : null,
          durationMinutes: dto.durationMinutes,
          isActive: dto.isActive ?? true,
        },
      });

      // Insert included services with quantities
      if (dto.services && dto.services.length > 0) {
        await tx.packageService.createMany({
          data: dto.services.map((s) => ({
            packageId: pkg.id,
            serviceId: s.serviceId,
            quantity: s.quantity ?? 1,
          })),
        });
      }

      return tx.package.findUnique({
        where: { id: pkg.id },
        include: {
          services: {
            include: {
              service: {
                include: { category: true },
              },
            },
          },
        },
      });
    });
  }

  async findPackageById(id: string) {
    return prisma.package.findUnique({
      where: { id },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            ratingAverage: true,
            ratingCount: true,
            status: true,
            isActive: true,
          },
        },
        services: {
          include: {
            service: {
              include: { category: true },
            },
          },
        },
      },
    });
  }

  async findPackageByVendorAndSlug(vendorId: string, slug: string) {
    return prisma.package.findUnique({
      where: {
        vendorId_slug: { vendorId, slug },
      },
    });
  }

  async listPackages(
    where: Prisma.PackageWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.PackageOrderByWithRelationInput
  ) {
    const [total, packages] = await prisma.$transaction([
      prisma.package.count({ where }),
      prisma.package.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              city: true,
              state: true,
              ratingAverage: true,
              ratingCount: true,
              status: true,
              isActive: true,
            },
          },
          services: {
            include: {
              service: {
                include: { category: true },
              },
            },
          },
        },
      }),
    ]);

    return { total, packages };
  }

  async updatePackage(
    id: string,
    dto: UpdatePackageDto,
    discountPercent?: number,
    slug?: string
  ) {
    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.PackageUpdateInput = {};

      if (dto.name !== undefined) updateData.name = dto.name;
      if (slug !== undefined) updateData.slug = slug;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.price !== undefined) updateData.price = new Prisma.Decimal(dto.price);
      if (dto.originalPrice !== undefined) {
        updateData.originalPrice = dto.originalPrice !== null ? new Prisma.Decimal(dto.originalPrice) : null;
      }
      if (discountPercent !== undefined) {
        updateData.discountPercent = new Prisma.Decimal(discountPercent);
      }
      if (dto.durationMinutes !== undefined) updateData.durationMinutes = dto.durationMinutes;
      if (dto.isActive !== undefined) updateData.isActive = dto.isActive;

      // Update basic fields
      await tx.package.update({
        where: { id },
        data: updateData,
      });

      // If services array is explicitly provided, replace package services
      if (dto.services) {
        await tx.packageService.deleteMany({
          where: { packageId: id },
        });

        if (dto.services.length > 0) {
          await tx.packageService.createMany({
            data: dto.services.map((s) => ({
              packageId: id,
              serviceId: s.serviceId,
              quantity: s.quantity ?? 1,
            })),
          });
        }
      }

      return tx.package.findUnique({
        where: { id },
        include: {
          services: {
            include: {
              service: {
                include: { category: true },
              },
            },
          },
        },
      });
    });
  }

  async softDeletePackage(id: string) {
    return prisma.package.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // =========================================================================
  // Ownership & Relation Validation Helpers
  // =========================================================================

  async countVendorOwnedServices(vendorId: string, serviceIds: string[]): Promise<number> {
    return prisma.service.count({
      where: {
        id: { in: serviceIds },
        vendorId,
        isActive: true,
      },
    });
  }

  async addServiceToPackage(packageId: string, serviceId: string, quantity: number = 1) {
    return prisma.packageService.upsert({
      where: {
        packageId_serviceId: {
          packageId,
          serviceId,
        },
      },
      update: {
        quantity,
      },
      create: {
        packageId,
        serviceId,
        quantity,
      },
      include: {
        service: {
          include: { category: true },
        },
      },
    });
  }

  async removeServiceFromPackage(packageId: string, serviceId: string) {
    return prisma.packageService.deleteMany({
      where: {
        packageId,
        serviceId,
      },
    });
  }

  async updatePackageService(packageId: string, serviceId: string, quantity: number) {
    return prisma.packageService.update({
      where: {
        packageId_serviceId: {
          packageId,
          serviceId,
        },
      },
      data: { quantity },
      include: {
        service: {
          include: { category: true },
        },
      },
    });
  }
}

export default CatalogRepository;
