import { Router } from 'express';
import { MarketplaceController } from './marketplace.controller';

const router = Router();
const controller = new MarketplaceController();

// Public marketplace discovery endpoints
router.get('/vendors', controller.listVendors);
router.get('/vendors/account/:vendorId', controller.getVendor);
router.get('/vendors/:vendorId', controller.getVendor);
router.get('/categories', controller.listCategories);
router.get('/services', controller.listServices);
router.get('/services/:serviceId', controller.getService);
router.get('/packages', controller.listPackages);
router.get('/packages/:packageId', controller.getPackage);

export default router;
