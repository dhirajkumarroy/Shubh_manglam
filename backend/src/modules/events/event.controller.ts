import { Request, Response, NextFunction } from 'express';
import { EventService } from './event.service';
import { ResponseDto } from '../../common/dto/api-response.dto';
import {
  createEventTypeSchema,
  updateEventTypeSchema,
  mapCategoryToEventTypeSchema,
  createEventSchema,
  updateEventSchema,
  createEventRequirementSchema,
  updateEventRequirementSchema,
} from './event.validation';

export class EventController {
  private service: EventService;

  constructor() {
    this.service = new EventService();
  }

  // =========================================================================
  // Event Types
  // =========================================================================

  listActiveEventTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventTypes = await this.service.listActiveEventTypes();
      res.status(200).json(ResponseDto.success('Event types retrieved successfully.', eventTypes));
    } catch (error) {
      next(error);
    }
  };

  listAllEventTypes = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const eventTypes = await this.service.listAllEventTypes();
      res.status(200).json(ResponseDto.success('All event types retrieved successfully.', eventTypes));
    } catch (error) {
      next(error);
    }
  };

  getEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const eventType = await this.service.getEventTypeById(id);
      res.status(200).json(ResponseDto.success('Event type retrieved successfully.', eventType));
    } catch (error) {
      next(error);
    }
  };

  createEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validated = createEventTypeSchema.parse(req.body);
      const created = await this.service.createEventType(validated);
      res.status(201).json(ResponseDto.success('Event type created successfully.', created));
    } catch (error) {
      next(error);
    }
  };

  updateEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = updateEventTypeSchema.parse(req.body);
      const updated = await this.service.updateEventType(id, validated);
      res.status(200).json(ResponseDto.success('Event type updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.service.deleteEventType(id);
      res.status(200).json(ResponseDto.success('Event type deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  getRecommendedCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { eventTypeId } = req.params;
      const categories = await this.service.getRecommendedCategories(eventTypeId);
      res.status(200).json(ResponseDto.success('Recommended categories retrieved successfully.', categories));
    } catch (error) {
      next(error);
    }
  };

  mapCategoryToEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validated = mapCategoryToEventTypeSchema.parse(req.body);
      const mapped = await this.service.mapCategoryToEventType(id, validated);
      res.status(200).json(ResponseDto.success('Category mapped to event type successfully.', mapped));
    } catch (error) {
      next(error);
    }
  };

  unmapCategoryFromEventType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, categoryId } = req.params;
      await this.service.unmapCategoryFromEventType(id, categoryId);
      res.status(200).json(ResponseDto.success('Category unmapped from event type successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Customer Events
  // =========================================================================

  createEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const validated = createEventSchema.parse(req.body);
      const event = await this.service.createEvent(customerId, validated);
      res.status(201).json(ResponseDto.success('Event created successfully.', event));
    } catch (error) {
      next(error);
    }
  };

  listEvents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const events = await this.service.listCustomerEvents(customerId);
      res.status(200).json(ResponseDto.success('Events retrieved successfully.', events));
    } catch (error) {
      next(error);
    }
  };

  getEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId } = req.params;
      const event = await this.service.getEventById(customerId, eventId);
      res.status(200).json(ResponseDto.success('Event details retrieved successfully.', event));
    } catch (error) {
      next(error);
    }
  };

  updateEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId } = req.params;
      const validated = updateEventSchema.parse(req.body);
      const updated = await this.service.updateEvent(customerId, eventId, validated);
      res.status(200).json(ResponseDto.success('Event updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId } = req.params;
      await this.service.deleteEvent(customerId, eventId);
      res.status(200).json(ResponseDto.success('Event deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };

  // =========================================================================
  // Event Requirements
  // =========================================================================

  listRequirements = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId } = req.params;
      const requirements = await this.service.listEventRequirements(customerId, eventId);
      res.status(200).json(ResponseDto.success('Event requirements retrieved successfully.', requirements));
    } catch (error) {
      next(error);
    }
  };

  createRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId } = req.params;
      const validated = createEventRequirementSchema.parse(req.body);
      const requirement = await this.service.createEventRequirement(customerId, eventId, validated);
      res.status(201).json(ResponseDto.success('Event requirement added successfully.', requirement));
    } catch (error) {
      next(error);
    }
  };

  updateRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId, requirementId } = req.params;
      const validated = updateEventRequirementSchema.parse(req.body);
      const updated = await this.service.updateEventRequirement(customerId, eventId, requirementId, validated);
      res.status(200).json(ResponseDto.success('Event requirement updated successfully.', updated));
    } catch (error) {
      next(error);
    }
  };

  deleteRequirement = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const customerId = (req as any).user.id;
      const { eventId, requirementId } = req.params;
      await this.service.deleteEventRequirement(customerId, eventId, requirementId);
      res.status(200).json(ResponseDto.success('Event requirement deleted successfully.'));
    } catch (error) {
      next(error);
    }
  };
}
