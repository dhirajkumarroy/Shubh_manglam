import { z } from 'zod';
import {
  userQuerySchema,
  adminVendorQuerySchema,
  rejectVendorSchema,
  suspendVendorSchema,
  reviewDocumentSchema,
} from './admin.validation';

export type UserQueryDto = z.infer<typeof userQuerySchema>;

export type AdminVendorQueryDto = z.infer<typeof adminVendorQuerySchema>;
export type RejectVendorDto = z.infer<typeof rejectVendorSchema>;
export type SuspendVendorDto = z.infer<typeof suspendVendorSchema>;
export type ReviewDocumentDto = z.infer<typeof reviewDocumentSchema>;

export interface AdminDashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalProviders: number;
  totalAdmins: number;
  totalActiveUsers: number;
  totalBlockedUsers: number;
  totalVerifiedUsers: number;
  totalVendors: number;
  totalApprovedVendors: number;
  totalPendingVendors: number;
  totalUnderReviewVendors: number;
  totalRejectedVendors: number;
  totalSuspendedVendors: number;
  totalEventTypes: number;
  totalCategories: number;
  recentUsers: any[];
}
