import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import colors from '../theme/colors';

const UPCOMING_CATEGORIES = [
  { id: '1', name: 'Decoration & Lighting', icon: '✨', desc: 'Mandap, floral, stage, illumination' },
  { id: '2', name: 'Tent & Pandals', icon: '⛺', desc: 'Waterproof tents, seating, shamiana' },
  { id: '3', name: 'Catering & Halwai', icon: '🍲', desc: 'Buffet, live counters, traditional sweets' },
  { id: '4', name: 'DJ, Sound & Band', icon: '🎶', desc: 'Music systems, dhol, brass band' },
  { id: '5', name: 'Photography & Video', icon: '📸', desc: 'Cinematic wedding, drone, pre-wedding' },
  { id: '6', name: 'Makeup & Mehndi', icon: '💄', desc: 'Bridal makeover, festive henna' },
];

export const ProviderHomeScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Shubh Mangalam Partner</Text>
            <Text style={styles.subGreeting}>Service Provider Dashboard</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Verified Vendor</Text>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Har Function, Ek App</Text>
          <Text style={styles.heroSubtitle}>
            Welcome to the Shubh Mangalam Service Provider network. Connect with customers planning weddings, birthdays, pujas, and celebrations in your area.
          </Text>
        </View>

        {/* Quick Stats Placeholder */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Active Leads</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Quotes Sent</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
        </View>

        {/* Service Categories Preview */}
        <Text style={styles.sectionTitle}>Supported Event Services</Text>
        {UPCOMING_CATEGORIES.map((cat) => (
          <View key={cat.id} style={styles.categoryCard}>
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>{cat.name}</Text>
              <Text style={styles.categoryDesc}>{cat.desc}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: 16,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  subGreeting: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.accentGoldBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accentGold,
  },
  badgeText: {
    color: colors.accentGold,
    fontSize: 11,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.secondary,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#FFE4E6',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  categoryDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default ProviderHomeScreen;
