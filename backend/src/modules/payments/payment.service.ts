import crypto from 'crypto';
import { Payment, PaymentStatus, RequestStatus } from '@prisma/client';
import { PaymentRepository } from './payment.repository';
import { requestRepository } from '../requests/request.repository';
import { NotificationService } from '../notifications/notification.service';
import razorpay from '../../config/razorpay';
import { env } from '../../config/env';
import logger from '../../config/logger';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/app-error';
import { VerifyPaymentDto } from './payment.types';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private notificationService: NotificationService;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Generates a new Razorpay order for a pending/assigned transport request and stores a pending Payment.
   */
  async createOrder(customerId: string, requestId: string): Promise<{ payment: Payment; razorpayOrder: any }> {
    logger.info(`PaymentService: Creating payment order for transport request ${requestId} requested by customer ${customerId}`);

    // 1. Fetch and validate transport request
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    // 2. Access check
    if (request.customerId !== customerId) {
      throw new ForbiddenError('You are not authorized to make a payment for this transport request.');
    }

    // 3. Status checks
    if (request.status !== RequestStatus.OWNER_ASSIGNED) {
      throw new BadRequestError('Payments can only be created for requests that have an assigned owner.');
    }

    // 4. Duplicate successful payment prevention
    const existingSuccessPayment = await this.paymentRepository.findSuccessPaymentByRequestId(requestId);
    if (existingSuccessPayment) {
      throw new ConflictError('This transport request has already been paid for successfully.');
    }

    // 5. Razorpay expects amount in paise (minor currency unit)
    const amountInPaise = Math.round(request.estimatedFare * 100);

    // 6. Invoke Razorpay API
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: request.id,
        notes: {
          requestId: request.id,
          customerId: request.customerId,
        },
      });
    } catch (err: any) {
      logger.error('Razorpay order creation failed:', err);
      throw new BadRequestError(`Razorpay service error: ${err.message || err}`);
    }

    // 7. Persist payment tracker in PENDING status
    const payment = await this.paymentRepository.createPayment({
      requestId: request.id,
      userId: customerId,
      amount: request.estimatedFare,
      providerOrderId: razorpayOrder.id,
    });

    logger.info(`PaymentService: Order created successfully. Razorpay Order ID: ${razorpayOrder.id}`);

    return {
      payment,
      razorpayOrder,
    };
  }

  /**
   * Verifies signature of client payment callback, marks payment SUCCESS and confirms booking/request.
   */
  async verifyPayment(customerId: string, dto: VerifyPaymentDto): Promise<{ payment: Payment; request: any }> {
    logger.info(`PaymentService: Verifying signature for Razorpay Order ${dto.razorpayOrderId}`);

    // 1. Fetch payment record
    const payment = await this.paymentRepository.findByOrderId(dto.razorpayOrderId);
    if (!payment) {
      throw new NotFoundError('Payment record not found for the provided Order ID.');
    }

    // 2. Verify ownership
    if (payment.userId !== customerId) {
      throw new ForbiddenError('You are not authorized to verify this payment.');
    }

    // 3. Prevent duplicate updates if already successful
    if (payment.status === PaymentStatus.SUCCESS) {
      const request = payment.requestId ? await requestRepository.findById(payment.requestId) : null;
      return { payment, request };
    }

    // 4. Verify signature cryptographically
    const text = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      logger.warn(`PaymentService: Invalid signature for Order ${dto.razorpayOrderId}`);
      throw new BadRequestError('Invalid payment signature verification.');
    }

    // 5. Update Payment Status to SUCCESS
    const updatedPayment = await this.paymentRepository.updatePaymentStatusByOrderId(
      dto.razorpayOrderId,
      PaymentStatus.SUCCESS,
      {
        providerPaymentId: dto.razorpayPaymentId,
        providerSignature: dto.razorpaySignature,
        paidAt: new Date(),
      }
    );

    // 6. Update TransportRequest Status to ACCEPTED (which means ride confirmed & paid)
    const updatedRequest = payment.requestId ? await requestRepository.updateStatus(payment.requestId, RequestStatus.ACCEPTED) : null;

    logger.info(`PaymentService: Payment verified successfully for transport request ${payment.requestId}. Status: SUCCESS`);

    // 7. Dispatch notifications
    if (updatedRequest) {
      this.notificationService.createNotification(updatedRequest.customerId, {
        title: 'Ride Request Confirmed',
        message: 'Your transport request has been confirmed and paid.',
        type: 'PAYMENT_SUCCESSFUL',
      }).catch((err) => logger.error('Failed to trigger customer notification', err));
    }

    if (updatedRequest?.assignedOwnerId) {
      this.notificationService.createNotification(updatedRequest.assignedOwnerId, {
        title: 'Ride Confirmed (Paid)',
        message: 'The customer completed payment. The booking is now active and ready to start.',
        type: 'PAYMENT_SUCCESSFUL',
      }).catch((err) => logger.error('Failed to trigger owner PAYMENT_SUCCESSFUL notification', err));
    }

    return {
      payment: updatedPayment,
      request: updatedRequest,
    };
  }

  /**
   * Registers a payment as COD (Cash on Delivery) and confirms the booking/request.
   */
  async payWithCOD(customerId: string, requestId: string): Promise<{ payment: Payment; request: any }> {
    logger.info(`PaymentService: Processing COD payment for request ${requestId} requested by customer ${customerId}`);

    // 1. Fetch and validate request
    const request = await requestRepository.findById(requestId);
    if (!request) {
      throw new NotFoundError('Transport request not found.');
    }

    // 2. Access check
    if (request.customerId !== customerId) {
      throw new ForbiddenError('You are not authorized to select payment mode for this transport request.');
    }

    // 3. Status checks
    if (request.status !== RequestStatus.OWNER_ASSIGNED) {
      throw new BadRequestError('COD can only be selected for requests with an assigned owner.');
    }

    // 4. Duplicate successful payment prevention
    const existingSuccessPayment = await this.paymentRepository.findSuccessPaymentByRequestId(requestId);
    if (existingSuccessPayment) {
      throw new ConflictError('This transport request has already been paid for successfully.');
    }

    // 5. Create Payment record in PENDING status but with provider = "COD"
    const payment = await this.paymentRepository.createPayment({
      requestId: request.id,
      userId: customerId,
      amount: request.estimatedFare,
      providerOrderId: `cod_${Math.random().toString(36).substring(2, 12)}`,
    });

    // 6. Update payment status/provider info to signify COD
    const updatedPayment = await this.paymentRepository.updatePaymentStatusByOrderId(
      payment.providerOrderId!,
      PaymentStatus.PENDING,
      {
        providerPaymentId: `pay_cod_${Math.random().toString(36).substring(2, 12)}`,
      }
    );

    // Update provider string from default RAZORPAY to COD
    const prismaInstance = require('../../config/database').default;
    await prismaInstance.payment.update({
      where: { id: payment.id },
      data: { provider: 'COD' }
    });
    updatedPayment.provider = 'COD';

    // 7. Update TransportRequest Status to ACCEPTED (means trip is active and confirmed)
    const updatedRequest = payment.requestId ? await requestRepository.updateStatus(payment.requestId, RequestStatus.ACCEPTED) : null;

    logger.info(`PaymentService: COD Payment registered successfully for request ${payment.requestId}.`);

    // 8. Dispatch notifications
    if (updatedRequest) {
      this.notificationService.createNotification(updatedRequest.customerId, {
        title: 'Ride Request Confirmed (COD)',
        message: 'Your transport request has been confirmed under Cash on Delivery.',
        type: 'PAYMENT_SUCCESSFUL',
      }).catch((err) => logger.error('Failed to trigger customer COD notification', err));
    }

    if (updatedRequest.assignedOwnerId) {
      this.notificationService.createNotification(updatedRequest.assignedOwnerId, {
        title: 'Ride Confirmed (COD)',
        message: 'The customer selected Cash on Delivery. The booking is now active and ready to start.',
        type: 'PAYMENT_SUCCESSFUL',
      }).catch((err) => logger.error('Failed to trigger owner COD notification', err));
    }

    return {
      payment: updatedPayment,
      request: updatedRequest,
    };
  }

  /**
   * Processes verified Webhook callbacks from Razorpay.
   */
  async processWebhook(headers: any, rawBody: Buffer): Promise<{ processed: boolean }> {
    // 1. Webhook Signature Verification
    const signature = headers['x-razorpay-signature'];
    if (!signature) {
      throw new BadRequestError('Missing x-razorpay-signature header.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('PaymentService Webhook: Invalid webhook signature verification.');
      throw new BadRequestError('Invalid webhook signature verification.');
    }

    const eventData = JSON.parse(rawBody.toString('utf-8'));
    logger.info(`PaymentService Webhook: Received verified webhook event: ${eventData.event}`);

    const payload = eventData.payload;

    switch (eventData.event) {
      case 'order.paid': {
        const orderEntity = payload.order?.entity;
        if (!orderEntity) break;

        const orderId = orderEntity.id;
        const paymentEntity = payload.payment?.entity;
        const paymentId = paymentEntity?.id;

        const payment = await this.paymentRepository.findByOrderId(orderId);
        if (payment && payment.status === PaymentStatus.PENDING) {
          logger.info(`PaymentService Webhook: Processing order.paid for order ${orderId}`);
          
          await this.paymentRepository.updatePaymentStatusByOrderId(
            orderId,
            PaymentStatus.SUCCESS,
            {
              providerPaymentId: paymentId,
              paidAt: new Date(),
            }
          );

          const updatedRequest = payment.requestId ? await requestRepository.updateStatus(payment.requestId, RequestStatus.ACCEPTED) : null;
          if (updatedRequest) {
            this.notificationService.createNotification(updatedRequest.customerId, {
              title: 'Ride Request Confirmed',
              message: 'Your transport request has been confirmed.',
              type: 'PAYMENT_SUCCESSFUL',
            }).catch((err) => logger.error('Failed to trigger webhook PAYMENT_SUCCESSFUL notification', err));

            if (updatedRequest.assignedOwnerId) {
              this.notificationService.createNotification(updatedRequest.assignedOwnerId, {
                title: 'Ride Confirmed (Paid)',
                message: 'Payment completed via Webhook. Ready to start.',
                type: 'PAYMENT_SUCCESSFUL',
              }).catch((err) => logger.error('Failed to trigger owner webhook notification', err));
            }
          }
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        const payment = await this.paymentRepository.findByOrderId(orderId);
        if (payment && payment.status === PaymentStatus.PENDING) {
          logger.info(`PaymentService Webhook: Processing payment.failed for order ${orderId}`);
          await this.paymentRepository.updatePaymentStatusByOrderId(
            orderId,
            PaymentStatus.FAILED,
            {
              providerPaymentId: paymentId,
            }
          );
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) break;

        const paymentId = refundEntity.payment_id;
        logger.info(`PaymentService Webhook: Processing refund.processed for payment ID: ${paymentId}`);

        const prismaInstance = require('../../config/database').default;
        await prismaInstance.payment.updateMany({
          where: { providerPaymentId: paymentId, status: { not: PaymentStatus.REFUNDED } },
          data: {
            status: PaymentStatus.REFUNDED,
          },
        });
        break;
      }

      default:
        logger.info(`PaymentService Webhook: Unhandled webhook event type: ${eventData.event}`);
    }

    return { processed: true };
  }

  /**
   * Refunds an existing successful payment via Razorpay.
   */
  async refundPayment(paymentId: string, requesterId: string, userRole: string): Promise<Payment> {
    logger.info(`PaymentService: Initiating refund for payment UUID ${paymentId} requested by user ${requesterId}`);

    // 1. Fetch payment record
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    // 2. Check if already refunded
    if (payment.status === PaymentStatus.REFUNDED) {
      return payment;
    }

    // 3. Must be SUCCESS to be eligible for refund
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestError('Only successful payments can be refunded.');
    }

    // 4. Fetch request and authorize
    const request = payment.requestId ? await requestRepository.findById(payment.requestId) : null;
    if (!request) {
      throw new NotFoundError('Associated transport request not found.');
    }

    if (
      request.customerId !== requesterId &&
      request.assignedOwnerId !== requesterId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenError('You are not authorized to refund this payment.');
    }

    // 5. Build idempotency key to prevent double refunds
    const idempotencyKey = `refund_${request.id}_${payment.id}`;
    const amountInPaise = Math.round(Number(payment.amount) * 100);

    if (!payment.providerPaymentId) {
      throw new BadRequestError('Payment is missing a provider payment ID, cannot request refund.');
    }

    // 6. Invoke Razorpay API
    try {
      await (razorpay.payments.refund as any)(payment.providerPaymentId, {
        amount: amountInPaise,
        notes: {
          requestId: request.id,
          reason: 'Cancellation or Rejection refund',
        },
      }, {
        'x-idempotency-key': idempotencyKey,
      });
    } catch (err: any) {
      logger.error('Razorpay refund API call failed:', err);
      throw new BadRequestError(`Razorpay refund failed: ${err.message || err}`);
    }

    // 7. Update status to REFUNDED
    const updatedPayment = await this.paymentRepository.updatePaymentStatusById(
      payment.id,
      PaymentStatus.REFUNDED
    );

    logger.info(`PaymentService: Payment ${payment.id} successfully refunded on Razorpay.`);

    return updatedPayment;
  }

  /**
   * Retrieves single payment details with authorization.
   */
  async getPaymentDetails(paymentId: string, userId: string, userRole: string): Promise<Payment> {
    logger.info(`PaymentService: Retrieving payment details for ${paymentId} requested by user ${userId}`);

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    const request = payment.requestId ? await requestRepository.findById(payment.requestId) : null;
    if (
      payment.userId !== userId &&
      request?.assignedOwnerId !== userId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenError('You are not authorized to view this payment.');
    }

    return payment;
  }

  /**
   * Lists paginated payments for customer.
   */
  async listMyPayments(userId: string, page: number, limit: number): Promise<any> {
    const { total, payments } = await this.paymentRepository.listByUserId(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      payments,
    };
  }
}

export default PaymentService;
