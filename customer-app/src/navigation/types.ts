export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  HomeScreen: undefined;
  OwnerDashboard: undefined;
  MyVehicles: undefined;
  CreateVehicle: undefined;
  EditVehicle: { vehicleId: string };
  CreateRequest: { purpose?: string };
  RequestDetails: { requestId: string };
  PaymentScreen: { requestId: string; amount: number };
};

export type VehicleStackParamList = {
  VehicleList: undefined;
  VehicleDetails: { id: string };
};

export type BookingStackParamList = {
  MyBookings: undefined;
  RequestDetails: { requestId: string };
  PaymentScreen: { requestId: string; amount: number };
};

export type AppTabParamList = {
  HomeTab: undefined;
  VehicleTab: undefined;
  BookingTab: undefined;
  NotificationTab: undefined;
  ProfileTab: undefined;
};

export type ProfileStackParamList = {
  ProfileScreen: undefined;
  ChangePassword: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  AuthStack: undefined;
  AppStack: undefined;
};
