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

interface ProviderTopBarProps {
  businessName?: string;
  ownerName?: string;
  unreadNotificationsCount?: number;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const ProviderTopBar: React.FC<ProviderTopBarProps> = ({
  businessName,
  ownerName,
  unreadNotificationsCount = 0,
  onOpenMenu,
  onOpenNotifications,
  onOpenProfile,
}) => {
  // Get initial letters from owner name or business name (e.g., "Rahul Chopra" -> "RC")
  const getInitials = () => {
    const target = (ownerName || businessName || 'SA').trim();
    const parts = target.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return target.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* 1. Left: Hamburger Menu Button */}
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.7}
        onPress={onOpenMenu}
        accessibilityLabel="Open side navigation menu"
      >
        <AppIcon type="feather" name="menu" size={21} color="#1C1917" />
      </TouchableOpacity>

      {/* 2. Middle: Shubh Ausar Brand with Mandap Motif */}
      <View style={styles.brandContainer}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.mandapIcon}>🎪</Text>
          <Text style={styles.brandName}>Shubh Ausar</Text>
        </View>
        <View style={styles.partnerBadge}>
          <Text style={styles.partnerBadgeText}>शुभ अवसर  |  PARTNER</Text>
        </View>
      </View>

      {/* 3. Right: Notification Bell & Profile Avatar */}
      <View style={styles.rightActions}>
        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onOpenNotifications}
          accessibilityLabel="Open notifications"
        >
          <AppIcon type="feather" name="bell" size={19} color="#1C1917" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Avatar with Online Status Indicator */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          activeOpacity={0.8}
          onPress={onOpenProfile}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.profileAvatarText}>{getInitials()}</Text>
          <View style={styles.onlineIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 58,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7DF',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EAE4DC',
  },
  brandContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mandapIcon: {
    fontSize: 17,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#881337', // Deep Auspicious Maroon
    letterSpacing: -0.2,
  },
  partnerBadge: {
    marginTop: 1,
  },
  partnerBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#E65100', // Saffron Orange
    letterSpacing: 0.8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9.5,
    fontWeight: '900',
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#4C0519', // Dark Royal Burgundy
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
    position: 'relative',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16A34A',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
});

export default ProviderTopBar;
