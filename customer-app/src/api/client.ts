import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Config from '../config';

const apiClient = axios.create({
  baseURL: Config.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically inject active JWT credentials
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global exception models
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Collect error message from backend error format
    const errorMessage =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      'An unexpected error occurred.';
    
    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
