import { Request, Response, NextFunction } from 'express';
import { CatalogService } from './catalog.service';
import {
  createServiceSchema,
  updateServiceSchema,
  catalogQuerySchema,
  createServiceImageSchema,
  updateServiceImageSchema,
  createPackageSchema,
  updatePackageSchema,
} from './catalog.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { UnauthorizedError } from '../../common/utils/app-error';

export class CatalogController {
  private service: CatalogService;

  constructor() {
    this.service = new CatalogService();
  }

  private getVendorId(req: AuthenticatedRequest): string {
    const vendor = (req as any).vendor;
    if (!vendor || !vendor.id) {
      throw new UnauthorizedError('Vendor identification required.');
    }
    return vendor.id;
  }

  private getUserId(req: AuthenticatedRequest): string | undefined {
    return req.user?.userId || req.user?.sub;
  }

  // =========================================================================
  // Vendor Service Endpoints
  // =========================================================================

  createService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const validatedBody = createServiceSchema.parse(req.body);
      const created = await this.service.createService(vendorId, validatedBody, userId);
      res.status(201).json(ResponseDto.success('Service created successfully.', created));
    } catch (error) {
      next(error);
    }
  };

  getVendorService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { id } = req.params;
      const service = await this.service.getVendorService(vendorId, id);
      res.status(200).json(ResponseDto.success('Service retrieved successfully.', service));
    } catch (error) {
      next(error);
    }
  };

  listVendorServices = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listVendorServices(vendorId, validatedQuery);
      res.status(200).json(ResponseDto.success('Vendor services retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  updateVendorService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const { id } = req.params;
      const validatedBody = updateServiceSchema.parse(req.body);
      const updated = await this.service.updateVendorService(vendorId, id, validatedBody, userId);
      res.status(200).json(ResponseDto.success('Service updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteVendorService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const { id } = req.params;
      const result = await this.service.deleteVendorService(vendorId, id, userId);
      res.status(200).json(ResponseDto.success(result.message, result.service));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Service Images Endpoints
  // =========================================================================

  addServiceImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { serviceId } = req.params;
      const validatedBody = createServiceImageSchema.parse(req.body);
      const image = await this.service.addServiceImage(vendorId, serviceId, validatedBody);
      res.status(201).json(ResponseDto.success('Image added to service successfully.', image));
    } catch (error) {
      next(error);
    }
  };

  listServiceImages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { serviceId } = req.params;
      const images = await this.service.listServiceImages(vendorId, serviceId);
      res.status(200).json(ResponseDto.success('Service images retrieved successfully.', images));
    } catch (error) {
      next(error);
    }
  };

  updateServiceImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { serviceId, imageId } = req.params;
      const validatedBody = updateServiceImageSchema.parse(req.body);
      const updated = await this.service.updateServiceImage(vendorId, serviceId, imageId, validatedBody);
      res.status(200).json(ResponseDto.success('Service image updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteServiceImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { serviceId, imageId } = req.params;
      const result = await this.service.deleteServiceImage(vendorId, serviceId, imageId);
      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  setPrimaryServiceImage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { serviceId, imageId } = req.params;
      const updated = await this.service.setPrimaryServiceImage(vendorId, serviceId, imageId);
      res.status(200).json(ResponseDto.success('Primary service image updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Vendor Package Endpoints
  // =========================================================================

  createPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const validatedBody = createPackageSchema.parse(req.body);
      const created = await this.service.createPackage(vendorId, validatedBody, userId);
      res.status(201).json(ResponseDto.success('Package created successfully.', created));
    } catch (error) {
      next(error);
    }
  };

  getVendorPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { id } = req.params;
      const pkg = await this.service.getVendorPackage(vendorId, id);
      res.status(200).json(ResponseDto.success('Package retrieved successfully.', pkg));
    } catch (error) {
      next(error);
    }
  };

  listVendorPackages = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listVendorPackages(vendorId, validatedQuery);
      res.status(200).json(ResponseDto.success('Vendor packages retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  updateVendorPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const { id } = req.params;
      const validatedBody = updatePackageSchema.parse(req.body);
      const updated = await this.service.updateVendorPackage(vendorId, id, validatedBody, userId);
      res.status(200).json(ResponseDto.success('Package updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteVendorPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const userId = this.getUserId(req);
      const { id } = req.params;
      const result = await this.service.deleteVendorPackage(vendorId, id, userId);
      res.status(200).json(ResponseDto.success(result.message, result.package));
    } catch (error) {
      next(error);
    }
  };

  addServiceToPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { packageId } = req.params;
      const { serviceId, quantity } = req.body;
      const result = await this.service.addServiceToPackage(vendorId, packageId, serviceId, quantity);
      res.status(201).json(ResponseDto.success('Service added to package successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  removeServiceFromPackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { packageId, serviceId } = req.params;
      const result = await this.service.removeServiceFromPackage(vendorId, packageId, serviceId);
      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  updatePackageService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = this.getVendorId(req);
      const { packageId, serviceId } = req.params;
      const { quantity } = req.body;
      const result = await this.service.updatePackageService(vendorId, packageId, serviceId, quantity);
      res.status(200).json(ResponseDto.success('Package service quantity updated successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Public Customer Catalog Endpoints
  // =========================================================================

  listPublicServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listPublicServices(validatedQuery);
      res.status(200).json(ResponseDto.success('Marketplace services retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  getPublicService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const service = await this.service.getPublicServiceDetails(id);
      res.status(200).json(ResponseDto.success('Service details retrieved successfully.', service));
    } catch (error) {
      next(error);
    }
  };

  listPublicPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listPublicPackages(validatedQuery);
      res.status(200).json(ResponseDto.success('Marketplace packages retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  getPublicPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const pkg = await this.service.getPublicPackageDetails(id);
      res.status(200).json(ResponseDto.success('Package details retrieved successfully.', pkg));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Admin Moderation Endpoints
  // =========================================================================

  listAdminServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listAdminServices(validatedQuery);
      res.status(200).json(ResponseDto.success('Admin services retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  moderateService = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const adminId = this.getUserId(req);
      const updated = await this.service.moderateServiceStatus(id, Boolean(isActive), adminId);
      res.status(200).json(ResponseDto.success('Service status moderated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  listAdminPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedQuery = catalogQuerySchema.parse(req.query);
      const result = await this.service.listAdminPackages(validatedQuery);
      res.status(200).json(ResponseDto.success('Admin packages retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  moderatePackage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const adminId = this.getUserId(req);
      const updated = await this.service.moderatePackageStatus(id, Boolean(isActive), adminId);
      res.status(200).json(ResponseDto.success('Package status moderated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };
}

export default CatalogController;
