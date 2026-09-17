import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Signs a short-lived JSON Web Token for API request authorization (approx 10-15m).
 * Payload contains only minimal claims: sub (userId), role, sessionId.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  const userId = payload.sub || payload.userId || '';
  const cleanPayload: JwtPayload = {
    sub: userId,
    userId: userId,
    role: payload.role,
    ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
  };

  return jwt.sign(cleanPayload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

/**
 * Signs a long-lived JSON Web Token for session refresh (7-30d).
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  const userId = payload.sub || payload.userId || '';
  const cleanPayload: JwtPayload = {
    sub: userId,
    userId: userId,
    role: payload.role,
    ...(payload.sessionId ? { sessionId: payload.sessionId } : {}),
  };

  return jwt.sign(cleanPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

/**
 * Verifies and decodes an incoming Access Token.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  if (!decoded.userId && decoded.sub) {
    decoded.userId = decoded.sub;
  }
  return decoded;
};

/**
 * Verifies and decodes an incoming Refresh Token.
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
  if (!decoded.userId && decoded.sub) {
    decoded.userId = decoded.sub;
  }
  return decoded;
};
