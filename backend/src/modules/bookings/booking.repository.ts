import { BookingStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';

export interface CreateInquiryParams {
  customerId: string;
  vendorId: string;
  serviceId?: string;
  occasion: string;
  eventDate: string;
  guestCount?: number;
  location?: string;
  notes?: string;
  estimatedBudget?: number;
}

export class BookingRepository {
  async createInquiry(params: CreateInquiryParams) {
    const bookingNumber = `SM-INQ-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    let serviceName = 'Custom Event Consultation';
    let servicePrice = 0;

    if (params.serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: params.serviceId },
      });
      if (service) {
        serviceName = service.name;
        servicePrice = Number(service.basePrice) || 0;
      }
    }

    const metadata = {
      occasion: params.occasion,
      eventDate: params.eventDate,
      guestCount: params.guestCount || 1,
      location: params.location || 'Local Area',
      notes: params.notes || '',
      serviceName,
    };

    const structuredNote = JSON.stringify(metadata);

    return prisma.booking.create({
      data: {
        bookingNumber,
        customerId: params.customerId,
        vendorId: params.vendorId,
        status: BookingStatus.PENDING,
        subtotal: new Prisma.Decimal(servicePrice),
        discount: new Prisma.Decimal(0),
        tax: new Prisma.Decimal(0),
        platformFee: new Prisma.Decimal(0),
        total: new Prisma.Decimal(params.estimatedBudget || servicePrice || 0),
        customerNote: structuredNote,
        items: params.serviceId
          ? {
              create: [
                {
                  serviceId: params.serviceId,
                  name: serviceName,
                  quantity: 1,
                  unitPrice: new Prisma.Decimal(servicePrice),
                  totalPrice: new Prisma.Decimal(servicePrice),
                  notes: `Occasion: ${params.occasion}`,
                },
              ],
            }
          : undefined,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            city: true,
            logo: true,
          },
        },
        items: true,
      },
    });
  }

  async getCustomerInquiries(customerId: string) {
    return prisma.booking.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            phone: true,
            email: true,
            city: true,
            logo: true,
            categories: {
              include: {
                category: {
                  select: { name: true },
                },
              },
            },
          },
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });
  }

  async getVendorInquiries(vendorId: string) {
    return prisma.booking.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            avatar: true,
          },
        },
        items: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                basePrice: true,
              },
            },
          },
        },
      },
    });
  }

  async findById(bookingId: string) {
    return prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendor: true,
        customer: true,
        items: true,
      },
    });
  }

  async updateStatus(
    bookingId: string,
    status: BookingStatus,
    data: { vendorNote?: string; confirmedAt?: Date; cancelledAt?: Date }
  ) {
    return prisma.booking.update({
      where: { id: bookingId },
      data: {
        status,
        vendorNote: data.vendorNote,
        confirmedAt: data.confirmedAt,
        cancelledAt: data.cancelledAt,
      },
      include: {
        vendor: true,
        customer: true,
        items: true,
      },
    });
  }

  async getInquiryAnalytics() {
    const [totalInquiries, acceptedCount, rejectedCount, pendingCount, allVendors] =
      await prisma.$transaction([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: BookingStatus.CONFIRMED } }),
        prisma.booking.count({ where: { status: BookingStatus.REJECTED } }),
        prisma.booking.count({ where: { status: BookingStatus.PENDING } }),
        prisma.vendor.findMany({
          where: { status: 'APPROVED' },
          select: {
            id: true,
            businessName: true,
            phone: true,
            city: true,
            categories: {
              include: {
                category: {
                  select: { name: true },
                },
              },
            },
            bookings: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        }),
      ]);

    const globalAcceptanceRate =
      totalInquiries > 0 ? Math.round((acceptedCount / totalInquiries) * 100) : 0;

    const providerStats = allVendors.map((vendor) => {
      const vendorBookings = vendor.bookings;
      const total = vendorBookings.length;
      const accepted = vendorBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
      const rejected = vendorBookings.filter((b) => b.status === BookingStatus.REJECTED).length;
      const pending = vendorBookings.filter((b) => b.status === BookingStatus.PENDING).length;
      const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;

      return {
        vendorId: vendor.id,
        businessName: vendor.businessName,
        phone: vendor.phone,
        city: vendor.city,
        categories: vendor.categories.map((c) => c.category.name),
        totalRequests: total,
        acceptedCount: accepted,
        rejectedCount: rejected,
        pendingCount: pending,
        acceptanceRate: rate,
      };
    });

    const recentInquiries = await prisma.booking.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { name: true, phone: true, email: true },
        },
        vendor: {
          select: { businessName: true, phone: true, city: true },
        },
        items: true,
      },
    });

    return {
      summary: {
        totalInquiries,
        acceptedCount,
        rejectedCount,
        pendingCount,
        acceptanceRate: globalAcceptanceRate,
      },
      providers: providerStats,
      recentInquiries,
    };
  }
}
