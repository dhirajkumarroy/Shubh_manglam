import { Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';
import { prisma } from '../../config/database';

export class BookingController {
  private service: BookingService;

  constructor() {
    this.service = new BookingService();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError('User authentication required.');
    }
    return userId;
  }

  private async getVendorId(req: AuthenticatedRequest): Promise<string> {
    if ((req as any).vendor?.id) {
      return (req as any).vendor.id;
    }
    const userId = this.getUserId(req);
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!vendor) {
      throw new UnauthorizedError('Service provider profile required.');
    }
    return vendor.id;
  }

  createInquiry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const { vendorId, serviceId, occasion, eventDate, guestCount, location, notes, estimatedBudget } = req.body;

      const inquiry = await this.service.createInquiry(customerId, {
        vendorId,
        serviceId,
        occasion,
        eventDate,
        guestCount: guestCount ? Number(guestCount) : undefined,
        location,
        notes,
        estimatedBudget: estimatedBudget ? Number(estimatedBudget) : undefined,
      });

      res.status(201).json(ResponseDto.success('Inquiry submitted successfully to provider.', inquiry));
    } catch (error) {
      next(error);
    }
  };

  getCustomerInquiries = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const list = await this.service.getCustomerInquiries(customerId);
      res.status(200).json(ResponseDto.success('Customer inquiries retrieved.', list));
    } catch (error) {
      next(error);
    }
  };

  getVendorInquiries = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = await this.getVendorId(req);
      const list = await this.service.getVendorInquiries(vendorId);
      res.status(200).json(ResponseDto.success('Provider inquiries retrieved.', list));
    } catch (error) {
      next(error);
    }
  };

  respondToInquiry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendorId = await this.getVendorId(req);
      const { id } = req.params;
      const { action, vendorNote } = req.body;

      if (!action || !['ACCEPT', 'REJECT'].includes(action)) {
        throw new BadRequestError('Valid action is required ("ACCEPT" or "REJECT").');
      }

      const updated = await this.service.respondToInquiry(vendorId, id, action, vendorNote);
      res.status(200).json(ResponseDto.success(`Inquiry ${action === 'ACCEPT' ? 'accepted' : 'rejected'} successfully.`, updated));
    } catch (error) {
      next(error);
    }
  };

  cancelInquiry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = this.getUserId(req);
      const { id } = req.params;
      const updated = await this.service.cancelInquiry(customerId, id);
      res.status(200).json(ResponseDto.success('Inquiry cancelled successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  getAdminInquiryAnalytics = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const analytics = await this.service.getInquiryAnalytics();
      res.status(200).json(ResponseDto.success('Inquiry analytics retrieved successfully.', analytics));
    } catch (error) {
      next(error);
    }
  };

  getBookingDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = req.user?.role || 'CUSTOMER';
      const { id } = req.params;

      const booking = await this.service.getBookingDetails(userId, role, id);
      res.status(200).json(ResponseDto.success('Booking retrieved successfully.', booking));
    } catch (error) {
      next(error);
    }
  };

  listBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = req.user?.role || 'CUSTOMER';
      const { page, limit, status, search, vendorId, customerId, eventId } = req.query;

      const result = await this.service.listBookings(userId, role, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
        status: status as any,
        search: search as string,
        vendorId: vendorId as string,
        customerId: customerId as string,
        eventId: eventId as string,
      });

      res.status(200).json(ResponseDto.success('Bookings retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  updateBookingStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const role = req.user?.role || 'CUSTOMER';
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        throw new BadRequestError('Status is required.');
      }

      const updated = await this.service.updateBookingStatus(userId, role, id, status, note);
      res.status(200).json(ResponseDto.success('Booking status updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };
}

