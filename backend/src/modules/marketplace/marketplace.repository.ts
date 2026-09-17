import { prisma } from '../../config/database';
import { VendorStatus, Prisma } from '@prisma/client';
import {
  MarketplaceVendorQueryDto,
  MarketplaceCategoryQueryDto,
  MarketplaceServiceQueryDto,
  MarketplacePackageQueryDto,
} from './marketplace.types';

export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

export class MarketplaceRepository {
  // =========================================================================
  // Vendors Discovery
  // =========================================================================

  async listVendors(query: MarketplaceVendorQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const search = query.search || query.q;
    const catFilter = query.categoryId || query.category;

    const whereClause: Prisma.VendorWhereInput = {
      status: VendorStatus.APPROVED,
      isActive: true,
      isVerified: true,
    };

    if (search) {
      whereClause.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.city) {
      whereClause.city = { contains: query.city, mode: 'insensitive' };
    }
    if (query.state) {
      whereClause.state = { contains: query.state, mode: 'insensitive' };
    }
    if (query.pincode) {
      whereClause.pincode = query.pincode;
    }
    if (query.minRating) {
      whereClause.ratingAverage = { gte: query.minRating };
    }

    if (catFilter) {
      whereClause.categories = {
        some: {
          category: {
            OR: [{ id: catFilter }, { slug: catFilter }],
            isActive: true,
          },
        },
      };
    }

    if (query.eventType) {
      whereClause.categories = {
        some: {
          category: {
            isActive: true,
            eventTypeCategories: {
              some: {
                OR: [{ eventTypeId: query.eventType }, { eventType: { slug: query.eventType } }],
              },
            },
          },
        },
      };
    }

    // Default Prisma ordering for database queries
    let orderBy: Prisma.VendorOrderByWithRelationInput[] = [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }];
    if (query.sort === 'newest') {
      orderBy = [{ createdAt: 'desc' }];
    } else if (query.sort === 'rating') {
      orderBy = [{ ratingAverage: 'desc' }, { ratingCount: 'desc' }];
    }

