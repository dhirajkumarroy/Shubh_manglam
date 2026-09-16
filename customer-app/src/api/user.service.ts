import apiClient from './client';
import { UserProfile, UpdateProfilePayload, ChangePasswordPayload } from '../types/user';

export const userService = {
  /**
   * Retrieves the profile details of the authenticated user.
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiClient.get('/users/profile');
    return response.data.data;
  },

  /**
   * Updates the profile details (name and phone) of the user.
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.patch('/users/profile', payload);
    return response.data.data;
  },

  /**
   * Changes the user's password.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    const response = await apiClient.patch('/users/change-password', {
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
    });
    return response.data;
  },

  /**
   * Uploads/updates profile avatar using multipart/form-data.
   */
  async uploadAvatar(formData: FormData): Promise<UserProfile> {
    const response = await apiClient.patch('/users/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
};

export default userService;
