import { Platform } from 'react-native';

// Host machine LAN IP address detected from Expo (10.44.62.6)
// This allows physical devices (iPhone / Android) and emulators to reach the backend
const DEV_API_URL = 'http://10.44.62.6:8000/api/v1';

export const Config = {
  API_URL: DEV_API_URL,
  RAZORPAY_KEY_ID: 'rzp_test_mockkeyid123',
};

export default Config;
