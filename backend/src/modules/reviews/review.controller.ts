import { Request, Response, NextFunction } from 'express';
import { reviewService } from './review.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { BadRequestError } from '../../common/utils/app-error';

export class ReviewController {
  getVendorReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { vendorId } = req.params;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 20;

      const result = await reviewService.getVendorReviews(vendorId, page, limit);
      res.status(200).json(ResponseDto.success('Vendor reviews retrieved successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user?.id;
      if (!customerId) {
        throw new BadRequestError('User not authenticated.');
      }

      const { bookingId, rating, comment } = req.body;
      const review = await reviewService.createReview(customerId, {
        bookingId,
        rating: Number(rating),
        comment,
      });

      res.status(201).json(ResponseDto.success('Review submitted successfully.', review));
    } catch (error) {
      next(error);
    }
  };
}

export const reviewController = new ReviewController();
export default reviewController;
