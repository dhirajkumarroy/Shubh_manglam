import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireVendor } from '../../middlewares/role.middleware';

const router = Router();
const controller = new VendorController();

// Protect all vendor routes with authentication and VENDOR role check
router.use(authenticateRequest, requireVendor);

// Profile
router.get('/profile', controller.getProfile);
router.patch('/profile', controller.updateProfile);

// Categories
router.put('/categories', controller.syncCategories);

// Documents
router.post('/documents', controller.addDocument);
router.delete('/documents/:documentId', controller.deleteDocument);

// Submit for review
router.post('/submit-for-review', controller.submitForReview);

export default router;
