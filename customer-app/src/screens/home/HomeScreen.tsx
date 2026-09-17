import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import colors from '../../theme/colors';

const CELEBRATION_CATEGORIES = [
  { id: '1', title: 'Decoration', icon: '🌸', desc: 'Stage, flower & theme decor' },
  { id: '2', title: 'Tent & Setup', icon: '🎪', desc: 'Canopies, seating & setups' },
  { id: '3', title: 'Catering & Food', icon: '🍲', desc: 'Buffets, sweets & live stalls' },
  { id: '4', title: 'DJ & Sound', icon: '🎶', desc: 'Sound systems & light setups' },
  { id: '5', title: 'Photography', icon: '📸', desc: 'Pre-wedding, shoots & video' },
  { id: '6', title: 'Makeup & Mehndi', icon: '💄', desc: 'Bridal artists & mehndi designers' },
];

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const { user, loading } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Hero Banner */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.name}>{user?.name || 'Customer'}</Text>
            </View>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>CUSTOMER</Text>
            </View>
          </View>
          <Text style={styles.subtext}>
            Discover verified local vendors for your wedding, birthday, puja & celebrations.
          </Text>

          {/* Account Status Pill */}
          <View style={styles.accountInfoPill}>
            <Text style={styles.accountInfoDot}>🟢</Text>
            <Text style={styles.accountInfoText}>
              {user?.email} • Verified Account
            </Text>
          </View>
        </View>

        {/* Celebration Services Marketplace Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Celebration Services</Text>
            <Text style={styles.sectionTag}>Shubh Mangalam</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Browse curated vendors for all festive occasions & family events
          </Text>

          <View style={styles.grid}>
            {CELEBRATION_CATEGORIES.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Quick Settings */}
        <View style={styles.quickSettingsSection}>
          <TouchableOpacity
            style={styles.profileNavButton}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.profileNavIcon}>👤</Text>
            <View style={styles.profileNavTextWrap}>
              <Text style={styles.profileNavTitle}>Account & Profile</Text>
              <Text style={styles.profileNavSub}>Manage profile details, security & settings</Text>
            </View>
            <Text style={styles.profileNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Logout Action */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleBadgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  subtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '400',
  },
  accountInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },
  accountInfoDot: {
    fontSize: 8,
    marginRight: 6,
  },
  accountInfoText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  sectionTag: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.card,
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardIcon: {
    fontSize: 30,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 15,
  },
  quickSettingsSection: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  profileNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileNavIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  profileNavTextWrap: {
    flex: 1,
  },
  profileNavTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  profileNavSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  profileNavArrow: {
    fontSize: 22,
    color: colors.textMuted,
  },
  footer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default HomeScreen;
