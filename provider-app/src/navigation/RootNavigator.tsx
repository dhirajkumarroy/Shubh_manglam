import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ProviderSplashScreen from '../screens/ProviderSplashScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';
import ProviderLoginScreen from '../screens/ProviderLoginScreen';
import ProviderRegisterScreen from '../screens/ProviderRegisterScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="ProviderSplash" component={ProviderSplashScreen} />
      <Stack.Screen name="ProviderLogin">
        {({ navigation }) => (
          <ProviderLoginScreen
            onSuccess={(data) => {
              navigation.replace('ProviderHome', {
                vendorStatus: data.vendor?.status,
              });
            }}
            onNavigateToRegister={() => navigation.navigate('ProviderRegister')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ProviderRegister">
        {({ navigation }) => (
          <ProviderRegisterScreen
            onSuccess={(data) => {
              navigation.replace('ProviderHome', {
                vendorStatus: data.vendor?.status || 'PENDING',
              });
            }}
            onNavigateToLogin={() => navigation.navigate('ProviderLogin')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ProviderHome">
        {({ route }) => (
          <ProviderHomeScreen
            vendorStatus={route.params?.vendorStatus}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
