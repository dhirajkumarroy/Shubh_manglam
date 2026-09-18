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

// Custom document type filter checking MIME types (images + PDFs)
const documentFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only JPEG, PNG, WebP images and PDF documents are allowed.'));
  }
};

/**
 * Express middleware to handle single document upload (up to 10MB).
 */
export const uploadDocument = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB
    },
    fileFilter: documentFilter,
  }).single('file');

  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('File is too large. Maximum size allowed is 10 MB.'));
        }
        return next(new BadRequestError(`File upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};

/**
 * Express middleware to handle single image upload (up to 5MB).
 */
export const uploadImage = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter,
  }).single('file');

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

/**
 * Custom gallery media filter checking MIME types (images + videos)
 */
const galleryFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Invalid file type. Only JPEG, PNG, WebP images and MP4, WebM, MOV videos are allowed for gallery.'));
  }
};

/**
 * Express middleware to handle gallery media upload (up to 50MB).
 */
export const uploadGalleryMedia = (req: Request, res: Response, next: NextFunction) => {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
    fileFilter: galleryFilter,
  }).single('file');

  upload(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new BadRequestError('Media file is too large. Maximum size allowed is 50 MB.'));
        }
        return next(new BadRequestError(`Media upload error: ${err.message}`));
      }
      return next(err);
    }
    next();
  });
};



