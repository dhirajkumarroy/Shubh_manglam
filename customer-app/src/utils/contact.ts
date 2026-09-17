import { Linking, Alert } from 'react-native';

/**
 * Normalizes phone numbers for WhatsApp wa.me links.
 * Strips special characters and ensures 91 country prefix for 10-digit Indian numbers.
 */
export const cleanPhoneForWhatsApp = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
};

/**
 * Opens native phone dialer with the vendor phone number.
 */
export const openDialer = async (phone: string): Promise<void> => {
  if (!phone || !phone.trim()) {
    Alert.alert('Contact Unavailable', 'This provider has not listed a contact phone number yet.');
    return;
  }

  const cleanNumber = phone.trim();
  const url = `tel:${cleanNumber}`;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch (err) {
    console.error('Error opening dialer:', err);
    Alert.alert('Unable to Call', `Could not launch dialer for ${phone}. Please dial manually.`);
  }
};

/**
 * Opens WhatsApp chat with optional prefilled message for inquiry.
 */
export const openWhatsApp = async (phone: string, message?: string): Promise<void> => {
  if (!phone || !phone.trim()) {
    Alert.alert('WhatsApp Unavailable', 'This provider has not listed a WhatsApp number yet.');
    return;
  }

  const cleanedPhone = cleanPhoneForWhatsApp(phone);
  if (!cleanedPhone) {
    Alert.alert('Invalid Number', 'The provider phone number is invalid.');
    return;
  }

  const encodedMsg = message ? encodeURIComponent(message) : '';
  const url = `https://wa.me/${cleanedPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;

  try {
    await Linking.openURL(url);
  } catch (err) {
    console.error('Error opening WhatsApp:', err);
    Alert.alert(
      'Unable to open WhatsApp',
      'Please make sure WhatsApp is installed on your device or access via WhatsApp Web.'
    );
  }
};
