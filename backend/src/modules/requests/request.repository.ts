import { TransportRequest, RequestStatus, Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { CreateRequestDto, RequestQueryDto } from './request.types';

export class RequestRepository {
  /**
   * Creates a new transport requirement request.
   */
  async create(
    customerId: string,
    dto: CreateRequestDto,
    distanceKm: number,
    estimatedFare: number
  ): Promise<TransportRequest> {
    return prisma.transportRequest.create({
      data: {
        customerId,
        purpose: dto.purpose,
        description: dto.description.trim(),
        pickupAddress: dto.pickupAddress.trim(),
        pickupLatitude: dto.pickupLatitude,
        pickupLongitude: dto.pickupLongitude,
        dropAddress: dto.dropAddress.trim(),
        dropLatitude: dto.dropLatitude,
        dropLongitude: dto.dropLongitude,
        distanceKm,
        requiredVehicleCategory: dto.requiredVehicleCategory,
        scheduledAt: dto.scheduledAt,
        estimatedFare,
        status: RequestStatus.PENDING,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  /**
   * Find a specific transport request by database ID.
   */
  async findById(id: string): Promise<any> {
    return prisma.transportRequest.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
          },
        },
        assignedOwner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
          },
        },
        assignedVehicle: {
          include: {
            images: true,
          },
        },
        payments: true,
      },
    });
  }

  /**
   * List transport requests submitted by a customer.
   */
  async listByCustomer(
    customerId: string,
    query: RequestQueryDto
  ): Promise<{ total: number; requests: TransportRequest[] }> {
    const where: Prisma.TransportRequestWhereInput = { customerId };
    
    if (query.status) {
      where.status = query.status as RequestStatus;
    }

    const [total, requests] = await prisma.$transaction([
      prisma.transportRequest.count({ where }),
      prisma.transportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          assignedOwner: {
            select: {
              name: true,
              phone: true,
            },
          },
          assignedVehicle: true,
        },
      }),
    ]);

    return { total, requests };
  }

  /**
   * Lists transport requests currently active or assigned to an owner.
   */
  async listByOwner(
    ownerId: string,
    query: RequestQueryDto
  ): Promise<{ total: number; requests: TransportRequest[] }> {
    const where: Prisma.TransportRequestWhereInput = { assignedOwnerId: ownerId };
    
    if (query.status) {
      where.status = query.status as RequestStatus;
    }

    const [total, requests] = await prisma.$transaction([
      prisma.transportRequest.count({ where }),
      prisma.transportRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          customer: {
            select: {
              name: true,
              phone: true,
            },
          },
          assignedVehicle: true,
        },
      }),
    ]);

    return { total, requests };
  }

  /**
   * Finds all pending requirements matching the owner's vehicle categories.
   */
  async findPendingByCategory(categories: string[]): Promise<any[]> {
    return prisma.transportRequest.findMany({
      where: {
        status: RequestStatus.PENDING,
        requiredVehicleCategory: {
          in: categories as any,
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Updates request status, with optional assignment parameters.
   */
  async updateStatus(
    id: string,
    status: RequestStatus,
    assignedOwnerId?: string,
    assignedVehicleId?: string
  ): Promise<any> {
    const data: Prisma.TransportRequestUpdateInput = { status };
    
    if (assignedOwnerId !== undefined) {
      data.assignedOwner = assignedOwnerId ? { connect: { id: assignedOwnerId } } : { disconnect: true };
    }
    if (assignedVehicleId !== undefined) {
      data.assignedVehicle = assignedVehicleId ? { connect: { id: assignedVehicleId } } : { disconnect: true };
    }

    return prisma.transportRequest.update({
      where: { id },
      data,
      include: {
        customer: true,
        assignedOwner: true,
        assignedVehicle: true,
      },
    });
  }
}
export const requestRepository = new RequestRepository();
