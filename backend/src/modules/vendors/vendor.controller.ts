import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

import { VendorService } from './vendor.service';
import {
  updateVendorProfileSchema,
  syncVendorCategoriesSchema,
  createVendorDocumentSchema,
} from './vendor.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError } from '../../common/utils/app-error';

export class VendorController {
  private vendorService: VendorService;

  constructor() {
    this.vendorService = new VendorService();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new UnauthorizedError('Authentication required.');
    }
    return userId;
  }

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profile = await this.vendorService.getOwnProfile(userId);
      res.status(200).json(ResponseDto.success('Vendor profile fetched successfully.', profile));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = updateVendorProfileSchema.parse(req.body);
      const updated = await this.vendorService.updateOwnProfile(userId, validatedBody);
      res.status(200).json(ResponseDto.success('Vendor profile updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  syncCategories = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = syncVendorCategoriesSchema.parse(req.body);
      const updated = await this.vendorService.syncOwnCategories(userId, validatedBody.categoryIds);
      res.status(200).json(ResponseDto.success('Vendor categories synchronized successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  addDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = createVendorDocumentSchema.parse(req.body);
      const document = await this.vendorService.addDocument(
        userId,
        validatedBody.documentType,
        validatedBody.documentUrl
      );
      res.status(201).json(ResponseDto.success('Vendor document uploaded successfully.', document));
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { documentId } = req.params;
      const result = await this.vendorService.deleteDocument(userId, documentId);
      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  submitForReview = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const updated = await this.vendorService.submitForReview(userId);
      res.status(200).json(ResponseDto.success('Vendor profile submitted for review.', updated));
    } catch (error) {
      next(error);
    }
  };
}

export default VendorController;
