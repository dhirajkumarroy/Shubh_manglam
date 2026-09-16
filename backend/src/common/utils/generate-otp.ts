import crypto from 'crypto';

/**
 * Generates a cryptographically secure 6-digit numeric OTP code.
 * @returns A 6-digit numeric string (e.g. "847291").
 */
export const generateOtp = (): string => {
  // Generates a random integer between 100,000 and 999,999 inclusive
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
};
