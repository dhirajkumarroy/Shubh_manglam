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
import colors from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 340);

interface CustomerSideMenuProps {
  visible: boolean;
  onClose: () => void;
  customerName?: string;
  phone?: string;
  email?: string;
  onNavigateHome: () => void;
  onNavigateInquiries: () => void;
  onNavigateEvents: () => void;
  onNavigateLocations: () => void;
  onNavigateNotifications: () => void;
  onNavigateProfile: () => void;
  onNavigateChangePassword: () => void;
  onLogout: () => void;
}

export const CustomerSideMenu: React.FC<CustomerSideMenuProps> = ({
  visible,
  onClose,
  customerName = 'Dhiraj Customer',
  phone = '+919811111111',
  email = 'customer@gmail.com',
  onNavigateHome,
  onNavigateInquiries,
  onNavigateEvents,
  onNavigateLocations,
  onNavigateNotifications,
  onNavigateProfile,
  onNavigateChangePassword,
  onLogout,
}) => {
  const handleItemPress = (action: () => void) => {
    onClose();
    setTimeout(() => {
      action();
    }, 150);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'CU';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Backdrop (tap to close) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Panel */}
        <View style={styles.drawer}>
          <SafeAreaView style={styles.drawerSafe}>
            {/* 1. Header Customer Card */}
            <View style={styles.headerCard}>
              <View style={styles.headerTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getInitials(customerName)}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.customerName} numberOfLines={1}>
                {customerName}
              </Text>
              <Text style={styles.contactText}>📞 {phone}</Text>
              {email ? <Text style={styles.emailText} numberOfLines={1}>✉️ {email}</Text> : null}

              <View style={styles.verifiedRow}>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ VERIFIED HOST</Text>
                </View>
              </View>
            </View>

            {/* 2. Scrollable Navigation Menu Items */}
            <ScrollView style={styles.menuList} showsVerticalScrollIndicator={false}>
              <Text style={styles.menuSectionHeader}>CELEBRATION NAVIGATION</Text>

              {/* Home */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateHome)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>🏠</Text>
                  <View>
                    <Text style={styles.menuLabel}>Explore Services</Text>
                    <Text style={styles.menuSub}>Halwai, Decorators, DJs & Beauticians</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              {/* Inquiries */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateInquiries)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>📋</Text>
                  <View>
                    <Text style={styles.menuLabel}>My Inquiries & Bookings</Text>
                    <Text style={styles.menuSub}>Track responses, acceptances & rates</Text>
                  </View>
                </View>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>Live</Text>
                </View>
              </TouchableOpacity>

              {/* Plan Event */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateEvents)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>🎪</Text>
                  <View>
                    <Text style={styles.menuLabel}>Plan an Event</Text>
                    <Text style={styles.menuSub}>Birthday, Wedding, Puja planner</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              {/* Locations */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateLocations)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>📍</Text>
                  <View>
                    <Text style={styles.menuLabel}>Venue Location</Text>
                    <Text style={styles.menuSub}>Panipat & nearby celebration zones</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              {/* Notifications */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateNotifications)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>🔔</Text>
                  <View>
                    <Text style={styles.menuLabel}>Alerts & Notifications</Text>
                    <Text style={styles.menuSub}>Partner messages and updates</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              <Text style={styles.menuSectionHeader}>ACCOUNT & SETTINGS</Text>

              {/* Profile */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateProfile)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>👤</Text>
                  <View>
                    <Text style={styles.menuLabel}>My Profile</Text>
                    <Text style={styles.menuSub}>Manage name, phone & info</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>

              {/* Change Password */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleItemPress(onNavigateChangePassword)}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuIcon}>🔒</Text>
                  <View>
                    <Text style={styles.menuLabel}>Security Settings</Text>
                    <Text style={styles.menuSub}>Change password & auth</Text>
                  </View>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* 3. Footer / Logout */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                activeOpacity={0.8}
                onPress={() => handleItemPress(onLogout)}
              >
                <Text style={styles.logoutIcon}>🚪</Text>
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
              <Text style={styles.versionText}>Shubh Mangalam Customer v1.0.0</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerSafe: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: '#FAF8F5',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E0D8',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E7E0D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    color: '#44403C',
    fontWeight: 'bold',
  },
  customerName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#44403C',
    fontWeight: '600',
  },
  emailText: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  verifiedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    fontSize: 18,
  },
  menuLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1C1917',
  },
  menuSub: {
    fontSize: 11,
    color: '#78716C',
    marginTop: 1,
  },
  menuArrow: {
    fontSize: 18,
    color: '#A8A29E',
    fontWeight: 'bold',
  },
  badgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E7E0D8',
    backgroundColor: '#FAF8F5',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingVertical: 11,
    borderRadius: 10,
    marginBottom: 8,
  },
  logoutIcon: {
    fontSize: 14,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#A8A29E',
    fontWeight: '500',
  },
});

export default CustomerSideMenu;
