import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform, View, StatusBar } from 'react-native';
import { useAppSelector, useAppDispatch } from '../store';
import { logoutUser } from '../store/slices/authSlice';
import OfflineBanner from '../components/OfflineBanner';
import { useUnreadCount } from '../hooks/useNotifications';
import colors from '../theme/colors';
import {
  AuthStackParamList,
  HomeStackParamList,
  AppTabParamList,
  ProfileStackParamList,
} from './types';
import { navigate } from './navigationRef';

// Top Bar, Side Menu & Bottom Bar Components
import UserTopBar from '../components/UserTopBar';
import UserSideMenu from '../components/UserSideMenu';
import UserBottomBar from '../components/UserBottomBar';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Home & Explore Screens
import HomeScreen from '../screens/home/HomeScreen';
import ExploreScreen from '../screens/marketplace/ExploreScreen';
import FavoritesScreen from '../screens/marketplace/FavoritesScreen';

// Event Planning Screens
import EventTypesScreen from '../screens/events/EventTypesScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventDetailsScreen from '../screens/events/EventDetailsScreen';
import EventRequirementsScreen from '../screens/events/EventRequirementsScreen';

// Location Screen
import LocationSelectionScreen from '../screens/location/LocationSelectionScreen';

// Marketplace Screens
import CategoryDiscoveryScreen from '../screens/marketplace/CategoryDiscoveryScreen';
import VendorDiscoveryScreen from '../screens/marketplace/VendorDiscoveryScreen';
import VendorDetailsScreen from '../screens/marketplace/VendorDetailsScreen';
import ServiceDetailsScreen from '../screens/marketplace/ServiceDetailsScreen';
import PackageDetailsScreen from '../screens/marketplace/PackageDetailsScreen';

// Notification Screen
import NotificationsScreen from '../screens/notification/NotificationsScreen';

// Inquiries Screen
import CustomerInquiriesScreen from '../screens/events/CustomerInquiriesScreen';

// Quotes & Bookings Screens
import QuotesListScreen from '../screens/quotes/QuotesListScreen';
import QuoteDetailsScreen from '../screens/quotes/QuoteDetailsScreen';
import MyBookingsScreen from '../screens/bookings/MyBookingsScreen';
import BookingDetailsScreen from '../screens/bookings/BookingDetailsScreen';

// Profile Screen
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

// 1. Auth Stack Navigator
const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// 2. Home Stack Navigator
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeScreen" component={HomeScreen} />
      <HomeStack.Screen name="EventTypesScreen" component={EventTypesScreen} />
      <HomeStack.Screen name="CreateEventScreen" component={CreateEventScreen} />
      <HomeStack.Screen name="EventDetailsScreen" component={EventDetailsScreen} />
      <HomeStack.Screen name="EventRequirementsScreen" component={EventRequirementsScreen} />
      <HomeStack.Screen name="LocationSelectionScreen" component={LocationSelectionScreen} />
      <HomeStack.Screen name="CategoryDiscoveryScreen" component={CategoryDiscoveryScreen} />
      <HomeStack.Screen name="VendorDiscoveryScreen" component={VendorDiscoveryScreen} />
      <HomeStack.Screen name="VendorDetailsScreen" component={VendorDetailsScreen} />
      <HomeStack.Screen name="ServiceDetailsScreen" component={ServiceDetailsScreen} />
      <HomeStack.Screen name="PackageDetailsScreen" component={PackageDetailsScreen} />
      <HomeStack.Screen name="CustomerInquiriesScreen" component={CustomerInquiriesScreen} />
      <HomeStack.Screen name="QuotesListScreen" component={QuotesListScreen} />
      <HomeStack.Screen name="QuoteDetailsScreen" component={QuoteDetailsScreen} />
      <HomeStack.Screen name="MyBookingsScreen" component={MyBookingsScreen} />
      <HomeStack.Screen name="BookingDetailsScreen" component={BookingDetailsScreen} />
    </HomeStack.Navigator>
  );
};

// 3. Events Stack Navigator
const EventsStackNavigator = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="EventTypesScreen" component={EventTypesScreen} />
      <HomeStack.Screen name="CreateEventScreen" component={CreateEventScreen} />
      <HomeStack.Screen name="EventDetailsScreen" component={EventDetailsScreen} />
      <HomeStack.Screen name="EventRequirementsScreen" component={EventRequirementsScreen} />
    </HomeStack.Navigator>
  );
};

// 4. Profile Stack Navigator
const ProfileStackNav = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <ProfileStack.Screen name="CustomerInquiriesScreen" component={CustomerInquiriesScreen} />
    </ProfileStack.Navigator>
  );
};

// 5. Main 6-Tab Navigator (Home, Explore, My Events, Messages, Favorites, Profile)
const AppTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <UserBottomBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="ExploreTab"
        component={ExploreScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStackNavigator}
        options={{ tabBarLabel: 'My Events' }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={CustomerInquiriesScreen}
        options={{ tabBarLabel: 'Messages' }}
      />
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesScreen}
        options={{ tabBarLabel: 'Favorites' }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNav}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// 6. User Main Shell with Top Toolbar & Side Menu Drawer
const UserMainShell = () => {
  const [sideMenuVisible, setSideMenuVisible] = useState(false);
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count || 0;

  return (
    <View style={styles.shellContainer}>
      {/* Top Tool Bar */}
      <UserTopBar
        userName={user?.name || 'Priya Sharma'}
        unreadNotificationsCount={unreadCount}
        onOpenMenu={() => setSideMenuVisible(true)}
        onOpenNotifications={() => navigate('NotificationTab')}
        onOpenProfile={() => navigate('ProfileTab')}
      />

      {/* Main Tab Area with Persistent Bottom Menu Bar */}
      <View style={styles.tabContentArea}>
        <AppTabNavigator />
      </View>

      {/* Slide-out Side Menu Drawer */}
      <UserSideMenu
        visible={sideMenuVisible}
        onClose={() => setSideMenuVisible(false)}
        userName={user?.name || 'Priya Sharma'}
        phone={user?.phone || '+91 98765 43210'}
        email={user?.email || 'user@shubhausar.com'}
        onNavigateHome={() => navigate('HomeTab')}
        onNavigateExplore={() => navigate('ExploreTab')}
        onNavigateQuotes={() => navigate('HomeTab', { screen: 'QuotesListScreen' })}
        onNavigateBookings={() => navigate('HomeTab', { screen: 'MyBookingsScreen' })}
        onNavigateInquiries={() => navigate('MessagesTab')}
        onNavigateEvents={() => navigate('EventsTab')}
        onNavigateLocations={() => navigate('HomeTab', { screen: 'LocationSelectionScreen' })}
        onNavigateNotifications={() => navigate('NotificationTab')}
        onNavigateProfile={() => navigate('ProfileTab')}
        onNavigateChangePassword={() => navigate('ChangePassword')}
        onLogout={() => dispatch(logoutUser())}
      />
    </View>
  );
};

export const RootNavigator: React.FC = () => {
  const { isAuthenticated, isResolved } = useAppSelector((state) => state.auth);

  if (!isResolved) {
    return <SplashScreen />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <OfflineBanner />
      {isAuthenticated ? <UserMainShell /> : <AuthStackNavigator />}
    </View>
  );
};

const styles = StyleSheet.create({
  shellContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabContentArea: {
    flex: 1,
  },
});

export default RootNavigator;
