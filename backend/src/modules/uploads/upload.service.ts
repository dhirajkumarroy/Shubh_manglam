import { storageService } from './storage.service';
import { randomUUID } from 'crypto';
import path from 'path';
import { BadRequestError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class UploadService {
  /**
   * Uploads a file buffer to storage and returns accessible URL path.
   */
  async uploadFile(file: Express.Multer.File, folder: string = 'documents'): Promise<{
    url: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    size: number;
  }> {
    if (!file || !file.buffer) {
      throw new BadRequestError('No file provided for upload.');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueFileName = `${randomUUID()}${ext}`;

    logger.info(`UploadService: Uploading ${file.originalname} (${file.size} bytes) to folder ${folder}`);
    const fileUrl = await storageService.uploadFile(
      file.buffer,
      uniqueFileName,
      folder,
      file.mimetype
    );

    // Normalize URL path: keep absolute HTTP/HTTPS URLs intact, prepend leading slash for local relative paths
    const isAbsolute = fileUrl.startsWith('http://') || fileUrl.startsWith('https://');
    const normalizedUrl = isAbsolute ? fileUrl : fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;

    return {
      url: normalizedUrl,
      fileName: uniqueFileName,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    };
  }

  /**
   * Deletes a file by its URL or relative path.
   */
  async deleteFile(fileUrl: string): Promise<void> {
    const cleanPath = fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl;
    await storageService.deleteFile(cleanPath);
  }
}

export default UploadService;
