import { RequestStatus, UserRole } from '@prisma/client';
import { RequestRepository } from './request.repository';
import { locationService } from '../locations/location.service';
import { NotificationService } from '../notifications/notification.service';
import { CreateRequestDto, RequestQueryDto } from './request.types';
import prisma from '../../config/database';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/app-error';
import logger from '../../config/logger';

export class RequestService {
  private requestRepository: RequestRepository;
  private notificationService: NotificationService;

  constructor() {
    this.requestRepository = new RequestRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Suggests estimated fares for all available vehicle categories based on pickup/drop coordinates.
   */
  async getEstimates(pickupLat: number, pickupLng: number, dropLat: number, dropLng: number): Promise<any> {
    const distanceKm = locationService.calculateDistance(pickupLat, pickupLng, dropLat, dropLng);
    const rules = await prisma.fareRule.findMany();

    const estimates = rules.map((rule) => {
      const estimatedFare = Math.round(rule.baseFare + distanceKm * rule.ratePerKm);
      return {
        category: rule.category,
        distanceKm: Math.round(distanceKm * 10) / 10,
        estimatedFare,
        baseFare: rule.baseFare,
        ratePerKm: rule.ratePerKm,
      };
    });

    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      estimates,
    };
  }

  /**
   * Creates a new transport request.
   */
  async createRequest(customerId: string, dto: CreateRequestDto): Promise<any> {
    logger.info(`RequestService: Customer ${customerId} creating requirement transport request for ${dto.requiredVehicleCategory}`);

    const distanceKm = locationService.calculateDistance(
      dto.pickupLatitude,
      dto.pickupLongitude,
      dto.dropLatitude,
      dto.dropLongitude
    );

    const rule = await prisma.fareRule.findUnique({
      where: { category: dto.requiredVehicleCategory },
    });

    if (!rule) {
      throw new NotFoundError(`Fare rules not configured for category: ${dto.requiredVehicleCategory}`);
    }

    const estimatedFare = Math.round(rule.baseFare + distanceKm * rule.ratePerKm);

    const request = await this.requestRepository.create(
      customerId,
      dto,
      distanceKm,
      estimatedFare
    );

    // Trigger background socket alert to nearby owners (WebSockets logic matches online owner devices)
    logger.info(`RequestService: Requirement Request ${request.id} created. Matching nearby owners...`);
    this.notifyNearbyOwnersOfRequest(request).catch((err) =>
      logger.error('Failed to notify nearby owners of request creation:', err)
    );

    return request;
  }

  /**
   * Finds all pending requests matching owner's active vehicles and operating radius boundaries.
   */
  async getNearbyRequestsForOwner(ownerId: string): Promise<any[]> {
    // 1. Fetch active owner vehicles
    const ownerVehicles = await prisma.vehicle.findMany({
      where: {
        ownerId,
        status: 'ACTIVE',
        isAvailable: true,
      },
    });

    if (ownerVehicles.length === 0) {
      return [];
    }

    // 2. Extract active vehicle categories
    const categories = Array.from(new Set(ownerVehicles.map((v) => v.category)));

    // 3. Fetch all pending requests of matching categories
    const pendingRequests = await this.requestRepository.findPendingByCategory(categories);

    // 4. Filter requests based on whether request pickup point is inside vehicle operating radius
    const nearbyRequests: any[] = [];

    for (const req of pendingRequests) {
      const match = ownerVehicles.find((vehicle) => {
        if (
          vehicle.category !== req.requiredVehicleCategory ||
          vehicle.operatingLatitude === null ||
          vehicle.operatingLongitude === null ||
          vehicle.operatingRadius === null
        ) {
          return false;
        }

        const distance = locationService.calculateDistance(
          req.pickupLatitude,
          req.pickupLongitude,
          vehicle.operatingLatitude,
          vehicle.operatingLongitude
        );

        return distance <= vehicle.operatingRadius;
      });

      if (match) {
        nearbyRequests.push({
          ...req,
          matchedVehicleId: match.id,
          matchedVehicleTitle: match.title,
        });
      }
    }

    return nearbyRequests;
  }

  /**
   * Accepts a pending requirement request. Owner only.
   */
  async acceptRequest(requestId: string, ownerId: string, role: string): Promise<any> {
    logger.info(`RequestService: Owner ${ownerId} attempting to accept requirement request ${requestId}`);

    if (role !== 'OWNER' && role !== UserRole.VENDOR && role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only vehicle owners can accept booking requests.');
    }

    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    if (request.status !== RequestStatus.PENDING) {
      throw new ConflictError('This transport request has already been assigned or cancelled.');
    }

    // Find one of the owner's active available vehicles matching the required category
    const vehicle = await prisma.vehicle.findFirst({
      where: {
        ownerId,
        category: request.requiredVehicleCategory,
        status: 'ACTIVE',
        isAvailable: true,
      },
    });

    if (!vehicle) {
      throw new BadRequestError('You do not have an active and available vehicle matching this category.');
    }

    // Assign owner and vehicle, and transition request to OWNER_ASSIGNED (waiting for checkout)
    const updatedRequest = await this.requestRepository.updateStatus(
      requestId,
      RequestStatus.OWNER_ASSIGNED,
      ownerId,
      vehicle.id
    );

    logger.info(`RequestService: Request ${requestId} assigned to Owner ${ownerId} with Vehicle ${vehicle.id}`);

    // Notify Customer
    this.notificationService.createNotification(request.customerId, {
      title: 'Transport Request Accepted',
      message: `Owner ${updatedRequest.assignedOwner?.name} accepted your ride request using a ${updatedRequest.assignedVehicle?.brand} ${updatedRequest.assignedVehicle?.model}. Confirm payment now to start the trip.`,
      type: 'OWNER_ACCEPTED',
    }).catch((err) => logger.error('Failed to trigger OWNER_ACCEPTED notification', err));

    return updatedRequest;
  }

