import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ProviderSplashScreen from '../screens/ProviderSplashScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="ProviderSplash" component={ProviderSplashScreen} />
      <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
    </Stack.Navigator>
  );
};

export default RootNavigator;
