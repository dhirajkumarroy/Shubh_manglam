import { Vehicle, VehicleStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { CreateVehicleDto, VehicleQueryDto } from './vehicle.types';

export class VehicleRepository {
  /**
   * Creates a new vehicle record and its associated images in a single database transaction.
   */
  async create(
    ownerId: string,
    dto: CreateVehicleDto,
    images: { imageUrl: string; isPrimary: boolean }[]
  ): Promise<any> {
    return prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          ownerId,
          title: dto.title,
          brand: dto.brand,
          model: dto.model,
          year: dto.year,
          vehicleNumber: dto.vehicleNumber.toUpperCase().trim(),
          fuelType: dto.fuelType,
          transmission: dto.transmission,
          category: dto.category,
          operatingLatitude: dto.operatingLatitude,
          operatingLongitude: dto.operatingLongitude,
          operatingRadius: dto.operatingRadius || 15.0,
          description: dto.description,
          status: VehicleStatus.PENDING,
          isAvailable: true,
        },
      });

      if (images.length > 0) {
        await tx.vehicleImage.createMany({
          data: images.map((img) => ({
            vehicleId: vehicle.id,
            imageUrl: img.imageUrl,
            isPrimary: img.isPrimary,
          })),
        });
      }

      // Return the created vehicle with its images and owner information
      return tx.vehicle.findUnique({
        where: { id: vehicle.id },
        include: {
          images: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
      });
    });
  }

  /**
   * Find vehicle by database ID.
   */
  async findById(id: string): Promise<any> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Find vehicle by its unique license plate/number.
   */
  async findByVehicleNumber(vehicleNumber: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { vehicleNumber: vehicleNumber.toUpperCase().trim() },
    });
  }

  /**
   * Updates partial data on a vehicle record.
   */
  async update(id: string, data: Prisma.VehicleUpdateInput): Promise<any> {
    return prisma.vehicle.update({
      where: { id },
      data,
      include: {
        images: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * List vehicles matching filters, pagination and sorting.
   * Public catalog only shows ACTIVE listings.
   */
  async list(query: VehicleQueryDto): Promise<{ total: number; vehicles: any[] }> {
    const {
      brand,
      fuelType,
      transmission,
      category,
      isAvailable,
      page,
      limit,
      sort,
    } = query;

    const whereClause: Prisma.VehicleWhereInput = {
      status: VehicleStatus.ACTIVE, // Public catalog filters inactive ones out
    };

    if (brand) {
      whereClause.brand = { contains: brand, mode: 'insensitive' };
    }
    if (fuelType) {
      whereClause.fuelType = fuelType;
    }
    if (transmission) {
      whereClause.transmission = transmission;
    }
    if (category) {
      whereClause.category = category;
    }
    if (isAvailable !== undefined) {
      whereClause.isAvailable = isAvailable;
    }

    const orderBy: Prisma.VehicleOrderByWithRelationInput = {};
    if (sort === 'newest') {
      orderBy.createdAt = 'desc';
    } else if (sort === 'oldest') {
      orderBy.createdAt = 'asc';
    }

    const [total, vehicles] = await prisma.$transaction([
      prisma.vehicle.count({ where: whereClause }),
      prisma.vehicle.findMany({
        where: whereClause,
        include: {
          images: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, vehicles };
  }

  /**
   * Lists all vehicles registered to a specific owner.
   */
  async listByOwner(
    ownerId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; vehicles: any[] }> {
    const whereClause: Prisma.VehicleWhereInput = {
      ownerId,
    };

    const [total, vehicles] = await prisma.$transaction([
      prisma.vehicle.count({ where: whereClause }),
      prisma.vehicle.findMany({
        where: whereClause,
        include: {
          images: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, vehicles };
  }
}

export default VehicleRepository;
