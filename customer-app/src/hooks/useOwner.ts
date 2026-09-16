import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ownerService from '../api/owner.service';
import requestService from '../api/request.service';
import { UpdateVehiclePayload } from '../types/vehicle-management';
import { DashboardStats } from '../types/owner';

/**
 * Hook to retrieve owner registered vehicles list.
 */
export const useOwnerVehicles = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['ownerVehicles', params],
    queryFn: () => ownerService.getMyVehicles(params),
  });
};

/**
 * Hook to retrieve requests assigned to owner's vehicles.
 */
export const useOwnerBookings = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['ownerRequests', params],
    queryFn: () => requestService.getOwnerRequests(params),
  });
};

/**
 * Mutation hook to register a new vehicle with multipart data.
 */
export const useCreateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => ownerService.createVehicle(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

/**
 * Mutation hook to patch existing vehicle details.
 */
export const useUpdateVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateVehiclePayload }) =>
      ownerService.updateVehicle(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ownerVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', data.id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

/**
 * Mutation to delete a vehicle listing.
 */
export const useDeleteVehicle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ownerService.deleteVehicle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerVehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    },
  });
};

/**
 * Mutation hook to approve (accept) a request.
 */
export const useApproveBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.acceptRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyRequests'] });
    },
  });
};

/**
 * Mutation hook to reject a request.
 */
export const useRejectBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearbyRequests'] });
    },
  });
};

/**
 * statistics hook
 */
export const useDashboardStats = () => {
  const { data: vehiclesData, isLoading: vehiclesLoading, error: vehiclesError, refetch: refetchVehicles } = useOwnerVehicles({ limit: 100 });
  const { data: requestsData, isLoading: requestsLoading, error: requestsError, refetch: refetchRequests } = useOwnerBookings({ limit: 100 });

  const isLoading = vehiclesLoading || requestsLoading;
  const isError = !!vehiclesError || !!requestsError;

  const vehicles = vehiclesData?.vehicles || [];
  const requests = requestsData?.requests || [];

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'ACTIVE' && v.isAvailable).length;

  const totalBookings = requests.length;
  const pendingRequests = requests.filter((r: any) => r.status === 'PENDING').length;

  const revenue = requests
    .filter((r: any) => r.status === 'ACCEPTED' || r.status === 'COMPLETED')
    .reduce((acc: number, curr: any) => acc + curr.estimatedFare, 0);

  const stats: DashboardStats = {
    totalVehicles,
    activeVehicles,
    totalBookings,
    pendingRequests,
    revenue,
  };

  const refetch = async () => {
    await Promise.all([refetchVehicles(), refetchRequests()]);
  };

  return {
    isLoading,
    isError,
    data: stats,
    refetch,
  };
};
