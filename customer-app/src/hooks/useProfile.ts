import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../api/user.service';
import { UpdateProfilePayload, ChangePasswordPayload } from '../types/user';
import { useAppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';

/**
 * Hook to retrieve the authenticated user profile details.
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userService.getProfile(),
  });
};

/**
 * Mutation hook to update user profile parameters (name and phone).
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userService.updateProfile(payload),
    onSuccess: (updatedUser) => {
      // Invalidate queries to refresh states
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Update Redux authentication state to keep components synchronized
      dispatch(updateUser(updatedUser));
    },
  });
};

/**
 * Mutation hook to submit password modification requests.
 */
export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userService.changePassword(payload),
  });
};

/**
 * Mutation hook to upload and associate a new profile avatar image.
 */
export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: (formData: FormData) => userService.uploadAvatar(formData),
    onSuccess: (updatedUser) => {
      // Invalidate queries to refresh states
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Update Redux authentication state to reflect new avatar URL
      dispatch(updateUser(updatedUser));
    },
  });
};
