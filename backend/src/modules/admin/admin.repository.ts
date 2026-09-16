import { Prisma, VehicleStatus, RequestStatus, Vehicle } from '@prisma/client';
import prisma from '../../config/database';
import { UserQueryDto, VehicleQueryDto, BookingQueryDto } from './admin.types';

export class AdminRepository {
  /**
   * Fetches dashboard statistics counts.
   */
  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalVehicles: number;
    totalActiveVehicles: number;
    totalBookings: number;
    totalCompletedBookings: number;
    totalPendingBookings: number;
  }> {
    const [
      totalUsers,
      totalVehicles,
      totalActiveVehicles,
      totalBookings,
      totalCompletedBookings,
      totalPendingBookings,
    ] = await prisma.$transaction([
      prisma.user.count(),
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: VehicleStatus.ACTIVE } }),
      prisma.transportRequest.count(),
      prisma.transportRequest.count({ where: { status: RequestStatus.COMPLETED } }),
      prisma.transportRequest.count({ where: { status: RequestStatus.PENDING } }),
    ]);

    return {
      totalUsers,
      totalVehicles,
      totalActiveVehicles,
      totalBookings,
      totalCompletedBookings,
      totalPendingBookings,
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
          isEmailVerified: true,
          avatar: true,
          isBlocked: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, users };
  }

  /**
   * Returns detailed user profile info by ID (excluding password).
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
        isEmailVerified: true,
        avatar: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Updates user block/unblock flag.
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
        isEmailVerified: true,
        avatar: true,
        isBlocked: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Retrieves a paginated, filtered list of vehicles sorted newest first.
   */
  async listVehicles(dto: VehicleQueryDto): Promise<{ total: number; vehicles: any[] }> {
    const { page, limit, status, brand } = dto;
    const where: Prisma.VehicleWhereInput = {};

    if (status) {
      where.status = status;
    }
    if (brand) {
      where.brand = { contains: brand, mode: 'insensitive' };
    }

    const [total, vehicles] = await prisma.$transaction([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
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
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, vehicles };
  }

  /**
   * Returns vehicle details.
   */
  async getVehicleById(id: string): Promise<any> {
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
   * Updates vehicle status.
   */
  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Retrieves a paginated, filtered list of bookings (transport requests) sorted newest first.
   */
  async listBookings(dto: BookingQueryDto): Promise<{ total: number; bookings: any[] }> {
    const { page, limit, status, vehicleId, customerId } = dto;
    const where: Prisma.TransportRequestWhereInput = {};

    if (status) {
      where.status = status as RequestStatus;
    }
    if (vehicleId) {
      where.assignedVehicleId = vehicleId;
    }
    if (customerId) {
      where.customerId = customerId;
    }

    const [total, bookings] = await prisma.$transaction([
      prisma.transportRequest.count({ where }),
      prisma.transportRequest.findMany({
        where,
        include: {
          assignedVehicle: {
            include: {
              images: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          assignedOwner: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { total, bookings };
  }

  /**
   * Returns booking details.
   */
  async getBookingById(id: string): Promise<any> {
    return prisma.transportRequest.findUnique({
      where: { id },
      include: {
        assignedVehicle: {
          include: {
            images: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        assignedOwner: {
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
}

export default AdminRepository;
