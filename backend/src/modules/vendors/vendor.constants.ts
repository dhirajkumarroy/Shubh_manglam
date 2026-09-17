import { VendorStatus } from '@prisma/client';
import { BadRequestError } from '../../common/utils/app-error';

/**
 * Valid Vendor lifecycle state transitions.
 * PENDING -> UNDER_REVIEW (by provider on submission), REJECTED (by admin)
 * UNDER_REVIEW -> APPROVED (by admin), REJECTED (by admin)
 * APPROVED -> SUSPENDED (by admin)
 * SUSPENDED -> APPROVED (by admin reactivate)
 * REJECTED -> UNDER_REVIEW (by provider on resubmission after resolving issues)
 */
export const VALID_VENDOR_TRANSITIONS: Record<VendorStatus, VendorStatus[]> = {
  PENDING: [VendorStatus.UNDER_REVIEW, VendorStatus.REJECTED],
  UNDER_REVIEW: [VendorStatus.APPROVED, VendorStatus.REJECTED],
  APPROVED: [VendorStatus.SUSPENDED],
  SUSPENDED: [VendorStatus.APPROVED],
  REJECTED: [VendorStatus.UNDER_REVIEW],
};

/**
 * Validates if transition from currentStatus to targetStatus is permitted.
 * Throws BadRequestError if transition is illegal.
 */
export function validateVendorTransition(currentStatus: VendorStatus, targetStatus: VendorStatus): void {
  if (currentStatus === targetStatus) {
    return;
  }
  const allowed = VALID_VENDOR_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new BadRequestError(
      `Invalid vendor status transition from '${currentStatus}' to '${targetStatus}'. Permitted transitions: ${allowed.join(', ') || 'None'}`
    );
  }
}
