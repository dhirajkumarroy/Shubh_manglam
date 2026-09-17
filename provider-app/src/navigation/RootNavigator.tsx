import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ProviderSplashScreen from '../screens/ProviderSplashScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';
import ProviderLoginScreen from '../screens/ProviderLoginScreen';
import ProviderRegisterScreen from '../screens/ProviderRegisterScreen';
import VendorOnboardingScreen from '../screens/VendorOnboardingScreen';
import { ProviderApiService } from '../services/api';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="ProviderSplash" component={ProviderSplashScreen} />
      <Stack.Screen name="ProviderLogin">
        {({ navigation }) => (
          <ProviderLoginScreen
            onSuccess={(data) => {
              if (!data.vendor || data.vendor.status === 'PENDING') {
                navigation.replace('VendorOnboarding');
              } else {
                navigation.replace('ProviderHome', {
                  vendorStatus: data.vendor.status,
                });
              }
            }}
            onNavigateToRegister={() => navigation.navigate('ProviderRegister')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ProviderRegister">
        {({ navigation }) => (
          <ProviderRegisterScreen
            onSuccess={() => {
              navigation.replace('VendorOnboarding');
            }}
            onNavigateToLogin={() => navigation.navigate('ProviderLogin')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="VendorOnboarding">
        {({ navigation }) => (
          <VendorOnboardingScreen
            onFinish={() => navigation.navigate('ProviderHome')}
            onLogout={async () => {
              await ProviderApiService.logout();
              navigation.replace('ProviderLogin');
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ProviderHome">
        {({ route, navigation }) => (
          <ProviderHomeScreen
            vendorStatus={route.params?.vendorStatus}
            onNavigateToOnboarding={() => navigation.navigate('VendorOnboarding')}
            onLogout={async () => {
              await ProviderApiService.logout();
              navigation.replace('ProviderLogin');
            }}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
