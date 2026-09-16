export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'OWNER' | 'ADMIN';
  isEmailVerified: boolean;
  avatar: string | null;
}

export interface UpdateProfilePayload {
  name: string;
  phone: string;
}

export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}
