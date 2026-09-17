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

export class EventRepository {
  // =========================================================================
  // Event Types
  // =========================================================================

  async listActiveEventTypes() {
    return prisma.eventType.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async listAllEventTypes() {
    return prisma.eventType.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: {
            categories: true,
            events: true,
          },
        },
      },
    });
  }

  async getEventTypeById(id: string) {
    return prisma.eventType.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            category: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async getEventTypeBySlug(slug: string) {
    return prisma.eventType.findUnique({
      where: { slug },
    });
  }

  async createEventType(data: CreateEventTypeDto & { slug: string }) {
    return prisma.eventType.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        icon: data.icon,
        image: data.image,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateEventType(id: string, data: UpdateEventTypeDto & { slug?: string }) {
    return prisma.eventType.update({
      where: { id },
      data,
    });
  }

  async deleteEventType(id: string) {
    return prisma.eventType.delete({
      where: { id },
    });
  }

  async getRecommendedCategories(eventTypeId: string) {
    return prisma.eventTypeCategory.findMany({
      where: {
        eventTypeId,
        category: {
          isActive: true,
        },
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        category: true,
      },
    });
  }

  async mapCategoryToEventType(eventTypeId: string, data: MapCategoryToEventTypeDto) {
    return prisma.eventTypeCategory.upsert({
      where: {
        eventTypeId_categoryId: {
          eventTypeId,
          categoryId: data.categoryId,
        },
      },
      update: {
        isRecommended: data.isRecommended ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      create: {
        eventTypeId,
        categoryId: data.categoryId,
        isRecommended: data.isRecommended ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
      include: {
        category: true,
      },
    });
  }

  async unmapCategoryFromEventType(eventTypeId: string, categoryId: string) {
    return prisma.eventTypeCategory.delete({
      where: {
        eventTypeId_categoryId: {
          eventTypeId,
          categoryId,
        },
      },
    });
  }

  // =========================================================================
  // Customer Events
  // =========================================================================

  async createEvent(customerId: string, data: CreateEventDto) {
    return prisma.event.create({
      data: {
        customerId,
        eventTypeId: data.eventTypeId,
        title: data.title,
        description: data.description,
        eventDate: new Date(data.eventDate),
        startTime: data.startTime,
        endTime: data.endTime,
        guestCount: data.guestCount,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        addressLine1: data.addressLine1,
        city: data.city,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
      },
      include: {
        eventType: true,
        requirements: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async findEventById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        eventType: true,
        requirements: {
          include: {
            category: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            bookings: true,
            quotes: true,
          },
        },
      },
    });
  }

  async listCustomerEvents(customerId: string) {
    return prisma.event.findMany({
      where: { customerId },
      include: {
        eventType: true,
        requirements: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            requirements: true,
            bookings: true,
            quotes: true,
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });
  }

  async updateEvent(id: string, data: UpdateEventDto) {
    const updatePayload: any = { ...data };
    if (data.eventDate) {
      updatePayload.eventDate = new Date(data.eventDate);
    }

    return prisma.event.update({
      where: { id },
      data: updatePayload,
      include: {
        eventType: true,
        requirements: {
          include: {
            category: true,
          },
        },
      },
    });
  }

  async deleteEvent(id: string) {
    return prisma.event.delete({
      where: { id },
    });
  }

  // =========================================================================
  // Event Requirements
  // =========================================================================

  async createRequirement(eventId: string, data: CreateEventRequirementDto) {
    return prisma.eventRequirement.create({
      data: {
        eventId,
        categoryId: data.categoryId,
        quantity: data.quantity ?? 1,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        notes: data.notes,
      },
      include: {
        category: true,
      },
    });
  }

  async findRequirementById(id: string) {
    return prisma.eventRequirement.findUnique({
      where: { id },
      include: {
        category: true,
        event: true,
      },
    });
  }

  async listRequirementsByEvent(eventId: string) {
    return prisma.eventRequirement.findMany({
      where: { eventId },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateRequirement(id: string, data: UpdateEventRequirementDto) {
    return prisma.eventRequirement.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async deleteRequirement(id: string) {
    return prisma.eventRequirement.delete({
      where: { id },
    });
  }
}
