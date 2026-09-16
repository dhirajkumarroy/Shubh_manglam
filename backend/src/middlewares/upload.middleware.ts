import { Request, Response, NextFunction } from 'express';
import multer, { FileFilterCallback } from 'multer';
import { BadRequestError } from '../common/utils/app-error';

// Custom file type filter checking MIME types
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

// Multer memory storage engine configuration
const uploadSingleImage = (fieldName: string) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter,
  }).single(fieldName);
};

/**
 * Express middleware to handle avatar image uploads.
 * Captures Multer limit errors and routes them to global error middleware.
 */
export const uploadAvatar = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadSingleImage('avatar');

  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File is too large. Maximum size allowed is 5 MB.'));
        }
        return next(new BadRequestError(`File upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

// Multer array storage engine configuration
const uploadMultipleImages = (fieldName: string, maxCount: number) => {
  return multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB per file
    },
    fileFilter,
  }).array(fieldName, maxCount);
};

/**
 * Express middleware to handle multiple vehicle image uploads.
 */
export const uploadVehicleImages = (req: Request, res: Response, next: NextFunction) => {
  const upload = uploadMultipleImages('images', 10);

  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File is too large. Maximum size allowed is 10 MB per image.'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new BadRequestError('Too many files uploaded. Maximum is 10 images.'));
        }
        return next(new BadRequestError(`File upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

