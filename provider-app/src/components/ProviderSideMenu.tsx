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

interface ProviderSideMenuProps {
  visible: boolean;
  onClose: () => void;
  activeTab: 'DASHBOARD' | 'QUOTES' | 'BOOKINGS' | 'SERVICES' | 'PACKAGES' | 'INQUIRIES' | 'PROFILE';
  onSelectTab: (tab: 'DASHBOARD' | 'QUOTES' | 'BOOKINGS' | 'SERVICES' | 'PACKAGES' | 'INQUIRIES' | 'PROFILE') => void;
  businessName?: string;
  phone?: string;
  city?: string;
  status?: string;
  isVerified?: boolean;
  servicesCount?: number;
  packagesCount?: number;
  onOpenNotifications: () => void;
  onNavigateToOnboarding: () => void;
  onLogout: () => void;
}

export const ProviderSideMenu: React.FC<ProviderSideMenuProps> = ({
  visible,
  onClose,
  activeTab,
  onSelectTab,
  businessName = 'Royal Celebrations & Decor',
  phone = '+919822222222',
  city = 'Panipat, Haryana',
  status = 'APPROVED',
  isVerified = true,
  servicesCount = 5,
  packagesCount = 0,
  onOpenNotifications,
  onNavigateToOnboarding,
  onLogout,
}) => {
  const handleItemPress = (action: () => void) => {
    onClose();
    setTimeout(() => {
      action();
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop (tap to close) */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <SafeAreaView style={styles.drawer}>
          <ScrollView contentContainerStyle={styles.drawerScroll} showsVerticalScrollIndicator={false}>
            {/* Header / Business Profile Card */}
            <View style={styles.profileHeader}>
              <View style={styles.headerTopRow}>
                <View style={styles.avatarBox}>
                  <Text style={styles.avatarText}>
                    {businessName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                  <Text style={styles.closeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.businessTitle} numberOfLines={1}>
                {businessName}
              </Text>

              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusBadge,
                    status === 'APPROVED' ? styles.statusApproved : styles.statusPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      status === 'APPROVED' ? styles.statusApprovedText : styles.statusPendingText,
                    ]}
                  >
                    {status === 'APPROVED' ? '● VERIFIED PARTNER' : `● ${status}`}
                  </Text>
                </View>
                {isVerified && (
                  <View style={styles.verifiedCheckBadge}>
                    <Text style={styles.verifiedCheckText}>✓ Official</Text>
                  </View>
                )}
              </View>

              <Text style={styles.metaText}>📞 {phone}</Text>
              <Text style={styles.metaText}>📍 {city}</Text>
            </View>

            <View style={styles.menuDivider} />

            {/* Navigation Menu Links */}
            <Text style={styles.menuSectionHeader}>MANAGEMENT & WORKSPACE</Text>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'DASHBOARD' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('DASHBOARD'))}
            >
              <Text style={styles.menuIcon}>📊</Text>
              <Text style={[styles.menuText, activeTab === 'DASHBOARD' && styles.menuTextActive]}>
                Dashboard Overview
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'QUOTES' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('QUOTES'))}
            >
              <Text style={styles.menuIcon}>📜</Text>
              <Text style={[styles.menuText, activeTab === 'QUOTES' && styles.menuTextActive]}>
                Quotes & Proposals
              </Text>
              <View style={[styles.countBadge, { backgroundColor: colors.accentGoldBg }]}>
                <Text style={[styles.countBadgeText, { color: colors.accentGold }]}>New</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'BOOKINGS' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('BOOKINGS'))}
            >
              <Text style={styles.menuIcon}>🤝</Text>
              <Text style={[styles.menuText, activeTab === 'BOOKINGS' && styles.menuTextActive]}>
                Confirmed Bookings
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'SERVICES' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('SERVICES'))}
            >
              <Text style={styles.menuIcon}>🎪</Text>
              <Text style={[styles.menuText, activeTab === 'SERVICES' && styles.menuTextActive]}>
                Services Catalog
              </Text>
              {servicesCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{servicesCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'PACKAGES' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('PACKAGES'))}
            >
              <Text style={styles.menuIcon}>📦</Text>
              <Text style={[styles.menuText, activeTab === 'PACKAGES' && styles.menuTextActive]}>
                Celebration Packages
              </Text>
              {packagesCount > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{packagesCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'INQUIRIES' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('INQUIRIES'))}
            >
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={[styles.menuText, activeTab === 'INQUIRIES' && styles.menuTextActive]}>
                Customer Inquiries
              </Text>
              <View style={[styles.countBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.countBadgeText, { color: '#15803D' }]}>New</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuItem, activeTab === 'PROFILE' && styles.menuItemActive]}
              activeOpacity={0.7}
              onPress={() => handleItemPress(() => onSelectTab('PROFILE'))}
            >
              <Text style={styles.menuIcon}>⚙️</Text>
              <Text style={[styles.menuText, activeTab === 'PROFILE' && styles.menuTextActive]}>
                Business Profile & KYC
              </Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            <Text style={styles.menuSectionHeader}>COMMUNICATIONS & ALERTS</Text>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleItemPress(onOpenNotifications)}
            >
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notifications</Text>
              <View style={[styles.countBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.countBadgeText, { color: '#DC2626' }]}>2</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleItemPress(onNavigateToOnboarding)}
            >
              <Text style={styles.menuIcon}>🛡️</Text>
              <Text style={styles.menuText}>Edit Documents & KYC</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />

            {/* Logout Option */}
            <TouchableOpacity
              style={styles.logoutItem}
              activeOpacity={0.7}
              onPress={() => handleItemPress(onLogout)}
            >
              <Text style={styles.logoutIcon}>🚪</Text>
              <Text style={styles.logoutText}>Sign Out of Partner Console</Text>
            </TouchableOpacity>

            <View style={styles.footerNote}>
              <Text style={styles.footerAppVersion}>Shubh Ausar • शुभ अवसर Partner v1.0.0</Text>
              <Text style={styles.footerAppName}>Celebrate Every Occasion • 100% Verified</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 3, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 16,
  },
  drawerScroll: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  profileHeader: {
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7E0D8',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#881337', // Auspicious Burgundy
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FED7AA',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  businessTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusApproved: {
    backgroundColor: '#DCFCE7',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusApprovedText: {
    color: '#15803D',
  },
  statusPendingText: {
    color: '#B45309',
  },
  verifiedCheckBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  verifiedCheckText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  metaText: {
    fontSize: 12,
    color: '#57534E',
    marginTop: 2,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 14,
  },
  menuSectionHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A8A29E',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 3,
  },
  menuItemActive: {
    backgroundColor: '#FFF7ED',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  menuIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#292524',
    flex: 1,
  },
  menuTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  countBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  logoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    marginTop: 6,
  },
  logoutIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  footerNote: {
    marginTop: 24,
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerAppVersion: {
    fontSize: 11,
    color: '#A8A29E',
    fontWeight: '600',
  },
  footerAppName: {
    fontSize: 10,
    color: '#D6D3D1',
    marginTop: 2,
  },
});

export default ProviderSideMenu;
