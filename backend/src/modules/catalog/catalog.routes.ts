import { Router } from 'express';
import { CatalogController } from './catalog.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireVendor, requireApprovedVendor, requireAdmin } from '../../middlewares/role.middleware';

const controller = new CatalogController();

// =========================================================================
// Vendor Catalog Router (Mounted at /vendor)
// All endpoints require Authenticated VENDOR with APPROVED status
// =========================================================================
export const vendorCatalogRouter = Router();

vendorCatalogRouter.use(authenticateRequest, requireVendor, requireApprovedVendor);

// Vendor Services
vendorCatalogRouter.post('/services', controller.createService);
vendorCatalogRouter.get('/services', controller.listVendorServices);
vendorCatalogRouter.get('/services/:id', controller.getVendorService);
vendorCatalogRouter.put('/services/:id', controller.updateVendorService);
vendorCatalogRouter.delete('/services/:id', controller.deleteVendorService);

// Vendor Service Images
vendorCatalogRouter.post('/services/:serviceId/images', controller.addServiceImage);
vendorCatalogRouter.get('/services/:serviceId/images', controller.listServiceImages);
vendorCatalogRouter.patch('/services/:serviceId/images/:imageId', controller.updateServiceImage);
vendorCatalogRouter.delete('/services/:serviceId/images/:imageId', controller.deleteServiceImage);
vendorCatalogRouter.patch('/services/:serviceId/images/:imageId/primary', controller.setPrimaryServiceImage);

// Vendor Packages
vendorCatalogRouter.post('/packages', controller.createPackage);
vendorCatalogRouter.get('/packages', controller.listVendorPackages);
vendorCatalogRouter.get('/packages/:id', controller.getVendorPackage);
vendorCatalogRouter.put('/packages/:id', controller.updateVendorPackage);
vendorCatalogRouter.delete('/packages/:id', controller.deleteVendorPackage);

// Vendor Package Services
vendorCatalogRouter.post('/packages/:packageId/services', controller.addServiceToPackage);
vendorCatalogRouter.delete('/packages/:packageId/services/:serviceId', controller.removeServiceFromPackage);
vendorCatalogRouter.patch('/packages/:packageId/services/:serviceId', controller.updatePackageService);

// =========================================================================
// Public Marketplace Services Router (Mounted at /services)
// =========================================================================
export const publicServicesRouter = Router();

publicServicesRouter.get('/', controller.listPublicServices);
publicServicesRouter.get('/:id', controller.getPublicService);

// =========================================================================
// Public Marketplace Packages Router (Mounted at /packages)
// =========================================================================
export const publicPackagesRouter = Router();

publicPackagesRouter.get('/', controller.listPublicPackages);
publicPackagesRouter.get('/:id', controller.getPublicPackage);

// =========================================================================
// Admin Moderation Router (Mounted at /admin)
// All endpoints require Authenticated ADMIN
// =========================================================================
export const adminCatalogRouter = Router();

adminCatalogRouter.use(authenticateRequest, requireAdmin);

adminCatalogRouter.get('/services', controller.listAdminServices);
adminCatalogRouter.patch('/services/:id/status', controller.moderateService);
adminCatalogRouter.get('/packages', controller.listAdminPackages);
adminCatalogRouter.patch('/packages/:id/status', controller.moderatePackage);
