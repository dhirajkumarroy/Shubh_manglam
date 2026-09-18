import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AppIcon from '../../components/AppIcon';
import colors from '../../theme/colors';

export const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState<'VENDORS' | 'SERVICES'>('VENDORS');
  const [favorites, setFavorites] = useState<any[]>([]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Favorites</Text>
          <Text style={styles.subtitle}>Curated vendors and services for your celebrations</Text>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'VENDORS' && styles.tabBtnActive]}
            onPress={() => setActiveTab('VENDORS')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'VENDORS' && styles.tabBtnTextActive]}>
              Vendors (0)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'SERVICES' && styles.tabBtnActive]}
            onPress={() => setActiveTab('SERVICES')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabBtnText, activeTab === 'SERVICES' && styles.tabBtnTextActive]}>
              Services (0)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content List or Empty State */}
        {favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <AppIcon type="ionicons" name="heart-outline" size={32} color="#DC2626" />
            </View>
            <Text style={styles.emptyTitle}>No favorites yet</Text>
            <Text style={styles.emptySubtitle}>
              Save vendors and services you love and find them easily later when planning your celebrations.
            </Text>
            <TouchableOpacity
              style={styles.exploreBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('VendorDiscoveryScreen')}
            >
              <Text style={styles.exploreBtnText}>Explore Vendors →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.listContent}>
            {/* List rendered here if favorites exist */}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#881337', // Brand Royal Maroon
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#78716C',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E7E0D8',
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#78716C',
  },
  tabBtnTextActive: {
    color: '#881337',
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1C1917',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#78716C',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    maxWidth: 280,
  },
  exploreBtn: {
    backgroundColor: '#E65100', // Saffron Orange
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 30,
  },
});

export default FavoritesScreen;
