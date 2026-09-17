import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

interface CustomerTopBarProps {
  userName?: string;
  unreadNotificationsCount?: number;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const CustomerTopBar: React.FC<CustomerTopBarProps> = ({
  userName = 'Customer',
  unreadNotificationsCount = 0,
  onOpenMenu,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* 1. Left: Hamburger Menu Icon */}
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.7}
        onPress={onOpenMenu}
        accessibilityLabel="Open menu drawer"
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>

      {/* 2. Middle: App Branding */}
      <View style={styles.brandContainer}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandLogo}>🎪</Text>
          <Text style={styles.brandName}>Shubh Mangalam</Text>
        </View>
        <View style={styles.subBadge}>
          <Text style={styles.subBadgeText}>HAR FUNCTION, EK APP</Text>
        </View>
      </View>

      {/* 3. Right Actions: Notification Bell & Profile Avatar */}
      <View style={styles.rightActions}>
        {/* Notification Bell */}
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onOpenNotifications}
          accessibilityLabel="Open notifications"
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          {unreadNotificationsCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          activeOpacity={0.8}
          onPress={onOpenProfile}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.profileAvatarText}>{getInitials(userName)}</Text>
          <View style={styles.onlineIndicator} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0D8',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  hamburgerIcon: {
    fontSize: 22,
    color: '#1C1917',
    fontWeight: 'bold',
    lineHeight: 24,
  },
  brandContainer: {
    alignItems: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  brandLogo: {
    fontSize: 18,
  },
  brandName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#881337',
    letterSpacing: 0.3,
  },
  subBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  subBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#C2410C',
    letterSpacing: 0.8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationIcon: {
    fontSize: 18,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  profileAvatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
    position: 'relative',
  },
  profileAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default CustomerTopBar;
