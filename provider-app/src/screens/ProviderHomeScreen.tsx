import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import AppIcon from '../components/AppIcon';
import PartnerGreetingCard from '../components/PartnerGreetingCard';
import VerificationCard from '../components/VerificationCard';
import ProfileCompletionCard from '../components/ProfileCompletionCard';
import QuickActionsSection from '../components/QuickActionsSection';
import BusinessOverviewCard, { TimePeriod } from '../components/BusinessOverviewCard';
import RecentLeadsSection, { LeadItemData } from '../components/RecentLeadsSection';
import { ProviderApiService } from '../services/api';
import { FullVendorProfile } from '../types';

interface ProviderHomeScreenProps {
  onNavigateToOnboarding?: () => void;
  onNavigateToCatalog?: () => void;
  onNavigateToPackages?: () => void;
  onNavigateToLeads?: () => void;
  onNavigateToBookings?: () => void;
  onLogout?: () => void;
  vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  hideTopHeader?: boolean;
  profile?: FullVendorProfile | null;
}

export const ProviderHomeScreen: React.FC<ProviderHomeScreenProps> = ({
  onNavigateToOnboarding,
  onNavigateToCatalog,
  onNavigateToPackages,
  onNavigateToLeads,
  onNavigateToBookings,
  onLogout,
  vendorStatus: initialStatus,
  hideTopHeader = true,
  profile: initialProfile,
}) => {
  const [profile, setProfile] = useState<FullVendorProfile | null>(initialProfile || null);
  const [loading, setLoading] = useState<boolean>(!initialProfile);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Business Performance Metrics
  const [leadsCount, setLeadsCount] = useState<number>(0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [servicesCount, setServicesCount] = useState<number>(0);
  const [recentLeads, setRecentLeads] = useState<LeadItemData[]>([]);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (!profile) {
        setLoading(true);
      }
      setError(null);

      // Fetch Profile, Inquiries, Quotes, Bookings, Services in parallel
      const [vendorProfile, inquiriesRes, quotesRes, bookingsRes, servicesRes] = await Promise.all([
        ProviderApiService.getVendorProfile().catch(() => null),
        ProviderApiService.getVendorInquiries().catch(() => []),
        ProviderApiService.getVendorQuotes().catch(() => ({ quotes: [], total: 0 })),
        ProviderApiService.getVendorBookings().catch(() => ({ bookings: [], total: 0 })),
        ProviderApiService.getVendorServices().catch(() => ({ services: [], pagination: {} })),
      ]);

      if (vendorProfile) {
        setProfile(vendorProfile);
      }

      const totalInquiries = Array.isArray(inquiriesRes) ? inquiriesRes : [];
      const totalQuotes = quotesRes.quotes || [];
      const totalBookings = bookingsRes.bookings || [];
      const totalServices = servicesRes.services || [];

      // Compute total leads (inquiries + quote requests)
      const computedLeadsCount = totalInquiries.length + totalQuotes.length;
      setLeadsCount(computedLeadsCount);
      setBookingsCount(bookingsRes.total || totalBookings.length);
      setServicesCount(totalServices.length);

      // Map Recent Leads from inquiries and quotes
      const leadsList: LeadItemData[] = [];

      // Add Quotes
      totalQuotes.forEach((q: any) => {
        const item = q.items?.[0];
        leadsList.push({
          id: q.id,
          type: 'QUOTE',
          serviceTitle: item?.name || q.event?.title || 'Celebration Quote Request',
          customerName: q.customer?.name || 'Celebration Host',
          eventType: q.event?.eventType?.name || 'Wedding',
          eventDate: formatDate(q.event?.eventDate),
          location: q.event?.city || vendorProfile?.city || 'Kharar',
          requirementSnippet: q.customerNotes || q.notes || 'Full celebration service requirement.',
          status: q.status || 'REQUESTED',
          timeAgo: formatTimeAgo(q.createdAt),
          imageUrl: item?.service?.primaryImage || item?.service?.images?.[0]?.url || null,
        });
      });

      // Add Inquiries
      totalInquiries.forEach((inq: any) => {
        leadsList.push({
          id: inq.id,
          type: 'INQUIRY',
          serviceTitle: inq.eventRequirement?.category?.name || inq.event?.title || 'Event Inquiry',
          customerName: inq.customer?.name || 'Client',
          eventType: inq.event?.eventType?.name || 'Special Occasion',
          eventDate: formatDate(inq.event?.eventDate),
          location: inq.event?.city || vendorProfile?.city || 'Punjab',
          requirementSnippet: inq.notes || inq.eventRequirement?.notes || 'Looking for available date & packages.',
          status: inq.status || 'NEW',
          timeAgo: formatTimeAgo(inq.createdAt),
          imageUrl: inq.eventRequirement?.category?.image || null,
        });
      });

      setRecentLeads(leadsList);
    } catch (err: any) {
      setError(err?.message || 'Unable to refresh dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const activeStatus = profile?.status || initialStatus || 'PENDING';
  const ownerName = profile?.user?.name;
  const businessName = profile?.businessName;
  const city = profile?.city;
  const state = profile?.state;

  return (
    <SafeAreaView style={[styles.safeArea, hideTopHeader && { backgroundColor: 'transparent' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadDashboardData(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Error Notification with Retry */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => loadDashboardData(true)}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Indicator for initial cold load */}
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Syncing your business command center...</Text>
          </View>
        )}

        {/* A. Top App Header (when not embedded in MainScreen tab shell) */}
        {!hideTopHeader && (
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Text style={styles.greetingTitle}>
                {businessName || 'Shubh Ausar Partner'}
              </Text>
              <Text style={styles.greetingSub}>
                {city ? `📍 ${city}, ${state || 'India'}` : 'Business Management Portal'}
              </Text>
            </View>
            {onLogout && (
              <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* B. Personalized Greeting Card */}
        <PartnerGreetingCard
          ownerName={ownerName}
          businessName={businessName}
          city={city}
          state={state}
        />

        {/* C. Verification Status Card */}
        <VerificationCard
          status={activeStatus}
          isVerified={profile?.isVerified}
          onPressDetails={onNavigateToOnboarding}
        />

        {/* D. Profile Completion Card */}
        <ProfileCompletionCard
          completeness={profile?.completeness}
          onNavigateToComplete={onNavigateToOnboarding}
        />

        {/* E. Quick Actions Carousel */}
        <QuickActionsSection
          onManageServices={onNavigateToCatalog || (() => {})}
          onManagePackages={onNavigateToPackages || onNavigateToCatalog || (() => {})}
          onManageProfile={onNavigateToOnboarding || (() => {})}
          onManageCalendar={onNavigateToBookings || (() => {})}
          onSeeAll={onNavigateToCatalog}
        />

        {/* F. Business Performance Overview (Maroon Analytics Card) */}
        <BusinessOverviewCard
          profileViews={245}
          leadsCount={leadsCount}
          bookingsCount={bookingsCount}
          ratingAverage={profile?.ratingAverage ?? 4.8}
          onSelectPeriod={(p) => {
            // Period selector toggled
          }}
        />

        {/* G. Recent Leads Section */}
        <RecentLeadsSection
          leads={recentLeads}
          onViewAllLeads={onNavigateToLeads || (() => {})}
          onSelectLead={(lead) => {
            if (onNavigateToLeads) onNavigateToLeads();
          }}
          onExploreServices={onNavigateToCatalog}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5', // Warm ivory canvas
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFBEB',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  loadingText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
    fontWeight: '600',
    flex: 1,
  },
  retryBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  retryBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
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
  greetingTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1C1917',
  },
  greetingSub: {
    fontSize: 12,
    color: '#78716C',
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
});

export default ProviderHomeScreen;
