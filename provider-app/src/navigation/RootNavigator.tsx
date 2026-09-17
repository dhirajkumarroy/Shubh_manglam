import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import ProviderSplashScreen from '../screens/ProviderSplashScreen';
import ProviderHomeScreen from '../screens/ProviderHomeScreen';
import ProviderMainScreen from '../screens/ProviderMainScreen';
import ProviderLoginScreen from '../screens/ProviderLoginScreen';
import ProviderRegisterScreen from '../screens/ProviderRegisterScreen';
import VendorOnboardingScreen from '../screens/VendorOnboardingScreen';
import CatalogDashboardScreen from '../screens/CatalogDashboardScreen';
import ServiceFormScreen from '../screens/ServiceFormScreen';
import ServiceImagesScreen from '../screens/ServiceImagesScreen';
import PackageFormScreen from '../screens/PackageFormScreen';
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
          <ProviderMainScreen
            vendorStatus={route.params?.vendorStatus}
            onNavigateToOnboarding={() => navigation.navigate('VendorOnboarding')}
            onAddService={() => navigation.navigate('ServiceForm')}
            onEditService={(id) => navigation.navigate('ServiceForm', { serviceId: id })}
            onManageImages={(serviceId, serviceName) =>
              navigation.navigate('ServiceImages', { serviceId, serviceName })
            }
            onAddPackage={() => navigation.navigate('PackageForm')}
            onEditPackage={(id) => navigation.navigate('PackageForm', { packageId: id })}
            onLogout={async () => {
              await ProviderApiService.logout();
              navigation.replace('ProviderLogin');
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CatalogDashboard">
        {({ navigation }) => (
          <CatalogDashboardScreen
            onBack={() => navigation.navigate('ProviderHome')}
            onAddService={() => navigation.navigate('ServiceForm')}
            onEditService={(id) => navigation.navigate('ServiceForm', { serviceId: id })}
            onManageImages={(serviceId, serviceName) =>
              navigation.navigate('ServiceImages', { serviceId, serviceName })
            }
            onAddPackage={() => navigation.navigate('PackageForm')}
            onEditPackage={(id) => navigation.navigate('PackageForm', { packageId: id })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ServiceForm">
        {({ route, navigation }) => (
          <ServiceFormScreen
            serviceId={route.params?.serviceId}
            onBack={() => navigation.navigate('ProviderHome')}
            onSuccess={() => navigation.navigate('ProviderHome')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ServiceImages">
        {({ route, navigation }) => (
          <ServiceImagesScreen
            serviceId={route.params.serviceId}
            serviceName={route.params.serviceName}
            onBack={() => navigation.navigate('ProviderHome')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PackageForm">
        {({ route, navigation }) => (
          <PackageFormScreen
            packageId={route.params?.packageId}
            onBack={() => navigation.navigate('ProviderHome')}
            onSuccess={() => navigation.navigate('ProviderHome')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
};

export default RootNavigator;
