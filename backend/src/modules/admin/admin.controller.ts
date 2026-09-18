import { Request, Response, NextFunction } from 'express';
import { AdminService } from './admin.service';
import {
  userQuerySchema,
  uuidParamSchema,
  vendorIdParamSchema,
  vendorDocumentParamsSchema,
  adminVendorQuerySchema,
  rejectVendorSchema,
  suspendVendorSchema,
  reviewDocumentSchema,
} from './admin.validation';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../categories/category.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { adminImportService } from './admin-import.service';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  private getAdminId(req: AuthenticatedRequest): string | undefined {
    return req.user?.userId || req.user?.sub;
  }

  getDashboardStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.status(200).json(ResponseDto.success('Dashboard stats retrieved successfully.', stats));
    } catch (error) {
      next(error);
    }
  };

  listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = userQuerySchema.parse(req.query);
      const result = await this.adminService.listUsers(validatedQuery);
      res.status(200).json(ResponseDto.success('Users list retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const user = await this.adminService.getUserDetails(id);
      res.status(200).json(ResponseDto.success('User details retrieved successfully.', user));
    } catch (error) {
      next(error);
    }
  };

  blockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const updatedUser = await this.adminService.blockUser(id);
      res.status(200).json(ResponseDto.success('User has been blocked successfully.', updatedUser));
    } catch (error) {
      next(error);
    }
  };

  unblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const updatedUser = await this.adminService.unblockUser(id);
      res.status(200).json(ResponseDto.success('User has been unblocked successfully.', updatedUser));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Vendor Management Controllers
  // =========================================================================

  listVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = adminVendorQuerySchema.parse(req.query);
      const result = await this.adminService.listVendors(validatedQuery);
      res.status(200).json(ResponseDto.success('Vendors list retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  getVendorDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const vendor = await this.adminService.getVendorDetails(vendorId);
      res.status(200).json(ResponseDto.success('Vendor details retrieved successfully.', vendor));
    } catch (error) {
      next(error);
    }
  };

  approveVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.approveVendor(vendorId, adminId);
      res.status(200).json(ResponseDto.success('Vendor has been approved successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  rejectVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const { rejectionReason } = rejectVendorSchema.parse(req.body);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.rejectVendor(vendorId, rejectionReason, adminId);
      res.status(200).json(ResponseDto.success('Vendor application has been rejected.', updated));
    } catch (error) {
      next(error);
    }
  };

  moveToUnderReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.moveToUnderReview(vendorId, adminId);
      res.status(200).json(ResponseDto.success('Vendor moved to UNDER_REVIEW.', updated));
    } catch (error) {
      next(error);
    }
  };

  suspendVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const { reason } = suspendVendorSchema.parse(req.body);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.suspendVendor(vendorId, reason, adminId);
      res.status(200).json(ResponseDto.success('Vendor has been suspended.', updated));
    } catch (error) {
      next(error);
    }
  };

  reactivateVendor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = vendorIdParamSchema.parse(req.params);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.reactivateVendor(vendorId, adminId);
      res.status(200).json(ResponseDto.success('Vendor has been reactivated.', updated));
    } catch (error) {
      next(error);
    }
  };

  reviewDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId, documentId } = vendorDocumentParamsSchema.parse(req.params);
      const { status, rejectionReason } = reviewDocumentSchema.parse(req.body);
      const adminId = this.getAdminId(req);
      const updated = await this.adminService.reviewVendorDocument(
        vendorId,
        documentId,
        status,
        rejectionReason,
        adminId
      );
      res.status(200).json(ResponseDto.success('Document review status updated.', updated));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Category Governance Controllers
  // =========================================================================

  listCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.adminService.listCategories({
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        search: req.query.search as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      });
      res.status(200).json(ResponseDto.success('Categories retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = createCategorySchema.parse(req.body);
      const adminId = this.getAdminId(req);
      const category = await this.adminService.createCategory(validatedBody, adminId);
      res.status(201).json(ResponseDto.success('Category created successfully.', category));
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const validatedBody = updateCategorySchema.parse(req.body);
      const adminId = this.getAdminId(req);
      const category = await this.adminService.updateCategory(id, validatedBody, adminId);
      res.status(200).json(ResponseDto.success('Category updated successfully.', category));
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = uuidParamSchema.parse(req.params);
      const adminId = this.getAdminId(req);
      const result = await this.adminService.removeCategory(id, adminId);
      res.status(200).json(ResponseDto.success(result.message, result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Document Requirement Governance Controllers
  // =========================================================================

  listDocumentRequirements = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentRequirementService } = await import('../vendors/document-requirement.service');
      const requirements = await documentRequirementService.adminListRequirements();
      res.status(200).json(ResponseDto.success('Document requirements retrieved successfully.', requirements));
    } catch (error) {
      next(error);
    }
  };

  createDocumentRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { documentRequirementService } = await import('../vendors/document-requirement.service');
      const requirement = await documentRequirementService.createRequirement(req.body);
      res.status(201).json(ResponseDto.success('Document requirement created successfully.', requirement));
    } catch (error) {
      next(error);
    }
  };

  updateDocumentRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { documentRequirementService } = await import('../vendors/document-requirement.service');
      const updated = await documentRequirementService.updateRequirement(id, req.body);
      res.status(200).json(ResponseDto.success('Document requirement updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  toggleDocumentRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { documentRequirementService } = await import('../vendors/document-requirement.service');
      const updated = await documentRequirementService.toggleActive(id);
      res.status(200).json(ResponseDto.success('Document requirement status updated.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteDocumentRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { documentRequirementService } = await import('../vendors/document-requirement.service');
      const result = await documentRequirementService.deleteRequirement(id);
      res.status(200).json(ResponseDto.success(result.message, result));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk smart import for categories, subcategories, and celebrations
   */
  bulkSmartImport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId = this.getAdminId(req);
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const result = await adminImportService.executeSmartImport(req.body, adminId, ipAddress);
      res.status(200).json(ResponseDto.success('Smart Excel import completed successfully.', result));
    } catch (error) {
      next(error);
    }
  };
}

export default AdminController;
