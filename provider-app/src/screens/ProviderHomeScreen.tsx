import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import VendorStatusBanner from '../components/VendorStatusBanner';
import { ProviderApiService } from '../services/api';
import { FullVendorProfile } from '../types';

interface ProviderHomeScreenProps {
  onNavigateToOnboarding?: () => void;
  onNavigateToCatalog?: () => void;
  onLogout?: () => void;
  vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  hideTopHeader?: boolean;
  profile?: FullVendorProfile | null;
}

export const ProviderHomeScreen: React.FC<ProviderHomeScreenProps> = ({
  onNavigateToOnboarding,
  onNavigateToCatalog,
  onLogout,
  vendorStatus: initialStatus,
  hideTopHeader = false,
  profile: initialProfile,
}) => {
  const [profile, setProfile] = useState<FullVendorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState<boolean>(!initialProfile);

  const fetchProfile = async () => {
    try {
      if (!initialProfile) setLoading(true);
      const data = await ProviderApiService.getVendorProfile();
      setProfile(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const activeStatus = profile?.status || initialStatus || 'PENDING';

  return (
    <SafeAreaView style={[styles.safeArea, hideTopHeader && { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header (conditionally rendered) */}
        {!hideTopHeader && (
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>
                {profile?.businessName || 'Shubh Mangalam Partner'}
              </Text>
              <Text style={styles.subGreeting}>
                {profile?.city ? `📍 ${profile.city}, ${profile.state || 'India'}` : 'Service Provider Console'}
              </Text>
            </View>
            {onLogout && (
              <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Dynamic Approval Lifecycle Banner */}
        <VendorStatusBanner status={activeStatus} />

        {/* Readiness / Incomplete Profile Notice */}
        {profile?.completeness && !profile.completeness.profileCompleted && (
          <View style={styles.actionCard}>
            <View style={styles.actionCardHeader}>
              <Text style={styles.actionCardTitle}>Profile Action Required</Text>
              <Text style={styles.actionCardScore}>
                {profile.completeness.completionPercentage}%
              </Text>
            </View>
            <Text style={styles.actionCardSub}>
              Complete missing documents and details to get verified and start receiving celebration leads.
            </Text>
            {onNavigateToOnboarding && (
              <TouchableOpacity
                style={styles.actionCardBtn}
                onPress={onNavigateToOnboarding}
              >
                <Text style={styles.actionCardBtnText}>Complete Onboarding →</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Quick Actions Row */}
        <View style={styles.actionsRow}>
          {activeStatus === 'APPROVED' && onNavigateToCatalog && (
            <TouchableOpacity
              style={styles.catalogBtn}
              onPress={onNavigateToCatalog}
            >
              <Text style={styles.catalogBtnText}>🎪 Manage Services & Packages →</Text>
            </TouchableOpacity>
          )}
          {onNavigateToOnboarding && (
            <TouchableOpacity
              style={styles.manageBtn}
              onPress={onNavigateToOnboarding}
            >
              <Text style={styles.manageBtnText}>⚙ Edit Business Profile & Docs</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Business Overview Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Text style={styles.heroTitle}>Partner Overview</Text>
            <View
              style={[
                styles.verifiedBadge,
                profile?.isVerified ? styles.badgeVerified : styles.badgeUnverified,
              ]}
            >
              <Text
                style={[
                  styles.verifiedBadgeText,
                  profile?.isVerified ? styles.badgeTextVerified : styles.badgeTextUnverified,
                ]}
              >
                {profile?.isVerified ? '✓ Verified Partner' : 'Verification Pending'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            {profile?.description ||
              'Connect with customers in your district planning weddings, receptions, birthdays, pujas, and corporate events.'}
          </Text>
        </View>

        {/* Selected Services / Categories */}
        <Text style={styles.sectionTitle}>Your Selected Celebration Categories</Text>
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.emptyText}>Loading vendor categories...</Text>
          </View>
        ) : !profile?.categories || profile.categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎪</Text>
            <Text style={styles.emptyTitle}>No Categories Selected Yet</Text>
            <Text style={styles.emptyText}>
              Select the celebration services you offer (Catering, Tent, Decoration, Lighting, etc.) to get matched with customers.
            </Text>
            {onNavigateToOnboarding && (
              <TouchableOpacity
                style={styles.addCategoryBtn}
                onPress={onNavigateToOnboarding}
              >
                <Text style={styles.addCategoryBtnText}>+ Select Categories</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.categoryGrid}>
            {profile.categories.map((cat) => (
              <View key={cat.id || cat.categoryId} style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeIcon}>{cat.icon || '🎪'}</Text>
                <Text style={styles.categoryBadgeName}>{cat.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Verification Documents Summary */}
        <Text style={styles.sectionTitle}>Verification Documents</Text>
        {!profile?.documents || profile.documents.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📄</Text>
            <Text style={styles.emptyTitle}>No Documents Uploaded</Text>
            <Text style={styles.emptyText}>
              Upload Identity Proof, Business Registration, or Address Proof for admin review.
            </Text>
          </View>
        ) : (
          <View style={styles.docSummaryGrid}>
            {profile.documents.map((doc) => (
              <View key={doc.id} style={styles.docMiniCard}>
                <Text style={styles.docMiniType}>
                  {doc.documentType.replace('_', ' ')}
                </Text>
                <Text
                  style={[
                    styles.docMiniStatus,
                    doc.status === 'APPROVED' && styles.statusGreen,
                    doc.status === 'REJECTED' && styles.statusRed,
                  ]}
                >
                  {doc.status}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerInfo: {
    flex: 1,
    marginRight: 8,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subGreeting: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B91C1C',
  },
  actionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  actionCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  actionCardScore: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  actionCardSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
    marginBottom: 12,
    lineHeight: 16,
  },
  actionCardBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionCardBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 12,
  },
  actionsRow: {
    marginBottom: 16,
    gap: 8,
  },
  catalogBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  catalogBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  manageBtn: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  manageBtnText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  verifiedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeVerified: {
    backgroundColor: '#DCFCE7',
  },
  badgeUnverified: {
    backgroundColor: '#FEF3C7',
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextVerified: {
    color: '#15803D',
  },
  badgeTextUnverified: {
    color: '#D97706',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#FFE4E6',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryBadgeName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  emptyContainer: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  addCategoryBtn: {
    marginTop: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addCategoryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  docSummaryGrid: {
    gap: 8,
    marginBottom: 20,
  },
  docMiniCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docMiniType: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  docMiniStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  statusGreen: {
    color: '#15803D',
  },
  statusRed: {
    color: '#DC2626',
  },
});

export default ProviderHomeScreen;
