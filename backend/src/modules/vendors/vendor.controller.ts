import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';

import { VendorService } from './vendor.service';
import {
  updateVendorProfileSchema,
  syncVendorCategoriesSchema,
  createVendorDocumentSchema,
  addGalleryMediaSchema,
  updateGalleryMediaSchema,
  reorderGallerySchema,
} from './vendor.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError } from '../../common/utils/app-error';
import { documentRequirementService } from './document-requirement.service';
import { galleryService } from './gallery.service';

export class VendorController {
  private vendorService: VendorService;

  constructor() {
    this.vendorService = new VendorService();
  }

  private getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.userId || req.user?.sub || (req.user as any)?.id;
    if (!userId) {
      throw new UnauthorizedError('Authentication required.');
    }
    return userId;
  }

  getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const profile = await this.vendorService.getOwnProfile(userId);
      res.status(200).json(ResponseDto.success('Vendor profile retrieved successfully.', profile));
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

  getDocumentRequirements = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requirements = await documentRequirementService.listActiveRequirements();
      res.status(200).json(ResponseDto.success('Active document requirements retrieved.', requirements));
    } catch (error) {
      next(error);
    }
  };

  addDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = createVendorDocumentSchema.parse(req.body);
      const document = await this.vendorService.addDocument(userId, validatedBody);
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

  // =========================================================================
  // Gallery Endpoints
  // =========================================================================

  getOwnGallery = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const gallery = await galleryService.getOwnGallery(userId);
      res.status(200).json(ResponseDto.success('Partner gallery retrieved successfully.', gallery));
    } catch (error) {
      next(error);
    }
  };

  addGalleryMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = addGalleryMediaSchema.parse(req.body);
      const media = await galleryService.addMediaItem(userId, validatedBody as any);
      res.status(201).json(ResponseDto.success('Gallery media added successfully.', media));
    } catch (error) {
      next(error);
    }
  };

  updateGalleryMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const validatedBody = updateGalleryMediaSchema.parse(req.body);
      const updated = await galleryService.updateMediaItem(userId, id, validatedBody);
      res.status(200).json(ResponseDto.success('Gallery media updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteGalleryMedia = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const { id } = req.params;
      const result = await galleryService.deleteMediaItem(userId, id);
      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  reorderGallery = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = this.getUserId(req);
      const validatedBody = reorderGallerySchema.parse(req.body);
      const gallery = await galleryService.reorderGallery(userId, validatedBody.items);
      res.status(200).json(ResponseDto.success('Gallery reordered successfully.', gallery));
    } catch (error) {
      next(error);
    }
  };

  getPublicGallery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { idOrSlug } = req.params;
      const gallery = await galleryService.getPublicGallery(idOrSlug);
      res.status(200).json(ResponseDto.success('Public gallery retrieved successfully.', gallery));
    } catch (error) {
      next(error);
    }
  };
}

export default VendorController;
