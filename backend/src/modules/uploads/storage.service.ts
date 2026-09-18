import fs from 'fs';
import path from 'path';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';
import logger from '../../config/logger';

// Configure cloudinary if credentials are present
if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export class StorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR || 'uploads');
  }

  /**
   * Uploads file buffer to either local storage or Cloudinary based on environment configuration.
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    folder: string = 'general',
    _mimeType?: string
  ): Promise<string> {
    if (
      env.STORAGE_PROVIDER === 'cloudinary' &&
      env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY
    ) {
      return this.uploadToCloudinary(buffer, fileName, folder);
    }

    return this.uploadToLocal(buffer, fileName, folder);
  }

  private async uploadToLocal(buffer: Buffer, fileName: string, folder: string): Promise<string> {
    const targetFolder = path.join(this.uploadDir, folder);
    await fs.promises.mkdir(targetFolder, { recursive: true });

    const filePath = path.join(targetFolder, fileName);
    await fs.promises.writeFile(filePath, buffer);

    logger.info(`StorageService: File saved locally at ${filePath}`);
    return `/uploads/${folder}/${fileName}`;
  }

  private async uploadToCloudinary(buffer: Buffer, fileName: string, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const publicId = path.parse(fileName).name;
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `shubh_mangalam/${folder}`,
          public_id: publicId,
          resource_type: 'auto',
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error || !result) {
            logger.error('StorageService: Cloudinary upload failed', error);
            return reject(error || new Error('Cloudinary upload returned undefined'));
          }
          logger.info(`StorageService: File uploaded to Cloudinary: ${result.secure_url}`);
          resolve(result.secure_url);
        }
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Deletes a file from either local disk or Cloudinary.
   */
  async deleteFile(
    fileUrlOrPath: string,
    resourceType: 'image' | 'video' | 'raw' = 'image'
  ): Promise<void> {
    if (!fileUrlOrPath) return;

    if (fileUrlOrPath.startsWith('http://') || fileUrlOrPath.startsWith('https://')) {
      if (fileUrlOrPath.includes('cloudinary.com')) {
        try {
          const parts = fileUrlOrPath.split('/');
          const fileWithExt = parts.slice(-2).join('/');
          const publicId = fileWithExt.substring(0, fileWithExt.lastIndexOf('.'));
          await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
          logger.info(`StorageService: Deleted Cloudinary file ${publicId} (${resourceType})`);
        } catch (err) {
          logger.warn(`StorageService: Failed to delete Cloudinary file: ${err}`);
        }
      }
      return;
    }

    try {
      const cleanPath = fileUrlOrPath.replace(/^\/?uploads\//, '');
      const fullPath = path.join(this.uploadDir, cleanPath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
        logger.info(`StorageService: Deleted local file ${fullPath}`);
      }
    } catch (err) {
      logger.warn(`StorageService: Failed to delete local file ${fileUrlOrPath}: ${err}`);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
