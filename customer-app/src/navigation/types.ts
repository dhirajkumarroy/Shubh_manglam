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
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  ChangePassword: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  NotificationTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  AuthStack: undefined;
  AppStack: undefined;
};
