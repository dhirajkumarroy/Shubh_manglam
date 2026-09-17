import { MarketplaceRepository } from './marketplace.repository';
import {
  MarketplaceVendorQueryDto,
  MarketplaceCategoryQueryDto,
  MarketplaceServiceQueryDto,
  MarketplacePackageQueryDto,
} from './marketplace.types';
import { NotFoundError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class MarketplaceService {
  private repo: MarketplaceRepository;

  constructor() {
    this.repo = new MarketplaceRepository();
  }

  async listVendors(query: MarketplaceVendorQueryDto) {
    logger.info(
      `MarketplaceService: Discovering vendors (cat: ${query.category || query.categoryId}, search: ${
        query.search || query.q
      }, lat: ${query.latitude}, lon: ${query.longitude}, radius: ${query.radius})`
    );
    return this.repo.listVendors(query);
  }

  async getVendorDetails(idOrSlug: string, coords?: { latitude?: number; longitude?: number }) {
    const vendor = await this.repo.getVendorDetails(idOrSlug, coords);
    if (!vendor) {
      throw new NotFoundError('Vendor not found or not active');
    }
    return vendor;
  }

  async listCategories(query: MarketplaceCategoryQueryDto) {
    return this.repo.listCategories(query);
  }

  async listServices(query: MarketplaceServiceQueryDto) {
    return this.repo.listServices(query);
  }

  async getServiceById(idOrSlug: string) {
    const service = await this.repo.getServiceById(idOrSlug);
    if (!service) {
      throw new NotFoundError('Service not found or not available');
    }
    return service;
  }

  async listPackages(query: MarketplacePackageQueryDto) {
    return this.repo.listPackages(query);
  }

  async getPackageById(idOrSlug: string) {
    const pkg = await this.repo.getPackageById(idOrSlug);
    if (!pkg) {
      throw new NotFoundError('Package not found or not available');
    }
    return pkg;
  }
}
