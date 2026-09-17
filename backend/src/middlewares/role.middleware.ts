import { Response, NextFunction } from 'express';
import { UserRole, VendorStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UnauthorizedError, ForbiddenError } from '../common/utils/app-error';
import { prisma } from '../config/database';

/**
 * Middleware factory to enforce required user role(s).
 */
export const requireRole = (...allowedRoles: (UserRole | string)[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required.'));
    }

    const userRole = req.user.role;
    const isAllowed = allowedRoles.some((role) => role === userRole);

    if (!isAllowed) {
      return next(
        new ForbiddenError(
          `Access forbidden. You do not have permission to access this resource. Required role: [${allowedRoles.join(', ')}].`
        )
      );
    }

    next();
  };
};

export const requireCustomer = requireRole(UserRole.CUSTOMER);
export const requireVendor = requireRole(UserRole.VENDOR);
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware to enforce that a VENDOR account is verified and APPROVED by admin.
 * Rejects PENDING, UNDER_REVIEW, REJECTED, or SUSPENDED vendors from protected actions.
 */
export const requireApprovedVendor = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required.');
    }

    if (req.user.role !== UserRole.VENDOR) {
      throw new ForbiddenError('Only service providers can access this endpoint.');
    }

    const userId = req.user.userId || req.user.sub;
    const vendor = await prisma.vendor.findUnique({
      where: { userId },
    });

    if (!vendor) {
      throw new ForbiddenError('No vendor profile found for this user account.');
    }

    if (vendor.status !== VendorStatus.APPROVED) {
      throw new ForbiddenError(
        `Vendor account is not approved. Current status: ${vendor.status}. Only APPROVED vendors can perform this action.`
      );
    }

    // Attach vendor to request for downstream handlers
    (req as any).vendor = vendor;
    next();
  } catch (error) {
    next(error);
  }
};
