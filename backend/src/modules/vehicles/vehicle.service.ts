import path from 'path';
import { UserRole, VehicleStatus } from '@prisma/client';
import { VehicleRepository } from './vehicle.repository';
import { CreateVehicleDto, UpdateVehicleDto, VehicleQueryDto } from './vehicle.types';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../../common/utils/app-error';
import { storageService } from '../uploads/storage.service';
import logger from '../../config/logger';

export class VehicleService {
  private vehicleRepository: VehicleRepository;

  constructor() {
    this.vehicleRepository = new VehicleRepository();
  }

  /**
   * Registers a new vehicle with associated images uploaded to the storage service.
   */
  async createVehicle(
    ownerId: string,
    userRole: string,
    dto: CreateVehicleDto,
    files: Express.Multer.File[]
  ): Promise<any> {
    logger.info(`VehicleService: User ${ownerId} attempting to register a vehicle`);

    // 1. Authorize role: only OWNER and ADMIN can list vehicles
    if (userRole !== 'OWNER' && userRole !== UserRole.VENDOR && userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
      logger.warn(`VehicleService: Unauthorized role ${userRole} for creating vehicle`);
      throw new ForbiddenError('Only users with the OWNER role or administrators can register vehicles.');
    }

    // 2. Validate registration number uniqueness
    const normalizedRegNum = dto.vehicleNumber.toUpperCase().trim();
    const existingVehicle = await this.vehicleRepository.findByVehicleNumber(normalizedRegNum);
    if (existingVehicle) {
      logger.warn(`VehicleService: Duplicate vehicle number registration attempt: ${normalizedRegNum}`);
      throw new ConflictError('A vehicle with this registration number is already registered.');
    }

    // 3. Enforce image limit bounds (1 - 10 images)
    if (!files || files.length === 0) {
      throw new BadRequestError('At least 1 vehicle image is required.');
    }
    if (files.length > 10) {
      throw new BadRequestError('A maximum of 10 vehicle images is allowed.');
    }

    // 4. Upload images via the StorageService abstraction
    const uploadedImages: { imageUrl: string; isPrimary: boolean }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = path.extname(file.originalname) || '.jpg';
      const fileName = `vehicle-${ownerId}-${Date.now()}-${i}${ext}`;
      
      logger.info(`VehicleService: Uploading image ${i + 1}/${files.length} for ${normalizedRegNum}`);
      const imageUrl = await storageService.uploadFile(
        file.buffer,
        fileName,
        'vehicles',
        file.mimetype
      );

      uploadedImages.push({
        imageUrl,
        isPrimary: i === 0, // Make the first uploaded image the primary thumbnail
      });
    }

    // 5. Commit records in database transaction
    const vehicle = await this.vehicleRepository.create(ownerId, dto, uploadedImages);
    logger.info(`VehicleService: Vehicle ${vehicle.id} successfully created for owner ${ownerId}`);
    return vehicle;
  }

  /**
   * Returns a paginated, filtered catalog of active vehicles.
   */
  async listVehicles(query: VehicleQueryDto): Promise<any> {
    const { total, vehicles } = await this.vehicleRepository.list(query);
    const totalPages = Math.ceil(total / query.limit);

    return {
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages,
      },
      vehicles,
    };
  }

  /**
   * Retrieves vehicle details.
   */
  async getVehicleDetails(id: string): Promise<any> {
    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      logger.warn(`VehicleService: Vehicle details not found for ID ${id}`);
      throw new NotFoundError('Vehicle not found.');
    }
    return vehicle;
  }

  /**
   * Performs partial updates on vehicle properties. Restricted to the owner.
   */
  async updateVehicle(
    id: string,
    ownerId: string,
    userRole: string,
    dto: UpdateVehicleDto
  ): Promise<any> {
    logger.info(`VehicleService: Updating vehicle ${id} by owner/admin ${ownerId}`);

    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      logger.warn(`VehicleService: Update failed. Vehicle not found for ID ${id}`);
      throw new NotFoundError('Vehicle not found.');
    }

    // Authorize: Only the owner or an admin can update the vehicle
    if (vehicle.ownerId !== ownerId && userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
      logger.warn(`VehicleService: Authorization denied for user ${ownerId} updating vehicle ${id}`);
      throw new ForbiddenError('You are not authorized to update this vehicle listing.');
    }

    // Validate number plate uniqueness if modified
    if (dto.vehicleNumber) {
      const normalizedRegNum = dto.vehicleNumber.toUpperCase().trim();
      if (normalizedRegNum !== vehicle.vehicleNumber) {
        const existingVehicle = await this.vehicleRepository.findByVehicleNumber(normalizedRegNum);
        if (existingVehicle) {
          logger.warn(`VehicleService: Update failed. Duplicate license plate: ${normalizedRegNum}`);
          throw new ConflictError('A vehicle with this registration number is already registered.');
        }
        dto.vehicleNumber = normalizedRegNum;
      }
    }

    const updatedVehicle = await this.vehicleRepository.update(id, dto);
    logger.info(`VehicleService: Vehicle ${id} updated successfully`);
    return updatedVehicle;
  }

  /**
   * Soft deletes a vehicle by setting its status to SUSPENDED.
   */
  async deleteVehicle(id: string, ownerId: string, userRole: string): Promise<any> {
    logger.info(`VehicleService: Delete requested for vehicle ${id} by owner/admin ${ownerId}`);

    const vehicle = await this.vehicleRepository.findById(id);
    if (!vehicle) {
      logger.warn(`VehicleService: Delete failed. Vehicle not found for ID ${id}`);
      throw new NotFoundError('Vehicle not found.');
    }

    // Authorize: Only the owner or an admin can delete the vehicle
    if (vehicle.ownerId !== ownerId && userRole !== UserRole.ADMIN && userRole !== 'ADMIN') {
      logger.warn(`VehicleService: Authorization denied for user ${ownerId} deleting vehicle ${id}`);
      throw new ForbiddenError('You are not authorized to delete this vehicle listing.');
    }

    // Perform soft delete status update
    const updatedVehicle = await this.vehicleRepository.update(id, {
      status: VehicleStatus.SUSPENDED,
      isAvailable: false, // Mark unavailable as well
    });

    logger.info(`VehicleService: Vehicle ${id} successfully soft deleted (suspended)`);
    return updatedVehicle;
  }

  /**
   * Retrieves vehicles owned by the authenticated owner.
   */
  async listMyVehicles(ownerId: string, page: number, limit: number): Promise<any> {
    logger.info(`VehicleService: Fetching owner listings for owner ${ownerId}`);
    const { total, vehicles } = await this.vehicleRepository.listByOwner(ownerId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      vehicles,
    };
  }
}

export default VehicleService;
