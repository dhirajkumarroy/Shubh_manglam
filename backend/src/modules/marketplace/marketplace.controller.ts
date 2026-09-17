import { Request, Response, NextFunction } from 'express';
import { MarketplaceService } from './marketplace.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import {
  marketplaceVendorQuerySchema,
  marketplaceCategoryQuerySchema,
  marketplaceServiceQuerySchema,
  marketplacePackageQuerySchema,
} from './marketplace.validation';

export class MarketplaceController {
  private service: MarketplaceService;

  constructor() {
    this.service = new MarketplaceService();
  }

  listVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = marketplaceVendorQuerySchema.parse(req.query);
      const data = await this.service.listVendors(query);
      res.status(200).json(ResponseDto.success('Marketplace vendors retrieved successfully.', data));
    } catch (error) {
      next(error);
    }
  };

  getVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const { lat, lon, latitude, longitude } = req.query;
      const userLat = lat || latitude ? Number(lat || latitude) : undefined;
      const userLon = lon || longitude ? Number(lon || longitude) : undefined;

      const vendor = await this.service.getVendorDetails(
        vendorId,
        userLat !== undefined && userLon !== undefined
          ? { latitude: userLat, longitude: userLon }
          : undefined
      );
      res.status(200).json(ResponseDto.success('Vendor details retrieved successfully.', vendor));
    } catch (error) {
      next(error);
    }
  };

  listCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = marketplaceCategoryQuerySchema.parse(req.query);
      const categories = await this.service.listCategories(query);
      res.status(200).json(ResponseDto.success('Marketplace categories retrieved successfully.', categories));
    } catch (error) {
      next(error);
    }
  };

  listServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = marketplaceServiceQuerySchema.parse(req.query);
      const data = await this.service.listServices(query);
      res.status(200).json(ResponseDto.success('Marketplace services retrieved successfully.', data));
    } catch (error) {
      next(error);
    }
  };

  getService = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { serviceId } = req.params;
      const service = await this.service.getServiceById(serviceId);
      res.status(200).json(ResponseDto.success('Service details retrieved successfully.', service));
    } catch (error) {
      next(error);
    }
  };

  listPackages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = marketplacePackageQuerySchema.parse(req.query);
      const data = await this.service.listPackages(query);
      res.status(200).json(ResponseDto.success('Marketplace packages retrieved successfully.', data));
    } catch (error) {
      next(error);
    }
  };

  getPackage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { packageId } = req.params;
      const pkg = await this.service.getPackageById(packageId);
      res.status(200).json(ResponseDto.success('Package details retrieved successfully.', pkg));
    } catch (error) {
      next(error);
    }
  };
}
