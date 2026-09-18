import { prisma } from '../../config/database';
import { MediaType, VendorStatus } from '@prisma/client';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../common/utils/app-error';
import { storageService } from '../uploads/storage.service';
import logger from '../../config/logger';

export const GALLERY_LIMITS = {
  MAX_PHOTOS: 10,
  MAX_VIDEOS: 5,
  MAX_TOTAL: 15,
} as const;

export interface AddGalleryMediaDto {
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  serviceId?: string;
  sortOrder?: number;
}

export interface UpdateGalleryMediaDto {
  caption?: string | null;
  serviceId?: string | null;
  sortOrder?: number;
}

export interface ReorderGalleryItemDto {
  id: string;
  sortOrder: number;
}

export class GalleryService {
  /**
   * Retrieves gallery media items for the authenticated vendor.
   */
  async getOwnGallery(userId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Partner profile not found.');
    }

    const items = await prisma.vendorGalleryMedia.findMany({
      where: { vendorId: vendor.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const photoCount = items.filter((i) => i.mediaType === MediaType.IMAGE).length;
    const videoCount = items.filter((i) => i.mediaType === MediaType.VIDEO).length;

    return {
      photosCount: photoCount,
      videosCount: videoCount,
      maxPhotos: GALLERY_LIMITS.MAX_PHOTOS,
      maxVideos: GALLERY_LIMITS.MAX_VIDEOS,
      totalCount: items.length,
      items,
    };
  }

  /**
   * Adds a media item (photo or video) to the vendor's gallery.
   * Enforces max 10 photos and max 5 videos at the backend level.
   */
  async addMediaItem(userId: string, data: AddGalleryMediaDto) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Partner profile not found.');
    }

    // Validate optional service association
    if (data.serviceId) {
      const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
      if (!service || service.vendorId !== vendor.id) {
        throw new BadRequestError('Associated service must belong to your own business.');
      }
    }

    // Enforce limits in a transaction or with lock
    const currentItems = await prisma.vendorGalleryMedia.findMany({
      where: { vendorId: vendor.id },
      select: { id: true, mediaType: true },
    });

    const photoCount = currentItems.filter((i) => i.mediaType === MediaType.IMAGE).length;
    const videoCount = currentItems.filter((i) => i.mediaType === MediaType.VIDEO).length;

    if (data.mediaType === MediaType.IMAGE && photoCount >= GALLERY_LIMITS.MAX_PHOTOS) {
      throw new BadRequestError(`You can upload a maximum of ${GALLERY_LIMITS.MAX_PHOTOS} photos to your gallery.`);
    }

    if (data.mediaType === MediaType.VIDEO && videoCount >= GALLERY_LIMITS.MAX_VIDEOS) {
      throw new BadRequestError(`You can upload a maximum of ${GALLERY_LIMITS.MAX_VIDEOS} videos to your gallery.`);
    }

    if (currentItems.length >= GALLERY_LIMITS.MAX_TOTAL) {
      throw new BadRequestError(`Gallery capacity reached (${GALLERY_LIMITS.MAX_TOTAL} items maximum).`);
    }

    const defaultSortOrder = currentItems.length;

    const media = await prisma.vendorGalleryMedia.create({
      data: {
        vendorId: vendor.id,
        mediaType: data.mediaType,
        url: data.url.trim(),
        thumbnailUrl: data.thumbnailUrl?.trim() || null,
        caption: data.caption?.trim() || null,
        serviceId: data.serviceId || null,
        sortOrder: data.sortOrder ?? defaultSortOrder,
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    logger.info(`GalleryService: Added ${data.mediaType} to gallery for vendor ${vendor.id} (ID: ${media.id})`);
    return media;
  }

  /**
   * Updates caption, service association, or sort order for a gallery item.
   */
  async updateMediaItem(userId: string, mediaId: string, data: UpdateGalleryMediaDto) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Partner profile not found.');
    }

    const existing = await prisma.vendorGalleryMedia.findUnique({ where: { id: mediaId } });
    if (!existing) {
      throw new NotFoundError('Gallery media item not found.');
    }

    if (existing.vendorId !== vendor.id) {
      throw new ForbiddenError('You are not authorized to edit this gallery item.');
    }

    if (data.serviceId) {
      const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
      if (!service || service.vendorId !== vendor.id) {
        throw new BadRequestError('Associated service must belong to your own business.');
      }
    }

    const updated = await prisma.vendorGalleryMedia.update({
      where: { id: mediaId },
      data: {
        ...(data.caption !== undefined && { caption: data.caption ? data.caption.trim() : null }),
        ...(data.serviceId !== undefined && { serviceId: data.serviceId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    logger.info(`GalleryService: Updated gallery item ${mediaId}`);
    return updated;
  }

  /**
   * Deletes a gallery media item.
   * Purges file from Cloudinary (or local filesystem) before deleting DB record.
   */
  async deleteMediaItem(userId: string, mediaId: string) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Partner profile not found.');
    }

    const existing = await prisma.vendorGalleryMedia.findUnique({ where: { id: mediaId } });
    if (!existing) {
      throw new NotFoundError('Gallery media item not found.');
    }

    if (existing.vendorId !== vendor.id) {
      throw new ForbiddenError('You are not authorized to delete this gallery item.');
    }

    // 1. Purge asset from Cloudinary / Local filesystem
    try {
      const resourceType = existing.mediaType === MediaType.VIDEO ? 'video' : 'image';
      logger.info(`GalleryService: Purging storage file ${existing.url} (${resourceType})`);
      await storageService.deleteFile(existing.url, resourceType);
    } catch (storageErr) {
      logger.warn(`GalleryService: Could not delete physical file for gallery item ${mediaId}: ${storageErr}`);
    }

    // 2. Delete database record
    await prisma.vendorGalleryMedia.delete({ where: { id: mediaId } });

    logger.info(`GalleryService: Deleted gallery item ${mediaId} for vendor ${vendor.id}`);
    return { message: 'Gallery item deleted successfully.' };
  }

  /**
   * Persists reordered gallery items to backend.
   */
  async reorderGallery(userId: string, items: ReorderGalleryItemDto[]) {
    const vendor = await prisma.vendor.findUnique({ where: { userId } });
    if (!vendor) {
      throw new NotFoundError('Partner profile not found.');
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestError('Invalid reorder payload.');
    }

    const itemIds = items.map((i) => i.id);
    const ownedItems = await prisma.vendorGalleryMedia.findMany({
      where: { id: { in: itemIds }, vendorId: vendor.id },
      select: { id: true },
    });

    if (ownedItems.length !== items.length) {
      throw new ForbiddenError('One or more gallery items do not belong to your partner account.');
    }

    // Batch update order in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.vendorGalleryMedia.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );

    logger.info(`GalleryService: Reordered ${items.length} gallery items for vendor ${vendor.id}`);
    return this.getOwnGallery(userId);
  }

  /**
   * Public retrieval of gallery for approved & active vendor.
   */
  async getPublicGallery(vendorIdOrSlug: string) {
    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { id: vendorIdOrSlug },
          { slug: vendorIdOrSlug },
          { partnerAccountId: vendorIdOrSlug },
        ],
        status: VendorStatus.APPROVED,
        isActive: true,
      },
      select: {
        id: true,
        businessName: true,
        partnerAccountId: true,
        isVerified: true,
      },
    });

    if (!vendor) {
      throw new NotFoundError('Verified partner not found.');
    }

    const items = await prisma.vendorGalleryMedia.findMany({
      where: { vendorId: vendor.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: {
        service: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    const photos = items.filter((i) => i.mediaType === MediaType.IMAGE);
    const videos = items.filter((i) => i.mediaType === MediaType.VIDEO);

    return {
      partner: vendor,
      totalCount: items.length,
      photosCount: photos.length,
      videosCount: videos.length,
      photos,
      videos,
      items,
    };
  }
}

export const galleryService = new GalleryService();
export default galleryService;
