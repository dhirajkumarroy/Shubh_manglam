import { EventRepository } from './event.repository';
import { prisma } from '../../config/database';
import {
  CreateEventTypeDto,
  UpdateEventTypeDto,
  MapCategoryToEventTypeDto,
  CreateEventDto,
  UpdateEventDto,
  CreateEventRequirementDto,
  UpdateEventRequirementDto,
} from './event.types';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../../common/utils/app-error';
import logger from '../../config/logger';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class EventService {
  private repo: EventRepository;

  constructor() {
    this.repo = new EventRepository();
  }

  // =========================================================================
  // Event Types (Public / Admin)
  // =========================================================================

  async listActiveEventTypes() {
    return this.repo.listActiveEventTypes();
  }

  async listAllEventTypes() {
    return this.repo.listAllEventTypes();
  }

  async getEventTypeById(id: string) {
    const eventType = await this.repo.getEventTypeById(id);
    if (!eventType) {
      throw new NotFoundError('Event type not found');
    }
    return eventType;
  }

  async createEventType(data: CreateEventTypeDto) {
    const slug = slugify(data.name);
    const existing = await this.repo.getEventTypeBySlug(slug);
    if (existing) {
      throw new ConflictError(`An event type with name '${data.name}' already exists.`);
    }

    logger.info(`Creating new Event Type: ${data.name} (${slug})`);
    return this.repo.createEventType({ ...data, slug });
  }

  async updateEventType(id: string, data: UpdateEventTypeDto) {
    const existing = await this.repo.getEventTypeById(id);
    if (!existing) {
      throw new NotFoundError('Event type not found');
    }

    let slug: string | undefined = undefined;
    if (data.name && data.name !== existing.name) {
      slug = slugify(data.name);
      const conflict = await this.repo.getEventTypeBySlug(slug);
      if (conflict && conflict.id !== id) {
        throw new ConflictError(`An event type with name '${data.name}' already exists.`);
      }
    }

    return this.repo.updateEventType(id, { ...data, slug });
  }

  async deleteEventType(id: string) {
    const existing = await this.repo.getEventTypeById(id);
    if (!existing) {
      throw new NotFoundError('Event type not found');
    }
    return this.repo.deleteEventType(id);
  }

  async getRecommendedCategories(eventTypeId: string) {
    const eventType = await this.repo.getEventTypeById(eventTypeId);
    if (!eventType) {
      throw new NotFoundError('Event type not found');
    }

    const mapping = await this.repo.getRecommendedCategories(eventTypeId);
    return mapping.map((m) => m.category);
  }

  async mapCategoryToEventType(eventTypeId: string, data: MapCategoryToEventTypeDto) {
    const [eventType, category] = await Promise.all([
      this.repo.getEventTypeById(eventTypeId),
      prisma.category.findUnique({ where: { id: data.categoryId } }),
    ]);

    if (!eventType) {
      throw new NotFoundError('Event type not found');
    }
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return this.repo.mapCategoryToEventType(eventTypeId, data);
  }

  async unmapCategoryFromEventType(eventTypeId: string, categoryId: string) {
    return this.repo.unmapCategoryFromEventType(eventTypeId, categoryId);
  }

  // =========================================================================
  // Customer Events
  // =========================================================================

  async createEvent(customerId: string, data: CreateEventDto) {
    const eventType = await this.repo.getEventTypeById(data.eventTypeId);
    if (!eventType || !eventType.isActive) {
      throw new BadRequestError('Invalid or inactive event type selected');
    }

    logger.info(`Customer ${customerId} creating event: ${data.title}`);
    return this.repo.createEvent(customerId, data);
  }

  async listCustomerEvents(customerId: string) {
    return this.repo.listCustomerEvents(customerId);
  }

  async getEventById(customerId: string, eventId: string) {
    const event = await this.repo.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (event.customerId !== customerId) {
      throw new ForbiddenError('You do not have permission to view this event');
    }
    return event;
  }

  async updateEvent(customerId: string, eventId: string, data: UpdateEventDto) {
    const event = await this.repo.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (event.customerId !== customerId) {
      throw new ForbiddenError('You do not have permission to modify this event');
    }

    if (data.eventTypeId) {
      const eventType = await this.repo.getEventTypeById(data.eventTypeId);
      if (!eventType || !eventType.isActive) {
        throw new BadRequestError('Invalid or inactive event type selected');
      }
    }

    return this.repo.updateEvent(eventId, data);
  }

  async deleteEvent(customerId: string, eventId: string) {
    const event = await this.repo.findEventById(eventId);
    if (!event) {
      throw new NotFoundError('Event not found');
    }
    if (event.customerId !== customerId) {
      throw new ForbiddenError('You do not have permission to delete this event');
    }

    return this.repo.deleteEvent(eventId);
  }

  // =========================================================================
  // Event Requirements
  // =========================================================================

  async listEventRequirements(customerId: string, eventId: string) {
    // Enforce event ownership
    await this.getEventById(customerId, eventId);
    return this.repo.listRequirementsByEvent(eventId);
  }

  async createEventRequirement(customerId: string, eventId: string, data: CreateEventRequirementDto) {
    // Enforce event ownership
    await this.getEventById(customerId, eventId);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category || !category.isActive) {
      throw new BadRequestError('Invalid or inactive category selected');
    }

    return this.repo.createRequirement(eventId, data);
  }

  async updateEventRequirement(
    customerId: string,
    eventId: string,
    requirementId: string,
    data: UpdateEventRequirementDto
  ) {
    // Enforce event ownership
    await this.getEventById(customerId, eventId);

    const req = await this.repo.findRequirementById(requirementId);
    if (!req || req.eventId !== eventId) {
      throw new NotFoundError('Event requirement not found');
    }

    return this.repo.updateRequirement(requirementId, data);
  }

  async deleteEventRequirement(customerId: string, eventId: string, requirementId: string) {
    // Enforce event ownership
    await this.getEventById(customerId, eventId);

    const req = await this.repo.findRequirementById(requirementId);
    if (!req || req.eventId !== eventId) {
      throw new NotFoundError('Event requirement not found');
    }

    return this.repo.deleteRequirement(requirementId);
  }
}
