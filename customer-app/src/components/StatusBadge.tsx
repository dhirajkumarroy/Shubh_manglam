import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export type StatusType =
  | 'NEW'
  | 'REQUESTED'
  | 'SENT'
  | 'VIEWED'
  | 'REVISION_REQUESTED'
  | 'REVISED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'small' }) => {
  const normalized = (status || '').toUpperCase().trim();

  let label = normalized.replace(/_/g, ' ');
  let bg = '#F3F4F6';
  let text = '#4B5563';
  let border = '#E5E7EB';

  switch (normalized) {
    case 'NEW':
    case 'REQUESTED':
      label = 'New';
      bg = '#EFF6FF';
      text = '#1D4ED8';
      border = '#BFDBFE';
      break;

    case 'SENT':
      label = 'Quote Received';
      bg = '#FEF3C7';
      text = '#B45309';
      border = '#FDE68A';
      break;

    case 'VIEWED':
      label = 'Viewed';
      bg = '#F5F3FF';
      text = '#6D28D9';
      border = '#DDD6FE';
      break;

    case 'REVISION_REQUESTED':
      label = 'Revision Requested';
      bg = '#FFF7ED';
      text = '#C2410C';
      border = '#FED7AA';
      break;

    case 'REVISED':
      label = 'Quote Revised';
      bg = '#EEF2FF';
      text = '#4338CA';
      border = '#C7D2FE';
      break;

    case 'ACCEPTED':
    case 'CONFIRMED':
    case 'BOOKED':
      label = normalized === 'CONFIRMED' || normalized === 'BOOKED' ? 'Booked' : 'Accepted';
      bg = '#ECFDF5';
      text = '#047857';
      border = '#A7F3D0';
      break;

    case 'IN_PROGRESS':
      label = 'In Progress';
      bg = '#EFF6FF';
      text = '#2563EB';
      border = '#BFDBFE';
      break;

    case 'COMPLETED':
      label = 'Completed';
      bg = '#F0FDF4';
      text = '#15803D';
      border = '#BBF7D0';
      break;

    case 'REJECTED':
    case 'CANCELLED':
    case 'EXPIRED':
      label = normalized === 'EXPIRED' ? 'Expired' : normalized === 'CANCELLED' ? 'Cancelled' : 'Declined';
      bg = '#FEF2F2';
      text = '#B91C1C';
      border = '#FECACA';
      break;

    case 'PENDING':
      label = 'Pending';
      bg = '#FEF3C7';
      text = '#92400E';
      border = '#FDE68A';
      break;

    default:
      break;
  }

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bg, borderColor: border },
        isSmall ? styles.badgeSmall : styles.badgeMedium,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: text },
          isSmall ? styles.textSmall : styles.textMedium,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  badgeMedium: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  textSmall: {
    fontSize: 10.5,
  },
  textMedium: {
    fontSize: 12,
  },
});

export default StatusBadge;
