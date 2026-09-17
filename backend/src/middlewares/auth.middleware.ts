import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../common/utils/generate-jwt';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { UnauthorizedError } from '../common/utils/app-error';

/**
 * Express middleware to authenticate API requests by verifying a Bearer access token.
 * Appends decodable JwtPayload onto req.user on success, otherwise routes to central error handling.
 */
export const authenticateRequest = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
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
    if (!decoded.userId && decoded.sub) {
      decoded.userId = decoded.sub;
    }
    req.user = decoded;
    next();
  } catch (error) {
    next(new UnauthorizedError('Authentication token is invalid or expired.'));
  }
};

export {
  requireRole,
  requireCustomer,
  requireVendor,
  requireAdmin,
  requireApprovedVendor,
} from './role.middleware';

export default authenticateRequest;
