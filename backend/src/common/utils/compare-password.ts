import bcrypt from 'bcrypt';

/**
 * Securely compares a raw password against a saved bcrypt hash.
 * @param password The raw password input.
 * @param hash The saved hashed password.
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
