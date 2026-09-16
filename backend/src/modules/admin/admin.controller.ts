import { Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import {
  userQuerySchema,
  vehicleQuerySchema,
  bookingQuerySchema,
  uuidParamSchema,
} from './admin.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  /**
   * GET /api/v1/admin/dashboard
   */
  getDashboardStats = async (
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.status(200).json(
        ResponseDto.success('Dashboard statistics retrieved successfully.', stats)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/users
   */
  listUsers = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = userQuerySchema.parse(req.query);
      const result = await this.adminService.listUsers(query);
      res.status(200).json(
        ResponseDto.success('Users list retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/users/:id
   */
  getUserDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const user = await this.adminService.getUserDetails(id);
      res.status(200).json(
        ResponseDto.success('User details retrieved successfully.', user)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/users/:id/block
   */
  blockUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const user = await this.adminService.blockUser(id);
      res.status(200).json(
        ResponseDto.success('User has been blocked successfully.', user)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/users/:id/unblock
   */
  unblockUser = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const user = await this.adminService.unblockUser(id);
      res.status(200).json(
        ResponseDto.success('User has been unblocked successfully.', user)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/vehicles
   */
  listVehicles = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = vehicleQuerySchema.parse(req.query);
      const result = await this.adminService.listVehicles(query);
      res.status(200).json(
        ResponseDto.success('Vehicles list retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/vehicles/:id
   */
  getVehicleDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const vehicle = await this.adminService.getVehicleDetails(id);
      res.status(200).json(
        ResponseDto.success('Vehicle details retrieved successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/vehicles/:id/approve
   */
  approveVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const vehicle = await this.adminService.approveVehicle(id);
      res.status(200).json(
        ResponseDto.success('Vehicle has been approved successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/vehicles/:id/reject
   */
  rejectVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const vehicle = await this.adminService.rejectVehicle(id);
      res.status(200).json(
        ResponseDto.success('Vehicle has been rejected successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/v1/admin/vehicles/:id/suspend
   */
  suspendVehicle = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const vehicle = await this.adminService.suspendVehicle(id);
      res.status(200).json(
        ResponseDto.success('Vehicle has been suspended successfully.', vehicle)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/bookings
   */
  listBookings = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = bookingQuerySchema.parse(req.query);
      const result = await this.adminService.listBookings(query);
      res.status(200).json(
        ResponseDto.success('Bookings list retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/v1/admin/bookings/:id
   */
  getBookingDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const booking = await this.adminService.getBookingDetails(id);
      res.status(200).json(
        ResponseDto.success('Booking details retrieved successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default AdminController;
