const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

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
  private getToken(): string | null {
    return sessionStorage.getItem('admin_access_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Request failed');
    }
    return data.data;
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
