import { Response, NextFunction } from 'express';
import { PaymentService } from './payment.service';
import {
  createOrderSchema,
  verifyPaymentSchema,
  uuidParamSchema,
  paymentQuerySchema,
} from './payment.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  /**
   * Generates a new Razorpay order for a pending booking.
   * POST /api/v1/payments/create-order
   */
  createOrder = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      // Validate inputs
      const validatedBody = createOrderSchema.parse(req.body);
      const targetId = (validatedBody.requestId || validatedBody.bookingId)!;

      const result = await this.paymentService.createOrder(userId, targetId);

      res.status(201).json(
        ResponseDto.success('Razorpay order created successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirms reservation with Cash on Delivery mode.
   * POST /api/v1/payments/cod
   */
  payWithCOD = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      // Validate inputs
      const validatedBody = createOrderSchema.parse(req.body);
      const targetId = (validatedBody.requestId || validatedBody.bookingId)!;

      const result = await this.paymentService.payWithCOD(userId, targetId);

      res.status(200).json(
        ResponseDto.success('Booking confirmed under Cash on Delivery mode.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cryptographically validates payment signature from client checkout callback.
   * POST /api/v1/payments/verify
   */
  verifyPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      // Validate inputs
      const validatedBody = verifyPaymentSchema.parse(req.body);

      const result = await this.paymentService.verifyPayment(userId, validatedBody);

      res.status(200).json(
        ResponseDto.success('Payment verified and booking confirmed successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Endpoint for receiving Razorpay webhooks.
   * POST /api/v1/payments/webhook
   */
  processWebhook = async (
    req: any, // Use any to allow accessing req.rawBody without compiler errors
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new BadRequestError('Raw body payload is required for webhook signature verification.');
      }

      const result = await this.paymentService.processWebhook(req.headers, rawBody);

      res.status(200).json(
        ResponseDto.success('Webhook event processed successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve single payment details by database UUID.
   * GET /api/v1/payments/:id
   */
  getPaymentDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = uuidParamSchema.parse(req.params);

      const payment = await this.paymentService.getPaymentDetails(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Payment details retrieved successfully.', payment)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve list of payments for the authenticated customer.
   * GET /api/v1/payments/my
   */
  listMyPayments = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const query = paymentQuerySchema.parse(req.query);

      const result = await this.paymentService.listMyPayments(userId, query.page, query.limit);

      res.status(200).json(
        ResponseDto.success('Customer payment history retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Manually trigger a refund for a payment.
   * POST /api/v1/payments/:id/refund
   */
  refundPayment = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = uuidParamSchema.parse(req.params);

      const payment = await this.paymentService.refundPayment(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Payment refund processed successfully.', payment)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default PaymentController;
