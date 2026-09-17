export interface CreateAddressDto {
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

export interface UpdateAddressDto {
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
