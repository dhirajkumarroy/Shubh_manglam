export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  EventTypesScreen: undefined;
  CreateEventScreen: { selectedEventType?: any } | undefined;
  EventDetailsScreen: { eventId: string };
  EventRequirementsScreen: { eventId: string };
  LocationSelectionScreen: { onSelectLocation?: (loc: any) => void } | undefined;
  CategoryDiscoveryScreen: { eventTypeId?: string; eventId?: string } | undefined;
  VendorDiscoveryScreen: {
    categoryId?: string;
    categoryName?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    eventTypeId?: string;
    eventId?: string;
  } | undefined;
  VendorDetailsScreen: {
    vendorId: string;
    vendorName?: string;
    latitude?: number;
    longitude?: number;
    eventId?: string;
  };
  ServiceDetailsScreen: {
    serviceId: string;
    vendor?: any;
    eventId?: string;
  };
  PackageDetailsScreen: {
    packageId: string;
    vendor?: any;
    eventId?: string;
  };
  CustomerInquiriesScreen: undefined;
  QuotesListScreen: undefined;
  QuoteDetailsScreen: { quoteId: string };
  MyBookingsScreen: undefined;
  BookingDetailsScreen: { bookingId: string };
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  ChangePassword: undefined;
  CustomerInquiriesScreen: undefined;
  QuotesListScreen: undefined;
  QuoteDetailsScreen: { quoteId: string };
  MyBookingsScreen: undefined;
  BookingDetailsScreen: { bookingId: string };
};

export type AppTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  EventsTab: undefined;
  MessagesTab: undefined;
  FavoritesTab: undefined;
  ProfileTab: undefined;
  // Legacy aliases
  QuotesTab?: undefined;
  BookingsTab?: undefined;
  InquiriesTab?: undefined;
  NotificationTab?: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  AuthStack: undefined;
  AppStack: undefined;
};
