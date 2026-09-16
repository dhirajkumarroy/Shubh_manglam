import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
} from './auth.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * HTTP handler to register a new user account.
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = registerSchema.parse(req.body);
      await this.authService.register(validatedBody);

      res.status(201).json(
        ResponseDto.success('Registration successful. Verification OTP sent.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to log in user credentials.
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);
      const result = await this.authService.login(validatedBody);

      res.status(200).json(
        ResponseDto.success('Login successful', {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            role: result.user.role,
            avatar: result.user.avatar,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to verify user's email address.
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = verifyEmailSchema.parse(req.body);
      await this.authService.verifyEmail(validatedBody);

      res.status(200).json(
        ResponseDto.success('Email verified successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to refresh session tokens.
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = refreshTokenSchema.parse(req.body);
      const result = await this.authService.refreshToken(validatedBody);

      res.status(200).json(
        ResponseDto.success('Tokens refreshed successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to initiate password reset request.
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = forgotPasswordSchema.parse(req.body);
      await this.authService.forgotPassword(validatedBody);

      res.status(200).json(
        ResponseDto.success('Password reset OTP sent to your email address.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to execute password reset using OTP.
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = resetPasswordSchema.parse(req.body);
      await this.authService.resetPassword(validatedBody);

      res.status(200).json(
        ResponseDto.success('Password has been reset successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to log out user.
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = logoutSchema.parse(req.body);
      await this.authService.logout(validatedBody);

      res.status(200).json(
        ResponseDto.success('Logged out successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;

