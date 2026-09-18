import { QuoteStatus, NotificationType, VendorStatus } from '@prisma/client';
import { QuoteRepository } from './quote.repository';
import { prisma } from '../../config/database';
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/app-error';
import {
  QuoteRequestDto,
  CreateVendorQuoteDto,
  ReviseQuoteDto,
  RevisionRequestDto,
  QuoteQueryDto,
} from './quote.types';
import { VALID_QUOTE_TRANSITIONS } from './quote.constants';
import logger from '../../config/logger';

export class QuoteService {
  private quoteRepository: QuoteRepository;

  constructor() {
    this.quoteRepository = new QuoteRepository();
  }

  /**
   * Helper to safely dispatch notification without failing the main transaction if background worker/redis has an issue
   */
  private async sendNotification(
    userId: string,
    payload: { title: string; message: string; type: NotificationType; data?: any }
  ) {
    try {
      await prisma.notification.create({
        data: {
          userId,
          title: payload.title,
          message: payload.message,
          type: payload.type,
          data: payload.data || {},
        },
      });
    } catch (err) {
      logger.error('Failed to create notification in quote service:', err);
    }
  }

  /**
   * Customer initiates a Quote Request
   */
  async requestQuote(customerId: string, dto: QuoteRequestDto) {
    // 1. Verify Vendor exists and is approved
    const vendor = await prisma.vendor.findUnique({
      where: { id: dto.vendorId },
      select: { id: true, userId: true, businessName: true, status: true },
    });

    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }
    if (vendor.status !== VendorStatus.APPROVED) {
      throw new BadRequestError('Quotes can only be requested from approved vendors.');
    }
    if (vendor.userId === customerId) {
      throw new BadRequestError('You cannot request a quote from your own vendor profile.');
    }

    // 2. If eventId is provided, verify Customer owns the event
    if (dto.eventId) {
      const event = await prisma.event.findUnique({
        where: { id: dto.eventId },
        select: { id: true, customerId: true },
      });
      if (!event) {
        throw new NotFoundError('Specified event was not found.');
      }
      if (event.customerId !== customerId) {
        throw new ForbiddenError('You can only request quotes for your own events.');
      }
    }

    // 3. If specific service items were requested, verify they belong to this vendor and are active
    if (dto.items && dto.items.length > 0) {
      const serviceIds = dto.items.map((i: any) => i.serviceId).filter(Boolean) as string[];
      if (serviceIds.length > 0) {
        const services = await prisma.service.findMany({
          where: {
            id: { in: serviceIds },
            vendorId: dto.vendorId,
            isActive: true,
          },
          select: { id: true },
        });

        if (services.length !== serviceIds.length) {
          throw new BadRequestError(
            'One or more requested services do not belong to this vendor or are not active.'
          );
        }
      }
    }

    // 4. Create Quote Request record
    const quote = await this.quoteRepository.createQuoteRequest({
      customerId,
      vendorId: dto.vendorId,
      eventId: dto.eventId,
      customerNotes: dto.customerNotes,
      items: dto.items,
    });

    // 5. Notify the Vendor
    if (vendor.userId) {
      await this.sendNotification(vendor.userId, {
        title: 'New Quote Request Received!',
        message: `A customer requested a formal quote for your services. Quote #${quote.quoteNumber}`,
        type: NotificationType.QUOTE_REQUESTED,
        data: {
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          customerId,
        },
      });
    }

