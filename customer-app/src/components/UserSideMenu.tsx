import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import AppIcon from './AppIcon';
import colors from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

export interface UserSideMenuProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  phone?: string;
  email?: string;
  onNavigateHome: () => void;
  onNavigateExplore?: () => void;
  onNavigateQuotes?: () => void;
  onNavigateBookings?: () => void;
  onNavigateInquiries?: () => void;
  onNavigateEvents?: () => void;
  onNavigateLocations?: () => void;
  onNavigateNotifications?: () => void;
  onNavigateProfile?: () => void;
  onNavigateChangePassword?: () => void;
  onLogout?: () => void;
}

export const UserSideMenu: React.FC<UserSideMenuProps> = ({
  visible,
  onClose,
  userName = 'User',
  phone = '+91 98765 43210',
  email = 'user@shubhausar.com',
  onNavigateHome,
  onNavigateExplore,
  onNavigateQuotes,
  onNavigateBookings,
  onNavigateInquiries,
  onNavigateEvents,
  onNavigateLocations,
  onNavigateNotifications,
  onNavigateProfile,
  onNavigateChangePassword,
  onLogout,
}) => {
  const handleItemPress = (action?: () => void) => {
    if (!action) return;
    onClose();
    setTimeout(() => {
      action();
    }, 150);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'SA';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Backdrop Tap to Close */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <SafeAreaView style={styles.drawerContainer}>
          {/* 1. Header Profile Banner */}
          <View style={styles.drawerHeader}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{getInitials(userName)}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityLabel="Close menu"
              >
                <AppIcon type="ionicons" name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.userPhone} numberOfLines={1}>
              {phone}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {email}
            </Text>

            <View style={styles.userTierBadge}>
              <Text style={styles.userTierText}>✨ Shubh Ausar Member</Text>
            </View>
          </View>

          {/* 2. Menu Navigation Links */}
          <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.menuSectionHeader}>CELEBRATIONS & ORDERS</Text>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleItemPress(onNavigateHome)}
            >
              <AppIcon type="ionicons" name="home-outline" size={20} color="#881337" />
              <Text style={styles.menuItemText}>Home</Text>
            </TouchableOpacity>

            {onNavigateExplore && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateExplore)}
              >
                <AppIcon type="ionicons" name="search-outline" size={20} color="#881337" />
                <Text style={styles.menuItemText}>Explore Marketplace</Text>
              </TouchableOpacity>
            )}

            {onNavigateEvents && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateEvents)}
              >
                <AppIcon type="ionicons" name="calendar-outline" size={20} color="#881337" />
                <Text style={styles.menuItemText}>My Events</Text>
              </TouchableOpacity>
            )}

            {onNavigateQuotes && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateQuotes)}
              >
                <AppIcon type="ionicons" name="document-text-outline" size={20} color="#881337" />
                <Text style={styles.menuItemText}>My Quotes</Text>
                <View style={styles.menuBadge}>
                  <Text style={styles.menuBadgeText}>Offers</Text>
                </View>
              </TouchableOpacity>
            )}

            {onNavigateBookings && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateBookings)}
              >
                <AppIcon type="ionicons" name="checkmark-done-circle-outline" size={20} color="#881337" />
                <Text style={styles.menuItemText}>My Bookings</Text>
              </TouchableOpacity>
            )}

            {onNavigateInquiries && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateInquiries)}
              >
                <AppIcon type="ionicons" name="chatbubble-ellipses-outline" size={20} color="#881337" />
                <Text style={styles.menuItemText}>My Messages</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            <Text style={styles.menuSectionHeader}>ACCOUNT & PREFERENCES</Text>

            {onNavigateLocations && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateLocations)}
              >
                <AppIcon type="ionicons" name="location-outline" size={20} color="#78716C" />
                <Text style={styles.menuItemText}>Saved Locations</Text>
              </TouchableOpacity>
            )}

            {onNavigateNotifications && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateNotifications)}
              >
                <AppIcon type="ionicons" name="notifications-outline" size={20} color="#78716C" />
                <Text style={styles.menuItemText}>Notifications</Text>
              </TouchableOpacity>
            )}

            {onNavigateProfile && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateProfile)}
              >
                <AppIcon type="ionicons" name="person-outline" size={20} color="#78716C" />
                <Text style={styles.menuItemText}>My Profile</Text>
              </TouchableOpacity>
            )}

            {onNavigateChangePassword && (
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onNavigateChangePassword)}
              >
                <AppIcon type="ionicons" name="lock-closed-outline" size={20} color="#78716C" />
                <Text style={styles.menuItemText}>Change Password</Text>
              </TouchableOpacity>
            )}

            <View style={styles.divider} />

            {/* Logout Action */}
            {onLogout && (
              <TouchableOpacity
                style={styles.logoutItem}
                activeOpacity={0.7}
                onPress={() => handleItemPress(onLogout)}
              >
                <AppIcon type="ionicons" name="log-out-outline" size={20} color="#DC2626" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            )}

            {/* Brand Signature */}
            <View style={styles.drawerFooter}>
              <Text style={styles.footerBrand}>Shubh Ausar • शुभ अवसर</Text>
              <Text style={styles.footerTagline}>Plan • Discover • Celebrate</Text>
              <Text style={styles.footerVersion}>User Portal v1.0.0</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },
  drawerHeader: {
    backgroundColor: '#881337', // Brand Royal Maroon
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22,
  },
  avatarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#881337',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#FED7AA',
    marginBottom: 1,
  },
  userEmail: {
    fontSize: 11,
    color: '#FFE4E6',
    marginBottom: 8,
  },
  userTierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  userTierText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  menuScroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.8,
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
    flex: 1,
  },
  menuBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0EAE1',
    marginVertical: 8,
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 12,
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  drawerFooter: {
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0EAE1',
    alignItems: 'center',
    marginBottom: 24,
  },
  footerBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: '#881337',
    marginBottom: 2,
  },
  footerTagline: {
    fontSize: 10,
    color: '#78716C',
    marginBottom: 2,
  },
  footerVersion: {
    fontSize: 9.5,
    color: '#A8A29E',
  },
});

export default UserSideMenu;
