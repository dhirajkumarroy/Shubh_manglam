import { Router } from 'express';
import { reviewController } from './review.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';

const router = Router();

// Public route to view vendor reviews
router.get('/vendor/:vendorId', reviewController.getVendorReviews);

// Protected route for customers to leave reviews on completed bookings
router.post('/', authenticateRequest, reviewController.createReview);

export default router;
