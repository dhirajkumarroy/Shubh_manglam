import React from 'react';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import store from './src/store';
import RootNavigator from './src/navigation/RootNavigator';

// Global React Query Client with optimal production configurations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // Stale time of 1 minute
      gcTime: 300000, // Garbage collection time of 5 minutes
      retry: 2, // Retry failed requests twice
      refetchOnWindowFocus: true,
    },
  },
});

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </Provider>
  );
}
