import { Platform } from 'react-native';

// Host machine LAN IP address (Current Wi-Fi: 192.168.0.102)
// This allows physical devices (iPhone / Android) and emulators to reach the backend
const DEV_API_URL = 'http://192.168.0.102:8000/api/v1';

export const Config = {
  API_URL: DEV_API_URL,
  RAZORPAY_KEY_ID: 'rzp_test_mockkeyid123',
};

export default Config;
