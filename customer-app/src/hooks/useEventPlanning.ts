import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EventService, {
  CreateEventPayload,
  UpdateEventPayload,
  CreateRequirementPayload,
  UpdateRequirementPayload,
} from '../api/event.service';
import AddressService, {
  CreateAddressPayload,
  UpdateAddressPayload,
} from '../api/address.service';
import MarketplaceService from '../api/marketplace.service';

export const useEventTypes = () => {
  return useQuery({
    queryKey: ['event-types'],
    queryFn: () => EventService.getEventTypes(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRecommendedCategories = (eventTypeId?: string) => {
  return useQuery({
    queryKey: ['event-type-categories', eventTypeId],
    queryFn: () => (eventTypeId ? EventService.getRecommendedCategories(eventTypeId) : []),
    enabled: !!eventTypeId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCustomerEvents = () => {
  return useQuery({
    queryKey: ['customer-events'],
    queryFn: () => EventService.getEvents(),
  });
};

export const useEventDetails = (eventId?: string) => {
  return useQuery({
    queryKey: ['customer-event', eventId],
    queryFn: () => (eventId ? EventService.getEventById(eventId) : null),
    enabled: !!eventId,
  });
};

export const useEventRequirements = (eventId?: string) => {
  return useQuery({
    queryKey: ['event-requirements', eventId],
    queryFn: () => (eventId ? EventService.getEventRequirements(eventId) : []),
    enabled: !!eventId,
  });
};

export const useCustomerAddresses = () => {
  return useQuery({
    queryKey: ['customer-addresses'],
    queryFn: () => AddressService.getAddresses(),
  });
};

export const useMarketplaceVendors = (params?: any) => {
  return useQuery({
    queryKey: ['marketplace-vendors', params],
    queryFn: () => MarketplaceService.getVendors(params),
    staleTime: 30 * 1000,
  });
};

export const useVendorDetails = (vendorId?: string, coords?: { latitude?: number; longitude?: number }) => {
  return useQuery({
    queryKey: ['marketplace-vendor', vendorId, coords],
    queryFn: () => (vendorId ? MarketplaceService.getVendorById(vendorId, coords) : null),
    enabled: !!vendorId,
  });
};

export const useMarketplaceCategories = (params?: any) => {
  return useQuery({
    queryKey: ['marketplace-categories', params],
    queryFn: () => MarketplaceService.getCategories(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useMarketplaceServices = (params?: any) => {
  return useQuery({
    queryKey: ['marketplace-services', params],
    queryFn: () => MarketplaceService.getServices(params),
    staleTime: 30 * 1000,
  });
};

export const useServiceDetails = (serviceId?: string) => {
  return useQuery({
    queryKey: ['marketplace-service', serviceId],
    queryFn: () => (serviceId ? MarketplaceService.getServiceById(serviceId) : null),
    enabled: !!serviceId,
  });
};

export const useMarketplacePackages = (params?: any) => {
  return useQuery({
    queryKey: ['marketplace-packages', params],
    queryFn: () => MarketplaceService.getPackages(params),
    staleTime: 30 * 1000,
  });
};

export const usePackageDetails = (packageId?: string) => {
  return useQuery({
    queryKey: ['marketplace-package', packageId],
    queryFn: () => (packageId ? MarketplaceService.getPackageById(packageId) : null),
    enabled: !!packageId,
  });
};

// =========================================================================
// Mutations with Invalidation
// =========================================================================

export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => EventService.createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: UpdateEventPayload }) =>
      EventService.updateEvent(eventId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
      queryClient.invalidateQueries({ queryKey: ['customer-event', eventId] });
    },
  });
};

export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => EventService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
    },
  });
};

export const useCreateRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: CreateRequirementPayload }) =>
      EventService.createEventRequirement(eventId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-requirements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['customer-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
    },
  });
};

export const useDeleteRequirement = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, requirementId }: { eventId: string; requirementId: string }) =>
      EventService.deleteEventRequirement(eventId, requirementId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event-requirements', eventId] });
      queryClient.invalidateQueries({ queryKey: ['customer-event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['customer-events'] });
    },
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => AddressService.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AddressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-addresses'] });
    },
  });
};
