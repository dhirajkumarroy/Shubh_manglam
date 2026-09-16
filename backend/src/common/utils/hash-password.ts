import bcrypt from 'bcrypt';
import { env } from '../../config/env';

/**
 * Hashes a raw password string using bcrypt.
 * @param password The raw password to hash.
 * @returns A Promise resolving to the hashed password string.
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};
