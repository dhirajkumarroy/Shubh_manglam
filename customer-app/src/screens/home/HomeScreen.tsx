import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../store';
import { logoutUser } from '../../store/slices/authSlice';
import { HomeStackParamList } from '../../navigation/types';
import colors from '../../theme/colors';

interface PurposeOption {
  id: string;
  title: string;
  icon: string;
  description: string;
}

const PURPOSE_OPTIONS: PurposeOption[] = [
  { id: 'PERSONAL_TRAVEL', title: 'Personal Travel', icon: '🚗', description: 'Trips, visits, tourism' },
  { id: 'MARKET_TRANSPORT', title: 'Market Transport', icon: '🏪', description: 'Travel to local markets' },
  { id: 'GOODS_DELIVERY', title: 'Goods Delivery', icon: '📦', description: 'Deliver items, parcels' },
  { id: 'HOUSE_SHIFTING', title: 'House Shifting', icon: '🚚', description: 'Move furniture & home' },
  { id: 'WEDDING', title: 'Wedding / Event', icon: '💒', description: 'Catering, guests, ceremony' },
  { id: 'AGRICULTURE', title: 'Agriculture', icon: '🌾', description: 'Farming seeds, harvest' },
  { id: 'CONSTRUCTION', title: 'Construction', icon: '🏗️', description: 'Sand, bricks, cement' },
  { id: 'EMERGENCY', title: 'Emergency', icon: '🚨', description: 'Urgent, hospital, quick transport' },
  { id: 'OTHER', title: 'Other Needs', icon: '❓', description: 'Custom vehicle requests' },
];

export const HomeScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { user, loading } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const handleSelectPurpose = (purposeId: string) => {
    navigation.navigate('CreateRequest', { purpose: purposeId });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header Card */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
            </View>
            {/* Owner Toggle Button */}
            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
              <TouchableOpacity
                style={styles.hostBadge}
                onPress={() => navigation.navigate('OwnerDashboard')}
              >
                <Text style={styles.hostBadgeText}>Host Console ⇄</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.subtext}>Describe your requirement & match with nearby drivers instantly.</Text>
        </View>

        {/* Section: Marketplace Needs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What do you need today?</Text>
          <Text style={styles.sectionSubtitle}>Select a purpose to request transport</Text>

          <View style={styles.grid}>
            {PURPOSE_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.card}
                onPress={() => handleSelectPurpose(item.id)}
              >
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.logoutButtonText}>Log Out</Text>
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: '500',
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  hostBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  hostBadgeText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  subtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    lineHeight: 20,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  cardDesc: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 14,
  },
  footer: {
    paddingHorizontal: 24,
    marginTop: 16,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default HomeScreen;
