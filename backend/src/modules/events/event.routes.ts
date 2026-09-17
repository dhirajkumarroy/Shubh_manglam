import { Router } from 'express';
import { EventController } from './event.controller';
import { authenticateRequest } from '../../middlewares/auth.middleware';
import { requireCustomer, requireAdmin } from '../../middlewares/role.middleware';

const controller = new EventController();

// =========================================================================
// 1. Public Event Types Router (Mounted at /event-types)
// =========================================================================
export const publicEventTypesRouter = Router();

publicEventTypesRouter.get('/', controller.listActiveEventTypes);
publicEventTypesRouter.get('/:id', controller.getEventType);
publicEventTypesRouter.get('/:eventTypeId/categories', controller.getRecommendedCategories);

// =========================================================================
// 2. Customer Events Router (Mounted at /events)
// =========================================================================
export const customerEventsRouter = Router();

// Enforce customer authentication for all event management endpoints
customerEventsRouter.use(authenticateRequest, requireCustomer);

// Event CRUD
customerEventsRouter.post('/', controller.createEvent);
customerEventsRouter.get('/', controller.listEvents);
customerEventsRouter.get('/:eventId', controller.getEvent);
customerEventsRouter.patch('/:eventId', controller.updateEvent);
customerEventsRouter.delete('/:eventId', controller.deleteEvent);

// Event Requirements CRUD
customerEventsRouter.get('/:eventId/requirements', controller.listRequirements);
customerEventsRouter.post('/:eventId/requirements', controller.createRequirement);
customerEventsRouter.patch('/:eventId/requirements/:requirementId', controller.updateRequirement);
customerEventsRouter.delete('/:eventId/requirements/:requirementId', controller.deleteRequirement);

// =========================================================================
// 3. Admin Event Types Router (Mounted at /admin/event-types)
// =========================================================================
export const adminEventTypesRouter = Router();

// Enforce admin authentication
adminEventTypesRouter.use(authenticateRequest, requireAdmin);

adminEventTypesRouter.get('/', controller.listAllEventTypes);
adminEventTypesRouter.post('/', controller.createEventType);
adminEventTypesRouter.patch('/:id', controller.updateEventType);
adminEventTypesRouter.delete('/:id', controller.deleteEventType);
adminEventTypesRouter.post('/:id/categories', controller.mapCategoryToEventType);
adminEventTypesRouter.delete('/:id/categories/:categoryId', controller.unmapCategoryFromEventType);
