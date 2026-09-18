import { BookingStatus, NotificationType } from '@prisma/client';
import { BookingRepository, CreateInquiryParams } from './booking.repository';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/utils/app-error';
import { prisma } from '../../config/database';

export class BookingService {
  private repository: BookingRepository;

  constructor() {
    this.repository = new BookingRepository();
  }

  private parseInquiryNote(note: string | null) {
    if (!note) return null;
    try {
      return JSON.parse(note);
    } catch {
      return { notes: note };
    }
  }

  async createInquiry(customerId: string, params: Omit<CreateInquiryParams, 'customerId'>) {
    if (!params.vendorId) {
      throw new BadRequestError('Vendor ID is required to send an inquiry.');
    }
    if (!params.occasion) {
      throw new BadRequestError('Occasion is required (e.g. Birthday, Wedding).');
    }
    if (!params.eventDate) {
      throw new BadRequestError('Event date is required.');
    }

    const inquiry = await this.repository.createInquiry({
      ...params,
      customerId,
    });

    // Notify the vendor
    try {
      const vendor = await prisma.vendor.findUnique({
        where: { id: params.vendorId },
        select: { userId: true, businessName: true },
      });
      if (vendor && vendor.userId) {
        await prisma.notification.create({
          data: {
            userId: vendor.userId,
            title: `New Inquiry for ${params.occasion}!`,
            message: `A customer sent an inquiry for ${params.occasion} on ${params.eventDate}. Check your leads to respond.`,
            type: NotificationType.REQUEST_CREATED,
            data: {
              bookingId: inquiry.id,
              bookingNumber: inquiry.bookingNumber,
              occasion: params.occasion,
              eventDate: params.eventDate,
            },
          },
        });
      }
    } catch (err) {
      console.error('Failed to create vendor notification:', err);
    }

    return {
      ...inquiry,
      inquiryDetails: this.parseInquiryNote(inquiry.customerNote),
    };
  }

  async getCustomerInquiries(customerId: string) {
    const list = await this.repository.getCustomerInquiries(customerId);
    return list.map((item) => ({
      ...item,
      inquiryDetails: this.parseInquiryNote(item.customerNote),
    }));
  }

  async getVendorInquiries(vendorId: string) {
    const list = await this.repository.getVendorInquiries(vendorId);
    return list.map((item) => ({
      ...item,
      inquiryDetails: this.parseInquiryNote(item.customerNote),
    }));
  }

  async respondToInquiry(
    vendorId: string,
    bookingId: string,
    action: 'ACCEPT' | 'REJECT',
    vendorNote?: string
  ) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Inquiry not found.');
    }

    if (booking.vendorId !== vendorId) {
      throw new ForbiddenError('You can only respond to inquiries sent to your business.');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError(`Cannot respond to inquiry with current status "${booking.status}".`);
    }

    const isAccept = action === 'ACCEPT';
    const newStatus = isAccept ? BookingStatus.CONFIRMED : BookingStatus.REJECTED;
    const now = new Date();

    const defaultNote = isAccept
      ? (vendorNote || 'Your inquiry has been accepted! We look forward to serving your celebration.')
      : (vendorNote || 'We are regretfully unavailable on this date.');

    const updated = await this.repository.updateStatus(bookingId, newStatus, {
      vendorNote: defaultNote,
      confirmedAt: isAccept ? now : undefined,
      cancelledAt: !isAccept ? now : undefined,
    });

    // Notify customer
    try {
      await prisma.notification.create({
        data: {
          userId: booking.customerId,
          title: isAccept
            ? `Inquiry Accepted by ${updated.vendor.businessName}!`
            : `Inquiry Declined by ${updated.vendor.businessName}`,
          message: isAccept
            ? `${updated.vendor.businessName} accepted your request for your celebration. Contact them to finalize details.`
            : `${updated.vendor.businessName} was unable to accept your request. Note: ${defaultNote}`,
          type: isAccept ? NotificationType.OWNER_ACCEPTED : NotificationType.OWNER_REJECTED,
          data: {
            bookingId: updated.id,
            bookingNumber: updated.bookingNumber,
            status: newStatus,
          },
        },
      });
    } catch (err) {
      console.error('Failed to notify customer of response:', err);
    }

    return {
      ...updated,
      inquiryDetails: this.parseInquiryNote(updated.customerNote),
    };
  }

  async cancelInquiry(customerId: string, bookingId: string) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Inquiry not found.');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenError('You can only cancel your own inquiries.');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError('Only pending inquiries can be cancelled.');
    }

    const updated = await this.repository.updateStatus(bookingId, BookingStatus.CANCELLED, {
      cancelledAt: new Date(),
      vendorNote: 'Cancelled by customer',
    });

    return {
      ...updated,
      inquiryDetails: this.parseInquiryNote(updated.customerNote),
    };
  }

  async getInquiryAnalytics() {
    return this.repository.getInquiryAnalytics();
  }

  async getBookingDetails(userId: string, role: string, bookingId: string) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    const isCustomer = booking.customerId === userId;
    const isVendor = booking.vendor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isCustomer && !isVendor && !isAdmin) {
      throw new ForbiddenError('You do not have permission to view this booking.');
    }

    return {
      ...booking,
      inquiryDetails: this.parseInquiryNote(booking.customerNote),
    };
  }

  async listBookings(userId: string, role: string, query: any) {
    if (role === 'CUSTOMER') {
      return this.repository.listBookings({
        ...query,
        customerId: userId,
      });
    }

    if (role === 'VENDOR') {
      const vendor = await prisma.vendor.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!vendor) {
        throw new ForbiddenError('Vendor profile not found for user.');
      }
      return this.repository.listBookings({
        ...query,
        vendorId: vendor.id,
      });
    }

    if (role === 'ADMIN') {
      return this.repository.listBookings(query);
    }

    throw new ForbiddenError('Unauthorized to view bookings.');
  }

  async updateBookingStatus(
    userId: string,
    role: string,
    bookingId: string,
    newStatus: BookingStatus,
    note?: string
  ) {
    const booking = await this.repository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    const isCustomer = booking.customerId === userId;
    const isVendor = booking.vendor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isCustomer && !isVendor && !isAdmin) {
      throw new ForbiddenError('You do not have permission to modify this booking.');
    }

    // Role-specific transition rules
    if (isCustomer && newStatus !== BookingStatus.CANCELLED) {
      throw new BadRequestError('Customers can only cancel a booking.');
    }

    if (isVendor && !([BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED] as BookingStatus[]).includes(newStatus)) {
      throw new BadRequestError(`Vendors cannot set status to ${newStatus}.`);
    }

    const now = new Date();
    const updated = await this.repository.updateStatus(bookingId, newStatus, {
      vendorNote: note || booking.vendorNote || undefined,
      confirmedAt: newStatus === BookingStatus.CONFIRMED ? now : undefined,
      cancelledAt: newStatus === BookingStatus.CANCELLED ? now : undefined,
    });

    // Notify the other party
    try {
      const targetUserId = isCustomer ? booking.vendor.userId : booking.customerId;
      if (targetUserId) {
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            title: `Booking #${booking.bookingNumber} Status Updated`,
            message: `Status changed to ${newStatus}.${note ? ` Note: ${note}` : ''}`,
            type: NotificationType.BOOKING_STATUS_CHANGED,
            data: {
              bookingId: booking.id,
              bookingNumber: booking.bookingNumber,
              newStatus,
            },
          },
        });
      }
    } catch (err) {
      console.error('Failed to dispatch status change notification:', err);
    }

    return updated;
  }
}

