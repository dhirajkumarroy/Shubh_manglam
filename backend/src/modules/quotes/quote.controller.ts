import { Response, NextFunction } from 'express';
import { QuoteService } from './quote.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { UnauthorizedError } from '../../common/utils/app-error';
import {
  requestQuoteSchema,
  createQuoteSchema,
  requestRevisionSchema,
  reviseQuoteSchema,
  quoteQuerySchema,
} from './quote.validation';

export class QuoteController {
  private quoteService: QuoteService;

  constructor() {
    this.quoteService = new QuoteService();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError('User authentication required.');
    }
    return userId;
  }

  private getUserRole(req: AuthenticatedRequest): string {
    return req.user?.role || 'CUSTOMER';
  }

  /**
   * Customer initiates a quote request
   * POST /api/v1/quotes/request
   */
  requestQuote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const validated = requestQuoteSchema.parse(req.body);

      const items = validated.requestedServiceIds?.map((sId) => ({
        serviceId: sId,
        description: 'Requested Service Item',
        quantity: 1,
        unitPrice: 0,
      }));

      const quote = await this.quoteService.requestQuote(customerId, {
        vendorId: validated.vendorId,
        eventId: validated.eventId,
        customerNotes: validated.customerNotes,
        items,
      });

      res.status(201).json(ResponseDto.success('Quote request submitted successfully.', quote));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Vendor creates a formal quote
   * POST /api/v1/quotes
   */
  createQuote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorUserId = this.getUserId(req);
      const validated = createQuoteSchema.parse(req.body);

      const quote = await this.quoteService.createQuote(vendorUserId, {
        quoteId: validated.quoteRequestId,
        customerId: validated.customerId,
        eventId: validated.eventId,
        validUntil: validated.validUntil,
        discount: validated.discount,
        tax: validated.tax,
        notes: validated.notes,
        items: validated.items,
      });

      res.status(201).json(ResponseDto.success('Formal quote created and sent to customer.', quote));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Customer requests a revision on a received quote
   * POST /api/v1/quotes/:id/revision-request
   */
  requestRevision = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const quoteId = req.params.id;
      const validated = requestRevisionSchema.parse(req.body);

      const updated = await this.quoteService.requestRevision(customerId, quoteId, validated);

      res.status(200).json(ResponseDto.success('Revision request sent to vendor.', updated));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Vendor issues a revised version of a quote
   * POST /api/v1/quotes/:id/revise
   */
  reviseQuote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorUserId = this.getUserId(req);
      const quoteId = req.params.id;
      const validated = reviseQuoteSchema.parse(req.body);

      const revised = await this.quoteService.reviseQuote(vendorUserId, quoteId, validated);

      res.status(200).json(ResponseDto.success('Revised quote sent to customer.', revised));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Customer accepts a quote -> Atomically creates confirmed booking with snapshots
   * POST /api/v1/quotes/:id/accept
   */
  acceptQuote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const quoteId = req.params.id;

      const result = await this.quoteService.acceptQuote(customerId, quoteId);

      res
        .status(200)
        .json(
          ResponseDto.success(
            'Quote accepted successfully. Booking created with item snapshots.',
            result
          )
        );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reject quote (Customer or Vendor)
   * POST /api/v1/quotes/:id/reject
   */
  rejectQuote = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = this.getUserRole(req);
      const quoteId = req.params.id;
      const reason = req.body.reason;

      const updated = await this.quoteService.rejectQuote(userId, quoteId, role, reason);

      res.status(200).json(ResponseDto.success('Quote rejected.', updated));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get quote details by ID
   * GET /api/v1/quotes/:id
   */
  getQuoteById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = this.getUserRole(req);
      const quoteId = req.params.id;

      const quote = await this.quoteService.getQuoteDetails(userId, role, quoteId);

      res.status(200).json(ResponseDto.success('Quote details retrieved successfully.', quote));
    } catch (error) {
      next(error);
    }
  };

  /**
   * List quotes (scoped by role)
   * GET /api/v1/quotes
   */
  listQuotes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = this.getUserRole(req);
      const query = quoteQuerySchema.parse(req.query);

      const result = await this.quoteService.listQuotes(userId, role, query);

      res.status(200).json(ResponseDto.success('Quotes retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };
}
