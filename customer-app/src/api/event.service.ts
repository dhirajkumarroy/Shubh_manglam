import apiClient from './client';

export interface EventTypeItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface EventCategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface EventRequirementItem {
  id: string;
  eventId: string;
  categoryId: string;
  quantity: number;
  budgetMin: number | null;
  budgetMax: number | null;
  notes: string | null;
  status: 'OPEN' | 'QUOTED' | 'BOOKED' | 'CANCELLED';
  category: EventCategoryItem;
  createdAt: string;
}

export interface EventItem {
  id: string;
  customerId: string;
  eventTypeId: string;
  title: string;
  description: string | null;
  eventDate: string;
  startTime: string | null;
  endTime: string | null;
  guestCount: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  addressLine1: string;
  city: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  status: 'DRAFT' | 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  eventType?: EventTypeItem;
  requirements?: EventRequirementItem[];
  _count?: {
    requirements?: number;
    bookings?: number;
    quotes?: number;
  };
}

export interface CreateEventPayload {
  eventTypeId: string;
  title: string;
  description?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  addressLine1: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateEventPayload {
  eventTypeId?: string;
  title?: string;
  description?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  addressLine1?: string;
  city?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  status?: string;
}

export interface CreateRequirementPayload {
  categoryId: string;
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
}

export interface UpdateRequirementPayload {
  quantity?: number;
  budgetMin?: number;
  budgetMax?: number;
  notes?: string;
  status?: string;
}

export const EventService = {
  async getEventTypes(): Promise<EventTypeItem[]> {
    const res = await apiClient.get<{ success: boolean; data: EventTypeItem[] }>('/event-types');
    return res.data.data || [];
  },

  async getEventTypeById(id: string): Promise<EventTypeItem> {
    const res = await apiClient.get<{ success: boolean; data: EventTypeItem }>(`/event-types/${id}`);
    return res.data.data;
  },

  async getRecommendedCategories(eventTypeId: string): Promise<EventCategoryItem[]> {
    const res = await apiClient.get<{ success: boolean; data: EventCategoryItem[] }>(
      `/event-types/${eventTypeId}/categories`
    );
    return res.data.data || [];
  },

  async getEvents(): Promise<EventItem[]> {
    const res = await apiClient.get<{ success: boolean; data: EventItem[] }>('/events');
    return res.data.data || [];
  },

  async getEventById(eventId: string): Promise<EventItem> {
    const res = await apiClient.get<{ success: boolean; data: EventItem }>(`/events/${eventId}`);
    return res.data.data;
  },

  async createEvent(payload: CreateEventPayload): Promise<EventItem> {
    const res = await apiClient.post<{ success: boolean; data: EventItem }>('/events', payload);
    return res.data.data;
  },

  async updateEvent(eventId: string, payload: UpdateEventPayload): Promise<EventItem> {
    const res = await apiClient.patch<{ success: boolean; data: EventItem }>(`/events/${eventId}`, payload);
    return res.data.data;
  },

  async deleteEvent(eventId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}`);
  },

  async getEventRequirements(eventId: string): Promise<EventRequirementItem[]> {
    const res = await apiClient.get<{ success: boolean; data: EventRequirementItem[] }>(
      `/events/${eventId}/requirements`
    );
    return res.data.data || [];
  },

  async createEventRequirement(eventId: string, payload: CreateRequirementPayload): Promise<EventRequirementItem> {
    const res = await apiClient.post<{ success: boolean; data: EventRequirementItem }>(
      `/events/${eventId}/requirements`,
      payload
    );
    return res.data.data;
  },

  async updateEventRequirement(
    eventId: string,
    requirementId: string,
    payload: UpdateRequirementPayload
  ): Promise<EventRequirementItem> {
    const res = await apiClient.patch<{ success: boolean; data: EventRequirementItem }>(
      `/events/${eventId}/requirements/${requirementId}`,
      payload
    );
    return res.data.data;
  },

  async deleteEventRequirement(eventId: string, requirementId: string): Promise<void> {
    await apiClient.delete(`/events/${eventId}/requirements/${requirementId}`);
  },
};

export default EventService;
