import { Request, Response, NextFunction } from 'express';
import { UploadService } from './upload.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { BadRequestError } from '../../common/utils/app-error';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('Document file is required.');
      }

      const result = await this.uploadService.uploadFile(req.file, 'documents');
      res.status(201).json(ResponseDto.success('Document uploaded successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('Image file is required.');
      }

      const folder = (req.query.folder as string) || 'images';
      const result = await this.uploadService.uploadFile(req.file, folder);
      res.status(201).json(ResponseDto.success('Image uploaded successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  uploadGalleryMedia = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        throw new BadRequestError('Media file (image or video) is required.');
      }

      const folder = req.file.mimetype.startsWith('video/') ? 'gallery/videos' : 'gallery/images';
      const result = await this.uploadService.uploadFile(req.file, folder);
      res.status(201).json(ResponseDto.success('Gallery media uploaded successfully.', result));
    } catch (error) {
      next(error);
    }
  };
}

export default UploadController;
