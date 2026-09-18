import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

interface QuickActionGridProps {
  onFindVendors: () => void;
  onRequestQuote: () => void;
  onMyQuotes: () => void;
  onMyBookings: () => void;
}

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({
  onFindVendors,
  onRequestQuote,
  onMyQuotes,
  onMyBookings,
}) => {
  const actions = [
    {
      key: 'FIND_VENDORS',
      title: 'Find Vendors',
      icon: 'storefront-outline',
      iconColor: '#BE123C',
      bg: '#FFF1F2',
      border: '#FFE4E6',
      onPress: onFindVendors,
    },
    {
      key: 'REQUEST_QUOTE',
      title: 'Request Quote',
      icon: 'document-text-outline',
      iconColor: '#854D0E',
      bg: '#FEFCE8',
      border: '#FEF08A',
      onPress: onRequestQuote,
    },
    {
      key: 'MY_QUOTES',
      title: 'My Quotes',
      icon: 'receipt-outline',
      iconColor: '#9D174D',
      bg: '#FDF2F8',
      border: '#FCE7F3',
      onPress: onMyQuotes,
    },
    {
      key: 'MY_BOOKINGS',
      title: 'My Bookings',
      icon: 'calendar-outline',
      iconColor: '#059669',
      bg: '#ECFDF5',
      border: '#A7F3D0',
      onPress: onMyBookings,
    },
  ];

  return (
    <View style={styles.grid}>
      {actions.map((act) => (
        <TouchableOpacity
          key={act.key}
          style={[styles.card, { backgroundColor: act.bg, borderColor: act.border }]}
          activeOpacity={0.8}
          onPress={act.onPress}
        >
          <View style={styles.iconCircle}>
            <AppIcon
              type="ionicons"
              name={act.icon}
              size={22}
              color={act.iconColor}
            />
          </View>
          <Text style={styles.cardTitle}>{act.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 22,
  },
  card: {
    flex: 1,
    height: 86,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      default: {},
    }),
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1C1917',
    textAlign: 'center',
  },
});

export default QuickActionGrid;
