import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';
import { ProviderTopBar } from '../components/ProviderTopBar';
import { ProviderSideMenu } from '../components/ProviderSideMenu';
import { ProviderBottomBar, ProviderTabType } from '../components/ProviderBottomBar';
import { ProviderNotificationsModal } from '../components/ProviderNotificationsModal';
import { ProviderHomeScreen } from './ProviderHomeScreen';
import { CatalogDashboardScreen } from './CatalogDashboardScreen';
import { ProviderInquiriesView } from './ProviderInquiriesView';
import { ProviderQuotesView } from './ProviderQuotesView';
import { ProviderBookingsView } from './ProviderBookingsView';
import { ProviderProfileView } from './ProviderProfileView';
import { ProviderApiService } from '../services/api';
import { FullVendorProfile } from '../types';

interface ProviderMainScreenProps {
  vendorStatus?: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  onNavigateToOnboarding: () => void;
  onAddService: () => void;
  onEditService: (id: string) => void;
  onManageImages: (serviceId: string, serviceName: string) => void;
  onAddPackage: () => void;
  onEditPackage: (id: string) => void;
  onLogout: () => void;
}

export const ProviderMainScreen: React.FC<ProviderMainScreenProps> = ({
  vendorStatus: initialStatus,
  onNavigateToOnboarding,
  onAddService,
  onEditService,
  onManageImages,
  onAddPackage,
  onEditPackage,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<ProviderTabType>('DASHBOARD');
  const [sideMenuVisible, setSideMenuVisible] = useState<boolean>(false);
  const [notificationsVisible, setNotificationsVisible] = useState<boolean>(false);

  const [profile, setProfile] = useState<FullVendorProfile | null>(null);
  const [servicesCount, setServicesCount] = useState<number>(5);
  const [packagesCount, setPackagesCount] = useState<number>(0);
  const [pendingInquiriesCount, setPendingInquiriesCount] = useState<number>(1);
  const [quotesCount, setQuotesCount] = useState<number>(0);
  const [bookingsCount, setBookingsCount] = useState<number>(0);

  const loadProfileAndStats = async () => {
    try {
      const [vendorProfile, servicesRes, packagesRes, inqRes, quotesRes, bookingsRes] = await Promise.all([
        ProviderApiService.getVendorProfile().catch(() => null),
        ProviderApiService.getVendorServices().catch(() => ({ services: [] })),
        ProviderApiService.getVendorPackages().catch(() => ({ packages: [] })),
        ProviderApiService.getVendorInquiries().catch(() => []),
        ProviderApiService.getVendorQuotes().catch(() => ({ quotes: [], total: 0 })),
        ProviderApiService.getVendorBookings().catch(() => ({ bookings: [], total: 0 })),
      ]);
      if (vendorProfile) setProfile(vendorProfile);
      setServicesCount(servicesRes.services?.length || 5);
      setPackagesCount(packagesRes.packages?.length || 0);
      const pendingInq = Array.isArray(inqRes) ? inqRes.filter((i: any) => i.status === 'PENDING').length : 0;
      const pendingQuotes = (quotesRes.quotes || []).filter((q: any) => q.status === 'REQUESTED' || q.status === 'REVISION_REQUESTED').length;
      setPendingInquiriesCount(pendingInq + pendingQuotes);
      setQuotesCount(quotesRes.total || (quotesRes.quotes || []).length);
      setBookingsCount(bookingsRes.total || (bookingsRes.bookings || []).length);
    } catch {
      // Keep existing defaults
    }
  };

  useEffect(() => {
    loadProfileAndStats();
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeContainer} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Top Tool Bar */}
      <ProviderTopBar
        businessName={profile?.businessName || 'Royal Celebrations & Decor'}
        ownerName={profile?.user?.name}
        unreadNotificationsCount={pendingInquiriesCount}
        onOpenMenu={() => setSideMenuVisible(true)}
        onOpenNotifications={() => setNotificationsVisible(true)}
        onOpenProfile={() => setActiveTab('PROFILE')}
      />

      {/* 2. Main Tab Content Area */}
      <View style={styles.contentArea}>
        {activeTab === 'DASHBOARD' && (
          <ProviderHomeScreen
            vendorStatus={profile?.status || initialStatus}
            profile={profile}
            hideTopHeader={true}
            onNavigateToOnboarding={onNavigateToOnboarding}
            onNavigateToCatalog={() => setActiveTab('SERVICES')}
            onNavigateToPackages={() => setActiveTab('PACKAGES')}
            onNavigateToLeads={() => setActiveTab('INQUIRIES')}
            onNavigateToBookings={() => setActiveTab('BOOKINGS')}
            onLogout={onLogout}
          />
        )}

        {activeTab === 'QUOTES' && (
          <ProviderQuotesView />
        )}

        {activeTab === 'BOOKINGS' && (
          <ProviderBookingsView />
        )}

        {activeTab === 'SERVICES' && (
          <CatalogDashboardScreen
            initialTab="SERVICES"
            hideHeader={true}
            onAddService={onAddService}
            onEditService={onEditService}
            onManageImages={onManageImages}
            onAddPackage={onAddPackage}
            onEditPackage={onEditPackage}
          />
        )}

        {activeTab === 'PACKAGES' && (
          <CatalogDashboardScreen
            initialTab="PACKAGES"
            hideHeader={true}
            onAddService={onAddService}
            onEditService={onEditService}
            onManageImages={onManageImages}
            onAddPackage={onAddPackage}
            onEditPackage={onEditPackage}
          />
        )}

        {activeTab === 'INQUIRIES' && (
          <ProviderInquiriesView />
        )}

        {activeTab === 'PROFILE' && (
          <ProviderProfileView
            profile={profile}
            onNavigateToOnboarding={onNavigateToOnboarding}
            onLogout={onLogout}
          />
        )}
      </View>

      {/* 3. Bottom Menu Bar */}
      <ProviderBottomBar
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab)}
        servicesCount={servicesCount}
        bookingsCount={bookingsCount}
        quotesCount={quotesCount}
        inquiriesCount={pendingInquiriesCount}
      />

      {/* 4. Slide-in Side Menu Drawer */}
      <ProviderSideMenu
        visible={sideMenuVisible}
        onClose={() => setSideMenuVisible(false)}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setSideMenuVisible(false);
        }}
        businessName={profile?.businessName || 'Royal Celebrations & Decor'}
        phone={profile?.phone || '+919822222222'}
        city={`${profile?.city || 'Panipat'}, ${profile?.state || 'Haryana'}`}
        status={profile?.status || initialStatus || 'APPROVED'}
        isVerified={profile?.isVerified ?? true}
        servicesCount={servicesCount}
        packagesCount={packagesCount}
        onOpenNotifications={() => {
          setSideMenuVisible(false);
          setNotificationsVisible(true);
        }}
        onNavigateToOnboarding={() => {
          setSideMenuVisible(false);
          onNavigateToOnboarding();
        }}
        onLogout={() => {
          setSideMenuVisible(false);
          onLogout();
        }}
      />

      {/* 5. Alerts & Notifications Modal */}
      <ProviderNotificationsModal
        visible={notificationsVisible}
        onClose={() => setNotificationsVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default ProviderMainScreen;