    // Fetch vendors matching standard database criteria
    const rawVendors = await prisma.vendor.findMany({
      where: whereClause,
      orderBy,
      select: {
        id: true,
        businessName: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        logo: true,
        coverImage: true,
        city: true,
        district: true,
        state: true,
        pincode: true,
        latitude: true,
        longitude: true,
        operatingRadiusKm: true,
        ratingAverage: true,
        ratingCount: true,
        createdAt: true,
        categories: {
          select: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                icon: true,
              },
            },
          },
        },
      },
    });

    // Compute Haversine distance and apply radius filtering if coordinates are provided
    let results = rawVendors.map((v) => {
      let distanceKm: number | null = null;
      if (
        query.latitude !== undefined &&
        query.longitude !== undefined &&
        v.latitude !== null &&
        v.longitude !== null
      ) {
        distanceKm = calculateHaversineDistanceKm(
          query.latitude,
          query.longitude,
          Number(v.latitude),
          Number(v.longitude)
        );
      }

      return {
        id: v.id,
        businessName: v.businessName,
        slug: v.slug,
        description: v.description,
        phone: v.phone,
        email: v.email,
        logo: v.logo,
        coverImage: v.coverImage,
        city: v.city,
        district: v.district,
        state: v.state,
        pincode: v.pincode,
        latitude: v.latitude ? Number(v.latitude) : null,
        longitude: v.longitude ? Number(v.longitude) : null,
        operatingRadiusKm: Number(v.operatingRadiusKm),
        ratingAverage: Number(v.ratingAverage),
        ratingCount: v.ratingCount,
        distanceKm,
        categories: v.categories.map((c) => c.category),
        createdAt: v.createdAt,
      };
    });

    // If client supplied user coordinates, apply radius filter
    if (query.latitude !== undefined && query.longitude !== undefined) {
      results = results.filter((v) => {
        if (v.distanceKm === null) return false;
        // Vendor must be within their operating radius and within customer requested radius
        const maxRadius = query.radius ? Math.min(query.radius, v.operatingRadiusKm) : v.operatingRadiusKm;
        return v.distanceKm <= maxRadius;
      });

      if (query.sort === 'nearest') {
        results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      }
    }

    const total = results.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedItems = results.slice((page - 1) * limit, page * limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      vendors: paginatedItems,
    };
  }

  async getVendorDetails(
    idOrSlug: string,
    coords?: { latitude?: number; longitude?: number }
  ) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        status: VendorStatus.APPROVED,
        isActive: true,
      },
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        services: {
          where: {
            isActive: true,
            isAvailable: true,
          },
          include: {
            category: true,
            images: {
              orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        packages: {
          where: {
            isActive: true,
          },
          include: {
            services: {
              include: {
                service: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          where: {
            isPublished: true,
          },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) return null;

    let distanceKm: number | null = null;
    if (
      coords?.latitude !== undefined &&
      coords?.longitude !== undefined &&
      vendor.latitude &&
      vendor.longitude
    ) {
      distanceKm = calculateHaversineDistanceKm(
        coords.latitude,
        coords.longitude,
        Number(vendor.latitude),
        Number(vendor.longitude)
      );
    }

    return {
      id: vendor.id,
      businessName: vendor.businessName,
      slug: vendor.slug,
      description: vendor.description,
      phone: vendor.phone,
      email: vendor.email,
      logo: vendor.logo,
      coverImage: vendor.coverImage,
      addressLine1: vendor.addressLine1,
      city: vendor.city,
      district: vendor.district,
      state: vendor.state,
      pincode: vendor.pincode,
      latitude: vendor.latitude ? Number(vendor.latitude) : null,
      longitude: vendor.longitude ? Number(vendor.longitude) : null,
      operatingRadiusKm: Number(vendor.operatingRadiusKm),
      ratingAverage: Number(vendor.ratingAverage),
      ratingCount: vendor.ratingCount,
      distanceKm,
      categories: vendor.categories.map((c) => c.category),
      services: vendor.services.map((s) => ({
        id: s.id,
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
        category: s.category,
        primaryImage: s.images.find((img) => img.isPrimary)?.url || s.images[0]?.url || null,
        images: s.images,
      })),
      packages: vendor.packages.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: Number(p.price),
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        discountPercent: p.discountPercent ? Number(p.discountPercent) : null,
        durationMinutes: p.durationMinutes,
        services: p.services.map((ps) => ({
          id: ps.id,
          serviceId: ps.serviceId,
          quantity: ps.quantity,
          service: {
            id: ps.service.id,
            name: ps.service.name,
            pricingType: ps.service.pricingType,
            basePrice: ps.service.basePrice ? Number(ps.service.basePrice) : null,
            category: ps.service.category,
          },
        })),
      })),
      reviews: vendor.reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        customerName: r.customer.name,
        customerAvatar: r.customer.avatar,
      })),
    };
  }

  // =========================================================================
  // Categories Discovery
  // =========================================================================

  async listCategories(query: MarketplaceCategoryQueryDto) {
    const whereClause: Prisma.CategoryWhereInput = {
      isActive: true,
    };

    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.eventTypeId) {
      whereClause.eventTypeCategories = {
        some: {
          OR: [{ eventTypeId: query.eventTypeId }, { eventType: { slug: query.eventTypeId } }],
        },
      };
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            vendorCategories: {
              where: {
                vendor: {
                  status: VendorStatus.APPROVED,
                  isActive: true,
                  isVerified: true,
                },
              },
            },
            services: {
              where: {
                isActive: true,
                isAvailable: true,
                vendor: {
                  status: VendorStatus.APPROVED,
                  isActive: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      },
    });

    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      image: c.image,
      sortOrder: c.sortOrder,
      vendorCount: c._count.vendorCategories,
      serviceCount: c._count.services,
    }));
  }

  // =========================================================================
  // Services & Packages Discovery
  // =========================================================================

  async listServices(query: MarketplaceServiceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const whereClause: Prisma.ServiceWhereInput = {
      isActive: true,
      isAvailable: true,
      vendor: {
        status: VendorStatus.APPROVED,
        isActive: true,
        isVerified: true,
      },
    };

    if (query.categoryId) {
      whereClause.OR = [{ categoryId: query.categoryId }, { category: { slug: query.categoryId } }];
    }
    if (query.vendorId) {
      whereClause.vendorId = query.vendorId;
    }
    if (query.eventTypeId) {
      whereClause.category = {
        eventTypeCategories: {
          some: {
            OR: [{ eventTypeId: query.eventTypeId }, { eventType: { slug: query.eventTypeId } }],
          },
        },
      };
    }
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    const vendorWhere: Prisma.VendorWhereInput = {
      status: VendorStatus.APPROVED,
      isActive: true,
      isVerified: true,
    };
    if (query.city) {
      vendorWhere.city = { contains: query.city, mode: 'insensitive' };
    }
    whereClause.vendor = vendorWhere;
    if (query.pricingType) {
      whereClause.pricingType = query.pricingType as any;
    }
    if (query.minPrice !== undefined) {
      whereClause.basePrice = { gte: query.minPrice };
    }
    if (query.maxPrice !== undefined) {
      whereClause.basePrice = { ...(whereClause.basePrice as any), lte: query.maxPrice };
    }

    let orderBy: Prisma.ServiceOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (query.sortBy === 'price_asc') {
      orderBy = [{ basePrice: 'asc' }];
    } else if (query.sortBy === 'price_desc') {
      orderBy = [{ basePrice: 'desc' }];
    } else if (query.sortBy === 'rating') {
      orderBy = [{ vendor: { ratingAverage: 'desc' } }];
    }

    const [total, services] = await Promise.all([
      prisma.service.count({ where: whereClause }),
      prisma.service.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              slug: true,
              city: true,
              state: true,
              ratingAverage: true,
              ratingCount: true,
            },
          },
          images: {
            orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          },
        },
      }),
    ]);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      services: services.map((s) => ({
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
        category: s.category,
        vendor: s.vendor
          ? {
              ...s.vendor,
              ratingAverage: Number(s.vendor.ratingAverage),
            }
          : undefined,
        primaryImage: s.images.find((i) => i.isPrimary)?.url || s.images[0]?.url || null,
        images: s.images,
      })),
    };
  }

  async getServiceById(idOrSlug: string) {
    const service = await prisma.service.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        vendor: {
          status: VendorStatus.APPROVED,
          isActive: true,
        },
      },
      include: {
        category: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            addressLine1: true,
            pincode: true,
            phone: true,
            email: true,
            ratingAverage: true,
            ratingCount: true,
            operatingRadiusKm: true,
          },
        },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        },
      },
    });

    if (!service) return null;

    return {
      id: service.id,
      vendorId: service.vendorId,
      categoryId: service.categoryId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      pricingType: service.pricingType,
      basePrice: service.basePrice ? Number(service.basePrice) : null,
      minPrice: service.minPrice ? Number(service.minPrice) : null,
      maxPrice: service.maxPrice ? Number(service.maxPrice) : null,
      minQuantity: service.minQuantity,
      maxQuantity: service.maxQuantity,
      durationMinutes: service.durationMinutes,
      isAvailable: service.isAvailable,
      isActive: service.isActive,
      category: service.category,
      vendor: {
        ...service.vendor,
        ratingAverage: Number(service.vendor.ratingAverage),
        operatingRadiusKm: Number(service.vendor.operatingRadiusKm),
      },
      primaryImage: service.images.find((i) => i.isPrimary)?.url || service.images[0]?.url || null,
      images: service.images,
    };
  }

  async listPackages(query: MarketplacePackageQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const whereClause: Prisma.PackageWhereInput = {
      isActive: true,
      vendor: {
        status: VendorStatus.APPROVED,
        isActive: true,
        isVerified: true,
      },
    };

    if (query.vendorId) {
      whereClause.vendorId = query.vendorId;
    }
    if (query.search) {
      whereClause.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.minPrice !== undefined) {
      whereClause.price = { gte: query.minPrice };
    }
    if (query.maxPrice !== undefined) {
      whereClause.price = { ...(whereClause.price as any), lte: query.maxPrice };
    }

    let orderBy: Prisma.PackageOrderByWithRelationInput[] = [{ createdAt: 'desc' }];
    if (query.sortBy === 'price_asc') {
      orderBy = [{ price: 'asc' }];
    } else if (query.sortBy === 'price_desc') {
      orderBy = [{ price: 'desc' }];
    }

    const [total, packages] = await Promise.all([
      prisma.package.count({ where: whereClause }),
      prisma.package.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
            },
          },
          services: {
            include: {
              service: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      packages: packages.map((p) => ({
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
        vendor: p.vendor
          ? {
              ...p.vendor,
              ratingAverage: Number(p.vendor.ratingAverage),
            }
          : undefined,
        services: p.services.map((ps) => ({
          id: ps.id,
          serviceId: ps.serviceId,
          quantity: ps.quantity,
          service: {
            id: ps.service.id,
            name: ps.service.name,
            pricingType: ps.service.pricingType,
            basePrice: ps.service.basePrice ? Number(ps.service.basePrice) : null,
            category: ps.service.category,
          },
        })),
      })),
    };
  }

  async getPackageById(idOrSlug: string) {
    const pkg = await prisma.package.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
        isActive: true,
        vendor: {
          status: VendorStatus.APPROVED,
          isActive: true,
        },
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            addressLine1: true,
            pincode: true,
            phone: true,
            email: true,
            ratingAverage: true,
            ratingCount: true,
            operatingRadiusKm: true,
          },
        },
        services: {
          include: {
            service: {
              include: {
                category: true,
                images: {
                  where: { isPrimary: true },
                },
              },
            },
          },
        },
      },
    });

    if (!pkg) return null;

    return {
      id: pkg.id,
      vendorId: pkg.vendorId,
      name: pkg.name,
      slug: pkg.slug,
      description: pkg.description,
      price: Number(pkg.price),
      originalPrice: pkg.originalPrice ? Number(pkg.originalPrice) : null,
      discountPercent: pkg.discountPercent ? Number(pkg.discountPercent) : null,
      durationMinutes: pkg.durationMinutes,
      isActive: pkg.isActive,
      vendor: {
        ...pkg.vendor,
        ratingAverage: Number(pkg.vendor.ratingAverage),
        operatingRadiusKm: Number(pkg.vendor.operatingRadiusKm),
      },
      services: pkg.services.map((ps) => ({
        id: ps.id,
        serviceId: ps.serviceId,
        quantity: ps.quantity,
        service: {
          id: ps.service.id,
          name: ps.service.name,
          pricingType: ps.service.pricingType,
          basePrice: ps.service.basePrice ? Number(ps.service.basePrice) : null,
          category: ps.service.category,
          primaryImage: ps.service.images[0]?.url || null,
        },
      })),
    };
  }
}
