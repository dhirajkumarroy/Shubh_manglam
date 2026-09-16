import { Response, NextFunction } from 'express';
import { VehicleService } from './vehicle.service';
import { createVehicleSchema, updateVehicleSchema, vehicleQuerySchema } from './vehicle.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class VehicleController {
  private vehicleService: VehicleService;

  constructor() {
    this.vehicleService = new VehicleService();
  }

  /**
   * Registers a new vehicle with image uploads.
   * POST /api/v1/vehicles
   */
  createVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        logger.warn('VehicleController: Create vehicle failed due to missing req.user credentials');
        throw new UnauthorizedError('Unauthorized access.');
      }

      // Parse and validate req.body fields with Zod
      const validatedBody = createVehicleSchema.parse(req.body);

      // Extract uploaded files from Multer array
      const files = req.files as Express.Multer.File[] | undefined;
      if (!files || files.length === 0) {
        throw new BadRequestError('At least 1 vehicle image is required.');
      }

      const vehicle = await this.vehicleService.createVehicle(
        userId,
        userRole,
        validatedBody,
        files
      );

      res.status(201).json(
        ResponseDto.success('Vehicle registered successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search and list catalog vehicles.
   * GET /api/v1/vehicles
   */
  listVehicles = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate queries via Zod
      const validatedQuery = vehicleQuerySchema.parse(req.query);

      const result = await this.vehicleService.listVehicles(validatedQuery);

      res.status(200).json(
        ResponseDto.success('Vehicles retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve vehicle detail schema by UUID.
   * GET /api/v1/vehicles/:id
   */
  getVehicleDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Vehicle ID is required.');
      }

      const vehicle = await this.vehicleService.getVehicleDetails(id);

      res.status(200).json(
        ResponseDto.success('Vehicle details retrieved successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update properties on an existing vehicle listing.
   * PATCH /api/v1/vehicles/:id
   */
  updateVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        logger.warn('VehicleController: Update vehicle failed due to missing req.user credentials');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Vehicle ID is required.');
      }

      // Parse partial properties validation
      const validatedBody = updateVehicleSchema.parse(req.body);

      const vehicle = await this.vehicleService.updateVehicle(
        id,
        userId,
        userRole,
        validatedBody
      );

      res.status(200).json(
        ResponseDto.success('Vehicle updated successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Soft deletes a vehicle by setting state to SUSPENDED.
   * DELETE /api/v1/vehicles/:id
   */
  deleteVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const userRole = req.user?.role;
      if (!userId || !userRole) {
        logger.warn('VehicleController: Delete vehicle failed due to missing req.user credentials');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Vehicle ID is required.');
      }

      await this.vehicleService.deleteVehicle(id, userId, userRole);

      res.status(200).json(
        ResponseDto.success('Vehicle deleted successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve vehicles owned by the authenticated owner.
   * GET /api/v1/vehicles/my
   */
  listMyVehicles = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('VehicleController: List owner vehicles failed due to missing req.user credentials');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
      const limit = Math.max(1, parseInt(req.query.limit as string || '10', 10));

      const result = await this.vehicleService.listMyVehicles(userId, page, limit);

      res.status(200).json(
        ResponseDto.success('Owner vehicles retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default VehicleController;
