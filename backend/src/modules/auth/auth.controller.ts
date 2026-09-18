import { Request, Response, NextFunction } from 'express';
import { AuthService, DeviceMetadata } from './auth.service';
import {
  customerRegisterSchema,
  providerRegisterSchema,
  loginSchema,
  adminLoginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  logoutSchema,
  googleAuthSchema,
  adminMfaVerifySchema,
  adminMfaDisableSchema,
} from './auth.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { UnauthorizedError } from '../../common/utils/app-error';
import { renderResetPasswordHtml } from './reset-password-page.html';
import { env } from '../../config/env';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  private getDeviceMeta(req: Request): DeviceMetadata {
    return {
      deviceId: req.headers['x-device-id'] as string | undefined,
      deviceType: req.headers['x-device-type'] as string | undefined,
      userAgent: req.headers['user-agent'],
      ipAddress:
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress,
    };
  }

  // =========================================================================
  // Customer Handlers
  // =========================================================================

  customerRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = customerRegisterSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.registerCustomer(validatedBody, meta);

      res.status(201).json(ResponseDto.success('Customer registered successfully. Verification link sent.', result));
    } catch (error) {
      next(error);
    }
  };

  customerLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.loginCustomer(validatedBody, meta);

      res.status(200).json(ResponseDto.success('Login successful.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Provider Handlers
  // =========================================================================

  providerRegister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = providerRegisterSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.registerProvider(validatedBody, meta);

      res.status(201).json(
        ResponseDto.success(
          'Provider registered successfully. Profile is PENDING admin approval.',
          result
        )
      );
    } catch (error) {
      next(error);
    }
  };

  providerLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.loginProvider(validatedBody, meta);

      res.status(200).json(ResponseDto.success('Provider login successful.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Admin Handlers
  // =========================================================================

  adminLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = adminLoginSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.loginAdmin(validatedBody, meta);

      res.status(200).json(ResponseDto.success('Admin login successful.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Token Refresh & Session Management
  // =========================================================================

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = refreshTokenSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.refreshToken(validatedBody, meta);

      res.status(200).json(ResponseDto.success('Tokens refreshed successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = logoutSchema.parse(req.body);
      await this.authService.logout(validatedBody.refreshToken);

      res.status(200).json(ResponseDto.success('Logged out successfully.'));
    } catch (error) {
      next(error);
    }
  };

  logoutAll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      await this.authService.logoutAll(userId);
      res.status(200).json(ResponseDto.success('All sessions revoked successfully.'));
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = await this.authService.getCurrentUser(userId);
      res.status(200).json(ResponseDto.success('User profile fetched successfully.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Email Verification
  // =========================================================================

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = verifyEmailSchema.parse(req.body);
      const result = await this.authService.verifyEmail(validatedBody);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  resendVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = resendVerificationSchema.parse(req.body);
      const result = await this.authService.resendVerificationEmail(validatedBody);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Password Management
  // =========================================================================

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = forgotPasswordSchema.parse(req.body);
      const origin = `${req.protocol}://${req.get('host')}`;
      const result = await this.authService.forgotPassword(validatedBody, origin);

      res.status(200).json(ResponseDto.success(result.message, result));
    } catch (error) {
      next(error);
    }
  };

  renderResetPasswordPage = (req: Request, res: Response): void => {
    const token = (req.query.token as string) || '';
    const email = (req.query.email as string) || '';
    const apiBaseUrl = `${req.protocol}://${req.get('host')}${env.API_PREFIX}`;
    const html = renderResetPasswordHtml({ token, email, apiBaseUrl });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(validatedBody);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      const validatedBody = changePasswordSchema.parse(req.body);
      const result = await this.authService.changePassword(userId, validatedBody);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Google OAuth
  // =========================================================================

  googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = googleAuthSchema.parse(req.body);
      const meta = this.getDeviceMeta(req);
      const result = await this.authService.googleAuth(validatedBody, meta);

      res.status(200).json(ResponseDto.success('Google authentication successful.', result));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Admin MFA
  // =========================================================================

  setupAdminMfa = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      const result = await this.authService.setupAdminMfa(userId);
      res.status(200).json(ResponseDto.success('MFA initialized. Scan the QR code or enter the key.', result));
    } catch (error) {
      next(error);
    }
  };

  verifyAdminMfa = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      const validatedBody = adminMfaVerifySchema.parse(req.body);
      const result = await this.authService.verifyAdminMfa(userId, validatedBody.code);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  disableAdminMfa = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.userId || req.user?.sub;
      if (!userId) {
        throw new UnauthorizedError('Authentication required.');
      }

      const validatedBody = adminMfaDisableSchema.parse(req.body);
      const result = await this.authService.disableAdminMfa(userId, validatedBody.code, validatedBody.password);

      res.status(200).json(ResponseDto.success(result.message));
    } catch (error) {
      next(error);
    }
  };

  // Backward compatibility aliases
  register = this.customerRegister;
  login = this.customerLogin;
}

export default AuthController;
