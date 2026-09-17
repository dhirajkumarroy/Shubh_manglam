import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import colors from '../theme/colors';

interface ProviderTopBarProps {
  businessName?: string;
  unreadNotificationsCount?: number;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const ProviderTopBar: React.FC<ProviderTopBarProps> = ({
  businessName,
  unreadNotificationsCount = 2,
  onOpenMenu,
  onOpenNotifications,
  onOpenProfile,
}) => {
  // Get initial letters from business name (e.g., "Royal Celebrations" -> "RC")
  const getInitials = (name?: string) => {
    if (!name) return 'SM';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      {/* 1. Left: Side Menu Bar Option (Hamburger Icon) */}
      <TouchableOpacity
        style={styles.iconBtn}
        activeOpacity={0.7}
        onPress={onOpenMenu}
        accessibilityLabel="Open side menu"
      >
        <Text style={styles.hamburgerIcon}>☰</Text>
      </TouchableOpacity>

      {/* 2. Middle: App Name & Partner Branding */}
      <View style={styles.brandContainer}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.brandLogo}>🎪</Text>
          <Text style={styles.brandName}>Shubh Mangalam</Text>
        </View>
        <View style={styles.partnerBadge}>
          <Text style={styles.partnerBadgeText}>PARTNER CONSOLE</Text>
        </View>
      </View>

      {/* 3. Right: Notification Icon & Profile Icon */}
      <View style={styles.rightActions}>
        {/* Notification Icon */}
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

        {/* Profile Icon / Avatar */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          activeOpacity={0.8}
          onPress={onOpenProfile}
          accessibilityLabel="Open profile"
        >
          <Text style={styles.profileAvatarText}>{getInitials(businessName)}</Text>
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
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandLogo: {
    fontSize: 16,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#881337', // Deep Auspicious Maroon
    letterSpacing: 0.2,
  },
  partnerBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FED7AA',
    marginTop: 2,
  },
  partnerBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationIcon: {
    fontSize: 18,
    color: '#1C1917',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#DC2626',
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
    fontSize: 10,
    fontWeight: '900',
  },
  profileAvatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#881337',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FDBA74',
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
