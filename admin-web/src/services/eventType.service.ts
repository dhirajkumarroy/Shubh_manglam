import apiClient from './apiClient';

export interface EventTypeItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    categories: number;
    events: number;
  };
}

class AdminEventTypeService {
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return apiClient.request<T>(endpoint, options);
  }

  async listEventTypes(): Promise<EventTypeItem[]> {
    return this.request<EventTypeItem[]>('/admin/event-types');
  }

  async createEventType(payload: {
    name: string;
    description?: string;
    icon?: string;
    sortOrder?: number;
  }): Promise<EventTypeItem> {
    return this.request<EventTypeItem>('/admin/event-types', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateEventType(
    id: string,
    payload: { name?: string; description?: string; icon?: string; isActive?: boolean; sortOrder?: number }
  ): Promise<EventTypeItem> {
    return this.request<EventTypeItem>(`/admin/event-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  async deleteEventType(id: string): Promise<void> {
    await this.request(`/admin/event-types/${id}`, {
      method: 'DELETE',
    });
  }

  async mapCategory(eventTypeId: string, categoryId: string): Promise<void> {
    await this.request(`/admin/event-types/${eventTypeId}/categories`, {
      method: 'POST',
      body: JSON.stringify({ categoryId }),
    });
  }

  async unmapCategory(eventTypeId: string, categoryId: string): Promise<void> {
    await this.request(`/admin/event-types/${eventTypeId}/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }
}

export const eventTypeService = new AdminEventTypeService();
export default eventTypeService;
