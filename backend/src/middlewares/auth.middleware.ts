import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../common/utils/generate-jwt';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UnauthorizedError, ForbiddenError } from '../common/utils/app-error';

/**
 * Express middleware to authenticate API requests by verifying a Bearer access token.
 * Appends decodable JwtPayload onto req.user on success, otherwise routes to central error handling.
 */
export const authenticateRequest = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Authentication token is missing or invalid.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Authentication token is missing.');
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication token is invalid or expired.'));
  }
};

/**
 * Express middleware to enforce that the authenticated user possesses the ADMIN role.
 * Yields a 403 Forbidden if the check fails.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required.'));
  }
  if (req.user.role !== 'ADMIN') {
    return next(new ForbiddenError('Access forbidden. Admin role required.'));
  }
  next();
};

export default authenticateRequest;
