import { prisma } from '../../config/database';
import { BookingStatus } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/utils/app-error';
import { NotificationService } from '../notifications/notification.service';
import logger from '../../config/logger';

export interface CreateReviewDto {
  bookingId: string;
  rating: number; // 1 to 5
  comment?: string;
}

export class ReviewService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Retrieves public reviews for a partner, including star rating breakdown distribution.
   */
  async getVendorReviews(vendorIdOrSlug: string, page: number = 1, limit: number = 20) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { id: vendorIdOrSlug },
          { slug: vendorIdOrSlug },
          { partnerAccountId: vendorIdOrSlug },
        ],
      },
      select: {
        id: true,
        businessName: true,
        ratingAverage: true,
        ratingCount: true,
      },
    });

    if (!vendor) {
      throw new NotFoundError('Partner not found.');
    }

    const skip = (page - 1) * limit;

    const [reviews, totalCount, allRatings] = await Promise.all([
      prisma.review.findMany({
        where: {
          vendorId: vendor.id,
          isPublished: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      }),
      prisma.review.count({
        where: {
          vendorId: vendor.id,
          isPublished: true,
        },
      }),
      prisma.review.groupBy({
        by: ['rating'],
        where: {
          vendorId: vendor.id,
          isPublished: true,
        },
        _count: {
          rating: true,
        },
      }),
    ]);

    // Format star rating distribution (5 to 1)
    const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allRatings.forEach((r) => {
      distribution[r.rating] = r._count.rating;
    });

    return {
      partnerId: vendor.id,
      businessName: vendor.businessName,
      ratingAverage: Number(vendor.ratingAverage),
      ratingCount: totalCount,
      distribution,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: {
          id: r.customer.id,
          name: r.customer.name,
          avatar: r.customer.avatar,
        },
      })),
    };
  }

  /**
   * Creates a review for a completed celebration booking.
   * Only the booking customer can submit a review.
   */
  async createReview(customerId: string, data: CreateReviewDto) {
    const { bookingId, rating, comment } = data;

    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestError('Rating must be an integer between 1 and 5 stars.');
    }

    // 1. Verify booking exists and belongs to customer
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        vendor: { select: { id: true, userId: true, businessName: true } },
        review: true,
      },
    });

    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    if (booking.customerId !== customerId) {
      throw new ForbiddenError('You can only review celebrations booked by your account.');
    }

    if (booking.status !== BookingStatus.COMPLETED && booking.status !== BookingStatus.PAID) {
      throw new BadRequestError('You can only review a booking that is completed.');
    }

    if (booking.review) {
      throw new BadRequestError('A review has already been submitted for this booking.');
    }

    // 2. Create review record
    const review = await prisma.review.create({
      data: {
        bookingId,
        customerId,
        vendorId: booking.vendorId,
        rating: Math.round(rating),
        comment: comment?.trim() || null,
        isPublished: true,
      },
      include: {
        customer: { select: { id: true, name: true, avatar: true } },
      },
    });

    // 3. Recalculate vendor average rating and count
    const aggregations = await prisma.review.aggregate({
      where: { vendorId: booking.vendorId, isPublished: true },
      _avg: { rating: true },
      _count: { id: true },
    });

    const newAvg = aggregations._avg.rating || rating;
    const newCount = aggregations._count.id;

    await prisma.vendor.update({
      where: { id: booking.vendorId },
      data: {
        ratingAverage: newAvg,
        ratingCount: newCount,
      },
    });

    // 4. Notify partner of new review
    await this.notificationService
      .createNotification(booking.vendor.userId, {
        title: 'New Review Received! 🌟',
        message: `${review.customer.name} rated your celebration services ${rating} stars: "${comment?.slice(0, 60) || ''}"`,
        type: 'SYSTEM',
      })
      .catch(() => {});

    logger.info(`ReviewService: Created review ${review.id} for vendor ${booking.vendorId} by user ${customerId}`);
    return review;
  }
}

export const reviewService = new ReviewService();
export default reviewService;
