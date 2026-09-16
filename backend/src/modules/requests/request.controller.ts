import { Response, NextFunction } from 'express';
import { requestService } from './request.service';
import { createRequestSchema, requestQuerySchema } from './request.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';

export class RequestController {
  /**
   * Suggests dynamic estimated pricing comparisons.
   * GET /api/v1/requests/estimates
   */
  getEstimates = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { pickupLat, pickupLng, dropLat, dropLng } = req.query;
      
      if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
        throw new BadRequestError('Pickup and drop coordinates (lat/lng) are required.');
      }

      const estimates = await requestService.getEstimates(
        Number(pickupLat),
        Number(pickupLng),
        Number(dropLat),
        Number(dropLng)
      );

      res.status(200).json(
        ResponseDto.success('Estimates retrieved successfully.', estimates)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Submits a requirement request.
   * POST /api/v1/requests
   */
  createRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedBody = createRequestSchema.parse(req.body);
      const request = await requestService.createRequest(userId, validatedBody);

      res.status(201).json(
        ResponseDto.success('Requirement request registered successfully.', request)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve specific request details.
   * GET /api/v1/requests/:id
   */
  getRequestDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      const request = await requestService.getRequestDetails(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Request details retrieved successfully.', request)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * List customer requests.
   * GET /api/v1/requests/customer/my-requests
   */
  listCustomerRequests = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedQuery = requestQuerySchema.parse(req.query);
      const data = await requestService.listCustomerRequests(userId, validatedQuery);

      res.status(200).json(
        ResponseDto.success('Customer requests retrieved successfully.', data)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * List owner assigned requests.
   * GET /api/v1/requests/owner/my-requests
   */
  listOwnerRequests = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedQuery = requestQuerySchema.parse(req.query);
      const data = await requestService.listOwnerRequests(userId, validatedQuery);

      res.status(200).json(
        ResponseDto.success('Owner requests retrieved successfully.', data)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Live nearby requests dashboard board.
   * GET /api/v1/requests/owner/nearby
   */
  getNearbyRequests = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const requests = await requestService.getNearbyRequestsForOwner(userId);

      res.status(200).json(
        ResponseDto.success('Live nearby requests matching your area retrieved.', requests)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Accept a pending request.
   * POST /api/v1/requests/:id/accept
   */
  acceptRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      const request = await requestService.acceptRequest(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Request accepted and assigned to your vehicle.', request)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Dismiss a request from active dashboard board.
   * POST /api/v1/requests/:id/reject
   */
  rejectRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      await requestService.rejectRequest(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Request dismissed successfully.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Mark active trip completed.
   * POST /api/v1/requests/:id/complete
   */
  completeTrip = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      const request = await requestService.completeTrip(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Trip completed successfully.', request)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel request.
   * POST /api/v1/requests/:id/cancel
   */
  cancelRequest = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      const request = await requestService.cancelRequest(id, userId);

      res.status(200).json(
        ResponseDto.success('Request cancelled successfully.', request)
      );
    } catch (error) {
      next(error);
    }
  };
}
export const requestController = new RequestController();
