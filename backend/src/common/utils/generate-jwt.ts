import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Signs a short-lived JSON Web Token for API request authorization.
 * @param payload Strong-typed payload containing user identity.
 */
export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  });
};

/**
 * Signs a long-lived JSON Web Token for refreshing request access.
 * @param payload Strong-typed payload containing user identity.
 */
export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  });
};

/**
 * Verifies and decodes an incoming Access Token.
 * @param token Raw access JWT from headers.
 * @throws An error if token is expired or signature is invalid.
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

/**
 * Verifies and decodes an incoming Refresh Token.
 * @param token Raw refresh JWT from cookies.
 * @throws An error if token is expired or signature is invalid.
 */
export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
};
