import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import requestService, { CreateRequestPayload } from '../api/request.service';

export const useMyRequests = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['myRequests', params],
    queryFn: () => requestService.getMyRequests(params),
  });
};

export const useOwnerRequests = (params?: { page?: number; limit?: number; status?: string }) => {
  return useQuery({
    queryKey: ['ownerRequests', params],
    queryFn: () => requestService.getOwnerRequests(params),
  });
};

export const useNearbyRequests = () => {
  return useQuery({
    queryKey: ['nearbyRequests'],
    queryFn: () => requestService.getNearbyRequests(),
    refetchInterval: 10000, // Poll nearby requests every 10 seconds to keep live feed updated
  });
};

export const useRequest = (id: string) => {
  return useQuery({
    queryKey: ['request', id],
    queryFn: () => requestService.getRequestById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      // Poll active requests that are not completed, cancelled, or rejected to update user real-time status
      const data = query.state.data;
      if (data && ['PENDING', 'OWNER_ASSIGNED'].includes(data.status)) {
        return 3000;
      }
      return false;
    },
  });
};

export const useCreateRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => requestService.createRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
};

export const useAcceptRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.acceptRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['nearbyRequests'] });
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
    },
  });
};

export const useRejectRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.rejectRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nearbyRequests'] });
    },
  });
};

export const useCompleteTrip = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.completeTrip(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['ownerRequests'] });
    },
  });
};

export const useCancelRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => requestService.cancelRequest(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      queryClient.invalidateQueries({ queryKey: ['myRequests'] });
    },
  });
};