    return quote;
  }

  /**
   * Vendor creates a Formal Quote (either responding to a request or directly to a customer)
   */
  async createQuote(vendorUserId: string, dto: CreateVendorQuoteDto) {
    // 1. Resolve Vendor
    const vendor = await prisma.vendor.findUnique({
      where: { userId: vendorUserId },
      select: { id: true, businessName: true, status: true },
    });

    if (!vendor) {
      throw new ForbiddenError('Only registered vendors can create formal quotes.');
    }
    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenError('Your vendor account must be approved before issuing quotes.');
    }

    // 2. If fulfilling an existing quote request
    let customerId = dto.customerId;
    let eventId = dto.eventId;

    if (dto.quoteId) {
      const existingQuote = await this.quoteRepository.findQuoteById(dto.quoteId);
      if (!existingQuote) {
        throw new NotFoundError('Existing quote request not found.');
      }
      if (existingQuote.vendorId !== vendor.id) {
        throw new ForbiddenError('You can only provide quotes for requests sent to your vendor account.');
      }
      if (existingQuote.status !== QuoteStatus.REQUESTED && existingQuote.status !== QuoteStatus.DRAFT) {
        throw new BadRequestError(
          `Cannot create quote on existing record with status ${existingQuote.status}.`
        );
      }
      customerId = existingQuote.customerId;
      eventId = existingQuote.eventId || undefined;
    }

    if (!customerId) {
      throw new BadRequestError('Customer ID is required.');
    }

    // Customer cannot be vendor itself
    if (customerId === vendorUserId) {
      throw new BadRequestError('You cannot issue quotes to your own user account.');
    }

    // 3. Verify services belong to this vendor
    const serviceIds = dto.items.map((i: any) => i.serviceId).filter(Boolean) as string[];
    if (serviceIds.length > 0) {
      const vendorServices = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          vendorId: vendor.id,
        },
        select: { id: true },
      });

      if (vendorServices.length !== serviceIds.length) {
        throw new BadRequestError('All quoted services must belong to your vendor catalog.');
      }
    }

    // 4. Calculate Authoritative Financial Totals on Backend
    let calculatedSubtotal = 0;
    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError(`Item quantity must be at least 1 for "${item.description}"`);
      }
      if (item.unitPrice < 0) {
        throw new BadRequestError(`Item unit price cannot be negative for "${item.description}"`);
      }
      calculatedSubtotal += item.quantity * item.unitPrice;
    }

    const discount = Math.max(0, dto.discount || 0);
    const tax = Math.max(0, dto.tax || 0);
    const total = Math.max(0, calculatedSubtotal - discount + tax);

    // 5. Validate Validity Date
    const validUntilDate = new Date(dto.validUntil);
    if (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date()) {
      throw new BadRequestError('validUntil must be a valid future date.');
    }

    // 6. Persist Quote and Version 1
    const quote = await this.quoteRepository.createVendorQuote({
      quoteId: dto.quoteId,
      customerId,
      vendorId: vendor.id,
      eventId,
      subtotal: calculatedSubtotal,
      discount,
      tax,
      total,
      validUntil: validUntilDate,
      notes: dto.notes,
      items: dto.items,
    });

    // 7. Notify Customer
    await this.sendNotification(customerId, {
      title: 'Formal Quote Received!',
      message: `${vendor.businessName} sent you a quote for ₹${total.toLocaleString('en-IN')}. Quote #${quote.quoteNumber}`,
      type: NotificationType.QUOTE_RECEIVED,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        vendorId: vendor.id,
        total,
      },
    });

    return quote;
  }

  /**
   * Customer requests a revision / negotiation
   */
  async requestRevision(customerId: string, quoteId: string, dto: RevisionRequestDto) {
    const quote = await this.quoteRepository.findQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found.');
    }

    if (quote.customerId !== customerId) {
      throw new ForbiddenError('You can only request revisions on your own quotes.');
    }

    // State machine check
    const allowedTransitions = VALID_QUOTE_TRANSITIONS[quote.status] || [];
    if (!allowedTransitions.includes(QuoteStatus.REVISION_REQUESTED)) {
      throw new BadRequestError(
        `Cannot request revision for a quote with status "${quote.status}". Only SENT or REVISED quotes can be negotiated.`
      );
    }

    // Expiration check
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      throw new BadRequestError('This quote has expired. Please request a new quote.');
    }

    const updated = await this.quoteRepository.requestRevision(quoteId, dto.revisionNotes);

    // Notify Vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: quote.vendorId },
      select: { userId: true, businessName: true },
    });

    if (vendor && vendor.userId) {
      await this.sendNotification(vendor.userId, {
        title: 'Quote Revision Requested',
        message: `Customer requested a revision on Quote #${quote.quoteNumber}: "${dto.revisionNotes}"`,
        type: NotificationType.QUOTE_REVISION_REQUESTED,
        data: {
          quoteId: quote.id,
          quoteNumber: quote.quoteNumber,
          revisionNotes: dto.revisionNotes,
        },
      });
    }

    return updated;
  }

  /**
   * Vendor creates a Revised Quote (v2, v3, etc.)
   */
  async reviseQuote(vendorUserId: string, quoteId: string, dto: ReviseQuoteDto) {
    const vendor = await prisma.vendor.findUnique({
      where: { userId: vendorUserId },
      select: { id: true, businessName: true },
    });

    if (!vendor) {
      throw new ForbiddenError('Vendor account not found.');
    }

    const quote = await this.quoteRepository.findQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found.');
    }

    if (quote.vendorId !== vendor.id) {
      throw new ForbiddenError('You can only revise quotes for your own vendor profile.');
    }

    // State machine check
    const allowedTransitions = VALID_QUOTE_TRANSITIONS[quote.status] || [];
    if (!allowedTransitions.includes(QuoteStatus.REVISED)) {
      throw new BadRequestError(
        `Cannot revise quote with current status "${quote.status}". Revisions are only allowed when status is REVISION_REQUESTED or SENT.`
      );
    }

    // Verify service ownership
    const serviceIds = dto.items.map((i) => i.serviceId).filter(Boolean) as string[];
    if (serviceIds.length > 0) {
      const vendorServices = await prisma.service.findMany({
        where: {
          id: { in: serviceIds },
          vendorId: vendor.id,
        },
        select: { id: true },
      });

      if (vendorServices.length !== serviceIds.length) {
        throw new BadRequestError('All revised services must belong to your vendor catalog.');
      }
    }

    // Authoritative backend financial calculation
    let calculatedSubtotal = 0;
    for (const item of dto.items) {
      if (item.quantity <= 0) {
        throw new BadRequestError(`Item quantity must be at least 1 for "${item.description}"`);
      }
      if (item.unitPrice < 0) {
        throw new BadRequestError(`Item unit price cannot be negative for "${item.description}"`);
      }
      calculatedSubtotal += item.quantity * item.unitPrice;
    }

    const discount = Math.max(0, dto.discount ?? Number(quote.discount));
    const tax = Math.max(0, dto.tax ?? Number(quote.tax));
    const total = Math.max(0, calculatedSubtotal - discount + tax);

    const validUntilDate = dto.validUntil ? new Date(dto.validUntil) : undefined;
    if (validUntilDate && (isNaN(validUntilDate.getTime()) || validUntilDate <= new Date())) {
      throw new BadRequestError('validUntil must be a valid future date.');
    }

    const newVersionNumber = (quote.currentVersion || 1) + 1;

    const revised = await this.quoteRepository.reviseQuote(quoteId, {
      newVersionNumber,
      subtotal: calculatedSubtotal,
      discount,
      tax,
      total,
      validUntil: validUntilDate,
      notes: dto.notes,
      items: dto.items,
    });

    // Notify Customer
    await this.sendNotification(quote.customerId, {
      title: 'Revised Quote Received!',
      message: `${vendor.businessName} has updated Quote #${quote.quoteNumber} (v${newVersionNumber}) to ₹${total.toLocaleString('en-IN')}.`,
      type: NotificationType.QUOTE_REVISED,
      data: {
        quoteId: quote.id,
        quoteNumber: quote.quoteNumber,
        version: newVersionNumber,
        total,
      },
    });

    return revised;
  }

  /**
   * Customer accepts quote -> Atomic Booking Creation with Snapshotting
   */
  async acceptQuote(customerId: string, quoteId: string) {
    const quote = await this.quoteRepository.findQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found.');
    }

    if (quote.customerId !== customerId) {
      throw new ForbiddenError('You can only accept quotes addressed to you.');
    }

    // Concurrency defense: Already accepted
    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new ConflictError('This quote has already been accepted and booked.');
    }

    // State machine check
    const allowedTransitions = VALID_QUOTE_TRANSITIONS[quote.status] || [];
    if (!allowedTransitions.includes(QuoteStatus.ACCEPTED)) {
      throw new BadRequestError(
        `Cannot accept quote with status "${quote.status}". Only SENT or REVISED quotes can be accepted.`
      );
    }

    // Expiration check
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      throw new BadRequestError('This quote has expired and can no longer be accepted.');
    }

    // Ensure items exist
    if (!quote.items || quote.items.length === 0) {
      throw new BadRequestError('Cannot accept an empty quote with no items.');
    }

    // Prepare immutable snapshots
    const eventDate = quote.event?.eventDate ? new Date(quote.event.eventDate) : new Date();
    const eventLocation = quote.event ? `${quote.event.addressLine1}, ${quote.event.city}` : 'Client Specified Location';

    const snapshotItems = quote.items.map((it) => ({
      serviceId: it.serviceId,
      packageId: null,
      name: it.service?.name || it.description || 'Quoted Service',
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      totalPrice: Number(it.totalPrice),
      notes: it.notes,
    }));

    // Interactive atomic transaction
    const result = await this.quoteRepository.acceptQuoteAndCreateBooking({
      quoteId: quote.id,
      customerId: quote.customerId,
      vendorId: quote.vendorId,
      eventId: quote.eventId,
      eventDate,
      eventLocation,
      subtotal: Number(quote.subtotal),
      discount: Number(quote.discount),
      tax: Number(quote.tax),
      total: Number(quote.total),
      customerNote: quote.customerNotes,
      vendorNote: quote.notes,
      items: snapshotItems,
    });

    // Notify Customer
    await this.sendNotification(quote.customerId, {
      title: 'Booking Confirmed!',
      message: `Your booking #${result.booking.bookingNumber} with ${quote.vendor.businessName} has been confirmed. Payment status is Pending.`,
      type: NotificationType.BOOKING_CREATED,
      data: {
        bookingId: result.booking.id,
        bookingNumber: result.booking.bookingNumber,
        quoteId: quote.id,
      },
    });

    // Notify Vendor
    if (quote.vendor.userId) {
      await this.sendNotification(quote.vendor.userId, {
        title: 'Quote Accepted & Booking Created!',
        message: `Customer ${quote.customer.name} accepted Quote #${quote.quoteNumber}. New Booking #${result.booking.bookingNumber} is confirmed.`,
        type: NotificationType.QUOTE_ACCEPTED,
        data: {
          quoteId: quote.id,
          bookingId: result.booking.id,
          bookingNumber: result.booking.bookingNumber,
        },
      });
    }

    return result;
  }

  /**
   * Reject quote (Customer or Vendor)
   */
  async rejectQuote(userId: string, quoteId: string, role: string, reason?: string) {
    const quote = await this.quoteRepository.findQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found.');
    }

    const isCustomer = quote.customerId === userId;
    const isVendor = quote.vendor.userId === userId;

    if (!isCustomer && !isVendor && role !== 'ADMIN') {
      throw new ForbiddenError('You are not authorized to reject this quote.');
    }

    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestError('Cannot reject an already accepted quote with an active booking.');
    }
    if (quote.status === QuoteStatus.REJECTED || quote.status === QuoteStatus.CANCELLED) {
      throw new BadRequestError(`Quote is already ${quote.status}.`);
    }

    const updated = await this.quoteRepository.updateQuoteStatus(quoteId, QuoteStatus.REJECTED);

    // Notify the other party
    if (isCustomer && quote.vendor.userId) {
      await this.sendNotification(quote.vendor.userId, {
        title: 'Quote Declined',
        message: `Customer declined Quote #${quote.quoteNumber}.${reason ? ` Reason: ${reason}` : ''}`,
        type: NotificationType.SYSTEM,
        data: { quoteId: quote.id, quoteNumber: quote.quoteNumber },
      });
    } else if (isVendor) {
      await this.sendNotification(quote.customerId, {
        title: 'Quote Cancelled by Vendor',
        message: `${quote.vendor.businessName} cancelled Quote #${quote.quoteNumber}.${reason ? ` Reason: ${reason}` : ''}`,
        type: NotificationType.SYSTEM,
        data: { quoteId: quote.id, quoteNumber: quote.quoteNumber },
      });
    }

    return updated;
  }

  /**
   * Get single quote details with authorization check
   */
  async getQuoteDetails(userId: string, role: string, quoteId: string) {
    const quote = await this.quoteRepository.findQuoteById(quoteId);
    if (!quote) {
      throw new NotFoundError('Quote not found.');
    }

    const isCustomer = quote.customerId === userId;
    const isVendor = quote.vendor.userId === userId;
    const isAdmin = role === 'ADMIN';

    if (!isCustomer && !isVendor && !isAdmin) {
      throw new ForbiddenError('You do not have permission to view this quote.');
    }

    return quote;
  }

  /**
   * List quotes scoped by role
   */
  async listQuotes(userId: string, role: string, query: QuoteQueryDto) {
    if (role === 'CUSTOMER') {
      return this.quoteRepository.listQuotes({
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
        throw new ForbiddenError('Vendor account not found for current user.');
      }
      return this.quoteRepository.listQuotes({
        ...query,
        vendorId: vendor.id,
      });
    }

    if (role === 'ADMIN') {
      return this.quoteRepository.listQuotes(query);
    }

    throw new ForbiddenError('Unauthorized to list quotes.');
  }
}
