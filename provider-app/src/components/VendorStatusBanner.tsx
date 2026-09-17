import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import colors from '../theme/colors';

interface VendorStatusBannerProps {
  status?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
}

export const VendorStatusBanner: React.FC<VendorStatusBannerProps> = ({ status = 'PENDING' }) => {
  let bgColor = '#FEF3C7';
  let textColor = '#92400E';
  let borderColor = '#F59E0B';
  let title = 'Pending Approval';
  let description = 'Your vendor registration is pending admin review. Catalog services and lead requests will be enabled once approved.';

  if (status === 'APPROVED') {
    bgColor = '#ECFDF5';
    textColor = '#065F46';
    borderColor = '#10B981';
    title = 'Verified & Approved Partner';
    description = 'Your business is live! You can manage services, respond to leads, and receive bookings.';
  } else if (status === 'UNDER_REVIEW') {
    bgColor = '#EFF6FF';
    textColor = '#1E40AF';
    borderColor = '#3B82F6';
    title = 'Under Review';
    description = 'Administration is reviewing your business profile and service offerings.';
  } else if (status === 'REJECTED') {
    bgColor = '#FEF2F2';
    textColor = '#991B1B';
    borderColor = '#EF4444';
    title = 'Application Rejected';
    description = 'Your registration could not be verified. Please contact support.';
  } else if (status === 'SUSPENDED') {
    bgColor = '#F3F4F6';
    textColor = '#374151';
    borderColor = '#9CA3AF';
    title = 'Account Suspended';
    description = 'Your provider account is currently suspended. Please contact platform compliance.';
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <Text style={[styles.title, { color: textColor }]}>● {title}</Text>
      <Text style={[styles.description, { color: textColor }]}>{description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
});

export default VendorStatusBanner;