  /**
   * Rejects/dismisses a request. Just logs or allows others.
   */
  async rejectRequest(requestId: string, ownerId: string, _role: string): Promise<any> {
    logger.info(`RequestService: Owner ${ownerId} rejecting requirement request ${requestId}`);
    // Rejections simply remove the request from the local Owner console stack.
    // In Shubh Mangalam, we just return success.
    return { success: true };
  }

  /**
   * Completes an active trip requirement. Owner or Admin.
   */
  async completeTrip(requestId: string, ownerId: string, role: string): Promise<any> {
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    if (role !== UserRole.ADMIN && role !== 'ADMIN' && request.assignedOwnerId !== ownerId) {
      throw new ForbiddenError('You are not authorized to complete this trip.');
    }

    if (request.status !== RequestStatus.ACCEPTED) {
      throw new BadRequestError('Only confirmed, paid trips can be marked as completed.');
    }

    const updatedRequest = await this.requestRepository.updateStatus(
      requestId,
      RequestStatus.COMPLETED
    );

    // Notify Customer
    this.notificationService.createNotification(request.customerId, {
      title: 'Trip Completed',
      message: 'Your transport requirement has been successfully completed.',
      type: 'TRIP_COMPLETED',
    }).catch((err) => logger.error('Failed to trigger TRIP_COMPLETED notification', err));

    return updatedRequest;
  }

  /**
   * Cancels a requirement request. Customer only.
   */
  async cancelRequest(requestId: string, customerId: string): Promise<any> {
    const request = await this.requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    if (request.customerId !== customerId) {
      throw new ForbiddenError('You can only cancel requests created by yourself.');
    }

    if (request.status === RequestStatus.COMPLETED || request.status === RequestStatus.CANCELLED) {
      throw new BadRequestError('Cannot cancel completed or already cancelled requests.');
    }

    const updatedRequest = await this.requestRepository.updateStatus(
      requestId,
      RequestStatus.CANCELLED
    );

    // Notify Owner if assigned
    if (request.assignedOwnerId) {
      this.notificationService.createNotification(request.assignedOwnerId, {
        title: 'Transport Request Cancelled',
        message: 'The customer cancelled their transportation request.',
        type: 'SYSTEM',
      }).catch((err) => logger.error('Failed to trigger BOOKING_CANCELLED notification', err));
    }

    return updatedRequest;
  }

  /**
   * Retrieve request details.
   */
  async getRequestDetails(id: string, userId: string, role: string): Promise<any> {
    const request = await this.requestRepository.findById(id);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    if (role !== UserRole.ADMIN && role !== 'ADMIN' && request.customerId !== userId && request.assignedOwnerId !== userId) {
      throw new ForbiddenError('Access Denied. You are not linked to this request.');
    }

    return request;
  }

  /**
   * Lists customer requirements requests.
   */
  async listCustomerRequests(customerId: string, query: RequestQueryDto): Promise<any> {
    const { total, requests } = await this.requestRepository.listByCustomer(customerId, query);
    return {
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
      requests,
    };
  }

  /**
   * Lists owner requirements requests.
   */
  async listOwnerRequests(ownerId: string, query: RequestQueryDto): Promise<any> {
    const { total, requests } = await this.requestRepository.listByOwner(ownerId, query);
    return {
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
      requests,
    };
  }

  /**
   * Triggers location query and WebSockets notifications to active owner devices.
   */
  private async notifyNearbyOwnersOfRequest(request: any) {
    const nearbyVehicles = await locationService.findNearbyVehicles(
      request.pickupLatitude,
      request.pickupLongitude,
      request.requiredVehicleCategory
    );

    const ownerIds = Array.from(new Set(nearbyVehicles.map((v) => v.ownerId)));
    logger.info(`RequestService: Dispatching alerts to ${ownerIds.length} nearby owners`);

    for (const ownerId of ownerIds) {
      this.notificationService.createNotification(ownerId, {
        title: 'New Nearby Transport Requirement',
        message: `A customer requested a ${request.requiredVehicleCategory} nearby for ${request.purpose}. View details to accept.`,
        type: 'REQUEST_CREATED',
      }).catch((err) => logger.error(`Failed to notify owner ${ownerId} of request creation:`, err));
    }
  }
}
export const requestService = new RequestService();
