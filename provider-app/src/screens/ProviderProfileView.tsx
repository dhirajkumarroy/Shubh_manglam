import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import colors from '../theme/colors';
import { FullVendorProfile } from '../types';

interface ProviderProfileViewProps {
  profile: FullVendorProfile | null;
  onNavigateToOnboarding?: () => void;
  onLogout?: () => void;
}

export const ProviderProfileView: React.FC<ProviderProfileViewProps> = ({
  profile,
  onNavigateToOnboarding,
  onLogout,
}) => {
  const businessName = profile?.businessName || 'Royal Celebrations & Decor';
  const phone = profile?.phone || '+919822222222';
  const email = profile?.email || 'provider@gmail.com';
  const address = profile?.addressLine1 || 'Main Market, GT Road';
  const city = profile?.city || 'Panipat';
  const state = profile?.state || 'Haryana';
  const pincode = profile?.pincode || '132103';
  const radius = profile?.operatingRadiusKm || 25;
  const isVerified = profile?.isVerified ?? true;
  const status = profile?.status || 'APPROVED';

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Card Header */}
      <View style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>
            {businessName.slice(0, 2).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.businessName}>{businessName}</Text>
        <Text style={styles.businessCategory}>Celebration & Event Partner</Text>

        <View style={styles.statusPillsRow}>
          <View
            style={[
              styles.badge,
              status === 'APPROVED' ? styles.badgeGreen : styles.badgeYellow,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                status === 'APPROVED' ? styles.badgeTextGreen : styles.badgeTextYellow,
              ]}
            >
              {status === 'APPROVED' ? '● VERIFIED PARTNER' : `● ${status}`}
            </Text>
          </View>
          {isVerified && (
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeTextBlue}>✓ KYC APPROVED</Text>
            </View>
          )}
        </View>
      </View>

      {/* Business Details Section */}
      <Text style={styles.sectionHeader}>BUSINESS CONTACT & LOCATION</Text>
      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Contact Phone</Text>
          <Text style={styles.infoValue}>{phone}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email Address</Text>
          <Text style={styles.infoValue}>{email}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Operating City</Text>
          <Text style={styles.infoValue}>📍 {city}, {state}</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Service Coverage</Text>
          <Text style={styles.infoValue}>{radius} km Radius</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Physical Address</Text>
          <Text style={[styles.infoValue, { maxWidth: '60%' }]} numberOfLines={2}>
            {address}, {city} - {pincode}
          </Text>
        </View>
      </View>

      {/* Operating Categories */}
      <Text style={styles.sectionHeader}>REGISTERED CELEBRATION DOMAINS</Text>
      <View style={styles.categoriesCard}>
        {profile?.categories && profile.categories.length > 0 ? (
          <View style={styles.pillsWrap}>
            {profile.categories.map((c) => (
              <View key={c.id || c.categoryId} style={styles.catPill}>
                <Text style={styles.catPillIcon}>{c.icon || '🎪'}</Text>
                <Text style={styles.catPillText}>{c.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.pillsWrap}>
            <View style={styles.catPill}>
              <Text style={styles.catPillIcon}>🌸</Text>
              <Text style={styles.catPillText}>Decoration</Text>
            </View>
            <View style={styles.catPill}>
              <Text style={styles.catPillIcon}>💡</Text>
              <Text style={styles.catPillText}>Lighting</Text>
            </View>
            <View style={styles.catPill}>
              <Text style={styles.catPillIcon}>🎪</Text>
              <Text style={styles.catPillText}>Tent & Setup</Text>
            </View>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {onNavigateToOnboarding && (
          <TouchableOpacity
            style={styles.editBtn}
            activeOpacity={0.8}
            onPress={onNavigateToOnboarding}
          >
            <Text style={styles.editBtnText}>⚙ Edit Business Profile & KYC Documents</Text>
          </TouchableOpacity>
        )}

        {onLogout && (
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.8}
            onPress={onLogout}
          >
            <Text style={styles.logoutBtnText}>🚪 Log Out of Partner Account</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.appFootnote}>Shubh Mangalam Partner Console • Version 1.0.0</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#881337',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FED7AA',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  businessName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1C1917',
    marginBottom: 4,
    textAlign: 'center',
  },
  businessCategory: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '500',
    marginBottom: 12,
  },
  statusPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  badgeBlue: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  badgeTextGreen: {
    color: '#15803D',
  },
  badgeTextYellow: {
    color: '#B45309',
  },
  badgeTextBlue: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78716C',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#78716C',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1917',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#F5EFE6',
    marginVertical: 10,
  },
  categoriesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 24,
  },
  pillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDF9',
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  catPillIcon: {
    fontSize: 14,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#292524',
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  editBtn: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E7E0D8',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#292524',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
  appFootnote: {
    fontSize: 11,
    color: '#A8A29E',
    textAlign: 'center',
  },
});

export default ProviderProfileView;
