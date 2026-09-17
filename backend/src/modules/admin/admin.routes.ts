import { Router } from 'express';
import { AdminController } from './admin.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';

const router = Router();
const controller = new AdminController();

// Protect all admin endpoints with authentication and admin role enforcement
router.use(authenticateRequest, requireAdmin);

// =========================================================================
// Dashboard & User Governance
// =========================================================================
router.get('/dashboard', controller.getDashboardStats);
router.get('/users', controller.listUsers);
router.get('/users/:id', controller.getUserDetails);
router.patch('/users/:id/block', controller.blockUser);
router.patch('/users/:id/unblock', controller.unblockUser);

// =========================================================================
// Vendor Governance
// =========================================================================
router.get('/vendors', controller.listVendors);
router.get('/vendors/:vendorId', controller.getVendorDetails);
router.post('/vendors/:vendorId/approve', controller.approveVendor);
router.post('/vendors/:vendorId/reject', controller.rejectVendor);
router.post('/vendors/:vendorId/under-review', controller.moveToUnderReview);
router.post('/vendors/:vendorId/suspend', controller.suspendVendor);
router.post('/vendors/:vendorId/reactivate', controller.reactivateVendor);

// Vendor Document Inspection
router.patch('/vendors/:vendorId/documents/:documentId', controller.reviewDocument);

// =========================================================================
// Category Management
// =========================================================================
router.get('/categories', controller.listCategories);
router.post('/categories', controller.createCategory);
router.patch('/categories/:id', controller.updateCategory);
router.delete('/categories/:id', controller.deleteCategory);

export default router;
