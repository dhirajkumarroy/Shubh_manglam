import apiClient from './client';

export interface AddressItem {
  id: string;
  userId: string;
  label: string | null;
  addressLine1: string;
  addressLine2: string | null;
  village: string | null;
  locality: string | null;
  city: string;
  district: string | null;
  state: string;
  country: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressPayload {
  label?: string;
  addressLine1: string;
  addressLine2?: string;
  village?: string;
  locality?: string;
  city: string;
  district?: string;
  state: string;
  country?: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface UpdateAddressPayload {
  label?: string;
  addressLine1?: string;
  addressLine2?: string;
  village?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export const AddressService = {
  async getAddresses(): Promise<AddressItem[]> {
    const res = await apiClient.get<{ success: boolean; data: AddressItem[] }>('/addresses');
    return res.data.data || [];
  },

  async getAddressById(id: string): Promise<AddressItem> {
    const res = await apiClient.get<{ success: boolean; data: AddressItem }>(`/addresses/${id}`);
    return res.data.data;
  },

  async createAddress(payload: CreateAddressPayload): Promise<AddressItem> {
    const res = await apiClient.post<{ success: boolean; data: AddressItem }>('/addresses', payload);
    return res.data.data;
  },

  async updateAddress(id: string, payload: UpdateAddressPayload): Promise<AddressItem> {
    const res = await apiClient.patch<{ success: boolean; data: AddressItem }>(`/addresses/${id}`, payload);
    return res.data.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/addresses/${id}`);
  },
};

export default AddressService;
