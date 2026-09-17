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
}
