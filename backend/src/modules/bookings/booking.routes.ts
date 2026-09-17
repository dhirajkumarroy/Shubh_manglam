import { Router } from 'express';
import { BookingController } from './booking.controller';
import {
  authenticateRequest,
  requireCustomer,
  requireVendor,
  requireAdmin,
} from '../../middlewares/auth.middleware';

const router = Router();
const controller = new BookingController();

// 1. Customer Endpoints
router.post('/inquiries', authenticateRequest, requireCustomer, controller.createInquiry);
router.get('/customer', authenticateRequest, requireCustomer, controller.getCustomerInquiries);
router.patch('/:id/cancel', authenticateRequest, requireCustomer, controller.cancelInquiry);

// 2. Provider Endpoints
router.get('/vendor', authenticateRequest, requireVendor, controller.getVendorInquiries);
router.patch('/:id/respond', authenticateRequest, requireVendor, controller.respondToInquiry);

// 3. Admin Analytics Endpoints
router.get('/admin/analytics', authenticateRequest, requireAdmin, controller.getAdminInquiryAnalytics);

export default router;
