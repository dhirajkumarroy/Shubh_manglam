import { Router } from 'express';
import { requestController } from './request.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';

const router = Router();

// Estimate suggestion
router.get('/estimates', authenticateRequest, requestController.getEstimates);

// Requirement actions
router.post('/', authenticateRequest, requestController.createRequest);
router.get('/customer/my-requests', authenticateRequest, requestController.listCustomerRequests);
router.get('/owner/my-requests', authenticateRequest, requestController.listOwnerRequests);
router.get('/owner/nearby', authenticateRequest, requestController.getNearbyRequests);

router.get('/:id', authenticateRequest, requestController.getRequestDetails);
router.post('/:id/accept', authenticateRequest, requestController.acceptRequest);
router.post('/:id/reject', authenticateRequest, requestController.rejectRequest);
router.post('/:id/complete', authenticateRequest, requestController.completeTrip);
router.post('/:id/cancel', authenticateRequest, requestController.cancelRequest);

export default router;
