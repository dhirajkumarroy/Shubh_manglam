import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

interface UserTopBarProps {
  userName?: string;
  avatarUrl?: string | null;
  unreadNotificationsCount?: number;
  onOpenMenu: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const UserTopBar: React.FC<UserTopBarProps> = ({
  userName = 'Priya Sharma',
  avatarUrl,
  unreadNotificationsCount = 0,
  onOpenMenu,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return 'PS';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
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

      {/* 2. Middle: Shubh Ausar Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.brandTitleRow}>
          <Text style={styles.mandapIcon}>🎪</Text>
          <Text style={styles.brandName}>Shubh Ausar</Text>
        </View>
        <View style={styles.taglineWrap}>
          <Text style={styles.taglineText}>शुभ अवसर  |  CELEBRATE EVERY OCCASION</Text>
        </View>
      </View>

      {/* 3. Right: Notification Bell & User Avatar */}
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

        {/* User Avatar */}
        <TouchableOpacity
          style={styles.profileAvatarBtn}
          activeOpacity={0.8}
          onPress={onOpenProfile}
          accessibilityLabel="Open profile"
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.profileAvatarText}>{getInitials(userName)}</Text>
          )}
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
    fontSize: 18,
    fontWeight: '900',
    color: '#881337', // Deep Royal Maroon
    letterSpacing: -0.2,
  },
  taglineWrap: {
    marginTop: 1,
  },
  taglineText: {
    fontSize: 8.5,
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
    backgroundColor: '#881337',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

export default UserTopBar;
