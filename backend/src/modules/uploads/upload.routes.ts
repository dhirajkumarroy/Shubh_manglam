import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { uploadImage, uploadDocument, uploadAvatar } from '../../middlewares/upload.middleware';
import { storageService } from './storage.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { BadRequestError } from '../../common/utils/app-error';

const router = Router();

/**
 * Common handler to process uploaded multer file
 */
const handleFileUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
  folder: string
): Promise<void> => {
  try {
    const file = req.file;
    if (!file) {
      throw new BadRequestError('No file provided for upload.');
    }

    const fileExtension = path.extname(file.originalname) || '';
    const uniqueName = `${path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_')}-${Date.now()}${fileExtension}`;

    const url = await storageService.uploadFile(file.buffer, uniqueName, folder, file.mimetype);

    res.status(201).json(
      ResponseDto.success('File uploaded successfully', {
        url,
        fileName: uniqueName,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @openapi
 * /uploads/image:
 *   post:
 *     summary: Upload an image file (JPEG, PNG, WebP)
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/image',
  authenticateRequest,
  uploadImage,
  (req: Request, res: Response, next: NextFunction) => handleFileUpload(req, res, next, 'images')
);

/**
 * @openapi
 * /uploads/document:
 *   post:
 *     summary: Upload a document (PDF, JPEG, PNG, WebP)
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/document',
  authenticateRequest,
  uploadDocument,
  (req: Request, res: Response, next: NextFunction) => handleFileUpload(req, res, next, 'documents')
);

/**
 * @openapi
 * /uploads/avatar:
 *   post:
 *     summary: Upload an avatar image
 *     tags:
 *       - Uploads
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/avatar',
  authenticateRequest,
  uploadAvatar,
  (req: Request, res: Response, next: NextFunction) => handleFileUpload(req, res, next, 'profiles')
);

/**
 * Generic upload endpoint
 */
router.post(
  '/',
  authenticateRequest,
  uploadImage,
  (req: Request, res: Response, next: NextFunction) => handleFileUpload(req, res, next, 'general')
);

export default router;
