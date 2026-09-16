import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';

const router = Router();
const controller = new PaymentController();

/**
 * @openapi
 * /payments/create-order:
 *   post:
 *     summary: Generate a new Razorpay order for booking payment
 *     description: Calculates amount from booking parameters, registers a pending payment tracker, and creates a Razorpay order entity.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *                 example: 8bfc352c-e1a8-4fbf-8b13-931edb2b18f2
 *     responses:
 *       201:
 *         description: Razorpay order generated successfully.
 *       400:
 *         description: Invalid booking state, parameter mismatch, or Razorpay API error.
 *       401:
 *         description: Unauthorized. Authentication token is missing, invalid, or expired.
 *       403:
 *         description: Forbidden. Authenticated user does not own the booking.
 *       404:
 *         description: Booking not found.
 *       409:
 *         description: Conflict. Booking is already paid.
 */
router.post('/create-order', authenticateRequest, controller.createOrder);
router.post('/cod', authenticateRequest, controller.payWithCOD);

/**
 * @openapi
 * /payments/verify:
 *   post:
 *     summary: Cryptographically verify payment signatures
 *     description: Validates client payment signatures from frontend Razorpay checkout callbacks and confirms bookings upon success.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpayOrderId
 *               - razorpayPaymentId
 *               - razorpaySignature
 *             properties:
 *               razorpayOrderId:
 *                 type: string
 *                 example: order_Okj8eKjA92kdke
 *               razorpayPaymentId:
 *                 type: string
 *                 example: pay_Okj8fJsk291ksd
 *               razorpaySignature:
 *                 type: string
 *                 example: 2e8a15998a449df5d30bc129841f3bbd1c3a6479b18349281a8bdfd7003c299b
 *     responses:
 *       200:
 *         description: Payment signature validated and booking confirmed.
 *       400:
 *         description: Invalid signature verification or parameter mismatch.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Payment record not found.
 */
router.post('/verify', authenticateRequest, controller.verifyPayment);

/**
 * @openapi
 * /payments/webhook:
 *   post:
 *     summary: Capture Razorpay Webhook notifications
 *     description: Verification endpoint for async Razorpay payment capture updates (e.g. order.paid, payment.failed, refund.processed).
 *     tags:
 *       - Payments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook received and processed successfully.
 *       400:
 *         description: Invalid signature header or payload validation error.
 */
router.post('/webhook', controller.processWebhook);

/**
 * @openapi
 * /payments/my:
 *   get:
 *     summary: Retrieve payment history for the authenticated customer
 *     description: Returns a paginated history list of payments initiated by the customer.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payments history list retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */
router.get('/my', authenticateRequest, controller.listMyPayments);

/**
 * @openapi
 * /payments/{id}:
 *   get:
 *     summary: Get payment status details
 *     description: Retrieve detailed metadata of a specific payment by its database UUID.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Payment not found.
 */
router.get('/:id', authenticateRequest, controller.getPaymentDetails);

/**
 * @openapi
 * /payments/{id}/refund:
 *   post:
 *     summary: Process manual refund for a payment
 *     description: Manually triggers a Razorpay payment refund (using an idempotency key) for a successful transaction.
 *     tags:
 *       - Payments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Refund processed successfully.
 *       400:
 *         description: Refund request failed on Razorpay or invalid payment status.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Payment not found.
 */
router.post('/:id/refund', authenticateRequest, controller.refundPayment);

export default router;
