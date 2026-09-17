import { Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import { userQuerySchema, uuidParamSchema } from './admin.validation';
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
}

export default AdminController;
