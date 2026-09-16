import { Platform } from 'react-native';

// Local IP address of host computer (to allow physical devices and emulators to connect)
const DEV_API_URL = 'http://192.168.0.104:8000/api/v1';

export const Config = {
  API_URL: DEV_API_URL,
  RAZORPAY_KEY_ID: 'rzp_test_mockkeyid123',
};

export default Config;
