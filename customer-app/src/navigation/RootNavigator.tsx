import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, Platform, View, StatusBar } from 'react-native';
import { useAppSelector } from '../store';
import OfflineBanner from '../components/OfflineBanner';
import { useUnreadCount } from '../hooks/useNotifications';
import colors from '../theme/colors';
import {
  AuthStackParamList,
  HomeStackParamList,
  AppTabParamList,
  ProfileStackParamList,
} from './types';

// Auth Screens
import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Home Screen
import HomeScreen from '../screens/home/HomeScreen';

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

// Profile Screen
import ProfileScreen from '../screens/profile/ProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

// 1. Auth Stack Navigator (Customer Only)
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
    </HomeStack.Navigator>
  );
};

// 3. Profile Stack Navigator
const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <ProfileStack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </ProfileStack.Navigator>
  );
};

// 4. Main App Bottom Tab Navigator
const AppTabNavigator = () => {
  const { data: unreadCountData } = useUnreadCount();
  const unreadCount = unreadCountData?.count || 0;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarIcon: ({ color }) => {
          let icon = '';
          if (route.name === 'HomeTab') icon = '🏠';
          else if (route.name === 'NotificationTab') icon = '🔔';
          else if (route.name === 'ProfileTab') icon = '👤';

          return <Text style={{ fontSize: 20, color }}>{icon}</Text>;
        },
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name="NotificationTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: '#ef4444',
            color: '#ffffff',
            fontSize: 10,
            lineHeight: 14,
          },
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
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
      {isAuthenticated ? <AppTabNavigator /> : <AuthStackNavigator />}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});

export default RootNavigator;
