import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireVendor } from '../../middlewares/role.middleware';

const router = Router();
const controller = new VendorController();

// Public endpoints
router.get('/document-requirements', controller.getDocumentRequirements);
router.get('/gallery/:idOrSlug', controller.getPublicGallery);

// Protect vendor operational routes with authentication and VENDOR role check
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

// Gallery Management (Protected)
router.get('/gallery', controller.getOwnGallery);
router.post('/gallery', controller.addGalleryMedia);
router.patch('/gallery/:id', controller.updateGalleryMedia);
router.delete('/gallery/:id', controller.deleteGalleryMedia);
router.put('/gallery/reorder', controller.reorderGallery);

export default router;
