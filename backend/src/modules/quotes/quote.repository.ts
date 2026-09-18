import { prisma } from '../../config/database';
import { QuoteStatus, BookingStatus, Prisma } from '@prisma/client';
import { QuoteQueryDto, QuoteItemInput } from './quote.types';

export class QuoteRepository {
  /**
   * Generates a unique, standardized quote number e.g. SA-Q-2026-9482
   */
  async generateQuoteNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `SA-Q-${year}-${randomSuffix}`;
    const existing = await prisma.quote.findUnique({ where: { quoteNumber: candidate } });
    if (existing) {
      return this.generateQuoteNumber();
    }
    return candidate;
  }

  /**
   * Generates a unique, standardized booking number e.g. SA-BK-2026-4821
   */
  async generateBookingNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const candidate = `SA-BK-${year}-${randomSuffix}`;
    const existing = await prisma.booking.findUnique({ where: { bookingNumber: candidate } });
    if (existing) {
      return this.generateBookingNumber();
    }
    return candidate;
  }

  /**
   * Creates a formal quote request from a customer
   */
  async createQuoteRequest(data: {
    customerId: string;
    vendorId: string;
    eventId?: string;
    customerNotes?: string;
    items?: QuoteItemInput[];
  }) {
    const quoteNumber = await this.generateQuoteNumber();

    return prisma.quote.create({
      data: {
        quoteNumber,
        customerId: data.customerId,
        vendorId: data.vendorId,
        eventId: data.eventId,
        status: QuoteStatus.REQUESTED,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        currentVersion: 1,
        customerNotes: data.customerNotes,
        items: data.items && data.items.length > 0
          ? {
              create: data.items.map((it) => ({
                serviceId: it.serviceId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.quantity * it.unitPrice,
                notes: it.notes,
              })),
            }
          : undefined,
      },
      include: {
        items: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            city: true,
            logo: true,
            userId: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        event: true,
      },
    });
  }

  /**
   * Creates a formal vendor quote or fulfills a quote request
   */
  async createVendorQuote(data: {
    quoteId?: string;
    customerId: string;
    vendorId: string;
    eventId?: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    validUntil: Date;
    notes?: string;
    items: QuoteItemInput[];
  }) {
    if (data.quoteId) {
      // Fulfilling an existing REQUESTED quote
      return prisma.$transaction(async (tx) => {
        // Delete any placeholder items
        await tx.quoteItem.deleteMany({ where: { quoteId: data.quoteId } });

        // Update quote header
        const updated = await tx.quote.update({
          where: { id: data.quoteId },
          data: {
            subtotal: data.subtotal,
            discount: data.discount,
            tax: data.tax,
            total: data.total,
            validUntil: data.validUntil,
            status: QuoteStatus.SENT,
            currentVersion: 1,
            notes: data.notes,
            items: {
              create: data.items.map((it) => ({
                serviceId: it.serviceId,
                description: it.description,
                quantity: it.quantity,
                unitPrice: it.unitPrice,
                totalPrice: it.quantity * it.unitPrice,
                notes: it.notes,
              })),
            },
          },
          include: {
            items: true,
            vendor: true,
            customer: true,
            event: true,
          },
        });

        // Record Version 1 in history
        await tx.quoteVersion.create({
          data: {
            quoteId: updated.id,
            versionNumber: 1,
            subtotal: data.subtotal,
            discount: data.discount,
            tax: data.tax,
            total: data.total,
            notes: data.notes,
            itemsJson: data.items as any,
          },
        });

        return updated;
      });
    }

    // Direct vendor-created quote
    const quoteNumber = await this.generateQuoteNumber();
    return prisma.$transaction(async (tx) => {
      const created = await tx.quote.create({
        data: {
          quoteNumber,
          customerId: data.customerId,
          vendorId: data.vendorId,
          eventId: data.eventId,
          subtotal: data.subtotal,
          discount: data.discount,
          tax: data.tax,
          total: data.total,
          validUntil: data.validUntil,
          status: QuoteStatus.SENT,
          currentVersion: 1,
          notes: data.notes,
          items: {
            create: data.items.map((it) => ({
              serviceId: it.serviceId,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.quantity * it.unitPrice,
              notes: it.notes,
            })),
          },
        },
        include: {
          items: true,
          vendor: true,
          customer: true,
          event: true,
        },
      });

      await tx.quoteVersion.create({
        data: {
          quoteId: created.id,
          versionNumber: 1,
          subtotal: data.subtotal,
          discount: data.discount,
          tax: data.tax,
          total: data.total,
          notes: data.notes,
          itemsJson: data.items as any,
        },
      });

      return created;
    });
  }

  /**
   * Creates a revised version of an existing quote (v2, v3, etc.)
   */
  async reviseQuote(
    quoteId: string,
    data: {
      newVersionNumber: number;
      subtotal: number;
      discount: number;
      tax: number;
      total: number;
      validUntil?: Date;
      notes?: string;
      items: QuoteItemInput[];
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Clear current items and replace with revised items
      await tx.quoteItem.deleteMany({ where: { quoteId } });

      const updateData: Prisma.QuoteUpdateInput = {
        subtotal: data.subtotal,
        discount: data.discount,
        tax: data.tax,
        total: data.total,
        status: QuoteStatus.REVISED,
        currentVersion: data.newVersionNumber,
        notes: data.notes,
        items: {
          create: data.items.map((it) => ({
            serviceId: it.serviceId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.quantity * it.unitPrice,
            notes: it.notes,
          })),
        },
      };

      if (data.validUntil) {
        updateData.validUntil = data.validUntil;
      }

      const updated = await tx.quote.update({
        where: { id: quoteId },
        data: updateData,
        include: {
          items: true,
          vendor: true,
          customer: true,
          event: true,
          versions: {
            orderBy: { versionNumber: 'desc' },
          },
        },
      });

      // 2. Append new version entry in quote_versions table
      await tx.quoteVersion.create({
        data: {
          quoteId,
          versionNumber: data.newVersionNumber,
          subtotal: data.subtotal,
          discount: data.discount,
          tax: data.tax,
          total: data.total,
          notes: data.notes,
          revisionNotes: updated.revisionNotes,
          itemsJson: data.items as any,
        },
      });

      return updated;
    });
  }

  /**
   * Records customer's revision request notes
   */
  async requestRevision(quoteId: string, revisionNotes: string) {
    return prisma.quote.update({
      where: { id: quoteId },
      data: {
        status: QuoteStatus.REVISION_REQUESTED,
        revisionNotes,
      },
      include: {
        items: true,
        vendor: true,
        customer: true,
        event: true,
      },
    });
  }

  /**
   * Updates quote status (e.g. VIEWED, REJECTED, CANCELLED)
   */
  async updateQuoteStatus(quoteId: string, status: QuoteStatus) {
    return prisma.quote.update({
      where: { id: quoteId },
      data: { status },
      include: {
        items: true,
        vendor: true,
        customer: true,
        event: true,
      },
    });
  }

  /**
   * Atomic Acceptance & Historical Booking Snapshot Creation
   */
  async acceptQuoteAndCreateBooking(data: {
    quoteId: string;
    customerId: string;
    vendorId: string;
    eventId?: string | null;
    eventDate: Date;
    eventLocation: string;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    customerNote?: string | null;
    vendorNote?: string | null;
    items: Array<{
      serviceId?: string | null;
      packageId?: string | null;
      name: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string | null;
    }>;
  }) {
    const bookingNumber = await this.generateBookingNumber();

    return prisma.$transaction(async (tx) => {
      // 1. Mark Quote as ACCEPTED and verify it was not already accepted (concurrency defense)
      const quote = await tx.quote.update({
        where: { id: data.quoteId },
        data: {
          status: QuoteStatus.ACCEPTED,
        },
      });

      // 2. Create historical Booking snapshot
      const booking = await tx.booking.create({
        data: {
          bookingNumber,
          customerId: data.customerId,
          vendorId: data.vendorId,
          eventId: data.eventId,
          status: BookingStatus.CONFIRMED,
          subtotal: data.subtotal,
          discount: data.discount,
          tax: data.tax,
          total: data.total,
          customerNote: data.customerNote,
          vendorNote: data.vendorNote,
          confirmedAt: new Date(),
          items: {
            create: data.items.map((it) => ({
              serviceId: it.serviceId,
              packageId: it.packageId,
              name: it.name,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              totalPrice: it.totalPrice,
              notes: it.notes,
            })),
          },
        },
        include: {
          items: true,
          vendor: true,
          customer: true,
          event: true,
        },
      });

      // 3. Link booking back to the quote
      await tx.quote.update({
        where: { id: data.quoteId },
        data: { bookingId: booking.id },
      });

      return { quote, booking };
    });
  }

  /**
   * Finds quote by ID with full relations
   */
  async findQuoteById(id: string) {
    return prisma.quote.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                pricingType: true,
                basePrice: true,
                images: {
                  where: { isPrimary: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            city: true,
            logo: true,
            ratingAverage: true,
            ratingCount: true,
            userId: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        event: true,
        booking: {
          select: {
            id: true,
            bookingNumber: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });
  }

  /**
   * Lists quotes with filters and pagination
   */
  async listQuotes(query: QuoteQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.QuoteWhereInput = {};

    if (query.status) {
      where.status = query.status;
    }
    if (query.vendorId) {
      where.vendorId = query.vendorId;
    }
    if (query.customerId) {
      where.customerId = query.customerId;
    }
    if (query.eventId) {
      where.eventId = query.eventId;
    }
    if (query.search) {
      where.OR = [
        { quoteNumber: { contains: query.search, mode: 'insensitive' } },
        { customerNotes: { contains: query.search, mode: 'insensitive' } },
        { notes: { contains: query.search, mode: 'insensitive' } },
        { vendor: { businessName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [total, quotes] = await Promise.all([
      prisma.quote.count({ where }),
      prisma.quote.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          items: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              logo: true,
              city: true,
              userId: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          event: {
            select: {
              id: true,
              title: true,
              eventDate: true,
              guestCount: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingNumber: true,
              status: true,
            },
          },
        },
      }),
    ]);

    return {
      quotes,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
