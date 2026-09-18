import { Router } from 'express';
import { QuoteController } from './quote.controller';
import {
  authenticateRequest,
  requireCustomer,
  requireVendor,
} from '../../middlewares/auth.middleware';

const router = Router();
const controller = new QuoteController();

// 1. Customer quote request
router.post('/request', authenticateRequest, requireCustomer, controller.requestQuote);

// 2. Vendor creates formal quote
router.post('/', authenticateRequest, requireVendor, controller.createQuote);

// 3. List quotes (scoped by role inside service)
router.get('/', authenticateRequest, controller.listQuotes);

// 4. Quote details
router.get('/:id', authenticateRequest, controller.getQuoteById);

// 5. Customer requests revision
router.post('/:id/revision-request', authenticateRequest, requireCustomer, controller.requestRevision);

// 6. Vendor issues revised quote
router.post('/:id/revise', authenticateRequest, requireVendor, controller.reviseQuote);

// 7. Customer accepts quote -> creates atomic booking snapshot
router.post('/:id/accept', authenticateRequest, requireCustomer, controller.acceptQuote);

// 8. Reject quote (customer or vendor)
router.post('/:id/reject', authenticateRequest, controller.rejectQuote);

export default router;
