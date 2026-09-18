import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireAdmin } from '../../middlewares/role.middleware';
import { authLimiter } from '../../middlewares/rate-limit.middleware';

const router = Router();
const controller = new AuthController();

// =========================================================================
// 1. Customer Endpoints
// =========================================================================
router.post('/customer/register', authLimiter, controller.customerRegister);
router.post('/customer/login', authLimiter, controller.customerLogin);

// =========================================================================
// 2. Provider Endpoints
// =========================================================================
router.post('/provider/register', authLimiter, controller.providerRegister);
router.post('/provider/login', authLimiter, controller.providerLogin);

// =========================================================================
// 3. Admin Endpoints (NO public registration!)
// =========================================================================
router.post('/admin/login', authLimiter, controller.adminLogin);
router.post('/admin/mfa/setup', authenticateRequest, requireAdmin, controller.setupAdminMfa);
router.post('/admin/mfa/verify', authenticateRequest, requireAdmin, controller.verifyAdminMfa);
router.post('/admin/mfa/disable', authenticateRequest, requireAdmin, controller.disableAdminMfa);

// =========================================================================
// 4. Token Refresh, Session & Profile
// =========================================================================
router.post('/refresh', controller.refreshToken);
router.post('/refresh-token', controller.refreshToken); // backward compatibility
router.post('/logout', controller.logout);
router.post('/logout-all', authenticateRequest, controller.logoutAll);
router.get('/me', authenticateRequest, controller.me);

// =========================================================================
// 5. Email Verification
// =========================================================================
router.post('/email/verify', controller.verifyEmail);
router.post('/verify-email', controller.verifyEmail); // backward compatibility
router.post('/email/resend-verification', authLimiter, controller.resendVerification);

// =========================================================================
// 6. Password Management
// =========================================================================
router.get('/password/reset-page', controller.renderResetPasswordPage);
router.get('/reset-password', controller.renderResetPasswordPage);
router.post('/password/forgot', authLimiter, controller.forgotPassword);
router.post('/forgot-password', authLimiter, controller.forgotPassword); // backward compatibility
router.post('/password/reset', authLimiter, controller.resetPassword);
router.post('/reset-password', authLimiter, controller.resetPassword); // backward compatibility
router.post('/password/change', authenticateRequest, controller.changePassword);

// =========================================================================
// 7. Google OAuth Foundation
// =========================================================================
router.post('/google', authLimiter, controller.googleAuth);

// =========================================================================
// 8. Backward Compatibility Aliases
// =========================================================================
router.post('/register', authLimiter, controller.customerRegister);
router.post('/login', authLimiter, controller.customerLogin);

export default router;
