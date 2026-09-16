import apiClient from './client';

export interface CreateRequestPayload {
  purpose: string;
  description: string;
  pickupAddress: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropAddress: string;
  dropLatitude: number;
  dropLongitude: number;
  requiredVehicleCategory: string;
  scheduledAt: string;
}

export const requestService = {
  /**
   * Suggests estimated fares for all available vehicle categories based on pickup/drop coordinates.
   */
  async getEstimates(params: {
    pickupLat: number;
    pickupLng: number;
    dropLat: number;
    dropLng: number;
  }): Promise<any> {
    const response = await apiClient.get('/requests/estimates', { params });
    return response.data.data;
  },

  /**
   * Submits a new transport requirement.
   */
  async createRequest(payload: CreateRequestPayload): Promise<any> {
    const response = await apiClient.post('/requests', payload);
    return response.data.data;
  },

  /**
   * Retrieves paginated requests submitted by the customer.
   */
  async getMyRequests(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const response = await apiClient.get('/requests/customer/my-requests', { params });
    return response.data.data;
  },

  /**
   * Retrieves requests assigned to the owner.
   */
  async getOwnerRequests(params?: { page?: number; limit?: number; status?: string }): Promise<any> {
    const response = await apiClient.get('/requests/owner/my-requests', { params });
    return response.data.data;
  },

  /**
   * Retrieves pending requests within operating range of owner's vehicles.
   */
  async getNearbyRequests(): Promise<any[]> {
    const response = await apiClient.get('/requests/owner/nearby');
    return response.data.data;
  },

  /**
   * Retrieves detailed parameters of a request by database UUID.
   */
  async getRequestById(id: string): Promise<any> {
    const response = await apiClient.get(`/requests/${id}`);
    return response.data.data;
  },

  /**
   * Accept a pending requirement (Owner only).
   */
  async acceptRequest(id: string): Promise<any> {
    const response = await apiClient.post(`/requests/${id}/accept`);
    return response.data.data;
  },

  /**
   * Reject/dismiss a requirement from live list (Owner only).
   */
  async rejectRequest(id: string): Promise<any> {
    const response = await apiClient.post(`/requests/${id}/reject`);
    return response.data.data;
  },

  /**
   * Mark an active trip completed (Owner only).
   */
  async completeTrip(id: string): Promise<any> {
    const response = await apiClient.post(`/requests/${id}/complete`);
    return response.data.data;
  },

  /**
   * Cancel a pending requirement (Customer only).
   */
  async cancelRequest(id: string): Promise<any> {
    const response = await apiClient.post(`/requests/${id}/cancel`);
    return response.data.data;
  },
};

export default requestService;
